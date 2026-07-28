/**
 * Modelo de Poisson — matemática pura e portável
 * ---------------------------------------------------------------------------
 * Extraído de scripts/build-probabilities.js para ser compartilhado com
 * scripts/build-standings.js (simulação de fim de temporada).
 *
 * Nada aqui toca rede ou disco: resultados entram, forças e probabilidades saem.
 * ---------------------------------------------------------------------------
 */

const round2 = (x) => Math.round(x * 100) / 100;

/* ================================================================== *
 * 1. Matemática de Poisson
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

/** Gols esperados de um confronto. home/away são as CHAVES do modelo (nomes da API). */
function expectedGoals(model, homeName, awayName) {
  const H = model.strengths[homeName];
  const A = model.strengths[awayName];
  if (!H || !A) return null;
  return {
    lambdaHome: model.leagueHomeAvg * H.attackHome * A.defenseAway,
    lambdaAway: model.leagueAwayAvg * A.attackAway * H.defenseHome,
    H,
    A,
  };
}

/** Prediz confronto. homeName/awayName são as CHAVES do modelo (nomes da API). */
function predictFixture(model, homeName, awayName) {
  const { lambdaHome, lambdaAway, H, A } = expectedGoals(model, homeName, awayName);
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

/**
 * Sorteia um número de gols de uma Poisson(lambda) pelo método de Knuth.
 * Usado na simulação de Monte Carlo do restante da temporada.
 */
function samplePoisson(lambda, rand = Math.random) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L);
  return k - 1;
}

module.exports = {
  round2,
  factorial,
  poissonPmf,
  scoreMatrix,
  deriveMarkets,
  SHRINK_K,
  shrink,
  computeModel,
  expectedGoals,
  predictFixture,
  samplePoisson,
};
