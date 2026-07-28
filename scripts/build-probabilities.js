/**
 * Modelo de probabilidades (Poisson) — Beira do Campo
 * ---------------------------------------------------------------------------
 * Gera probabilidades a partir de um modelo PRÓPRIO (Poisson):
 *   resultados reais (apifootball.com)  ->  força ataque/defesa por time
 *   ->  gols esperados (lambda)  ->  mercados (1x2, over/under 2.5, ambos marcam)
 *
 * Fonte de dados: apifootball.com (sem hífen) — plano grátis, temporada atual.
 * Prediz os confrontos do content/jogos.json que pertencem a ligas cobertas.
 *
 *   node scripts/build-probabilities.js
 *
 * Saída: content/probabilidades.json  (lido pelo Next no render — estático/SEO)
 *
 * A matemática vive em scripts/lib/poisson.js: PURA e portável — roda igual num
 * GitHub Action ou Cloudflare Worker. Na Fase 2 migra pra src/lib/probabilities/*.ts.
 * ---------------------------------------------------------------------------
 */

const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

// Matemática pura (Poisson, forças de ataque/defesa) — compartilhada com
// scripts/build-standings.js.
const {
  round2,
  computeModel,
  predictFixture,
} = require("./lib/poisson");

const pct = (x) => Math.round(x * 1000) / 10;

/* ================================================================== *
 * 1. Camada de dados — apifootball.com
 * ================================================================== */

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";

// competition (como está no jogos.json)  ->  league_id da apifootball.com
const LEAGUE_MAP = {
  "Brasileirão Série A": 99,
  "Brasileirão Série B": 75,
  "Brasileirão Série C": 79,
  "Brasileirão Série D": 80,
  "Copa do Brasil": 349,
  "Copa do Nordeste": 504,
  "Brasileirão Feminino A1": 660,
};

const SEASON_START = "2026-01-01";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchFinishedResults(leagueId) {
  const url = `${API_BASE}/?action=get_events&APIkey=${API_KEY}&league_id=${leagueId}&from=${SEASON_START}&to=${todayISO()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!Array.isArray(data)) return []; // {error:...} quando sem jogos no range
  return data
    .filter((e) => e.match_status === "Finished")
    .map((e) => ({
      date: e.match_date,
      home: e.match_hometeam_name,
      away: e.match_awayteam_name,
      hg: parseInt(e.match_hometeam_score, 10),
      ag: parseInt(e.match_awayteam_score, 10),
    }))
    .filter((r) => Number.isFinite(r.hg) && Number.isFinite(r.ag));
}

/* ================================================================== *
 * 2. Casamento de nomes (jogos.json  <->  nomes da API)
 * ================================================================== */

// Tokens de sufixo a remover do fim do nome: UF + " W" (feminino) + genéricos.
const STRIP = new Set([
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms",
  "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc",
  "sp", "se", "to",
  "w", "fc", "ec", "cf", "club", "clube", "futebol", "esporte", "esportivo",
]);

function normFull(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Nome reduzido em tokens, sem sufixos ("Vila Nova FC" -> ["vila","nova"]). */
function coreTokens(s) {
  const t = normFull(s).split(" ").filter(Boolean);
  while (t.length > 1 && STRIP.has(t[t.length - 1])) t.pop();
  return t;
}

const subset = (a, b) => a.every((x) => b.includes(x));

// Aliases só para casos que subconjunto de tokens não pega (ex.: nomes totalmente distintos).
const ALIAS = {
  vasco: "vasco da gama",
};

/**
 * Resolvedor nome(jogos.json) -> chave do modelo (nome API), em cascata:
 * 1) match exato  2) core exato único  3) subconjunto de tokens único  4) alias.
 * A exigência de "único" evita casar América-MG com América-RN, etc.
 */
function buildResolver(model) {
  const apiNames = Object.keys(model.strengths);
  const byFull = new Map(apiNames.map((n) => [normFull(n), n]));
  const cores = apiNames.map((n) => ({ name: n, tokens: coreTokens(n) }));

  const bySubset = (jt) =>
    cores.filter((c) => subset(jt, c.tokens) || subset(c.tokens, jt));

  return function resolve(jogosName) {
    const full = normFull(jogosName);
    if (byFull.has(full)) return byFull.get(full);

    const jt = coreTokens(jogosName);
    const jcore = jt.join(" ");
    const exactCore = cores.filter((c) => c.tokens.join(" ") === jcore);
    if (exactCore.length === 1) return exactCore[0].name;

    const sub = bySubset(jt);
    if (sub.length === 1) return sub[0].name;

    if (ALIAS[full]) {
      const af = normFull(ALIAS[full]);
      if (byFull.has(af)) return byFull.get(af);
      const as = bySubset(coreTokens(ALIAS[full]));
      if (as.length === 1) return as[0].name;
    }
    return null;
  };
}

/* ================================================================== *
 * 3. Runner
 * ================================================================== */

function getUpcomingFixtures() {
  const raw = readFileSync(join(process.cwd(), "content", "jogos.json"), "utf-8");
  const { games } = JSON.parse(raw);
  const today = todayISO();
  return games.filter((g) => g.date >= today);
}

const PROBABILITIES_PATH = join(
  process.cwd(),
  "content",
  "probabilidades.json",
);
const HISTORY_PATH = join(
  process.cwd(),
  "content",
  "probabilidades-historico.json",
);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function predictionKey(prediction) {
  return [prediction.date, prediction.home, prediction.away]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mergePredictions(...groups) {
  const merged = new Map();
  for (const prediction of groups.flat()) {
    merged.set(predictionKey(prediction), {
      ...merged.get(predictionKey(prediction)),
      ...prediction,
    });
  }
  return [...merged.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function enrichArchivedPredictions(predictions, fixtures) {
  const fixtureByKey = new Map(
    fixtures.map((fixture) => [predictionKey(fixture), fixture]),
  );
  return predictions.map((prediction) => {
    const fixture = fixtureByKey.get(predictionKey(prediction));
    if (!fixture) return prediction;
    return {
      ...prediction,
      time: fixture.time,
      competition: fixture.competition,
      round: fixture.round,
    };
  });
}

function evaluateHistoricalPredictions(
  predictions,
  resultsByCompetition,
  resolvers,
) {
  return predictions.map((prediction) => {
    if (prediction.actualResult || !prediction.competition) return prediction;
    const results = resultsByCompetition[prediction.competition];
    const resolve = resolvers[prediction.competition];
    if (!results || !resolve) return prediction;

    const homeKey = resolve(prediction.home);
    const awayKey = resolve(prediction.away);
    const result = results.find(
      (item) =>
        item.date === prediction.date &&
        item.home === homeKey &&
        item.away === awayKey,
    );
    if (!result) return prediction;

    const outcome =
      result.hg > result.ag
        ? "casa"
        : result.hg < result.ag
          ? "fora"
          : "empate";
    return {
      ...prediction,
      actualResult: {
        homeGoals: result.hg,
        awayGoals: result.ag,
        outcome,
        recordedAt: new Date().toISOString(),
      },
    };
  });
}

function calculateMetrics(predictions) {
  const evaluated = predictions.filter((prediction) => prediction.actualResult);
  if (evaluated.length === 0) {
    return { evaluated: 0, hitRate: 0, brierScore: 0, minimumSample: 20 };
  }

  let hits = 0;
  let brierTotal = 0;
  for (const prediction of evaluated) {
    const probabilities = prediction.resultado;
    const predicted = Object.entries(probabilities).reduce((best, current) =>
      current[1] > best[1] ? current : best,
    )[0];
    if (predicted === prediction.actualResult.outcome) hits += 1;

    const targets = {
      casa: prediction.actualResult.outcome === "casa" ? 1 : 0,
      empate: prediction.actualResult.outcome === "empate" ? 1 : 0,
      fora: prediction.actualResult.outcome === "fora" ? 1 : 0,
    };
    brierTotal +=
      ((probabilities.casa - targets.casa) ** 2 +
        (probabilities.empate - targets.empate) ** 2 +
        (probabilities.fora - targets.fora) ** 2) /
      3;
  }

  return {
    evaluated: evaluated.length,
    hitRate: round2(hits / evaluated.length),
    brierScore: round2(brierTotal / evaluated.length),
    minimumSample: 20,
  };
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }

  const fixtures = getUpcomingFixtures();
  const previousCurrent = readJson(PROBABILITIES_PATH, { predictions: [] });
  const previousHistory = readJson(HISTORY_PATH, { predictions: [] });
  const archived = enrichArchivedPredictions(
    mergePredictions(
      previousHistory.predictions ?? [],
      previousCurrent.predictions ?? [],
    ),
    fixtures,
  );
  const competitions = [
    ...new Set(
      [
        ...fixtures.map((fixture) => fixture.competition),
        ...archived.map((prediction) => prediction.competition),
      ].filter(Boolean),
    ),
  ];
  console.log(`Confrontos futuros no jogos.json: ${fixtures.length}`);
  console.log(`Competições: ${competitions.join(", ")}\n`);

  // Constrói um modelo por liga coberta.
  const models = {};
  const resultsByCompetition = {};
  for (const comp of competitions) {
    const leagueId = LEAGUE_MAP[comp];
    if (!leagueId) {
      console.log(`— ${comp}: sem cobertura na API (pulado)`);
      continue;
    }
    const results = await fetchFinishedResults(leagueId);
    resultsByCompetition[comp] = results;
    const model = computeModel(results);
    if (!model) {
      console.log(`— ${comp}: 0 resultados retornados (pulado)`);
      continue;
    }
    models[comp] = model;
    console.log(`✓ ${comp}: modelo com ${model.sampleSize} jogos, ${Object.keys(model.strengths).length} times`);
  }

  // Resolvedor de nomes por competição (construído uma vez).
  const resolvers = {};
  for (const [comp, model] of Object.entries(models)) {
    resolvers[comp] = buildResolver(model);
  }

  // Prediz cada confronto.
  const predictions = [];
  const unmatched = [];
  for (const f of fixtures) {
    const model = models[f.competition];
    if (!model) continue;
    const resolve = resolvers[f.competition];
    const homeKey = resolve(f.home);
    const awayKey = resolve(f.away);
    if (!homeKey || !awayKey) {
      unmatched.push(`${f.home} x ${f.away} (${!homeKey ? f.home : f.away})`);
      continue;
    }
    predictions.push({
      date: f.date,
      time: f.time,
      home: f.home,
      away: f.away,
      competition: f.competition,
      round: f.round,
      ...predictFixture(model, homeKey, awayKey),
    });
  }

  // Ranking de força por competição — o modelo já calcula, só não expunha.
  // Alimenta o hub /estatisticas (ataque/defesa de cada time vs. média da liga).
  const teamStrengths = {};
  for (const [comp, model] of Object.entries(models)) {
    teamStrengths[comp] = Object.entries(model.strengths)
      .map(([name, s]) => {
        const games = s.games.home + s.games.away;
        // Média das forças casa/fora — 1.0 = exatamente a média da liga.
        const ataque = (s.attackHome + s.attackAway) / 2;
        const defesa = (s.defenseHome + s.defenseAway) / 2;
        return {
          time: name,
          jogos: games,
          ataque: round2(ataque),
          defesa: round2(defesa),
          // Saldo de força: >0 = time acima da média da liga no conjunto.
          saldo: round2(ataque - defesa),
        };
      })
      .filter((t) => t.jogos > 0)
      .sort((a, b) => b.saldo - a.saldo);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "apifootball.com",
    model: "poisson-v1",
    disclaimer:
      "Estimativas estatísticas de modelo próprio. Não são garantia de resultado.",
    leagueAverages: Object.fromEntries(
      Object.entries(models).map(([comp, m]) => [
        comp,
        { golsCasa: round2(m.leagueHomeAvg), golsFora: round2(m.leagueAwayAvg) },
      ]),
    ),
    teamStrengths,
    predictions,
  };
  writeFileSync(PROBABILITIES_PATH, JSON.stringify(out, null, 2) + "\n");

  const historicalPredictions = evaluateHistoricalPredictions(
    mergePredictions(archived, predictions),
    resultsByCompetition,
    resolvers,
  );
  writeFileSync(
    HISTORY_PATH,
    JSON.stringify(
      {
        updatedAt: out.generatedAt,
        predictions: historicalPredictions,
        metrics: calculateMetrics(historicalPredictions),
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`\n✓ ${predictions.length} predições geradas.`);
  for (const p of predictions) {
    console.log(
      `  ${p.home} x ${p.away}  →  ${pct(p.resultado.casa)}% / ${pct(p.resultado.empate)}% / ${pct(p.resultado.fora)}%  (xG ${p.lambdaHome}-${p.lambdaAway})`,
    );
  }
  if (unmatched.length) {
    console.log(`\n⚠ ${unmatched.length} confrontos sem casar nome (ajustar ALIAS):`);
    for (const u of unmatched) console.log(`  - ${u}`);
  }
}

if (require.main === module) main();

// Re-export por compatibilidade — a implementação vive em scripts/lib/poisson.js.
module.exports = require("./lib/poisson");
