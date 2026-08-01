import { loadData as loadContentData } from "@/lib/content-data";

/** Uma predição por confronto — saída do modelo Poisson (scripts/build-probabilities.js). */
export interface Prediction {
  date: string;
  time?: string;
  home: string;
  away: string;
  competition?: string;
  round?: string;
  lambdaHome: number;
  lambdaAway: number;
  golsEsperados: number;
  resultado: { casa: number; empate: number; fora: number };
  gols: { over25: number; under25: number };
  ambosMarcam: { sim: number; nao: number };
  placarProvavel: string;
  explicacao: {
    forcaAtaqueCasa: number;
    forcaDefesaCasa: number;
    forcaAtaqueFora: number;
    forcaDefesaFora: number;
    jogosConsiderados: { casa: number; fora: number };
  };
  actualResult?: {
    homeGoals: number;
    awayGoals: number;
    outcome: "casa" | "empate" | "fora";
    recordedAt: string;
  };
}

/** Força de um time vs. média da liga. 1.0 = exatamente na média. */
export interface TeamStrength {
  time: string;
  jogos: number;
  /** >1 marca mais que a média da liga. */
  ataque: number;
  /** <1 sofre menos que a média da liga (quanto menor, melhor). */
  defesa: number;
  /** ataque - defesa. >0 = conjunto acima da média. */
  saldo: number;
}

export interface ProbabilitiesData {
  generatedAt: string;
  source: string;
  model: string;
  disclaimer: string;
  /** Médias de gols por competição: { "Brasileirão Série A": {golsCasa, golsFora} } */
  leagueAverages?: Record<string, { golsCasa: number; golsFora: number }>;
  /** Ranking de força por competição. */
  teamStrengths?: Record<string, TeamStrength[]>;
  predictions: Prediction[];
}

export interface ProbabilityHistoryData {
  updatedAt: string;
  predictions: Prediction[];
  metrics?: {
    evaluated: number;
    hitRate: number;
    brierScore: number;
    minimumSample: number;
  };
}

/** Carrega probabilidades.json (R2 em runtime, arquivo local como fallback). */
function loadData(): Promise<ProbabilitiesData | null> {
  return loadContentData<ProbabilitiesData>("probabilidades.json");
}

function loadHistory(): Promise<ProbabilityHistoryData | null> {
  return loadContentData<ProbabilityHistoryData>(
    "probabilidades-historico.json",
  );
}

export function getProbabilitiesData(): Promise<ProbabilitiesData | null> {
  return loadData();
}

export function getProbabilityHistory(): Promise<ProbabilityHistoryData | null> {
  return loadHistory();
}

export async function getAllPredictions(): Promise<Prediction[]> {
  return (await loadData())?.predictions ?? [];
}

function normalizeTeam(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Chave de índice de um confronto (home|away normalizados). */
export function predictionKey(home: string, away: string): string {
  return `${normalizeTeam(home)}|${normalizeTeam(away)}`;
}

/** Acha a predição de um confronto pelos nomes dos times (usado na página do jogo). */
export async function getPredictionFor(
  home: string,
  away: string,
  date?: string,
): Promise<Prediction | undefined> {
  const h = normalizeTeam(home);
  const a = normalizeTeam(away);
  const [current, history] = await Promise.all([
    getAllPredictions(),
    loadHistory(),
  ]);
  const historical = history?.predictions ?? [];
  return [...current, ...historical].find(
    (p) =>
      normalizeTeam(p.home) === h &&
      normalizeTeam(p.away) === a &&
      (!date || p.date === date),
  );
}

/**
 * Resolvedor de predições (atuais + histórico) com o dado carregado uma vez só.
 * Mesma semântica de `getPredictionFor`, mas para uso dentro de listas —
 * onde chamar a versão async por item faria N buscas.
 */
export async function getPredictionResolver(): Promise<
  (home: string, away: string, date?: string) => Prediction | undefined
> {
  const [current, history] = await Promise.all([
    getAllPredictions(),
    loadHistory(),
  ]);
  const all = [...current, ...(history?.predictions ?? [])];

  return (home, away, date) => {
    const h = normalizeTeam(home);
    const a = normalizeTeam(away);
    return all.find(
      (p) =>
        normalizeTeam(p.home) === h &&
        normalizeTeam(p.away) === a &&
        (!date || p.date === date),
    );
  };
}

/**
 * Índice de todas as predições por confronto — carrega o dado uma vez só.
 * Use em listas (GameSchedule) para evitar N buscas.
 */
export async function getPredictionsIndex(): Promise<Map<string, Prediction>> {
  const index = new Map<string, Prediction>();
  for (const p of await getAllPredictions()) {
    index.set(predictionKey(p.home, p.away), p);
  }
  return index;
}
