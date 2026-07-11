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

/** Soma dias a uma data YYYY-MM-DD no fuso de Brasília. */
export function addDaysBRT(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00-03:00`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Data de amanhã no fuso de Brasília (YYYY-MM-DD). */
export function getTomorrowBRT(): string {
  return addDaysBRT(getTodayBRT(), 1);
}

/** Jogos de uma data específica (YYYY-MM-DD, BRT). */
export function getMatchesByDate(date: string): Match[] {
  return getAllMatches().filter((m) => m.date === date);
}

/** Só jogos de AMANHÃ (BRT) — para a landing /jogos-de-amanha. */
export function getTomorrowMatches(): Match[] {
  return getMatchesByDate(getTomorrowBRT());
}

/** Jogos futuros da janela (depois de hoje), ordenados por data e horário. */
export function getUpcomingMatches(): Match[] {
  const today = getTodayBRT();
  return getAllMatches()
    .filter((m) => m.date > today)
    .sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
    );
}

/** Data curta pt-BR: "11/07". */
export function formatDateShortBR(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

/** Data longa pt-BR: "sexta-feira, 11 de julho". */
export function formatDateLongBR(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
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
