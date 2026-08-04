import { loadData as loadContentData } from "@/lib/content-data";
import { getTeam, resolveTeamSlug } from "@/lib/teams";
import { API_NAME_FIXES } from "@/lib/standings-names";
import { displayPlayerName } from "@/lib/player-names";

/**
 * Artilharia por competição — gerada por scripts/build-topscorers.js.
 *
 * O builder só publica ranking que passou na conferência contra os gols
 * realmente marcados por cada time, então aqui não há checagem de sanidade:
 * o que chegou já é confiável.
 */

export interface Scorer {
  position: number;
  /** Nome como vem da API, muitas vezes invertido. Use `displayName`. */
  player: string;
  playerId: string;
  team: string;
  teamId: string;
  goals: number;
  /** A fonte manda vazio na maioria das ligas brasileiras. */
  assists: number | null;
  penaltyGoals: number | null;
}

export interface TopScorersRanking {
  slug: string;
  competition: string;
  shortName: string;
  leagueId: number;
  season: string;
  updatedThrough: string;
  /** Qual lista da fonte foi aprovada — rastro pra auditoria. */
  stage: { key: string; label: string; teamsChecked: number };
  totalGoals: number;
  scorers: Scorer[];
}

export interface TopScorersData {
  generatedAt: string;
  updatedThrough: string;
  source: string;
  disclaimer: string;
  rankings: Record<string, TopScorersRanking>;
}

export interface EnrichedScorer extends Scorer {
  /** Nome corrigido ("Bruno Henrique" em vez de "Henrique Bruno"). */
  displayName: string;
  /** Nome do clube no padrão do portal ("São Paulo", não "Sao Paulo"). */
  teamName: string;
  /** Slug quando o clube tem página no portal. */
  teamSlug?: string;
}

export interface EnrichedTopScorersRanking extends TopScorersRanking {
  scorers: EnrichedScorer[];
}

function loadData(): Promise<TopScorersData | null> {
  return loadContentData<TopScorersData>("artilharia.json");
}

export function getTopScorersData(): Promise<TopScorersData | null> {
  return loadData();
}

function enrich(scorer: Scorer): EnrichedScorer {
  const slug = resolveTeamSlug(scorer.team);
  const team = slug ? getTeam(slug) : undefined;
  return {
    ...scorer,
    displayName: displayPlayerName(scorer.player),
    teamName: team?.name ?? API_NAME_FIXES[scorer.team] ?? scorer.team,
    teamSlug: slug,
  };
}

export async function getTopScorers(
  slug: string,
): Promise<EnrichedTopScorersRanking | null> {
  const ranking = (await loadData())?.rankings?.[slug];
  if (!ranking) return null;
  return { ...ranking, scorers: ranking.scorers.map(enrich) };
}

export async function getAllTopScorersSlugs(): Promise<string[]> {
  return Object.keys((await loadData())?.rankings ?? {});
}

/** A competição tem artilharia publicada? */
export async function hasTopScorers(slug: string): Promise<boolean> {
  return Boolean((await loadData())?.rankings?.[slug]);
}

/**
 * Artilheiro de cada clube — cauda longa ("maior artilheiro do Flamengo em
 * 2026") derivada da mesma lista, sem chamada extra.
 */
export function scorersByTeam(
  ranking: EnrichedTopScorersRanking,
): { teamName: string; teamSlug?: string; scorers: EnrichedScorer[] }[] {
  const groups = new Map<
    string,
    { teamName: string; teamSlug?: string; scorers: EnrichedScorer[] }
  >();

  for (const scorer of ranking.scorers) {
    const key = scorer.teamSlug ?? scorer.teamName;
    const group = groups.get(key);
    if (group) group.scorers.push(scorer);
    else
      groups.set(key, {
        teamName: scorer.teamName,
        teamSlug: scorer.teamSlug,
        scorers: [scorer],
      });
  }

  return [...groups.values()].sort(
    (a, b) =>
      b.scorers.reduce((s, p) => s + p.goals, 0) -
        a.scorers.reduce((s, p) => s + p.goals, 0) ||
      a.teamName.localeCompare(b.teamName, "pt-BR"),
  );
}

/** Rota da landing de artilharia. */
export function topScorersPath(slug: string): string {
  return slug === "libertadores"
    ? "/artilharia-da-libertadores"
    : `/artilharia-do-${slug}`;
}

/** "12 gols" / "1 gol" — concordância sem virar if no meio do JSX. */
export function goalsLabel(goals: number): string {
  return `${goals} ${goals === 1 ? "gol" : "gols"}`;
}
