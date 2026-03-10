#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  PROJECT_DIR,
  ensureDir,
  run,
  getLatestArticleSlug,
  loadArticle,
  resolveImage,
  copyFile,
} = require("./lib/short-video-data");

const {
  splitIntoScenes,
  buildSceneNarrationChunks,
  generateSceneImages,
  synthesizeLongNarration,
  buildLongformProps,
  FPS,
} = require("./lib/longform-video-data");

const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "longform-videos");

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    image: null,
    skipImages: false,
    skipTts: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--latest") {
      args.latest = true;
    } else if (token === "--image") {
      args.image = argv[i + 1];
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
    console.error("Usage: node render-longform-video.js <slug> [--latest] [--image <path>] [--skip-images] [--skip-tts]");
    process.exit(1);
  }

  console.log(`\n🎬 Longform Video: ${slug}`);
  console.log("═".repeat(60));

  // ── 1. Load article ──────────────────────────────────────────────────────
  const article = loadArticle(slug);
  console.log(`📄 Artigo: ${article.data.title}`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // ── 2. Split into scenes ─────────────────────────────────────────────────
  const scenes = splitIntoScenes(article);
  console.log(`📑 ${scenes.length} cenas encontradas`);

  for (const scene of scenes) {
    if (scene.heading) {
      console.log(`   └─ ${scene.heading}`);
    }
  }

  // ── 3. Build narration chunks ────────────────────────────────────────────
  const chunks = buildSceneNarrationChunks(article);
  const totalWords = chunks.reduce((sum, c) => sum + c.text.split(/\s+/).length, 0);
  console.log(`\n🎙️  ${chunks.length} chunks de narracao (~${totalWords} palavras)`);

  // Save narration text
  const narrationTextPath = path.join(outputDir, "narration.txt");
  fs.writeFileSync(
    narrationTextPath,
    chunks.map((c, i) => `--- Chunk ${i} (${c.type}) ---\n${c.text}`).join("\n\n"),
    "utf8"
  );

  // ── 4. Generate images ───────────────────────────────────────────────────
  let imagePaths;
  if (args.skipImages) {
    console.log("\n📸 Pulando geracao de imagens (--skip-images)");
    // Use existing images
    imagePaths = scenes.map((_, i) => path.join(outputDir, `scene-${i}.png`));
  } else {
    console.log("\n📸 Gerando imagens para cada cena...");
    imagePaths = await generateSceneImages({
      scenes,
      article,
      outputDir,
    });
  }

  // ── 5. TTS synthesis ─────────────────────────────────────────────────────
  let ttsResult;
  if (args.skipTts) {
    console.log("\n🔊 Pulando TTS (--skip-tts)");
    ttsResult = {
      m4aPath: path.join(outputDir, "narration.m4a"),
      chunkPaths: chunks.map((_, i) => path.join(outputDir, `chunk-${i}.wav`)),
    };
  } else {
    console.log("\n🔊 Sintetizando narracao (TTS por chunks)...");
    ttsResult = await synthesizeLongNarration({
      chunks,
      outputDir,
    });
    console.log(`✅ Narracao sintetizada: ${ttsResult.m4aPath}`);
  }

  // ── 6. Copy assets to Remotion public dir ────────────────────────────────
  console.log("\n📦 Copiando assets para Remotion...");
  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    const dest = path.join(remotionAssetDir, `scene-${i}.png`);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
    }
  }
  copyFile(ttsResult.m4aPath, path.join(remotionAssetDir, "narration.m4a"));

  // ── 7. Build Remotion props ──────────────────────────────────────────────
  console.log("⚙️  Calculando timing e props...");
  const audioRelativePath = `renders/${slug}/narration.m4a`;
  const props = buildLongformProps({
    article,
    chunks,
    chunkPaths: ttsResult.chunkPaths,
    imagePaths,
    audioRelativePath,
    rendersDir: remotionAssetDir,
    slug,
  });

  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  const estimatedDuration = (props.durationInFrames / FPS).toFixed(1);
  console.log(`⏱️  Duracao estimada: ${estimatedDuration}s (${props.durationInFrames} frames)`);
  console.log(`🎬 ${props.scenes.length} cenas no video`);

  // ── 8. Render with Remotion ──────────────────────────────────────────────
  const videoPath = path.join(outputDir, `${slug}-longform.mp4`);
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
      "LongformVideo",
      "--out",
      videoPath,
    ],
    {stdio: "inherit"}
  );

  // ── 9. Save manifest ────────────────────────────────────────────────────
  const manifest = {
    slug,
    articlePath: article.path,
    videoPath,
    propsPath,
    narrationTextPath,
    format: "longform",
    compositionId: "LongformVideo",
    durationInFrames: props.durationInFrames,
    durationSeconds: Number(estimatedDuration),
    sceneCount: props.scenes.length,
    chunkCount: chunks.length,
    imagePaths,
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Video longform gerado com sucesso!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   ⏱️  ${estimatedDuration}s`);
  console.log("═".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Erro:", error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
