import {
  formatChance,
  getAllStandingsSlugs,
  getStandingsData,
  getStandingsTable,
  type EnrichedStandingRow,
  type EnrichedStandingsTable,
} from "@/lib/standings";
import { getAllStandingsCopy } from "@/lib/standings-competitions";

/**
 * Recortes da simulação por OBJETIVO, em vez de por competição.
 *
 * O dado já existe: scripts/build-standings.js roda 10 mil simulações do
 * restante de cada campeonato e grava `chances` em cada linha da tabela. O que
 * faltava era a leitura que o torcedor faz na busca — "quem vai ser rebaixado",
 * "quem pode ser campeão", "qual a chance do meu time" — que atravessa as
 * divisões e não cabe dentro de uma tabela só.
 *
 * Nada aqui recalcula probabilidade: é ordenação e recorte do que a simulação
 * já produziu.
 */

export type RaceObjective = "titulo" | "rebaixamento";

export interface RaceCopy {
  objective: RaceObjective;
  path: string;
  eyebrow: string;
  h1: (season: string) => string;
  title: (season: string) => string;
  intro: string;
  /** Pergunta que a página responde de cara. */
  question: (season: string) => string;
  keywords: string[];
  description: (season: string) => string;
  /** Rótulo da coluna de chance. */
  chanceLabel: string;
  /** Como chamar quem está na frente nesse recorte. */
  leaderNoun: string;
}

export const RACE_COPY: Record<RaceObjective, RaceCopy> = {
  rebaixamento: {
    objective: "rebaixamento",
    path: "/probabilidades/rebaixamento",
    eyebrow: "Probabilidades",
    h1: (season) => `Chances de rebaixamento ${season}`,
    title: (season) =>
      `Quem vai ser rebaixado em ${season}? Chances de cada time`,
    intro:
      "A chance de cada time cair, calculada por simulação do restante do campeonato. Rodamos os jogos que faltam 10 mil vezes com o nosso modelo de Poisson e contamos em quantas delas cada time termina na zona.",
    question: (season) =>
      `Quem vai ser rebaixado no Brasileirão ${season}?`,
    keywords: [
      "rebaixamento brasileirão",
      "quem vai ser rebaixado no brasileirão",
      "chances de rebaixamento",
      "z4 do brasileirão",
      "probabilidade de rebaixamento",
      "quem cai para a série b",
    ],
    description: (season) =>
      `Chances de rebaixamento no Brasileirão ${season} time a time, calculadas por 10 mil simulações do restante do campeonato. Série A, B e C atualizadas todo dia.`,
    chanceLabel: "Chance de cair",
    leaderNoun: "maior risco",
  },
  titulo: {
    objective: "titulo",
    path: "/probabilidades/titulo",
    eyebrow: "Probabilidades",
    h1: (season) => `Chances de título ${season}`,
    title: (season) => `Quem vai ser campeão em ${season}? Chances de título`,
    intro:
      "A chance de cada time levantar a taça, calculada por simulação do restante do campeonato. São 10 mil temporadas simuladas com o nosso modelo de Poisson — a chance é a fatia delas em que o time termina em primeiro.",
    question: (season) => `Quem vai ser campeão brasileiro em ${season}?`,
    keywords: [
      "chances de título do brasileirão",
      "quem vai ser campeão brasileiro",
      "probabilidade de título",
      "favorito ao título do brasileirão",
      "quem pode ser campeão",
    ],
    description: (season) =>
      `Chances de título no Brasileirão ${season} time a time, calculadas por 10 mil simulações do restante do campeonato. Série A, B e C atualizadas todo dia.`,
    chanceLabel: "Chance de título",
    leaderNoun: "favorito",
  },
};

/** Uma competição dentro do recorte, já ordenada pelo objetivo. */
export interface RaceCompetition {
  slug: string;
  competition: string;
  shortName: string;
  season: string;
  roundsPlayed: number;
  totalRounds: number;
  remainingMatches: number;
  standingsPath?: string;
  /** Só linhas com chance relevante, da maior pra menor. */
  rows: EnrichedStandingRow[];
}

/** Abaixo disso a linha vira ruído — 0,4% de chance não é informação útil. */
const RELEVANT_CHANCE = 0.5;

function chanceOf(row: EnrichedStandingRow, objective: RaceObjective): number {
  return row.chances?.[objective] ?? 0;
}

function toRaceCompetition(
  table: EnrichedStandingsTable,
  objective: RaceObjective,
): RaceCompetition | null {
  if (!table.simulation) return null;

  const rows = table.rows
    .filter((row) => chanceOf(row, objective) >= RELEVANT_CHANCE)
    .sort(
      (a, b) =>
        chanceOf(b, objective) - chanceOf(a, objective) ||
        a.position - b.position,
    );
  if (rows.length === 0) return null;

  const path = getAllStandingsCopy().find((c) => c.slug === table.slug)?.path;

  return {
    slug: table.slug,
    competition: table.competition,
    shortName: table.shortName,
    season: table.season,
    roundsPlayed: table.roundsPlayed,
    totalRounds: table.totalRounds,
    remainingMatches: table.remainingMatches,
    standingsPath: path,
    rows,
  };
}

/** Tabelas já enriquecidas, na ordem em que a copy declara as competições. */
async function loadTables(): Promise<EnrichedStandingsTable[]> {
  const order = getAllStandingsCopy().map((c) => c.slug);
  const slugs = (await getAllStandingsSlugs()).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
  const tables = await Promise.all(slugs.map((slug) => getStandingsTable(slug)));
  return tables.filter((t): t is EnrichedStandingsTable => t !== null);
}

/**
 * Todas as competições simuladas, ordenadas pelo objetivo.
 * A Série A vem primeiro — é o que a busca quer em 9 de cada 10 casos.
 */
export async function getRace(
  objective: RaceObjective,
): Promise<{ competitions: RaceCompetition[]; generatedAt?: string; season: string }> {
  const [tables, data] = await Promise.all([loadTables(), getStandingsData()]);

  const competitions = tables
    .map((table) => toRaceCompetition(table, objective))
    .filter((c): c is RaceCompetition => c !== null);

  return {
    competitions,
    generatedAt: data?.generatedAt,
    season: data?.season ?? String(new Date().getFullYear()),
  };
}

/** Onde o time aparece — pode estar em mais de uma competição simulada. */
export interface TeamRace {
  competition: RaceCompetition["competition"];
  shortName: string;
  slug: string;
  season: string;
  roundsPlayed: number;
  totalRounds: number;
  remainingMatches: number;
  standingsPath?: string;
  row: EnrichedStandingRow;
  /** Quantos times a competição tem — pra "12º de 20". */
  totalTeams: number;
  /** Rótulo da zona de cima nessa competição ("G4", "Acesso"). */
  promotionLabel: string;
  /** O que a zona secundária significa, quando existe. */
  secondaryLabel?: string;
}

export async function getTeamRaces(teamSlug: string): Promise<TeamRace[]> {
  const tables = await loadTables();
  const copies = getAllStandingsCopy();

  const races: TeamRace[] = [];
  for (const table of tables) {
    if (!table.simulation) continue;
    const row = table.rows.find((r) => r.teamSlug === teamSlug);
    if (!row || !row.chances) continue;

    const copy = copies.find((c) => c.slug === table.slug);
    races.push({
      competition: table.competition,
      shortName: table.shortName,
      slug: table.slug,
      season: table.season,
      roundsPlayed: table.roundsPlayed,
      totalRounds: table.totalRounds,
      remainingMatches: table.remainingMatches,
      standingsPath: copy?.path,
      row,
      totalTeams: table.rows.length,
      promotionLabel: copy?.promotionLabel ?? "G4",
      secondaryLabel: copy?.faq.promotionZoneAnswer,
    });
  }
  return races;
}

/** Todos os times que aparecem em alguma simulação — pra generateStaticParams. */
export async function getAllRaceTeamSlugs(): Promise<string[]> {
  const tables = await loadTables();
  const slugs = new Set<string>();
  for (const table of tables) {
    if (!table.simulation) continue;
    for (const row of table.rows) {
      if (row.teamSlug && row.chances) slugs.add(row.teamSlug);
    }
  }
  return [...slugs];
}

/**
 * Frase de resposta direta pro topo da página e pra meta description.
 * É o trecho que o Google costuma recortar — vale ser específico e curto.
 */
export function raceSummary(
  competition: RaceCompetition,
  objective: RaceObjective,
): string {
  const top = competition.rows.slice(0, 3);
  if (top.length === 0) return "";

  // formatChance, não Math.round: arredondar 99,9 pra "100%" venderia uma
  // certeza que o modelo não dá — e brigaria com o ">99%" da tabela ao lado.
  const list = top
    .map((row) => `${row.displayName} (${formatChance(chanceOf(row, objective))})`)
    .join(", ");

  return objective === "rebaixamento"
    ? `Hoje, os maiores riscos de queda ${competition.slug === "brasileirao" ? "na Série A" : `na ${competition.shortName}`} são ${list}. Faltam ${competition.remainingMatches} jogos.`
    : `Hoje, os favoritos ao título ${competition.slug === "brasileirao" ? "da Série A" : `da ${competition.shortName}`} são ${list}. Faltam ${competition.remainingMatches} jogos.`;
}
