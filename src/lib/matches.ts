import { readFileSync } from "fs";
import { join } from "path";

export interface Game {
  date: string; // YYYY-MM-DD (BRT)
  time: string; // HH:MM (BRT)
  home: string;
  away: string;
  competition: string;
  round: string;
  channel: string;
  stadium: string;
}

export interface ScheduleData {
  updatedAt: string;
  games: Game[];
}

export interface Match extends Game {
  slug: string;
  startDateIso: string;
}

function getSchedule(): ScheduleData {
  const filePath = join(process.cwd(), "content", "jogos.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ScheduleData;
}

function slugifyTeam(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slug inclui data para evitar colisão entre confrontos em dias diferentes da janela. */
export function buildMatchSlug(home: string, away: string, date: string): string {
  return `${slugifyTeam(home)}-x-${slugifyTeam(away)}-${date}`;
}

function toMatch(game: Game): Match {
  return {
    ...game,
    slug: buildMatchSlug(game.home, game.away, game.date),
    startDateIso: `${game.date}T${game.time}:00-03:00`,
  };
}

/** Data de hoje no fuso de Brasília (YYYY-MM-DD). */
export function getTodayBRT(): string {
  // Usa toLocaleDateString com timezone pra obter a data real de BRT,
  // independente do fuso do servidor.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA format → YYYY-MM-DD
}

/**
 * Retorna todos os jogos da janela no jogos.json que ainda não terminaram.
 * - Inclui jogos de hoje (mesmo já finalizados — UX: a página existe até fim do dia)
 * - Inclui jogos futuros
 * - Exclui jogos de dias passados (lixo residual)
 */
export function getAllMatches(): Match[] {
  const today = getTodayBRT();
  const schedule = getSchedule();
  const matches = schedule.games
    .filter((g) => g.date >= today)
    .map(toMatch);

  // Dedup por slug (data no slug evita colisão entre dias)
  const seen = new Set<string>();
  return matches.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });
}

/** Só jogos de HOJE (BRT) — para o TV-guide /jogos-futebol-hoje. */
export function getTodayMatches(): Match[] {
  const today = getTodayBRT();
  return getAllMatches().filter((m) => m.date === today);
}

export function getMatchBySlug(slug: string): Match | undefined {
  return getAllMatches().find((m) => m.slug === slug);
}

export function getScheduleMeta(): { updatedAt: string } {
  return { updatedAt: getSchedule().updatedAt };
}

/** Dias entre hoje (BRT) e a data do jogo. 0 = hoje, 1 = amanhã, etc. */
export function daysUntil(dateStr: string): number {
  const today = getTodayBRT();
  const todayDate = new Date(`${today}T00:00:00-03:00`);
  const gameDate = new Date(`${dateStr}T00:00:00-03:00`);
  const diffMs = gameDate.getTime() - todayDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
