import { readFileSync } from "fs";
import { join } from "path";

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

export interface ProbabilitiesData {
  generatedAt: string;
  source: string;
  model: string;
  disclaimer: string;
  leagueAverages: { golsCasa: number; golsFora: number };
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

/** Lê content/probabilidades.json. Retorna null se o arquivo ainda não existe. */
function loadData(): ProbabilitiesData | null {
  try {
    const filePath = join(process.cwd(), "content", "probabilidades.json");
    return JSON.parse(readFileSync(filePath, "utf-8")) as ProbabilitiesData;
  } catch {
    return null;
  }
}

function loadHistory(): ProbabilityHistoryData | null {
  try {
    const filePath = join(
      process.cwd(),
      "content",
      "probabilidades-historico.json",
    );
    return JSON.parse(readFileSync(filePath, "utf-8")) as ProbabilityHistoryData;
  } catch {
    return null;
  }
}

export function getProbabilitiesData(): ProbabilitiesData | null {
  return loadData();
}

export function getProbabilityHistory(): ProbabilityHistoryData | null {
  return loadHistory();
}

export function getAllPredictions(): Prediction[] {
  return loadData()?.predictions ?? [];
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
export function getPredictionFor(
  home: string,
  away: string,
  date?: string,
): Prediction | undefined {
  const h = normalizeTeam(home);
  const a = normalizeTeam(away);
  const current = getAllPredictions();
  const historical = loadHistory()?.predictions ?? [];
  return [...current, ...historical].find(
    (p) =>
      normalizeTeam(p.home) === h &&
      normalizeTeam(p.away) === a &&
      (!date || p.date === date),
  );
}

/**
 * Índice de todas as predições por confronto — lê o arquivo uma vez só.
 * Use em listas (GameSchedule) para evitar N leituras de arquivo.
 */
export function getPredictionsIndex(): Map<string, Prediction> {
  const index = new Map<string, Prediction>();
  for (const p of getAllPredictions()) {
    index.set(predictionKey(p.home, p.away), p);
  }
  return index;
}
