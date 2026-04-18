import { readFileSync } from "fs";
import { join } from "path";

export interface Game {
  time: string;
  home: string;
  away: string;
  competition: string;
  round: string;
  channel: string;
  stadium: string;
}

export interface ScheduleData {
  date: string;
  updatedAt: string;
  games: Game[];
}

export interface Match extends Game {
  slug: string;
  date: string;
  startDateIso: string;
}

let cache: { mtime: number; data: ScheduleData } | null = null;

function getSchedule(): ScheduleData {
  const filePath = join(process.cwd(), "content", "jogos-hoje.json");
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

export function buildMatchSlug(home: string, away: string): string {
  return `${slugifyTeam(home)}-x-${slugifyTeam(away)}`;
}

function toMatch(game: Game, date: string): Match {
  return {
    ...game,
    slug: buildMatchSlug(game.home, game.away),
    date,
    startDateIso: `${date}T${game.time}:00-03:00`,
  };
}

export function getAllMatches(): Match[] {
  const schedule = getSchedule();
  const matches = schedule.games.map((g) => toMatch(g, schedule.date));

  // Deduplicate by slug — se jogos-hoje.json tiver o mesmo confronto
  // listado em duas competições (raro), fica com a primeira ocorrência.
  const seen = new Set<string>();
  return matches.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });
}

export function getMatchBySlug(slug: string): Match | undefined {
  return getAllMatches().find((m) => m.slug === slug);
}

export function getScheduleMeta(): { date: string; updatedAt: string } {
  const { date, updatedAt } = getSchedule();
  return { date, updatedAt };
}
