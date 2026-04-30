#!/usr/bin/env node
/**
 * IndexNow notification script.
 *
 * Notifica buscadores compatíveis (Bing, Yandex, Seznam, Naver) sobre URLs
 * novas/atualizadas. Bing crawleia em ~10 minutos em vez de dias.
 *
 * Spec oficial: https://www.indexnow.org/
 *
 * Modos de uso:
 *   node scripts/indexnow.js https://beiradocampo.com.br/slug-1 [url2] [...]
 *   node scripts/indexnow.js --file caminho/para/urls.txt
 *   node scripts/indexnow.js --all          # todas as páginas estratégicas + artigos
 *   node scripts/indexnow.js --strategic    # só home/categorias/times (44 URLs)
 *
 * Variáveis de ambiente (opcional):
 *   INDEXNOW_KEY        — chave (default: chave embutida abaixo)
 *   INDEXNOW_HOST       — domínio (default: beiradocampo.com.br)
 *   INDEXNOW_DRY_RUN=1  — não envia, só mostra o payload
 */

const fs = require("fs");
const path = require("path");

const HOST = process.env.INDEXNOW_HOST || "beiradocampo.com.br";
const KEY = process.env.INDEXNOW_KEY || "fb687149f8edf99c2848836359af6927";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10000; // limite oficial do IndexNow por request
const DRY_RUN = process.env.INDEXNOW_DRY_RUN === "1";

const TEAMS = [
  "flamengo", "corinthians", "palmeiras", "sao-paulo", "santos",
  "vasco", "botafogo", "fluminense", "atletico-mg", "cruzeiro",
  "gremio", "internacional", "bahia", "fortaleza", "athletico-pr",
  "red-bull-bragantino",
];

const STRATEGIC_PATHS = [
  "/",
  "/jogos-futebol-hoje",
  "/sobre",
  "/time",
  "/categoria/brasileirao",
  "/categoria/libertadores",
  "/categoria/champions",
  "/categoria/transferencias",
  "/categoria/analises",
  "/categoria/selecao",
  "/categoria/futebol-internacional",
  "/categoria/opiniao",
];

function buildStrategicUrls() {
  const base = `https://${HOST}`;
  const strategic = STRATEGIC_PATHS.map((p) => (p === "/" ? base + "/" : base + p));
  const teamPages = TEAMS.flatMap((t) => [
    `${base}/jogos-futebol-hoje/${t}`,
    `${base}/time/${t}`,
  ]);
  return [...strategic, ...teamPages];
}

function buildAllUrls() {
  const articlesPath = path.join(__dirname, "..", ".velite", "articles.json");
  if (!fs.existsSync(articlesPath)) {
    console.error(
      "❌ .velite/articles.json não encontrado. Rode `npm run build` antes de --all.",
    );
    process.exit(1);
  }
  const articles = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
  const articleUrls = articles
    .filter((a) => !a.draft)
    .map((a) => `https://${HOST}/${a.slug}`);
  return [...buildStrategicUrls(), ...articleUrls];
}

function readUrlsFromFile(file) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Arquivo não encontrado: ${file}`);
    process.exit(1);
  }
  return fs
    .readFileSync(file, "utf-8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function sanitizeUrls(urls) {
  const seen = new Set();
  const valid = [];
  const skipped = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    if (!u.startsWith(`https://${HOST}/`) && u !== `https://${HOST}`) {
      skipped.push(u);
      continue;
    }
    valid.push(u);
  }
  return { valid, skipped };
}

async function postBatch(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  if (DRY_RUN) {
    console.log("🔍 DRY RUN — payload:");
    console.log(JSON.stringify({ ...body, urlList: `[${urls.length} URLs]` }, null, 2));
    return { ok: true, status: 0 };
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  let text = "";
  try {
    text = await res.text();
  } catch {}
  return { ok: res.status === 200 || res.status === 202, status: res.status, body: text };
}

async function main() {
  const args = process.argv.slice(2);
  let urls = [];

  if (args.length === 0) {
    console.error(
      "Uso: node scripts/indexnow.js <url1> [url2 ...]\n" +
        "     node scripts/indexnow.js --file urls.txt\n" +
        "     node scripts/indexnow.js --all\n" +
        "     node scripts/indexnow.js --strategic",
    );
    process.exit(1);
  }

  if (args[0] === "--all") {
    urls = buildAllUrls();
  } else if (args[0] === "--strategic") {
    urls = buildStrategicUrls();
  } else if (args[0] === "--file") {
    if (!args[1]) {
      console.error("❌ --file precisa de um caminho.");
      process.exit(1);
    }
    urls = readUrlsFromFile(args[1]);
  } else {
    urls = args;
  }

  const { valid, skipped } = sanitizeUrls(urls);
  if (skipped.length > 0) {
    console.warn(`⚠️  ${skipped.length} URLs ignoradas (host diferente de ${HOST}):`);
    skipped.slice(0, 3).forEach((u) => console.warn(`   - ${u}`));
    if (skipped.length > 3) console.warn(`   ... e mais ${skipped.length - 3}`);
  }
  if (valid.length === 0) {
    console.error("❌ Nenhuma URL válida pra enviar.");
    process.exit(1);
  }

  console.log(`📡 IndexNow → ${valid.length} URL(s) para ${HOST}`);
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Key file: ${KEY_LOCATION}`);

  const totalBatches = Math.ceil(valid.length / BATCH_SIZE);
  let okCount = 0;
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = valid.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   [${batchNum}/${totalBatches}] enviando ${batch.length} URLs... `);
    const { ok, status, body } = await postBatch(batch);
    if (ok) {
      console.log(`✅ HTTP ${status || "DRY"}`);
      okCount += batch.length;
    } else {
      console.log(`❌ HTTP ${status}`);
      if (body) console.error(`      ${body.slice(0, 200)}`);
      process.exit(2);
    }
  }
  console.log(`✅ ${okCount}/${valid.length} URLs aceitas pelo IndexNow.`);
  if (!DRY_RUN) {
    console.log("⏱️  Bing costuma crawlear em ~10 min. Yandex em algumas horas.");
  }
}

main().catch((e) => {
  console.error("❌ Erro inesperado:", e);
  process.exit(1);
});
