/**
 * Classificação do Brasileirão — Beira do Campo
 * ---------------------------------------------------------------------------
 * Gera a tabela oficial (apifootball.com) enriquecida com o que ninguém mais dá:
 *
 *   get_standings  ->  posição, J/V/E/D, gols, pontos, splits casa/fora, zonas
 *   get_events     ->  últimos 5 jogos (forma) + jogos que faltam
 *   Poisson + Monte Carlo  ->  chance de título, G4, acesso e rebaixamento
 *
 *   node scripts/build-standings.js [--runs 10000] [--no-sim]
 *
 * Saída: content/classificacao.json (lido pelo Next no render — estático/SEO)
 *
 * A simulação usa PRNG com semente fixa: rodar duas vezes com os mesmos
 * resultados dá os mesmos números — evita a tabela "tremer" entre deploys.
 * ---------------------------------------------------------------------------
 */

const { writeFileSync } = require("fs");
const { join } = require("path");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { computeModel, expectedGoals, samplePoisson } = require("./lib/poisson");

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";
const OUTPUT_PATH = join(process.cwd(), "content", "classificacao.json");

/**
 * Temporada: derivada do ano corrente, NUNCA chumbada — as rotas são perenes
 * (/tabela-do-brasileirao continua a mesma em 2027, só muda o conteúdo).
 * Use `--season 2027` pra forçar (útil em janeiro, quando o calendário vira
 * antes ou depois do ano civil).
 */
function seasonWindow(season) {
  return { start: `${season}-01-01`, end: `${season}-12-31` };
}

/**
 * Competições com tabela publicada. `slug` é a rota (/tabela-do-<slug>) e a
 * chave em classificacao.json — a copy de cada página vive em
 * src/lib/standings-competitions.ts, casada por este mesmo slug.
 *
 * `zones` diz quantos times cada faixa pega, porque isso muda por competição
 * (Brasileirão: G4/G6/Z4; Champions: 8 diretos de 24; estadual: 2 por grupo).
 * `format` controla a checagem de consistência e se a simulação pode rodar:
 * "pontos-corridos" = todos contra todos, em `legs` turnos (1 ou 2).
 */
const SERIES = [
  {
    slug: "brasileirao",
    competition: "Brasileirão Série A",
    shortName: "Brasileirão",
    leagueId: 99,
    totalRounds: 38,
    format: "pontos-corridos",
    legs: 2,
    zones: { promotion: 4, secondary: 6, relegation: 4 },
  },
  {
    slug: "brasileirao-serie-b",
    competition: "Brasileirão Série B",
    shortName: "Série B",
    leagueId: 75,
    totalRounds: 38,
    format: "pontos-corridos",
    legs: 2,
    // Série B não tem faixa secundária: ou sobe no G4, ou não sobe.
    zones: { promotion: 4, secondary: null, relegation: 4 },
  },
  {
    slug: "brasileirao-serie-c",
    competition: "Brasileirão Série C",
    shortName: "Série C",
    leagueId: 79,
    // Primeira fase: turno único, 8 avançam ao quadrangular, 4 caem pra Série D.
    totalRounds: 19,
    format: "pontos-corridos",
    legs: 1,
    zones: { promotion: 8, secondary: null, relegation: 4 },
  },
];

const round1 = (x) => Math.round(x * 10) / 10;
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ================================================================== *
 * 1. Camada de dados — apifootball.com
 * ================================================================== */

async function apiGet(action, params) {
  const query = new URLSearchParams({ action, APIkey: API_KEY, ...params });
  const res = await fetch(`${API_BASE}/?${query}`);
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  return res.json();
}

async function fetchStandings(leagueId, competition) {
  const data = await apiGet("get_standings", { league_id: String(leagueId) });
  if (!Array.isArray(data)) return [];

  // A API separa a tabela por estágio: "Current" no Brasileirão, "First Stage"
  // na Série C, e uma por grupo em estadual. Um estágio só = tabela única.
  const stages = [...new Set(data.map((r) => r.stage_name).filter(Boolean))];
  if (stages.length <= 1) return data;

  const current = data.filter((r) => r.stage_name === "Current");
  if (current.length) return current;

  console.log(
    `  ⚠ ${competition}: ${stages.length} estágios na API (${stages.join(", ")}) — usando "${stages[0]}"`,
  );
  return data.filter((r) => r.stage_name === stages[0]);
}

/** Jogos da temporada: encerrados (com placar) e os que ainda faltam. */
async function fetchSeasonEvents(leagueId, season) {
  const { start, end } = seasonWindow(season);
  const data = await apiGet("get_events", {
    league_id: String(leagueId),
    from: start,
    to: end,
  });
  if (!Array.isArray(data)) return { finished: [], remaining: [] };

  const finished = [];
  const remaining = [];
  for (const e of data) {
    const home = e.match_hometeam_name;
    const away = e.match_awayteam_name;
    if (!home || !away) continue;
    const hg = parseInt(e.match_hometeam_score, 10);
    const ag = parseInt(e.match_awayteam_score, 10);
    if (e.match_status === "Finished" && Number.isFinite(hg) && Number.isFinite(ag)) {
      finished.push({ date: e.match_date, home, away, hg, ag, round: e.match_round });
    } else {
      remaining.push({ date: e.match_date, home, away, round: e.match_round });
    }
  }
  finished.sort((a, b) => a.date.localeCompare(b.date));
  return { finished, remaining };
}

/* ================================================================== *
 * 2. Forma recente (últimos 5)
 * ================================================================== */

const FORM_SIZE = 5;

/** Últimos 5 resultados de cada time, do mais antigo para o mais recente. */
function buildForm(finished) {
  const byTeam = new Map();
  const push = (team, entry) => {
    if (!byTeam.has(team)) byTeam.set(team, []);
    byTeam.get(team).push(entry);
  };

  for (const m of finished) {
    const homeResult = m.hg > m.ag ? "V" : m.hg === m.ag ? "E" : "D";
    const awayResult = m.hg > m.ag ? "D" : m.hg === m.ag ? "E" : "V";
    push(m.home, {
      resultado: homeResult,
      adversario: m.away,
      placar: `${m.hg}-${m.ag}`,
      mandante: true,
      data: m.date,
    });
    push(m.away, {
      resultado: awayResult,
      adversario: m.home,
      placar: `${m.ag}-${m.hg}`,
      mandante: false,
      data: m.date,
    });
  }

  const form = {};
  for (const [team, games] of byTeam) {
    form[team] = games.slice(-FORM_SIZE);
  }
  return form;
}

/* ================================================================== *
 * 3. Monte Carlo do restante da temporada
 * ================================================================== */

/** PRNG determinístico (mulberry32) — mesma entrada, mesma saída. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIM_SEED = 20260728;

/**
 * Simula os jogos que faltam N vezes e conta em quantas cada time termina
 * campeão, na zona principal (G4/acesso), na secundária (G6) e no rebaixamento.
 *
 * ⚠️ Assume tabela única de pontos corridos. Competição por grupos (estadual,
 * Série C/D, fase de grupos de copa) precisa simular grupo a grupo — por isso
 * `format` filtra quem chega aqui.
 *
 * Critérios de desempate: pontos > vitórias > saldo > gols marcados — os mesmos
 * do regulamento (confronto direto e cartões ficam de fora, não muda a estatística).
 */
function simulateSeason({ rows, remaining, model, runs, zones }) {
  const teams = rows.map((r) => r.team);
  const index = new Map(teams.map((t, i) => [t, i]));
  const n = teams.length;

  const basePts = rows.map((r) => r.points);
  const baseWins = rows.map((r) => r.wins);
  const baseGD = rows.map((r) => r.goalDiff);
  const baseGF = rows.map((r) => r.goalsFor);

  // Lambdas pré-calculados por confronto — não muda entre runs.
  const fixtures = [];
  for (const m of remaining) {
    const h = index.get(m.home);
    const a = index.get(m.away);
    if (h === undefined || a === undefined) continue; // time fora da tabela (ex.: jogo de outra fase)
    const xg = expectedGoals(model, m.home, m.away);
    if (!xg) continue;
    fixtures.push({ h, a, lh: xg.lambdaHome, la: xg.lambdaAway });
  }

  const titulo = new Array(n).fill(0);
  const promocao = new Array(n).fill(0);
  const secundaria = new Array(n).fill(0);
  const rebaixamento = new Array(n).fill(0);
  const pointsSum = new Array(n).fill(0);
  const positionSum = new Array(n).fill(0);

  // Zona secundária é opcional (a Série B não tem "G6").
  const promotionSize = zones.promotion ?? 0;
  const secondarySize = zones.secondary ?? 0;
  const relegationSize = zones.relegation ?? 0;

  const rand = mulberry32(SIM_SEED);
  const pts = new Array(n);
  const wins = new Array(n);
  const gd = new Array(n);
  const gf = new Array(n);
  const order = new Array(n);

  for (let run = 0; run < runs; run++) {
    for (let i = 0; i < n; i++) {
      pts[i] = basePts[i];
      wins[i] = baseWins[i];
      gd[i] = baseGD[i];
      gf[i] = baseGF[i];
      order[i] = i;
    }

    for (const f of fixtures) {
      const hg = samplePoisson(f.lh, rand);
      const ag = samplePoisson(f.la, rand);
      gf[f.h] += hg;
      gf[f.a] += ag;
      gd[f.h] += hg - ag;
      gd[f.a] += ag - hg;
      if (hg > ag) {
        pts[f.h] += 3;
        wins[f.h] += 1;
      } else if (hg === ag) {
        pts[f.h] += 1;
        pts[f.a] += 1;
      } else {
        pts[f.a] += 3;
        wins[f.a] += 1;
      }
    }

    order.sort(
      (x, y) =>
        pts[y] - pts[x] || wins[y] - wins[x] || gd[y] - gd[x] || gf[y] - gf[x],
    );

    for (let position = 0; position < n; position++) {
      const team = order[position];
      pointsSum[team] += pts[team];
      positionSum[team] += position + 1;
      if (position === 0) titulo[team] += 1;
      if (position < promotionSize) promocao[team] += 1;
      if (position < secondarySize) secundaria[team] += 1;
      if (relegationSize && position >= n - relegationSize) {
        rebaixamento[team] += 1;
      }
    }
  }

  const chances = {};
  for (let i = 0; i < n; i++) {
    chances[teams[i]] = {
      titulo: round1((titulo[i] / runs) * 100),
      promocao: round1((promocao[i] / runs) * 100),
      secundaria: secondarySize ? round1((secundaria[i] / runs) * 100) : null,
      rebaixamento: round1((rebaixamento[i] / runs) * 100),
      pontosProjetados: Math.round(pointsSum[i] / runs),
      posicaoMedia: round1(positionSum[i] / runs),
    };
  }
  return { chances, simulatedFixtures: fixtures.length };
}

/* ================================================================== *
 * 4. Normalização das linhas da tabela
 * ================================================================== */

/**
 * Classifica a zona a partir do texto de promoção da API.
 * Série A: Libertadores (G4), pré-Libertadores (G6), Sul-Americana, rebaixamento.
 * Série B: acesso à Série A (G4) e rebaixamento à Série C.
 */
function parseZone(promotion) {
  const p = (promotion || "").toLowerCase();
  if (!p) return null;
  if (p.includes("relegation")) return "rebaixamento";
  if (p.includes("libertadores")) {
    return p.includes("qualification") ? "pre-libertadores" : "libertadores";
  }
  if (p.includes("sudamericana")) return "sul-americana";
  if (p.includes("promotion")) return "acesso";
  return null;
}

const int = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

function splitStats(row, prefix) {
  const played = int(row[`${prefix}_league_payed`]); // sic — a API escreve "payed"
  const gf = int(row[`${prefix}_league_GF`]);
  const ga = int(row[`${prefix}_league_GA`]);
  return {
    position: int(row[`${prefix}_league_position`]),
    played,
    wins: int(row[`${prefix}_league_W`]),
    draws: int(row[`${prefix}_league_D`]),
    losses: int(row[`${prefix}_league_L`]),
    goalsFor: gf,
    goalsAgainst: ga,
    goalDiff: gf - ga,
    points: int(row[`${prefix}_league_PTS`]),
  };
}

function normalizeRow(row) {
  const played = int(row.overall_league_payed);
  const points = int(row.overall_league_PTS);
  const goalsFor = int(row.overall_league_GF);
  const goalsAgainst = int(row.overall_league_GA);
  return {
    position: int(row.overall_league_position),
    team: row.team_name,
    teamId: row.team_id,
    badge: row.team_badge || null,
    played,
    wins: int(row.overall_league_W),
    draws: int(row.overall_league_D),
    losses: int(row.overall_league_L),
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    points,
    // Aproveitamento: % dos pontos disputados que o time somou.
    aproveitamento: played ? round1((points / (played * 3)) * 100) : 0,
    zone: parseZone(row.overall_promotion),
    home: splitStats(row, "home"),
    away: splitStats(row, "away"),
  };
}

/* ================================================================== *
 * 5. Runner
 * ================================================================== */

function parseArgs(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(name);
    return i > -1 ? parseInt(argv[i + 1], 10) || fallback : fallback;
  };
  return {
    runs: flag("--runs", 10000),
    season: flag("--season", new Date().getFullYear()),
    simulate: !argv.includes("--no-sim"),
  };
}

async function buildTable(serie, { runs, simulate, season }) {
  const [standings, events] = await Promise.all([
    fetchStandings(serie.leagueId, serie.competition),
    fetchSeasonEvents(serie.leagueId, season),
  ]);

  if (standings.length === 0) {
    console.log(`— ${serie.competition}: sem classificação na API (pulado)`);
    return null;
  }

  const rows = standings
    .map(normalizeRow)
    .sort((a, b) => a.position - b.position);
  const form = buildForm(events.finished);
  const teamNames = new Set(rows.map((r) => r.team));

  // Só interessam os jogos que faltam ENTRE times da tabela.
  const remaining = events.remaining.filter(
    (m) => teamNames.has(m.home) && teamNames.has(m.away),
  );

  const isRoundRobin = serie.format === "pontos-corridos";

  // Consistência: jogos disputados + jogos que faltam devem fechar o campeonato.
  // Só faz sentido em pontos corridos — por grupos, o total depende do formato.
  if (isRoundRobin) {
    const playedTotal = rows.reduce((s, r) => s + r.played, 0) / 2;
    const legs = serie.legs ?? 2;
    const expectedTotal = (rows.length * (rows.length - 1) * legs) / 2;
    const accounted = playedTotal + remaining.length;
    if (Math.abs(accounted - expectedTotal) > 0.5) {
      console.log(
        `  ⚠ ${serie.competition}: ${playedTotal} disputados + ${remaining.length} restantes = ${accounted} (esperado ${expectedTotal})`,
      );
    }
  }

  const model = computeModel(events.finished);

  let chances = {};
  let simulatedFixtures = 0;
  // A simulação assume tabela única; competição por grupos fica só com a tabela.
  if (simulate && isRoundRobin && model && remaining.length > 0) {
    const sim = simulateSeason({
      rows,
      remaining,
      model,
      runs,
      zones: serie.zones ?? {},
    });
    chances = sim.chances;
    simulatedFixtures = sim.simulatedFixtures;
    if (simulatedFixtures < remaining.length) {
      console.log(
        `  ⚠ ${serie.competition}: ${remaining.length - simulatedFixtures} jogos sem força de time no modelo`,
      );
    }
  }

  const roundsPlayed = Math.max(...rows.map((r) => r.played));

  return {
    slug: serie.slug,
    competition: serie.competition,
    shortName: serie.shortName,
    leagueId: serie.leagueId,
    season: String(season),
    format: serie.format,
    zones: serie.zones ?? {},
    roundsPlayed,
    totalRounds: serie.totalRounds,
    remainingMatches: remaining.length,
    simulation: simulatedFixtures
      ? { runs, fixtures: simulatedFixtures, model: "poisson-v1" }
      : null,
    rows: rows.map((r) => ({
      ...r,
      form: form[r.team] ?? [],
      chances: chances[r.team] ?? null,
    })),
  };
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  console.log(
    `Classificação ${options.season} — ${options.simulate ? `${options.runs} simulações` : "sem simulação"}\n`,
  );

  const tables = {};
  for (const serie of SERIES) {
    const table = await buildTable(serie, options);
    if (!table) continue;
    tables[serie.slug] = table;

    const leader = table.rows[0];
    const chance = leader.chances ? ` · título ${leader.chances.titulo}%` : "";
    console.log(
      `✓ ${serie.competition}: ${table.rows.length} times, rodada ${table.roundsPlayed}/${table.totalRounds}` +
        ` — líder ${leader.team} (${leader.points} pts${chance})`,
    );
  }

  if (Object.keys(tables).length === 0) {
    console.error("✗ Nenhuma tabela gerada — arquivo não foi escrito.");
    process.exit(1);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    updatedThrough: todayISO(),
    season: String(options.season),
    source: "apifootball.com",
    disclaimer:
      "Classificação oficial da competição. As chances de título, G4 e rebaixamento são estimativas de modelo estatístico próprio — não são garantia de resultado.",
    tables,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✓ content/classificacao.json atualizado.`);
}

if (require.main === module) main();
