#!/usr/bin/env node
/**
 * ==============================================================================
 * build-venues.js — Estádios dos clubes (nome, cidade, capacidade)
 * ==============================================================================
 *
 * Fonte: apifootball.com (`get_teams`), que devolve o estádio de cada clube com
 * capacidade preenchida em 100% dos times da Série A e da B.
 *
 * Por que só estádio, e não o elenco
 * ----------------------------------
 * O mesmo endpoint traz o elenco completo (39 jogadores por clube, com número,
 * posição e idade). Só que a fonte grava os nomes de brasileiro invertidos
 * ("Alves Dyogo" no lugar de Dyogo Alves) e `player_country` vem VAZIO nos 794
 * jogadores — não há como separar quem está invertido de quem está certo.
 * 70% dos nomes têm 2+ palavras, ou seja, ficariam no chute. Página de elenco
 * com nome errado destrói a confiança mais rápido do que ganha tráfego, então
 * o elenco fica de fora até haver uma fonte de nome confiável.
 *
 * Uso:
 *   node scripts/build-venues.js            # respeita a janela de 24h
 *   node scripts/build-venues.js --force    # regenera na hora
 *
 * Depois: node scripts/publish-data.js estadios.json
 */

const { writeFileSync, readFileSync, existsSync } = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";
const OUTPUT_PATH = path.join(__dirname, "..", "content", "estadios.json");

/** Competições com página de estádios. Casa com src/lib/venues.ts. */
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
];

async function apiGet(action, params) {
  const query = new URLSearchParams({ action, APIkey: API_KEY, ...params });
  const res = await fetch(`${API_BASE}/?${query}`);
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  return res.json();
}

const toInt = (v) => {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * "Belo Horizonte, Minas Gerais" -> "Belo Horizonte".
 *
 * A fonte manda "cidade, estado" em alguns clubes e só a cidade em outros
 * (repetida, quando cidade e estado têm o mesmo nome). Fica só a cidade nos
 * dois casos: meia lista com estado e meia sem parece erro de digitação.
 */
function cleanCity(raw) {
  const first = String(raw || "")
    .split(",")[0]
    .trim();
  return first || null;
}

async function buildCompetition(comp) {
  let teams;
  try {
    teams = await apiGet("get_teams", { league_id: String(comp.leagueId) });
  } catch (err) {
    console.log(`  – ${comp.competition}: falha na API (${err.message})`);
    return null;
  }
  if (!Array.isArray(teams) || teams.length === 0) {
    console.log(`  – ${comp.competition}: sem dados`);
    return null;
  }

  const venues = teams
    .map((t) => ({
      team: String(t.team_name || "").trim(),
      teamId: String(t.team_key || ""),
      badge: t.team_badge || null,
      founded: toInt(t.team_founded),
      coach: t.coaches?.[0]?.coach_name?.trim() || null,
      squadSize: Array.isArray(t.players) ? t.players.length : null,
      stadium: t.venue?.venue_name?.trim() || null,
      city: cleanCity(t.venue?.venue_city),
      capacity: toInt(t.venue?.venue_capacity),
      surface: t.venue?.venue_surface?.trim() || null,
    }))
    .filter((v) => v.team && v.stadium)
    .sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));

  if (venues.length === 0) {
    console.log(`  – ${comp.competition}: nenhum estádio preenchido`);
    return null;
  }

  const withCapacity = venues.filter((v) => v.capacity);

  // Maracanã (Flamengo e Fluminense) e Mineirão (Cruzeiro e Atlético) são um
  // estádio cada, não dois: somar por clube inflaria o total em ~140 mil
  // lugares. O agregado é por praça; a lista continua por clube, que é como o
  // torcedor procura ("estádio do Flamengo").
  const unique = new Map();
  for (const v of withCapacity) {
    if (!unique.has(v.stadium)) unique.set(v.stadium, v.capacity);
  }
  const totalCapacity = [...unique.values()].reduce((s, c) => s + c, 0);

  return {
    slug: comp.slug,
    competition: comp.competition,
    shortName: comp.shortName,
    leagueId: comp.leagueId,
    teams: venues.length,
    withCapacity: withCapacity.length,
    /** Praças distintas — menor que `teams` quando há estádio compartilhado. */
    uniqueStadiums: unique.size,
    totalCapacity,
    averageCapacity: unique.size ? Math.round(totalCapacity / unique.size) : null,
    venues,
  };
}

/** Janela mínima entre duas gerações. Ver o comentário em `main`. */
const MAX_AGE_HOURS = 24;

/**
 * Este script entra no mesmo encadeamento do cron que os outros builders, mas
 * o dado dele é praticamente estático — capacidade de estádio não muda de duas
 * em duas horas. Em vez de depender do agente lembrar de rodar só às vezes, o
 * próprio script decide: fora da janela, regenera; dentro, sai na hora sem
 * gastar chamada de API. Assim o comando do cron pode ser sempre o mesmo.
 */
function isFresh() {
  if (process.argv.includes("--force")) return false;
  if (!existsSync(OUTPUT_PATH)) return false;
  try {
    const { generatedAt } = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
    const ageHours = (Date.now() - new Date(generatedAt).getTime()) / 3_600_000;
    if (!Number.isFinite(ageHours) || ageHours >= MAX_AGE_HOURS) return false;
    console.log(
      `Estádios: gerado há ${ageHours.toFixed(1)}h (janela de ${MAX_AGE_HOURS}h) — pulando.` +
        " Use --force para regenerar agora.",
    );
    return true;
  } catch {
    return false; // arquivo ilegível: melhor regenerar
  }
}

async function main() {
  if (!API_KEY) {
    console.error("✗ APIFOOTBALL_KEY ausente no .env.local");
    process.exit(1);
  }
  if (isFresh()) return;

  console.log("Estádios — nome, cidade e capacidade por clube\n");

  const competitions = {};
  for (const comp of COMPETITIONS) {
    const built = await buildCompetition(comp);
    if (!built) continue;
    competitions[comp.slug] = built;
    const biggest = built.venues[0];
    console.log(
      `  ✓ ${comp.competition}: ${built.teams} estádios` +
        ` (${built.withCapacity} com capacidade) — maior: ${biggest.stadium}` +
        ` (${biggest.capacity?.toLocaleString("pt-BR")} lugares)`,
    );
  }

  if (Object.keys(competitions).length === 0) {
    console.error("\n✗ Nenhum estádio gerado — arquivo não foi escrito.");
    process.exit(1);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "apifootball.com",
    disclaimer:
      "Capacidade oficial informada pela fonte. Estádios em obras ou com restrição de público podem operar abaixo desse número.",
    competitions,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✓ content/estadios.json atualizado.`);
}

if (require.main === module) main();
