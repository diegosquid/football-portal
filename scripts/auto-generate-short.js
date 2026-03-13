#!/usr/bin/env node
/**
 * auto-generate-short.js
 *
 * Detecta artigos novos (últimas 24h) que ainda não têm short gerado,
 * e gera + publica automaticamente, rotacionando o estilo visual.
 *
 * Uso:
 *   node scripts/auto-generate-short.js [--dry-run] [--max N]
 */

const fs = require("fs");
const path = require("path");
const {spawnSync} = require("child_process");

const PROJECT_DIR = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(PROJECT_DIR, "content", "articles");
const SHORTS_DIR = path.join(PROJECT_DIR, "generated", "remotion-shorts");
const NODE_BIN = process.execPath;

// Estilos que rotacionam — clean é o mais usado, os outros dão variedade
const FORMATS = ["clean", "clean", "clean", "split", "pulse", "stacked", "poster"];

// Categorias que NÃO devem gerar short automaticamente
const SKIP_CATEGORIES = ["opiniao"];

function parseArgs(argv) {
  const args = {dryRun: false, max: 3};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    if (argv[i] === "--max") args.max = parseInt(argv[i + 1], 10) || 3;
  }
  return args;
}

function getRecentArticles(hoursAgo = 24) {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));

  const articles = [];
  for (const file of files) {
    const fullPath = path.join(ARTICLES_DIR, file);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs < cutoff) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) continue;

    const fm = frontmatter[1];
    const slug = file.replace(/\.mdx$/, "");
    const draft = /^draft:\s*true/m.test(fm);
    const category = (fm.match(/^category:\s*"?([^"\n]+)"?/m) || [])[1] || "";

    if (draft) continue;
    if (SKIP_CATEGORIES.includes(category.trim())) continue;

    articles.push({slug, path: fullPath, mtime: stat.mtimeMs, category: category.trim()});
  }

  return articles.sort((a, b) => b.mtime - a.mtime);
}

function hasShort(slug) {
  const dir = path.join(SHORTS_DIR, slug);
  if (!fs.existsSync(dir)) return false;
  // Verifica se tem manifest com videoPath
  const manifest = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifest)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
    return data.videoPath && fs.existsSync(data.videoPath);
  } catch {
    return false;
  }
}

function hasYoutubeUpload(slug) {
  const uploadFile = path.join(SHORTS_DIR, slug, "youtube-upload.json");
  return fs.existsSync(uploadFile);
}

function pickFormat(index) {
  return FORMATS[index % FORMATS.length];
}

function generateAndUpload(slug, format, dryRun) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎬 Gerando short: ${slug}`);
  console.log(`   Formato: ${format}`);
  console.log(`   TTS: minimax (Portuguese_News_Reporter_v1)`);

  if (dryRun) {
    console.log("   ⏭️  DRY RUN — pulando render/upload");
    return true;
  }

  const result = spawnSync(NODE_BIN, [
    path.join(PROJECT_DIR, "scripts", "publish-youtube-short.js"),
    slug,
    "--format", format,
    "--tts-provider", "minimax",
    "--privacy", "public",
    "--thumbnail", "auto",
  ], {
    cwd: PROJECT_DIR,
    stdio: "inherit",
    env: process.env,
    timeout: 5 * 60 * 1000, // 5 min timeout
  });

  if (result.status !== 0) {
    console.error(`   ❌ Falhou (exit code ${result.status})`);
    return false;
  }

  console.log(`   ✅ Publicado!`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("🔍 Buscando artigos recentes sem short...\n");

  const recent = getRecentArticles(24);
  const pending = recent.filter((a) => !hasShort(a.slug));

  if (pending.length === 0) {
    console.log("✅ Todos os artigos recentes já têm short. Nada a fazer.");
    return;
  }

  console.log(`📋 ${pending.length} artigo(s) sem short:`);
  for (const a of pending) {
    console.log(`   • ${a.slug} (${a.category})`);
  }

  const toProcess = pending.slice(0, args.max);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];
    const format = pickFormat(i + Date.now() % FORMATS.length);
    const ok = generateAndUpload(article.slug, format, args.dryRun);
    if (ok) success++;
    else failed++;

    // Rate limit: espera 10s entre uploads pro YouTube não reclamar
    if (i < toProcess.length - 1 && !args.dryRun) {
      console.log("⏳ Aguardando 10s antes do próximo...");
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📊 Resumo: ${success} gerados, ${failed} falharam, ${pending.length - toProcess.length} restantes`);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
