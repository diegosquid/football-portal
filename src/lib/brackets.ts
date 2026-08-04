import { loadData as loadContentData } from "@/lib/content-data";
import { getTeam, resolveTeamSlug } from "@/lib/teams";
import { API_NAME_FIXES } from "@/lib/standings-names";

/**
 * Chaveamento de mata-mata — gerado por scripts/build-brackets.js.
 *
 * O builder só publica fase em que o rótulo da fonte e a quantidade de
 * confrontos concordam, então uma fase que chegou aqui é uma chave de verdade.
 * Competição pode aparecer com uma fase só (a que está em andamento) — é o
 * caso normal no meio da temporada.
 */

export interface BracketLegScore {
  home: number;
  away: number;
}

export interface BracketLeg {
  date: string;
  home: string;
  away: string;
  /** Tempo normal + prorrogação. null quando o jogo ainda não aconteceu. */
  score: BracketLegScore | null;
  penalties: BracketLegScore | null;
  stadium: string | null;
  finished: boolean;
}

export interface BracketTie {
  /** [mandante da volta, visitante da volta] — a ordem do agregado. */
  teams: [string, string];
  legs: BracketLeg[];
  /** Agregado por nome de time. null antes do primeiro jogo. */
  aggregate: Record<string, number> | null;
  penalties: Record<string, number> | null;
  decided: boolean;
  winner: string | null;
}

export interface BracketRound {
  name: string;
  order: number;
  sourceStage: string;
  ties: BracketTie[];
  decided: number;
}

export interface BracketCompetition {
  slug: string;
  competition: string;
  shortName: string;
  leagueId: number;
  season: string;
  rounds: BracketRound[];
}

export interface BracketsData {
  generatedAt: string;
  source: string;
  disclaimer: string;
  competitions: Record<string, BracketCompetition>;
}

/** Nome de time no padrão do portal, com link quando o clube tem página. */
export interface TeamLabel {
  name: string;
  slug?: string;
}

function loadData(): Promise<BracketsData | null> {
  return loadContentData<BracketsData>("chaveamento.json");
}

export function getBracketsData(): Promise<BracketsData | null> {
  return loadData();
}

export async function getBracket(
  slug: string,
): Promise<BracketCompetition | null> {
  return (await loadData())?.competitions?.[slug] ?? null;
}

export async function hasBracket(slug: string): Promise<boolean> {
  return Boolean((await loadData())?.competitions?.[slug]);
}

export function teamLabel(apiName: string): TeamLabel {
  const slug = resolveTeamSlug(apiName);
  const team = slug ? getTeam(slug) : undefined;
  return {
    name: team?.name ?? API_NAME_FIXES[apiName] ?? apiName,
    slug,
  };
}

/** "2 x 1" / "—" quando o jogo ainda não rolou. */
export function formatLeg(leg: BracketLeg): string {
  if (!leg.score) return "—";
  return `${leg.score.home} x ${leg.score.away}`;
}

/**
 * Texto do confronto pra FAQ e resposta direta.
 * "Palmeiras eliminou o Fortaleza (3-0 no agregado)".
 */
export function describeTie(tie: BracketTie): string {
  const [a, b] = tie.teams;
  const nameA = teamLabel(a).name;
  const nameB = teamLabel(b).name;

  if (!tie.aggregate) return `${nameA} x ${nameB} ainda não começou.`;

  const scoreA = tie.aggregate[a];
  const scoreB = tie.aggregate[b];
  const aggregate = `${scoreA}-${scoreB}`;

  if (!tie.decided) {
    const played = tie.legs.filter((l) => l.finished).length;
    if (played === 0) return `${nameA} x ${nameB} ainda não começou.`;
    return `${nameA} x ${nameB} está ${aggregate} no agregado, com a decisão no próximo jogo.`;
  }

  const winnerName = teamLabel(tie.winner!).name;
  const loserName = tie.winner === a ? nameB : nameA;
  const penaltyPart = tie.penalties
    ? ` nos pênaltis (${tie.penalties[tie.winner!]}-${tie.penalties[tie.winner === a ? b : a]}), após ${aggregate} no agregado`
    : ` por ${aggregate} no agregado`;

  return `${winnerName} eliminou o ${loserName}${penaltyPart}.`;
}

/** Fase em andamento — a que interessa pro topo da página. */
export function currentRound(
  competition: BracketCompetition,
): BracketRound | undefined {
  return (
    competition.rounds.find((r) => r.decided < r.ties.length) ??
    competition.rounds[competition.rounds.length - 1]
  );
}

export function bracketPath(slug: string): string {
  return `/chaveamento-da-${slug === "copa-do-brasil" ? "copa-do-brasil" : slug}`;
}
