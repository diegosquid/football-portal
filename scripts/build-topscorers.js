#!/usr/bin/env node
/**
 * ==============================================================================
 * build-topscorers.js — Artilharia por competição
 * ==============================================================================
 *
 * Fonte: apifootball.com (`get_topscorers`), a mesma da tabela e dos palpites.
 *
 * O problema que este script resolve
 * ----------------------------------
 * A resposta de `get_topscorers` mistura mais de um "stage" no mesmo array, e o
 * rótulo NÃO é confiável: na Série A, o stage chamado "Current" some com os
 * artilheiros de verdade e devolve uma lista em que o Vasco tem 28 gols de
 * artilheiros tendo marcado 23 no campeonato inteiro. O stage certo era o
 * rotulado " - 2nd Stage".
 *
 * Por isso a escolha do stage aqui não é por nome nem por id chumbado: cada
 * stage é CONFERIDO contra os gols que os times realmente marcaram (somados de
 * `get_events`). Um artilheiro não pode ter feito mais gols do que o time todo.
 * Stage que viola isso é descartado; competição sem nenhum stage aprovado
 * simplesmente não é publicada — página de artilharia errada é pior que ausente.
 *
 * Uso:
 *   node scripts/build-topscorers.js
 *   node scripts/build-topscorers.js --verbose   # mostra o veredito por stage
 *
 * Depois: node scripts/publish-data.js artilharia.json
 */

const { writeFileSync } = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";
const OUTPUT_PATH = path.join(__dirname, "..", "content", "artilharia.json");
const SEASON_START = "2026-01-01";

/**
 * Competições com artilharia publicada. `slug` é a chave em artilharia.json e
 * casa com a copy em src/lib/topscorers-competitions.ts.
 *
 * Série C (79) fica de fora: `get_topscorers` devolve 404 "check your plan".
 */
const COMPETITIONS = [
  {
    slug: "brasileirao",
    competition: "Brasileirão Série A",
    shortName: "Brasileirão",
    leagueId: 99,
  },
  {
    slug: "brasileirao-serie-b",
    competition: "Brasileirão Série B",
    shortName: "Série B",
    leagueId: 75,
  },
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
];

/** Mínimo de times conferidos pra confiar no veredito de um stage. */
const MIN_TEAMS_CHECKED = 5;
/** Lista com menos que isso não vira página. */
const MIN_SCORERS = 8;

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

/**
 * Um jogo acabou? `match_status` não é só "Finished": mata-mata decidido nos
 * pênaltis vem como "After Pen." e W.O. como "Awarded". Filtrar só por
 * "Finished" apagava 8 jogos da Libertadores e reprovava a competição inteira
 * por gols que "não existiam".
 */
const FINISHED_STATUSES = new Set(["Finished", "After Pen.", "Awarded"]);

/** Gols marcados por time na temporada — a régua que valida os artilheiros. */
async function fetchGoalsByTeam(leagueId) {
  const events = await apiGet("get_events", {
    league_id: String(leagueId),
    from: SEASON_START,
    to: todayISO(),
  });
  if (!Array.isArray(events)) return {};

  const goals = {};
  const add = (team, n) => {
    if (!team) return;
    goals[team] = (goals[team] || 0) + n;
  };
  for (const e of events) {
    if (!FINISHED_STATUSES.has(e.match_status)) continue;
    add(e.match_hometeam_name, Number(e.match_hometeam_score) || 0);
    add(e.match_awayteam_name, Number(e.match_awayteam_score) || 0);
  }
  return goals;
}

/* ================================================================== *
 * 2. Escolha do stage — conferência contra os gols reais
 * ================================================================== */

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");

/**
 * Casa o nome do time da lista de artilheiros com o do calendário.
 * A MESMA API escreve "Flamengo" num endpoint e "Flamengo RJ" no outro, então
 * exato falha: cai pra containment com mínimo de 5 caracteres, que evita casar
 * "Remo" dentro de "Bragantino" e afins.
 */
function matchTeam(name, candidates) {
  const target = normalize(name);
  if (!target) return undefined;
  if (candidates.includes(name)) return name;

  const exact = candidates.find((c) => normalize(c) === target);
  if (exact) return exact;

  return candidates
    .filter((c) => {
      const n = normalize(c);
      return (
        n.length >= 5 &&
        target.length >= 5 &&
        (n.includes(target) || target.includes(n))
      );
    })
    .sort((a, b) => normalize(b).length - normalize(a).length)[0];
}

/**
 * Um stage é consistente quando, para todo time conferível, a soma dos gols dos
 * artilheiros não passa do que o time marcou.
 */
function auditStage(rows, goalsByTeam) {
  const teamNames = Object.keys(goalsByTeam);
  const scored = {};
  for (const p of rows) {
    scored[p.team_name] = (scored[p.team_name] || 0) + (Number(p.goals) || 0);
  }

  let checked = 0;
  const violations = [];
  for (const [team, sum] of Object.entries(scored)) {
    const hit = matchTeam(team, teamNames);
    if (!hit) continue;
    checked++;
    if (sum > goalsByTeam[hit]) {
      violations.push({ team, artilheiros: sum, timeMarcou: goalsByTeam[hit] });
    }
  }

  return {
    checked,
    violations,
    /** Sem cobertura mínima não dá pra afirmar nada — o stage fica reprovado. */
    ok: checked >= MIN_TEAMS_CHECKED && violations.length === 0,
  };
}

/* ================================================================== *
 * 3. Montagem da lista
 * ================================================================== */

/**
 * Um jogador aparece mais de uma vez no mesmo stage (nome do time grafado de
 * dois jeitos). Fica a entrada com mais gols.
 */
function dedupe(rows) {
  const best = new Map();
  for (const p of rows) {
    const key = p.player_key || `${normalize(p.player_name)}|${normalize(p.team_name)}`;
    const prev = best.get(key);
    if (!prev || Number(p.goals) > Number(prev.goals)) best.set(key, p);
  }
  return [...best.values()];
}

/** Posição recalculada do zero: `player_place` da API vem furado e reinicia. */
function rank(rows) {
  const sorted = rows
    .map((p) => ({
      player: String(p.player_name || "").trim(),
      playerId: String(p.player_key || ""),
      team: String(p.team_name || "").trim(),
      teamId: String(p.team_key || ""),
      goals: Number(p.goals) || 0,
      // A API manda "" nesses dois na maioria das ligas brasileiras.
      assists: p.assists === "" || p.assists == null ? null : Number(p.assists),
      penaltyGoals:
        p.penalty_goals === "" || p.penalty_goals == null
          ? null
          : Number(p.penalty_goals),
    }))
    .filter((p) => p.player && p.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, "pt-BR"));

  // Empate divide a mesma posição (dois com 12 gols são os dois 1º).
  let position = 0;
  let lastGoals = null;
  return sorted.map((p, i) => {
    if (p.goals !== lastGoals) {
      position = i + 1;
      lastGoals = p.goals;
    }
    return { position, ...p };
  });
}

async function buildRanking(comp, { verbose }) {
  let raw;
  try {
    raw = await apiGet("get_topscorers", { league_id: String(comp.leagueId) });
  } catch (err) {
    console.log(`  – ${comp.competition}: falha na API (${err.message})`);
    return null;
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    const reason = raw && raw.message ? raw.message : "sem dados";
    console.log(`  – ${comp.competition}: ${reason}`);
    return null;
  }

  const goalsByTeam = await fetchGoalsByTeam(comp.leagueId);
  if (Object.keys(goalsByTeam).length === 0) {
    console.log(
      `  ✗ ${comp.competition}: sem calendário pra conferir os gols — não publicado`,
    );
    return null;
  }

  // Um grupo por stage; cada um é auditado separadamente.
  const stages = new Map();
  for (const p of raw) {
    const key = String(p.fk_stage_key ?? "sem-stage");
    if (!stages.has(key)) stages.set(key, []);
    stages.get(key).push(p);
  }

  const approved = [];
  for (const [key, rows] of stages) {
    const audit = auditStage(rows, goalsByTeam);
    const label = (rows[0]?.stage_name || "").trim() || "sem nome";
    if (verbose || !audit.ok) {
      const verdict = audit.ok
        ? "OK"
        : audit.checked < MIN_TEAMS_CHECKED
          ? `só ${audit.checked} times conferíveis`
          : `${audit.violations.length} time(s) com mais gols de artilheiro que de time`;
      console.log(
        `      stage ${key} ("${label}"): ${rows.length} jogadores — ${verdict}`,
      );
      for (const v of audit.violations.slice(0, 3)) {
        console.log(
          `        · ${v.team}: artilheiros somam ${v.artilheiros}, time marcou ${v.timeMarcou}`,
        );
      }
    }
    if (audit.ok) approved.push({ key, label, rows, audit });
  }

  if (approved.length === 0) {
    console.log(
      `  ✗ ${comp.competition}: nenhum stage passou na conferência — não publicado`,
    );
    return null;
  }

  // Entre os aprovados, o mais completo.
  approved.sort((a, b) => b.rows.length - a.rows.length);
  const chosen = approved[0];
  const scorers = rank(dedupe(chosen.rows));

  if (scorers.length < MIN_SCORERS) {
    console.log(
      `  ✗ ${comp.competition}: só ${scorers.length} artilheiros — lista curta demais, não publicado`,
    );
    return null;
  }

  return {
    slug: comp.slug,
    competition: comp.competition,
    shortName: comp.shortName,
    leagueId: comp.leagueId,
    // Fatia da string, não `new Date(...).getFullYear()`: "2026-01-01" é lido
    // como meia-noite UTC e, no fuso de Brasília, volta como 2025.
    season: SEASON_START.slice(0, 4),
    updatedThrough: todayISO(),
    /** Rastro da decisão — dá pra auditar depois qual lista virou página. */
    stage: { key: chosen.key, label: chosen.label, teamsChecked: chosen.audit.checked },
    totalGoals: scorers.reduce((sum, p) => sum + p.goals, 0),
    scorers,
  };
}

/* ================================================================== *
 * 4. Saída
 * ================================================================== */

/**
 * Chaves já corrigidas em src/lib/player-names.ts.
 *
 * Lê direto do arquivo .ts em vez de manter uma segunda lista aqui: duplicar o
 * mapa é garantir que as duas cópias divirjam na primeira janela.
 */
function loadMappedNames() {
  const source = require("fs").readFileSync(
    path.join(__dirname, "..", "src", "lib", "player-names.ts"),
    "utf-8",
  );
  const body = source.slice(
    source.indexOf("PLAYER_NAME_FIXES"),
    source.indexOf("displayPlayerName"),
  );
  return new Set(
    [...body.matchAll(/^\s*(?:"([^"]+)"|([A-Za-zÀ-ÿ]+))\s*:/gm)].map(
      (m) => m[1] ?? m[2],
    ),
  );
}

/** Até que posição um nome errado realmente aparece pro leitor. */
const SUSPECT_UNTIL_POSITION = 20;

/**
 * Nomes que provavelmente estão invertidos e ainda não foram corrigidos.
 *
 * O filtro é o que torna o aviso útil em vez de ruído de duas em duas horas:
 *   - nome de uma palavra só ("Neymar", "Pedro") não tem como estar invertido;
 *   - abreviado ("J. Calleri", "K. Viveros") já vem na ordem certa da fonte;
 *   - fora do top 20 quase ninguém lê.
 * Sobra exatamente o caso perigoso: "Sobrenome Nome" visível na página.
 */
function suspectNames(rankings) {
  const mapped = loadMappedNames();
  const suspects = new Map();

  for (const ranking of Object.values(rankings)) {
    for (const p of ranking.scorers) {
      if (p.position > SUSPECT_UNTIL_POSITION) continue;
      if (mapped.has(p.player)) continue;
      if (/^[A-ZÀ-Þ]\.\s/.test(p.player)) continue;
      if (p.player.trim().split(/\s+/).length < 2) continue;
      suspects.set(p.player, `${p.team} — ${ranking.competition}, ${p.position}º`);
    }
  }
  return suspects;
}

/** Listagem completa, incluindo os nomes que provavelmente já estão certos. */
function reportUnmapped(rankings) {
  const mapped = loadMappedNames();
  const missing = new Map();
  for (const ranking of Object.values(rankings)) {
    for (const p of ranking.scorers) {
      if (!mapped.has(p.player)) missing.set(p.player, p.team);
    }
  }

  console.log(
    `\n${missing.size} nome(s) sem correção em src/lib/player-names.ts:`,
  );
  for (const [player, team] of [...missing].sort()) {
    console.log(`  "${player}"  ::  ${team}`);
  }
  console.log(
    "\nA fonte grava boa parte dos nomes invertidos (Sobrenome Nome).",
    "\nRevise a lista e acrescente só os que você tem certeza.",
  );
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }
  const verbose = process.argv.includes("--verbose");
  const unmapped = process.argv.includes("--unmapped");

  console.log("Artilharia — conferindo cada stage contra os gols reais\n");

  const rankings = {};
  for (const comp of COMPETITIONS) {
    const ranking = await buildRanking(comp, { verbose });
    if (!ranking) continue;
    rankings[comp.slug] = ranking;
    const top = ranking.scorers[0];
    console.log(
      `  ✓ ${comp.competition}: ${ranking.scorers.length} artilheiros` +
        ` — líder ${top.player} (${top.goals} gols, ${top.team})`,
    );
  }

  if (Object.keys(rankings).length === 0) {
    console.error("\n✗ Nenhuma artilharia gerada — arquivo não foi escrito.");
    process.exit(1);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    updatedThrough: todayISO(),
    source: "apifootball.com",
    disclaimer:
      "Artilharia conferida contra os gols marcados por cada time na competição. Gols de jogadores fora da lista de destaque da fonte podem não aparecer.",
    rankings,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✓ content/artilharia.json atualizado.`);

  // Aviso no fluxo normal, não atrás de flag: quem roda isto é o cron, e nome
  // errado no topo da artilharia é o tipo de erro que ninguém vai caçar de
  // propósito. Aparecendo aqui, entra no log e no contexto do agente.
  const suspects = suspectNames(rankings);
  if (suspects.size > 0) {
    console.log(
      `\n⚠ ${suspects.size} nome(s) no top ${SUSPECT_UNTIL_POSITION} podem estar invertidos:`,
    );
    for (const [player, where] of [...suspects].sort()) {
      console.log(`    "${player}"  (${where})`);
    }
    console.log(
      "  A fonte grava nome de brasileiro como \"Sobrenome Nome\".",
      "\n  Confira e, só com certeza, acrescente em src/lib/player-names.ts.",
    );
  }

  if (unmapped) reportUnmapped(rankings);
}

if (require.main === module) main();
