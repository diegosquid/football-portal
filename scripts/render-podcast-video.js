#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  PROJECT_DIR,
  ensureDir,
  run,
  getLatestArticleSlug,
  loadArticle,
  copyFile,
} = require("./lib/short-video-data");

const {
  generateDialogueScript,
  parseDialogueTurns,
  synthesizePodcastAudio,
  groupTurnsIntoBlocks,
  generatePodcastImages,
  extractKeyQuotes,
  buildPodcastProps,
  FPS,
} = require("./lib/podcast-video-data");

const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "podcast-videos");

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    scriptFile: null,
    skipImages: false,
    skipTts: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--latest") {
      args.latest = true;
    } else if (token === "--script-file") {
      args.scriptFile = argv[i + 1];
      i += 1;
    } else if (token === "--skip-images") {
      args.skipImages = true;
    } else if (token === "--skip-tts") {
      args.skipTts = true;
    } else if (!token.startsWith("--") && !args.slug) {
      args.slug = token;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug || (args.latest ? getLatestArticleSlug() : null);

  if (!slug) {
    console.error("Usage: node render-podcast-video.js <slug> [--latest] [--script-file <path>] [--skip-images] [--skip-tts]");
    process.exit(1);
  }

  console.log(`\n🎙️  Podcast Video: ${slug}`);
  console.log("═".repeat(60));

  // ── 1. Load article ──────────────────────────────────────────────────────
  const article = loadArticle(slug);
  console.log(`📄 Artigo: ${article.data.title}`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // ── 2. Generate dialogue script ──────────────────────────────────────────
  let script;
  if (args.scriptFile) {
    console.log(`📜 Usando roteiro de: ${args.scriptFile}`);
    script = fs.readFileSync(path.resolve(args.scriptFile), "utf8").trim();
  } else {
    script = await generateDialogueScript(article);
  }

  const scriptPath = path.join(outputDir, "dialogue-script.txt");
  fs.writeFileSync(scriptPath, script, "utf8");
  console.log(`✅ Roteiro salvo: ${scriptPath}`);

  // ── 3. Parse dialogue turns ──────────────────────────────────────────────
  const turns = parseDialogueTurns(script);
  const totalWords = turns.reduce((sum, t) => sum + t.text.split(/\s+/).length, 0);

  console.log(`\n📊 ${turns.length} turnos de dialogo (~${totalWords} palavras)`);
  const fernandaTurns = turns.filter((t) => t.speaker === "Fernanda").length;
  const ricardoTurns = turns.filter((t) => t.speaker === "Ricardo").length;
  console.log(`   Fernanda: ${fernandaTurns} falas | Ricardo: ${ricardoTurns} falas`);

  if (turns.length < 4) {
    throw new Error(`Roteiro muito curto (${turns.length} turnos). Minimo 4 turnos.`);
  }

  // ── 4. Group turns into thematic blocks ──────────────────────────────────
  const blocks = groupTurnsIntoBlocks(turns, article);
  console.log(`📑 ${blocks.length} blocos tematicos`);
  for (const block of blocks) {
    console.log(`   └─ ${block.heading || "(abertura)"}: ${block.turns.length} turnos`);
  }

  // ── 5. Generate images ───────────────────────────────────────────────────
  let imagePaths;
  if (args.skipImages) {
    console.log("\n📸 Pulando geracao de imagens (--skip-images)");
    imagePaths = blocks.map((_, i) => path.join(outputDir, `block-${i}.png`));
  } else {
    console.log("\n📸 Gerando imagens para cada bloco...");
    imagePaths = await generatePodcastImages({
      blocks,
      article,
      outputDir,
    });
  }

  // ── 6. TTS per turn ──────────────────────────────────────────────────────
  let ttsResult;
  if (args.skipTts) {
    console.log("\n🔊 Pulando TTS (--skip-tts)");
    ttsResult = {
      m4aPath: path.join(outputDir, "narration.m4a"),
      turnResults: turns.map((t, i) => ({
        index: i,
        speaker: t.speaker,
        text: t.text,
        wavPath: path.join(outputDir, `turn-${i}.wav`),
        durationSeconds: 5,
        durationFrames: 150,
      })),
    };
  } else {
    console.log("\n🔊 Sintetizando TTS por turno (2 vozes)...");
    ttsResult = await synthesizePodcastAudio({
      turns,
      outputDir,
    });
    console.log(`✅ Audio sintetizado: ${ttsResult.m4aPath}`);
  }

  // ── 7. Extract key quotes ────────────────────────────────────────────────
  const keyQuotes = extractKeyQuotes(turns);
  console.log(`💬 ${keyQuotes.length} quotes de destaque extraidos`);

  // ── 8. Copy assets to Remotion ───────────────────────────────────────────
  console.log("\n📦 Copiando assets para Remotion...");
  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    const dest = path.join(remotionAssetDir, `block-${i}.png`);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
    }
  }
  copyFile(ttsResult.m4aPath, path.join(remotionAssetDir, "narration.m4a"));

  // ── 9. Build props ───────────────────────────────────────────────────────
  console.log("⚙️  Calculando timing e props...");
  const audioRelativePath = `renders/${slug}/narration.m4a`;
  const props = buildPodcastProps({
    article,
    turns,
    turnResults: ttsResult.turnResults,
    blocks,
    imagePaths,
    keyQuotes,
    audioRelativePath,
    slug,
  });

  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  const estimatedDuration = (props.durationInFrames / FPS).toFixed(1);
  console.log(`⏱️  Duracao estimada: ${estimatedDuration}s (${props.durationInFrames} frames)`);
  console.log(`🎬 ${props.scenes.length} cenas no video`);

  // ── 10. Render with Remotion ─────────────────────────────────────────────
  const videoPath = path.join(outputDir, `${slug}-podcast.mp4`);
  console.log(`\n🎥 Renderizando video (${props.durationInFrames} frames)...`);

  run(
    "npm",
    [
      "--prefix",
      VIDEO_STUDIO_DIR,
      "run",
      "render:article",
      "--",
      "--props-file",
      propsPath,
      "--composition-id",
      "PodcastVideo",
      "--out",
      videoPath,
    ],
    {stdio: "inherit"}
  );

  // ── 11. Save manifest ───────────────────────────────────────────────────
  const manifest = {
    slug,
    articlePath: article.path,
    videoPath,
    propsPath,
    scriptPath,
    format: "podcast",
    compositionId: "PodcastVideo",
    durationInFrames: props.durationInFrames,
    durationSeconds: Number(estimatedDuration),
    sceneCount: props.scenes.length,
    turnCount: turns.length,
    blockCount: blocks.length,
    quoteCount: keyQuotes.length,
    voices: {Fernanda: "Kore", Ricardo: "Puck"},
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Podcast gerado com sucesso!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   ⏱️  ${estimatedDuration}s`);
  console.log(`   🎙️  ${fernandaTurns} falas Fernanda + ${ricardoTurns} falas Ricardo`);
  console.log("═".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Erro:", error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
