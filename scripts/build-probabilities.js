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
 * A matemática (seções 1 e 2) é PURA e portável — roda igual num GitHub Action
 * ou Cloudflare Worker. Na Fase 2 migra pra src/lib/probabilities/*.ts.
 * ---------------------------------------------------------------------------
 */

const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const round2 = (x) => Math.round(x * 100) / 100;
const pct = (x) => Math.round(x * 1000) / 10;

/* ================================================================== *
 * 1. Matemática de Poisson (pura, portável)
 * ================================================================== */

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poissonPmf(lambda, k) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function scoreMatrix(lambdaHome, lambdaAway, maxGoals = 10) {
  const home = [];
  const away = [];
  for (let k = 0; k <= maxGoals; k++) {
    home.push(poissonPmf(lambdaHome, k));
    away.push(poissonPmf(lambdaAway, k));
  }
  const matrix = [];
  for (let i = 0; i <= maxGoals; i++) {
    const row = [];
    for (let j = 0; j <= maxGoals; j++) row.push(home[i] * away[j]);
    matrix.push(row);
  }
  return matrix;
}

function deriveMarkets(matrix) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let bttsYes = 0;
  let total = 0;
  let best = { i: 0, j: 0, p: 0 };

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const p = matrix[i][j];
      total += p;
      if (i > j) homeWin += p;
      else if (i === j) draw += p;
      else awayWin += p;
      if (i + j >= 3) over25 += p;
      if (i >= 1 && j >= 1) bttsYes += p;
      if (p > best.p) best = { i, j, p };
    }
  }

  const norm = (x) => x / total;
  return {
    resultado: { casa: norm(homeWin), empate: norm(draw), fora: norm(awayWin) },
    gols: { over25: norm(over25), under25: norm(total - over25) },
    ambosMarcam: { sim: norm(bttsYes), nao: norm(total - bttsYes) },
    placarProvavel: `${best.i}-${best.j}`,
  };
}

/* ================================================================== *
 * 2. Modelo: resultados -> forças -> lambdas
 * ================================================================== */

const SHRINK_K = 5; // regressão à média p/ amostra pequena (cold-start)

function shrink(raw, n) {
  const w = n / (n + SHRINK_K);
  return w * raw + (1 - w) * 1.0;
}

function computeModel(results) {
  const matches = results.length;
  if (matches === 0) return null;
  const leagueHomeAvg = results.reduce((s, r) => s + r.hg, 0) / matches;
  const leagueAwayAvg = results.reduce((s, r) => s + r.ag, 0) / matches;

  const teams = {};
  const ensure = (name) =>
    (teams[name] ||= { homeGF: 0, homeGA: 0, homeN: 0, awayGF: 0, awayGA: 0, awayN: 0 });

  for (const r of results) {
    const h = ensure(r.home);
    const a = ensure(r.away);
    h.homeGF += r.hg;
    h.homeGA += r.ag;
    h.homeN += 1;
    a.awayGF += r.ag;
    a.awayGA += r.hg;
    a.awayN += 1;
  }

  const strengths = {};
  for (const [name, t] of Object.entries(teams)) {
    const homeGF = t.homeN ? t.homeGF / t.homeN : leagueHomeAvg;
    const homeGA = t.homeN ? t.homeGA / t.homeN : leagueAwayAvg;
    const awayGF = t.awayN ? t.awayGF / t.awayN : leagueAwayAvg;
    const awayGA = t.awayN ? t.awayGA / t.awayN : leagueHomeAvg;
    strengths[name] = {
      attackHome: shrink(homeGF / leagueHomeAvg, t.homeN),
      defenseHome: shrink(homeGA / leagueAwayAvg, t.homeN),
      attackAway: shrink(awayGF / leagueAwayAvg, t.awayN),
      defenseAway: shrink(awayGA / leagueHomeAvg, t.awayN),
      games: { home: t.homeN, away: t.awayN },
    };
  }

  return { leagueHomeAvg, leagueAwayAvg, strengths, sampleSize: matches };
}

/** Prediz confronto. homeName/awayName são as CHAVES do modelo (nomes da API). */
function predictFixture(model, homeName, awayName) {
  const H = model.strengths[homeName];
  const A = model.strengths[awayName];
  const lambdaHome = model.leagueHomeAvg * H.attackHome * A.defenseAway;
  const lambdaAway = model.leagueAwayAvg * A.attackAway * H.defenseHome;
  const markets = deriveMarkets(scoreMatrix(lambdaHome, lambdaAway));
  return {
    lambdaHome: round2(lambdaHome),
    lambdaAway: round2(lambdaAway),
    golsEsperados: round2(lambdaHome + lambdaAway),
    ...markets,
    explicacao: {
      forcaAtaqueCasa: round2(H.attackHome),
      forcaDefesaCasa: round2(H.defenseHome),
      forcaAtaqueFora: round2(A.attackAway),
      forcaDefesaFora: round2(A.defenseAway),
      jogosConsiderados: { casa: H.games.home, fora: A.games.away },
    },
  };
}

/* ================================================================== *
 * 3. Camada de dados — apifootball.com
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
      home: e.match_hometeam_name,
      away: e.match_awayteam_name,
      hg: parseInt(e.match_hometeam_score, 10),
      ag: parseInt(e.match_awayteam_score, 10),
    }))
    .filter((r) => Number.isFinite(r.hg) && Number.isFinite(r.ag));
}

/* ================================================================== *
 * 4. Casamento de nomes (jogos.json  <->  nomes da API)
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
 * 5. Runner
 * ================================================================== */

function getUpcomingFixtures() {
  const raw = readFileSync(join(process.cwd(), "content", "jogos.json"), "utf-8");
  const { games } = JSON.parse(raw);
  const today = todayISO();
  return games.filter((g) => g.date >= today);
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }

  const fixtures = getUpcomingFixtures();
  const competitions = [...new Set(fixtures.map((f) => f.competition))];
  console.log(`Confrontos futuros no jogos.json: ${fixtures.length}`);
  console.log(`Competições: ${competitions.join(", ")}\n`);

  // Constrói um modelo por liga coberta.
  const models = {};
  for (const comp of competitions) {
    const leagueId = LEAGUE_MAP[comp];
    if (!leagueId) {
      console.log(`— ${comp}: sem cobertura na API (pulado)`);
      continue;
    }
    const results = await fetchFinishedResults(leagueId);
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
      home: f.home,
      away: f.away,
      ...predictFixture(model, homeKey, awayKey),
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "apifootball.com",
    model: "poisson-v1",
    disclaimer:
      "Estimativas estatísticas de modelo próprio. Não são garantia de resultado.",
    predictions,
  };
  writeFileSync(
    join(process.cwd(), "content", "probabilidades.json"),
    JSON.stringify(out, null, 2) + "\n",
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

module.exports = { poissonPmf, scoreMatrix, deriveMarkets, computeModel, predictFixture };
