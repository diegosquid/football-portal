#!/usr/bin/env node
/**
 * ==============================================================================
 * build-brackets.js — Chaveamento das competições de mata-mata
 * ==============================================================================
 *
 * Fonte: apifootball.com (`get_events`). Não existe endpoint de chaveamento —
 * o confronto é reconstruído emparelhando os jogos de ida e volta.
 *
 * Duas armadilhas do dado, que explicam o tamanho deste arquivo:
 *
 * 1. `match_hometeam_score` vem CORROMPIDO em jogo decidido nos pênaltis.
 *    Exemplo real: "Dep. Tachira 3 x 0 The Strongest" com ft 1-0 e pênaltis
 *    5-3 — o 3 não é nem o placar do tempo normal, nem o dos pênaltis. Os
 *    campos confiáveis são `*_ft_score`, `*_extra_score` e `*_penalty_score`,
 *    e são só esses que este script usa.
 *
 * 2. `stage_name` não é posição de chaveamento. A Libertadores devolve
 *    "Quarter-finals" com 6 jogos e "Semi-finals" com 16 — são as fases
 *    prévias de fevereiro, não as quartas e a semi de verdade. Por isso a fase
 *    é nomeada pela QUANTIDADE de confrontos que ela realmente tem, e round
 *    que não fecha como chave é descartado.
 *
 * Uso:
 *   node scripts/build-brackets.js
 *   node scripts/build-brackets.js --verbose
 *
 * Depois: node scripts/publish-data.js chaveamento.json
 */

const { writeFileSync } = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";
const OUTPUT_PATH = path.join(__dirname, "..", "content", "chaveamento.json");
const SEASON_START = "2026-01-01";
const SEASON_END = "2026-12-31";

/** Competições de mata-mata com página de chaveamento. */
const COMPETITIONS = [
  {
    slug: "copa-do-brasil",
    competition: "Copa do Brasil",
    shortName: "Copa do Brasil",
    leagueId: 349,
  },
  {
    slug: "libertadores",
    competition: "Libertadores",
    shortName: "Libertadores",
    leagueId: 18,
  },
  {
    slug: "sul-americana",
    competition: "Sul-Americana",
    shortName: "Sul-Americana",
    leagueId: 385,
  },
];

/**
 * Fases de chaveamento aceitas, com quantos confrontos cada uma DEVE ter.
 *
 * A checagem é dupla — nome e contagem — porque cada um sozinho engana:
 * nomear pela contagem transformava a prévia da Libertadores ("Semi-finals",
 * 8 confrontos) numas segundas "oitavas de final", e confiar só no nome
 * aceitaria uma "Final" com 4 confrontos. Só passa a fase em que os dois
 * concordam; qualquer divergência é dado sujo e fica de fora.
 */
const KNOCKOUT_ROUNDS = {
  final: { ties: 1, name: "Final", order: 100 },
  "semi-finals": { ties: 2, name: "Semifinais", order: 90 },
  "1/2-finals": { ties: 2, name: "Semifinais", order: 90 },
  "quarter-finals": { ties: 4, name: "Quartas de final", order: 80 },
  "1/4-finals": { ties: 4, name: "Quartas de final", order: 80 },
  "1/8-finals": { ties: 8, name: "Oitavas de final", order: 70 },
  "1/16-finals": { ties: 16, name: "Fase de 16 avos", order: 60 },
};

function knockoutRound(stage) {
  return KNOCKOUT_ROUNDS[stage.trim().toLowerCase()];
}

const FINISHED = new Set(["Finished", "After Pen.", "Awarded"]);

async function apiGet(action, params) {
  const query = new URLSearchParams({ action, APIkey: API_KEY, ...params });
  const res = await fetch(`${API_BASE}/?${query}`);
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  return res.json();
}

const num = (v) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Placar do tempo normal (+ prorrogação quando houve).
 * Nunca lê `match_hometeam_score`: é o campo que vem furado nos pênaltis.
 */
function legScore(e) {
  const ft = { home: num(e.match_hometeam_ft_score), away: num(e.match_awayteam_ft_score) };
  if (ft.home === null || ft.away === null) {
    // Jogo sem ft_score preenchido: só confia no placar simples se não houve
    // pênaltis (onde ele estaria corrompido).
    if (num(e.match_hometeam_penalty_score) !== null) return null;
    const h = num(e.match_hometeam_score);
    const a = num(e.match_awayteam_score);
    return h === null || a === null ? null : { home: h, away: a };
  }
  const etHome = num(e.match_hometeam_extra_score) ?? 0;
  const etAway = num(e.match_awayteam_extra_score) ?? 0;
  return { home: ft.home + etHome, away: ft.away + etAway };
}

const pairKey = (a, b) => [a, b].sort().join(" :: ");

/** Reconstrói um confronto (1 ou 2 jogos) a partir das partidas emparelhadas. */
function buildTie(legs) {
  legs.sort((a, b) => a.date.localeCompare(b.date));
  const first = legs[0];
  // Manda no confronto quem jogou em casa na VOLTA, como manda o costume.
  const anchor = legs.length > 1 ? legs[legs.length - 1].home : first.home;
  const other = anchor === first.home ? first.away : first.home;

  let aggAnchor = 0;
  let aggOther = 0;
  let played = 0;
  let penalties = null;

  for (const leg of legs) {
    if (!leg.finished || !leg.score) continue;
    played++;
    const anchorIsHome = leg.home === anchor;
    aggAnchor += anchorIsHome ? leg.score.home : leg.score.away;
    aggOther += anchorIsHome ? leg.score.away : leg.score.home;
    if (leg.penalties) {
      penalties = {
        [anchor]: anchorIsHome ? leg.penalties.home : leg.penalties.away,
        [other]: anchorIsHome ? leg.penalties.away : leg.penalties.home,
      };
    }
  }

  const complete = played === legs.length;
  let winner = null;
  if (complete) {
    if (aggAnchor > aggOther) winner = anchor;
    else if (aggOther > aggAnchor) winner = other;
    else if (penalties) {
      winner = penalties[anchor] > penalties[other] ? anchor : other;
    }
  }

  return {
    teams: [anchor, other],
    // Sem horário de propósito: `match_time` desta fonte vem em fuso europeu
    // (21:30 de Brasília chega como 02:30) e a agenda confiável do portal é o
    // jogos.json. Quem quer horário clica no jogo e cai em /onde-assistir.
    legs: legs.map((leg) => ({
      date: leg.date,
      home: leg.home,
      away: leg.away,
      score: leg.score,
      penalties: leg.penalties,
      stadium: leg.stadium || null,
      finished: leg.finished,
    })),
    aggregate: played > 0 ? { [anchor]: aggAnchor, [other]: aggOther } : null,
    penalties,
    decided: Boolean(winner),
    winner,
  };
}

async function buildCompetition(comp, { verbose }) {
  let events;
  try {
    events = await apiGet("get_events", {
      league_id: String(comp.leagueId),
      from: SEASON_START,
      to: SEASON_END,
    });
  } catch (err) {
    console.log(`  – ${comp.competition}: falha na API (${err.message})`);
    return null;
  }
  if (!Array.isArray(events) || events.length === 0) {
    console.log(`  – ${comp.competition}: sem jogos no período`);
    return null;
  }

  // Agrupa por fase da fonte, depois emparelha ida e volta dentro dela.
  const byStage = new Map();
  for (const e of events) {
    const stage = String(e.stage_name || e.match_round || "").trim();
    if (!stage || /group/i.test(stage)) continue; // fase de grupos não é chave
    if (!byStage.has(stage)) byStage.set(stage, []);
    const finished = FINISHED.has(e.match_status);
    byStage.get(stage).push({
      date: e.match_date,
      home: String(e.match_hometeam_name || "").trim(),
      away: String(e.match_awayteam_name || "").trim(),
      // Jogo que não aconteceu não tem placar: a fonte manda "0" nos campos de
      // gol de partida futura, e isso virava um "0 x 0" que parecia resultado.
      score: finished ? legScore(e) : null,
      penalties:
        num(e.match_hometeam_penalty_score) !== null
          ? {
              home: num(e.match_hometeam_penalty_score),
              away: num(e.match_awayteam_penalty_score),
            }
          : null,
      stadium: e.match_stadium,
      finished,
    });
  }

  const rounds = [];
  for (const [stage, legs] of byStage) {
    const pairs = new Map();
    for (const leg of legs) {
      if (!leg.home || !leg.away) continue;
      const key = pairKey(leg.home, leg.away);
      pairs.set(key, [...(pairs.get(key) ?? []), leg]);
    }

    // Trava estrutural: chave é 1 ou 2 jogos entre os mesmos dois times.
    const malformed = [...pairs.values()].filter((l) => l.length > 2);
    const ties = [...pairs.values()]
      .filter((l) => l.length <= 2)
      .map(buildTie)
      .sort((a, b) => a.legs[0].date.localeCompare(b.legs[0].date));

    const meta = knockoutRound(stage);
    const countMatches = meta && ties.length === meta.ties;
    const skip = !meta || !countMatches || malformed.length > 0;

    if (verbose || skip) {
      const why = !meta
        ? "fase não é etapa de chaveamento"
        : !countMatches
          ? `rótulo diz ${meta.name} (${meta.ties} confrontos), mas vieram ${ties.length} — dado inconsistente`
          : malformed.length > 0
            ? `${malformed.length} par(es) com mais de 2 jogos`
            : "OK";
      console.log(`      "${stage}": ${legs.length} jogos, ${ties.length} confrontos — ${why}`);
    }
    if (skip) continue;

    rounds.push({
      name: meta.name,
      order: meta.order,
      sourceStage: stage,
      ties,
      decided: ties.filter((t) => t.decided).length,
    });
  }

  if (rounds.length === 0) {
    console.log(`  ✗ ${comp.competition}: nenhuma fase fechou como chave — não publicado`);
    return null;
  }

  rounds.sort((a, b) => a.order - b.order);

  return {
    slug: comp.slug,
    competition: comp.competition,
    shortName: comp.shortName,
    leagueId: comp.leagueId,
    // Fatia da string, não `new Date(...).getFullYear()`: "2026-01-01" é lido
    // como meia-noite UTC e, no fuso de Brasília, volta como 2025.
    season: SEASON_START.slice(0, 4),
    rounds,
  };
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }
  const verbose = process.argv.includes("--verbose");

  console.log("Chaveamento — emparelhando ida e volta e conferindo a estrutura\n");

  const competitions = {};
  for (const comp of COMPETITIONS) {
    const built = await buildCompetition(comp, { verbose });
    if (!built) continue;
    competitions[comp.slug] = built;
    console.log(
      `  ✓ ${comp.competition}: ${built.rounds.length} fase(s) — ` +
        built.rounds.map((r) => `${r.name} (${r.ties.length})`).join(", "),
    );
  }

  if (Object.keys(competitions).length === 0) {
    console.error("\n✗ Nenhum chaveamento gerado — arquivo não foi escrito.");
    process.exit(1);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "apifootball.com",
    disclaimer:
      "Confrontos reconstruídos a partir do calendário oficial. Placar agregado considera tempo normal e prorrogação; pênaltis são mostrados à parte.",
    competitions,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✓ content/chaveamento.json atualizado.`);
}

if (require.main === module) main();
