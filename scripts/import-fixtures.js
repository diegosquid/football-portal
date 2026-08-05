#!/usr/bin/env node
/**
 * ==============================================================================
 * import-fixtures.js — Completa o jogos.json com os jogos que faltam
 * ==============================================================================
 *
 * Por que existe: as paginas /onde-assistir/<jogo> respondem por 67% dos
 * cliques organicos do site (Search Console, mai-ago/2026). Elas so existem
 * para jogo que esta no jogos.json, e o jogos.json e escrito a mao pelo agente
 * — na pratica, cobrindo ~1/4 do calendario. Serie D, Feminino, Libertadores e
 * Sul-Americana estavam com zero cobertura.
 *
 * Este script NAO substitui a curadoria. Ele so ACRESCENTA confronto que ainda
 * nao esta no arquivo, preservando byte por byte o que o agente escreveu — o
 * jogo curado tem emissora pesquisada, e isso vale mais que o importado.
 *
 * As duas armadilhas resolvidas aqui
 * ----------------------------------
 * 1. HORARIO. `match_time` da apifootball vem em fuso europeu (UTC+2 no verao),
 *    e o parametro `timezone=` da API e ignorado. Em vez de chumbar "-5h", o
 *    script MEDE o deslocamento comparando os jogos que ja estao no arquivo
 *    curado com os mesmos jogos na API. Precisa de amostras concordantes; se
 *    divergirem, aborta sem escrever. Assim o import continua correto quando a
 *    Europa virar o horario de verao, e falha em silencio nenhum.
 *
 * 2. NOME DO CLUBE. A API escreve "Sao Paulo" e "Flamengo RJ". Os nomes
 *    canonicos saem de src/lib/teams.ts e src/lib/standings-names.ts, lidos
 *    direto dos arquivos pra nao criar uma segunda lista que diverge.
 *
 * Uso:
 *   node scripts/import-fixtures.js            # aplica
 *   node scripts/import-fixtures.js --dry-run  # so mostra o que entraria
 *
 * Rode DEPOIS de escrever o jogos.json curado e ANTES de build-probabilities.
 */

const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";
const GAMES_PATH = path.join(__dirname, "..", "content", "jogos.json");
const SRC = path.join(__dirname, "..", "src", "lib");

/** Quantos dias pra frente importar. */
const HORIZON_DAYS = 14;
/** Minimo de jogos em comum pra confiar no deslocamento de fuso medido. */
const MIN_CALIBRATION_SAMPLES = 3;

/** league_id -> nome da competicao como o portal escreve. */
const LEAGUES = {
  99: "Brasileirão Série A",
  75: "Brasileirão Série B",
  79: "Brasileirão Série C",
  80: "Brasileirão Série D",
  349: "Copa do Brasil",
  504: "Copa do Nordeste",
  660: "Brasileirão Feminino A1",
  18: "Libertadores",
  385: "Sul-Americana",
};

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");

/* ================================================================== *
 * 1. Nomes canonicos de clube
 * ================================================================== */

/**
 * Monta "nome da API -> nome do portal" a partir das mesmas fontes que o site
 * usa, em vez de uma lista propria: teams.ts (clube com pagina) e
 * standings-names.ts (clube sem pagina, so pro acento).
 */
function loadTeamNames() {
  const teamsSrc = readFileSync(path.join(SRC, "teams.ts"), "utf-8");
  const entries = [
    ...teamsSrc.matchAll(
      /name:\s*"([^"]+)",\s*shortName:[^}]*?(?:aliases:\s*\[([^\]]*)\])?\s*}/g,
    ),
  ].map((m) => ({
    name: m[1],
    aliases: m[2] ? [...m[2].matchAll(/"([^"]+)"/g)].map((a) => a[1]) : [],
  }));

  const byNorm = new Map();
  for (const t of entries) {
    for (const n of [t.name, ...t.aliases]) byNorm.set(norm(n), t.name);
  }

  // Correcoes de acento pra clube que nao tem pagina no portal.
  const fixesSrc = readFileSync(path.join(SRC, "standings-names.ts"), "utf-8");
  const fixes = fixesSrc.slice(
    fixesSrc.indexOf("API_NAME_FIXES"),
    fixesSrc.indexOf("API_SHORT_NAMES"),
  );
  for (const m of fixes.matchAll(/"?([^":\n]+)"?\s*:\s*"([^"]+)"/g)) {
    const from = m[1].trim();
    if (from && !byNorm.has(norm(from))) byNorm.set(norm(from), m[2]);
  }
  return byNorm;
}

/**
 * Nome de exibicao. Sem correspondencia, devolve o da API — nome cru e melhor
 * que nome errado, e clube de fora do Brasil raramente esta cadastrado.
 */
function displayTeam(apiName, byNorm) {
  const key = norm(apiName);
  if (byNorm.has(key)) return byNorm.get(key);
  for (const [k, v] of byNorm) {
    if (k.length >= 6 && (key.includes(k) || k.includes(key))) return v;
  }
  return String(apiName || "").trim();
}

/**
 * Time de competicao feminina.
 *
 * A fonte e inconsistente: escreve "Bahia W" e "Mixto W", mas "Botafogo" e
 * "Ferroviária" sem sufixo nenhum. Padronizar em "<Clube> Feminino" resolve
 * duas coisas de uma vez — fica na convencao que a imprensa brasileira usa, e
 * garante slug distinto do time masculino. Sem isso, Corinthians x Santos do
 * feminino e do masculino no mesmo dia disputariam a mesma URL, e um dos dois
 * jogos simplesmente nao existiria no site.
 */
function womensTeam(name) {
  const base = String(name || "")
    .trim()
    .replace(/\s+(W|Women|Feminino|Fem\.?)$/i, "")
    .trim();
  return base ? `${base} Feminino` : base;
}

/* ================================================================== *
 * 2. Fuso — medido, nao chumbado
 * ================================================================== */

const pad = (n) => String(n).padStart(2, "0");

/** Converte data/hora da API pro fuso de Brasilia usando o offset medido. */
function toBRT(dateStr, timeStr, offsetHours) {
  const d = new Date(`${dateStr}T${timeStr}:00Z`);
  d.setUTCHours(d.getUTCHours() - offsetHours - 3); // API->UTC, UTC->BRT
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

/**
 * Descobre o deslocamento comparando jogos que existem nas duas fontes.
 * Retorna null quando nao ha amostras suficientes ou elas discordam — nesse
 * caso o import inteiro e abortado, porque horario errado numa pagina de
 * "que horas e o jogo" e pior que a pagina nao existir.
 */
function calibrateOffset(curated, apiEvents) {
  const samples = [];
  for (const g of curated) {
    const hit = apiEvents.find(
      (e) =>
        norm(e.match_hometeam_name).includes(norm(g.home).slice(0, 6)) &&
        norm(e.match_awayteam_name).includes(norm(g.away).slice(0, 6)) &&
        // Sem a janela de data, o mesmo confronto em OUTRA rodada entra como
        // amostra e devolve deslocamentos absurdos (25,5h). Um dia de folga
        // cobre o caso legitimo: o fuso empurra o jogo pro dia seguinte.
        Math.abs(new Date(`${e.match_date}T12:00:00Z`) - new Date(`${g.date}T12:00:00Z`)) <=
          36 * 3_600_000,
    );
    if (!hit || !hit.match_time) continue;
    const brt = new Date(`${g.date}T${g.time}:00-03:00`);
    const api = new Date(`${hit.match_date}T${hit.match_time}:00Z`);
    samples.push(Math.round(((api - brt) / 3_600_000) * 2) / 2);
  }
  if (samples.length < MIN_CALIBRATION_SAMPLES) {
    console.log(
      `  ✗ so ${samples.length} jogo(s) em comum pra calibrar o fuso (minimo ${MIN_CALIBRATION_SAMPLES}).`,
    );
    return null;
  }
  const distinct = [...new Set(samples)];
  if (distinct.length !== 1) {
    console.log(
      `  ✗ deslocamentos divergentes entre as fontes: ${distinct.join(", ")}h — nao da pra converter com seguranca.`,
    );
    return null;
  }
  console.log(
    `  ✓ fuso calibrado em ${distinct[0]}h, com ${samples.length} jogo(s) em comum.`,
  );
  return distinct[0];
}

/* ================================================================== *
 * 3. Rotulo da fase
 * ================================================================== */

/** Fases de mata-mata, como a fonte as nomeia -> como o portal escreve. */
const STAGE_PT = {
  final: "Final",
  "semi-finals": "Semifinal",
  "1/2-finals": "Semifinal",
  "quarter-finals": "Quartas de Final",
  "1/4-finals": "Quartas de Final",
  "1/8-finals": "Oitavas de Final",
  "1/16-finals": "Fase de 16 avos",
  "1/32-finals": "Fase de 32 avos",
  "group stage": "Fase de Grupos",
  qualification: "Fase Preliminar",
};

/**
 * A fonte manda "22" em pontos corridos e "1/8-finals" em mata-mata; o portal
 * escreve "Rodada 22" e "Oitavas de Final". "Current" nao e fase, e sim o
 * rotulo interno da temporada corrente — vira string vazia, que a pagina ja
 * trata omitindo o trecho.
 */
function roundLabel(matchRound, stageName) {
  const round = String(matchRound || "").trim();
  if (/^\d+$/.test(round)) return `Rodada ${round}`;

  const stage = String(stageName || "").trim();
  const pt = STAGE_PT[stage.toLowerCase()];
  if (pt) return pt;
  if (/^current$/i.test(stage)) return "";
  return round || (stage && !/^current$/i.test(stage) ? stage : "");
}

/* ================================================================== *
 * 4. Import
 * ================================================================== */

async function apiGet(action, params) {
  const query = new URLSearchParams({ action, APIkey: API_KEY, ...params });
  const res = await fetch(`${API_BASE}/?${query}`);
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  return res.json();
}

const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Chave de confronto — mesma dupla no mesmo dia e o mesmo jogo.
 *
 * Os dois lados passam pelo nome canonico ANTES de comparar. Sem isso, o
 * curado "Fluminense x Vasco" e o importado "Fluminense x Vasco da Gama" viram
 * chaves diferentes e o jogo entra duas vezes — duas paginas para a mesma
 * partida, com slugs distintos, competindo entre si no buscador.
 */
const gameKey = (g, names) =>
  `${g.date}|${norm(displayTeam(g.home, names))}|${norm(displayTeam(g.away, names))}`;

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry-run");
  const reset = process.argv.includes("--reset");

  const schedule = JSON.parse(readFileSync(GAMES_PATH, "utf-8"));
  const all_existing = schedule.games ?? [];
  // `--reset` descarta o que ESTE script acrescentou antes e importa de novo —
  // usado quando a regra muda (nome de time, rótulo de fase). O que o agente
  // curou tem `source` ausente e nunca é tocado.
  const curated = reset
    ? all_existing.filter((g) => g.source !== "api")
    : all_existing;
  if (reset) {
    console.log(
      `--reset: descartando ${all_existing.length - curated.length} jogo(s) importados antes.`,
    );
  }
  console.log(`jogos.json curado: ${curated.length} jogo(s)\n`);

  const today = new Date();
  const until = new Date(today);
  until.setDate(until.getDate() + HORIZON_DAYS);

  const all = [];
  for (const [leagueId, competition] of Object.entries(LEAGUES)) {
    let events;
    try {
      events = await apiGet("get_events", {
        league_id: leagueId,
        from: iso(today),
        to: iso(until),
      });
    } catch (err) {
      console.log(`  – ${competition}: falha na API (${err.message})`);
      continue;
    }
    if (!Array.isArray(events)) continue;
    for (const e of events) {
      if (e.match_status === "Finished") continue;
      if (!e.match_time || !e.match_hometeam_name || !e.match_awayteam_name) continue;
      all.push({ ...e, competition });
    }
  }
  console.log(`API: ${all.length} jogo(s) nos proximos ${HORIZON_DAYS} dias.`);

  const offset = calibrateOffset(curated, all);
  if (offset === null) {
    console.error("\n✗ Import abortado — jogos.json nao foi tocado.");
    process.exit(1);
  }

  const names = loadTeamNames();
  const known = new Set(curated.map((g) => gameKey(g, names)));
  const added = [];

  for (const e of all) {
    const { date, time } = toBRT(e.match_date, e.match_time, offset);
    const isWomens = /feminino/i.test(e.competition);
    const naming = (raw) => {
      const canonical = displayTeam(raw, names);
      return isWomens ? womensTeam(canonical) : canonical;
    };
    const game = {
      date,
      time,
      home: naming(e.match_hometeam_name),
      away: naming(e.match_awayteam_name),
      competition: e.competition,
      round: roundLabel(e.match_round, e.stage_name),
      // A fonte nao tem emissora brasileira. A pagina ja trata "A definir" com
      // o texto certo, e o agente pode preencher depois na curadoria.
      channel: "A definir",
      stadium: (e.match_stadium || "").trim(),
      // Marca a origem. E o que permite `--reset` refazer o import sem tocar
      // no que o agente curou, e deixa o arquivo auditavel.
      source: "api",
    };
    const key = gameKey(game, names);
    if (known.has(key)) continue;
    known.add(key);
    added.push(game);
  }

  const byComp = {};
  for (const g of added) byComp[g.competition] = (byComp[g.competition] || 0) + 1;
  console.log(`\n${added.length} jogo(s) a acrescentar:`);
  for (const [c, n] of Object.entries(byComp).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${c}`);
  }
  if (added.length > 0) {
    console.log("\n  amostra:");
    const sample = [
      ...new Map(added.map((g) => [g.competition, g])).values(),
    ]; // um de cada competicao, pra conferir rotulo e horario de todas
    for (const g of sample) {
      console.log(
        `    ${g.date} ${g.time}  ${g.home} x ${g.away}` +
          `  [${g.competition}${g.round ? ` — ${g.round}` : ""}]`,
      );
    }
  }

  if (dryRun) {
    console.log("\n--dry-run: nada foi escrito.");
    return;
  }
  if (added.length === 0) {
    console.log("\nNada a fazer.");
    return;
  }

  const games = [...curated, ...added].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
  writeFileSync(
    GAMES_PATH,
    JSON.stringify({ ...schedule, games }, null, 2) + "\n",
  );
  console.log(
    `\n✓ content/jogos.json: ${curated.length} -> ${games.length} jogos.`,
  );
}

if (require.main === module) main();
