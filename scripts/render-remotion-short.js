#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  PROJECT_DIR,
  SITE_NAME,
  SITE_URL,
  ensureDir,
  run,
  getLatestArticleSlug,
  loadArticle,
  buildNarration,
  generateNarrationScript,
  generateHotTakeScript,
  generateVersusScript,
  generateTop3Script,
  generateItemImage,
  sanitizeForTTS,
  buildHighlights,
  resolveAuthor,
  resolveImage,
  getMediaDuration,
  copyFile,
  synthesizeNarration,
} = require("./lib/short-video-data");

const DEFAULT_VOICE = "Eddy (Portuguese (Brazil))";
const DEFAULT_RATE = "176";
const DEFAULT_GEMINI_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";
const FPS = 30;
const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "remotion-shorts");
const FORMAT_MAP = {
  clean: "NewsShortDynamic",
  split: "NewsShortSplit",
  pulse: "NewsShortPulse",
  stacked: "NewsShortStacked",
  ticker: "NewsShortTicker",
  poster: "NewsShortPoster",
  briefing: "NewsShortBriefing",
  hottake: "NewsShortHotTake",
  versus: "NewsShortVersus",
  top3: "CountdownShort",
  dynamic: "NewsShortDynamic",
  card: "NewsShortCard",
  showcase: "ShowcaseShort",
};

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    format: "clean",
    image: null,
    bgVideos: [],
    title: null,
    excerpt: null,
    category: null,
    narrationFile: null,
    aiNarration: false,
    ttsProvider: "auto",
    voice: DEFAULT_VOICE,
    geminiVoice: DEFAULT_GEMINI_VOICE,
    minimaxVoice: null,
    elevenlabsVoice: null,
    fishVoice: null,
    rate: DEFAULT_RATE,
    emotion: null,
    speed: null,
    bottomImage: null,
    centerText: null,
    cardPosition: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--latest") {
      args.latest = true;
    } else if (token === "--format") {
      args.format = argv[i + 1];
      i += 1;
    } else if (token === "--image") {
      args.image = argv[i + 1];
      i += 1;
    } else if (token === "--bg-video") {
      args.bgVideos.push(argv[i + 1]);
      i += 1;
    } else if (token === "--title") {
      args.title = argv[i + 1];
      i += 1;
    } else if (token === "--excerpt") {
      args.excerpt = argv[i + 1];
      i += 1;
    } else if (token === "--category") {
      args.category = argv[i + 1];
      i += 1;
    } else if (token === "--ai-narration") {
      args.aiNarration = true;
    } else if (token === "--narration-file") {
      args.narrationFile = argv[i + 1];
      i += 1;
    } else if (token === "--tts-provider") {
      args.ttsProvider = argv[i + 1];
      i += 1;
    } else if (token === "--gemini-voice") {
      args.geminiVoice = argv[i + 1];
      i += 1;
    } else if (token === "--minimax-voice") {
      args.minimaxVoice = argv[i + 1];
      i += 1;
    } else if (token === "--elevenlabs-voice") {
      args.elevenlabsVoice = argv[i + 1];
      i += 1;
    } else if (token === "--fish-voice") {
      args.fishVoice = argv[i + 1];
      i += 1;
    } else if (token === "--voice") {
      args.voice = argv[i + 1];
      i += 1;
    } else if (token === "--rate") {
      args.rate = argv[i + 1];
      i += 1;
    } else if (token === "--emotion") {
      args.emotion = argv[i + 1];
      i += 1;
    } else if (token === "--speed") {
      args.speed = parseFloat(argv[i + 1]);
      i += 1;
    } else if (token === "--bottom-image") {
      args.bottomImage = argv[i + 1];
      i += 1;
    } else if (token === "--center-text") {
      args.centerText = argv[i + 1];
      i += 1;
    } else if (token === "--card-position") {
      args.cardPosition = argv[i + 1];
      i += 1;
    } else if (!token.startsWith("--") && !args.slug) {
      args.slug = token;
    }
  }

  return args;
}

function toSlugAssetName(filePath, fallback) {
  const ext = path.extname(filePath) || fallback;
  return `source${ext}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const format = String(args.format || "clean").toLowerCase();
  const compositionId = FORMAT_MAP[format];
  if (!compositionId) {
    throw new Error(`Unknown format "${args.format}". Use one of: ${Object.keys(FORMAT_MAP).join(", ")}`);
  }
  const slug = args.slug || (args.latest ? getLatestArticleSlug() : getLatestArticleSlug());

  // Modo sem artigo: quando tem --narration-file + --title, artigo é opcional
  const articleOptional = args.narrationFile && args.title;
  let article, author;
  try {
    article = loadArticle(slug);
    author = resolveAuthor(article.data.author);
  } catch (err) {
    if (!articleOptional) throw err;
    console.log("📝 Modo sem artigo — usando dados do CLI");
    article = {
      data: {
        title: args.title || slug,
        excerpt: args.excerpt || "",
        category: args.category || "noticias",
        author: "renato-caldeira",
      },
      content: "",
      body: "",
    };
    author = resolveAuthor(article.data.author);
  }

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // ── TOP 3: flow especial via countdown pipeline ──
  if (format === "top3") {
    console.log("🏆 Gerando Top 3 a partir do artigo...");
    const top3Data = await generateTop3Script(article);
    console.log(`📝 Ranking: ${top3Data.rankingTitle}`);
    for (const item of top3Data.items) {
      console.log(`   ${item.rank}º ${item.name} — ${item.stat}`);
    }

    // Gerar imagens para cada item
    console.log("\n🎨 Gerando imagens para cada item...");
    for (const item of top3Data.items) {
      if (item.imagePrompt) {
        const imgPath = path.join(outputDir, `item-${item.rank}.png`);
        try {
          await generateItemImage(item.imagePrompt, imgPath);
          item.imageSrc = imgPath;
          console.log(`   ✅ Item ${item.rank}: imagem gerada`);
        } catch (err) {
          console.log(`   ⚠️  Item ${item.rank}: falha na imagem (${err.message.slice(0, 80)})`);
        }
      }
    }

    // Montar topic.json para o countdown pipeline
    const topicJson = {
      slug,
      title: top3Data.rankingTitle,
      category: String(article.data.category || "curiosidades"),
      items: top3Data.items.sort((a, b) => a.rank - b.rank),
      segments: [
        { key: "intro", text: sanitizeForTTS(top3Data.narration.intro) },
        { key: "item-3", text: sanitizeForTTS(top3Data.narration.item3) },
        { key: "item-2", text: sanitizeForTTS(top3Data.narration.item2) },
        { key: "item-1", text: sanitizeForTTS(top3Data.narration.item1) },
        { key: "cta", text: sanitizeForTTS(top3Data.narration.cta) },
      ],
    };

    const topicPath = path.join(outputDir, "topic.json");
    fs.writeFileSync(topicPath, JSON.stringify(topicJson, null, 2));

    // Delegar pro render-countdown-short.js
    console.log("\n🎬 Delegando para render-countdown-short.js...");
    const countdownArgs = [
      path.join(__dirname, "render-countdown-short.js"),
      topicPath,
      "--tts-provider", args.ttsProvider === "auto" ? "minimax" : args.ttsProvider,
    ];
    if (args.minimaxVoice) countdownArgs.push("--voice-id", args.minimaxVoice);
    if (args.geminiVoice) countdownArgs.push("--gemini-voice", args.geminiVoice);
    if (args.fishVoice) countdownArgs.push("--fish-voice", args.fishVoice);

    run(process.execPath, countdownArgs, { stdio: "inherit" });

    // Ler manifest gerado pelo countdown
    const countdownDir = path.join(PROJECT_DIR, "generated", "countdown-shorts", slug);
    const countdownManifest = path.join(countdownDir, "manifest.json");
    if (fs.existsSync(countdownManifest)) {
      const manifest = JSON.parse(fs.readFileSync(countdownManifest, "utf8"));
      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    }
    return;
  }

  // Imagem opcional quando tem vídeo de fundo
  let imagePath;
  if (args.bgVideos.length > 0 && !args.image) {
    // Criar placeholder transparente 1x1 pra não quebrar o Remotion
    imagePath = path.join(outputDir, "source.png");
    if (!fs.existsSync(imagePath)) {
      const {execSync} = require("child_process");
      execSync(`ffmpeg -y -f lavfi -i color=c=black@0:s=1x1 -frames:v 1 "${imagePath}" 2>/dev/null || true`);
      // fallback: arquivo vazio
      if (!fs.existsSync(imagePath)) fs.writeFileSync(imagePath, "");
    }
    console.log("🎥 Usando vídeo de fundo — imagem de placeholder");
  } else {
    imagePath = resolveImage(article, outputDir, args.image);
  }
  let narration;
  let versusData = null;
  if (args.narrationFile) {
    narration = fs.readFileSync(path.resolve(args.narrationFile), "utf8").trim();
  } else if (format === "versus") {
    console.log("⚔️  Gerando roteiro versus com Gemini...");
    const versusResult = await generateVersusScript(article);
    narration = versusResult.narration;
    versusData = { sideA: versusResult.sideA, sideB: versusResult.sideB };
    console.log(`📝 Versus: ${versusData.sideA.name} vs ${versusData.sideB.name} (${narration.split(/\s+/).length} palavras)`);
  } else if (format === "hottake") {
    console.log("🔥 Gerando roteiro de opinião quente com Gemini...");
    narration = await generateHotTakeScript(article);
    console.log(`📝 Opinião gerada (${narration.split(/\s+/).length} palavras)`);
  } else if (args.aiNarration) {
    console.log("🤖 Gerando roteiro de narração com Gemini...");
    narration = await generateNarrationScript(article);
    console.log(`📝 Roteiro gerado (${narration.split(/\s+/).length} palavras)`);
  } else {
    narration = buildNarration(article);
  }
  const highlights = article.body ? buildHighlights(article) : [String(args.title || article.data.title || "")];

  const narrationTextPath = path.join(outputDir, "narration.txt");
  const propsPath = path.join(outputDir, "input-props.json");
  const manifestPath = path.join(outputDir, "manifest.json");
  const videoPath = path.join(outputDir, `${slug}-${format}-remotion.mp4`);

  fs.writeFileSync(narrationTextPath, narration);

  const narrationAudio = await synthesizeNarration({
    text: narration,
    textPath: narrationTextPath,
    outputDir,
    provider: args.ttsProvider,
    geminiVoiceName: args.geminiVoice,
    minimaxVoiceId: args.minimaxVoice,
    minimaxEmotion: args.emotion,
    minimaxSpeed: args.speed,
    elevenlabsVoiceId: args.elevenlabsVoice,
    fishVoiceId: args.fishVoice,
    fishSpeed: args.speed,
    localVoice: args.voice,
    localRate: args.rate,
  });

  const sourceAudioPath = narrationAudio.sourcePath;
  const finalAudioPath = narrationAudio.m4aPath;

  const copiedImageName = toSlugAssetName(imagePath, ".png");
  const copiedAudioName = "narration.m4a";
  copyFile(imagePath, path.join(remotionAssetDir, copiedImageName));
  copyFile(finalAudioPath, path.join(remotionAssetDir, copiedAudioName));

  // Copiar/concatenar vídeo(s) de fundo se fornecido(s)
  let copiedVideoName = null;
  if (args.bgVideos.length > 0) {
    copiedVideoName = "bg-video.mp4";
    const destPath = path.join(remotionAssetDir, copiedVideoName);

    for (const v of args.bgVideos) {
      const p = path.resolve(v);
      if (!fs.existsSync(p)) {
        console.error(`❌ Vídeo de fundo não encontrado: ${p}`);
        process.exit(1);
      }
    }

    if (args.bgVideos.length === 1) {
      copyFile(path.resolve(args.bgVideos[0]), destPath);
      console.log(`🎥 Vídeo de fundo copiado: ${copiedVideoName}`);
    } else {
      console.log(`🎥 Concatenando ${args.bgVideos.length} vídeos de fundo...`);
      const concatListPath = path.join(remotionAssetDir, "concat-list.txt");
      const concatContent = args.bgVideos
        .map((v) => `file '${path.resolve(v)}'`)
        .join("\n");
      fs.writeFileSync(concatListPath, concatContent);
      run("ffmpeg", [
        "-y", "-f", "concat", "-safe", "0",
        "-i", concatListPath,
        "-c", "copy",
        destPath,
      ]);
      fs.unlinkSync(concatListPath);
      console.log(`🎥 ${args.bgVideos.length} vídeos concatenados em: ${copiedVideoName}`);
    }
  }

  // Copiar bottom image se fornecida (formato showcase)
  let copiedBottomImageName = null;
  if (args.bottomImage) {
    const bottomPath = path.resolve(args.bottomImage);
    if (!fs.existsSync(bottomPath)) {
      console.error(`❌ Imagem inferior não encontrada: ${bottomPath}`);
      process.exit(1);
    }
    const ext = path.extname(bottomPath) || ".jpg";
    copiedBottomImageName = `bottom${ext}`;
    copyFile(bottomPath, path.join(remotionAssetDir, copiedBottomImageName));
    console.log(`🖼️  Imagem inferior copiada: ${copiedBottomImageName}`);
  }

  const durationSeconds = getMediaDuration(finalAudioPath);
  const durationInFrames = Math.ceil(durationSeconds * FPS) + 12;

  const props = {
    slug,
    title: String(args.title || article.data.title || ""),
    excerpt: String(args.excerpt || article.data.excerpt || ""),
    category: String(args.category || article.data.category || ""),
    authorName: author.name,
    micHandle: author.micHandle,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    imageSrc: `renders/${slug}/${copiedImageName}`,
    ...(copiedVideoName ? { videoSrc: `renders/${slug}/${copiedVideoName}` } : {}),
    audioSrc: `renders/${slug}/${copiedAudioName}`,
    callToAction: articleOptional && !article.slug
      ? "" // sem artigo = sem CTA de "leia a matéria"
      : format === "hottake" ? "Concorda? Comenta aí!" : format === "versus" ? "Quem leva? Comenta!" : "Leia a matéria completa no site",
    followCallToAction: format === "hottake" ? "Para mais opiniões quentes, siga o canal" : format === "versus" ? "Para mais duelos, siga o canal" : "Para mais notícias de futebol, siga o canal",
    followHandle: "@beiradocampotv",
    highlights,
    ...(versusData ? { versusData } : {}),
    ...(copiedBottomImageName ? { bottomImageSrc: `renders/${slug}/${copiedBottomImageName}` } : {}),
    ...(args.centerText ? { centerText: args.centerText } : {}),
    ...(args.cardPosition ? { cardPosition: args.cardPosition } : {}),
    format,
    durationInFrames,
    fps: FPS,
  };

  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  run("npm", [
    "--prefix",
    VIDEO_STUDIO_DIR,
    "run",
    "render:article",
    "--",
    "--props-file",
    propsPath,
    "--composition-id",
    compositionId,
    "--out",
    videoPath,
  ], {
    stdio: "inherit",
  });

  const manifest = {
    slug,
    articlePath: article.path,
    imagePath,
    narrationTextPath,
    narrationSourcePath: sourceAudioPath,
    narrationAiffPath: narrationAudio.provider === "local" ? sourceAudioPath : null,
    narrationWavPath: narrationAudio.wavPath || null,
    narrationM4aPath: finalAudioPath,
    propsPath,
    videoPath,
    format,
    compositionId,
    ttsProvider: narrationAudio.provider,
    voice: narrationAudio.provider === "minimax"
      ? (narrationAudio.voiceId || args.minimaxVoice)
      : narrationAudio.provider === "fish"
      ? (narrationAudio.referenceId || args.fishVoice)
      : narrationAudio.provider === "local" ? args.voice : args.geminiVoice,
    localFallbackVoice: args.voice,
    rate: Number(args.rate),
    durationSeconds: Number(durationSeconds.toFixed(2)),
    durationInFrames,
    highlights,
    narration,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
