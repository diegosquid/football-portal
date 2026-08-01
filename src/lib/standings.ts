import { loadData as loadContentData } from "@/lib/content-data";
import { getTeam, resolveTeamSlug } from "@/lib/teams";
import { API_NAME_FIXES, API_SHORT_NAMES } from "@/lib/standings-names";

/**
 * Zona da tabela — vem do campo de promoção da API (scripts/build-standings.js).
 * `string` de propósito: competição nova (Champions, estadual) traz zona que
 * ainda não mapeamos, e isso não pode derrubar a página — veja `zoneMeta()`.
 */
export type StandingZone = KnownStandingZone | (string & {});

export type KnownStandingZone =
  | "libertadores"
  | "pre-libertadores"
  | "sul-americana"
  | "acesso"
  | "rebaixamento";

export interface FormEntry {
  resultado: "V" | "E" | "D";
  adversario: string;
  placar: string;
  mandante: boolean;
  data: string;
}

/** Recorte de desempenho como mandante ou visitante. */
export interface SplitStats {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

/**
 * Saída da simulação de Monte Carlo do restante da temporada (em %).
 * Os nomes são neutros de propósito: "promoção" é G4 no Brasileirão, acesso na
 * Série B e seria o top-8 numa Champions.
 */
export interface StandingChances {
  titulo: number;
  /** Zona de cima (G4 / acesso). */
  promocao: number;
  /** Zona secundária (G6). null quando a competição não tem. */
  secundaria: number | null;
  rebaixamento: number;
  pontosProjetados: number;
  posicaoMedia: number;
}

export interface StandingRow {
  position: number;
  /** Nome como vem da API ("Flamengo RJ", "Sao Paulo"). Use `displayName`. */
  team: string;
  teamId: string;
  badge: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** % dos pontos disputados que o time somou. */
  aproveitamento: number;
  zone: StandingZone | null;
  home: SplitStats;
  away: SplitStats;
  form: FormEntry[];
  chances: StandingChances | null;
}

export interface StandingsTable {
  slug: string;
  competition: string;
  shortName: string;
  leagueId: number;
  /** Ano da temporada ("2026"). A rota é perene; o conteúdo é que vira. */
  season: string;
  /** "pontos-corridos" habilita a simulação; grupos ficam só com a tabela. */
  format: string;
  zones: {
    promotion?: number | null;
    secondary?: number | null;
    relegation?: number | null;
  };
  roundsPlayed: number;
  totalRounds: number;
  remainingMatches: number;
  simulation: { runs: number; fixtures: number; model: string } | null;
  rows: StandingRow[];
}

export interface StandingsData {
  generatedAt: string;
  updatedThrough: string;
  season: string;
  source: string;
  disclaimer: string;
  tables: Record<string, StandingsTable>;
}

/** Linha com o nome já normalizado pro padrão do portal e link pro time. */
export interface EnrichedStandingRow extends StandingRow {
  /** "Flamengo" em vez de "Flamengo RJ" — nome canônico de src/lib/teams.ts. */
  displayName: string;
  shortName: string;
  /** Slug do time quando ele existe em teams.ts (vira link pra /time/[slug]). */
  teamSlug?: string;
}

export interface EnrichedStandingsTable extends StandingsTable {
  rows: EnrichedStandingRow[];
}

export interface ZoneMeta {
  label: string;
  short: string;
  description: string;
}

/** Rótulos das zonas conhecidas — usados na legenda e nos rótulos de linha. */
export const ZONE_META: Record<KnownStandingZone, ZoneMeta> = {
  libertadores: {
    label: "Libertadores (fase de grupos)",
    short: "G4",
    description:
      "Os quatro primeiros vão direto à fase de grupos da Libertadores.",
  },
  "pre-libertadores": {
    label: "Libertadores (fase prévia)",
    short: "G6",
    description:
      "5º e 6º entram na Libertadores pela fase prévia (qualificatória).",
  },
  "sul-americana": {
    label: "Sul-Americana",
    short: "SUL",
    description: "Vagas na Copa Sul-Americana do ano seguinte.",
  },
  acesso: {
    label: "Acesso à Série A",
    short: "G4",
    description: "Os quatro primeiros sobem para a Série A.",
  },
  rebaixamento: {
    label: "Rebaixamento",
    short: "Z4",
    description: "Os quatro últimos são rebaixados para a divisão de baixo.",
  },
};

/**
 * Rótulo de uma zona, com fallback pra zona que ainda não mapeamos.
 * Competição nova entra sem quebrar: o slug vira um rótulo legível
 * ("play-offs" → "Play offs") até alguém escrever o texto de verdade.
 */
export function zoneMeta(
  zone: StandingZone,
  /** Rótulos próprios da competição — na Série C, "acesso" é ir ao quadrangular. */
  overrides?: Record<string, string>,
): ZoneMeta {
  const known = ZONE_META[zone as KnownStandingZone];
  const override = overrides?.[zone];
  if (known) return override ? { ...known, label: override } : known;
  const label =
    override ?? zone.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  return { label, short: "", description: "" };
}

/** Carrega classificacao.json (R2 em runtime, arquivo local como fallback). */
function loadData(): Promise<StandingsData | null> {
  return loadContentData<StandingsData>("classificacao.json");
}

export function getStandingsData(): Promise<StandingsData | null> {
  return loadData();
}

/**
 * Nome de exibição: prefere o nome canônico do portal ("São Paulo") ao da API
 * ("Sao Paulo"), e cai no da API quando o time não está cadastrado.
 */
function enrichRow(row: StandingRow): EnrichedStandingRow {
  const slug = resolveTeamSlug(row.team);
  const team = slug ? getTeam(slug) : undefined;
  return {
    ...row,
    displayName: team?.name ?? API_NAME_FIXES[row.team] ?? row.team,
    shortName:
      team?.shortName ??
      API_SHORT_NAMES[row.team] ??
      row.team.slice(0, 3).toUpperCase(),
    teamSlug: slug,
  };
}

/** Tabela de uma competição pelo slug ("brasileirao", "brasileirao-serie-b"). */
export async function getStandingsTable(
  slug: string,
): Promise<EnrichedStandingsTable | null> {
  const table = (await loadData())?.tables?.[slug];
  if (!table) return null;
  return { ...table, rows: table.rows.map(enrichRow) };
}

export async function getAllStandingsSlugs(): Promise<string[]> {
  return Object.keys((await loadData())?.tables ?? {});
}

/** Rota da landing de classificação de uma competição. */
export function standingsPath(competitionSlug: string): string {
  return `/tabela-do-${competitionSlug}`;
}

/** A competição tem tabela publicada? */
export async function hasStandings(competitionSlug: string): Promise<boolean> {
  return Boolean((await loadData())?.tables?.[competitionSlug]);
}

/** Linha de um time específico — usada no box de tabela dentro do artigo. */
export async function getTeamStanding(
  competitionSlug: string,
  teamSlug: string,
): Promise<EnrichedStandingRow | undefined> {
  return (await getStandingsTable(competitionSlug))?.rows.find(
    (row) => row.teamSlug === teamSlug,
  );
}

/**
 * Formata uma chance em % pra leitura humana.
 * Nunca imprime "100%" nem "0%": no futebol nada é certo, e arredondar 99,7
 * para 100 vende uma garantia que o modelo não dá.
 */
export function formatChance(value: number): string {
  if (value >= 99.5) return ">99%";
  if (value < 1) return "<1%";
  return `${Math.round(value)}%`;
}

/** "73,3%" — decimal com vírgula, como se escreve em português. */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** "20ª rodada" — texto curto pro subtítulo e metadata. */
export function roundLabel(table: StandingsTable): string {
  return `${table.roundsPlayed}ª rodada`;
}

/** Data/hora da última atualização em pt-BR (fuso de São Paulo). */
export function formatUpdatedAt(timestamp?: string): string | null {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}
