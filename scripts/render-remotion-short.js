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
  clean: "NewsShortClean",
  split: "NewsShortSplit",
  pulse: "NewsShortPulse",
  stacked: "NewsShortStacked",
  ticker: "NewsShortTicker",
  poster: "NewsShortPoster",
  briefing: "NewsShortBriefing",
};

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    format: "clean",
    image: null,
    narrationFile: null,
    ttsProvider: "auto",
    voice: DEFAULT_VOICE,
    geminiVoice: DEFAULT_GEMINI_VOICE,
    rate: DEFAULT_RATE,
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
    } else if (token === "--narration-file") {
      args.narrationFile = argv[i + 1];
      i += 1;
    } else if (token === "--tts-provider") {
      args.ttsProvider = argv[i + 1];
      i += 1;
    } else if (token === "--gemini-voice") {
      args.geminiVoice = argv[i + 1];
      i += 1;
    } else if (token === "--voice") {
      args.voice = argv[i + 1];
      i += 1;
    } else if (token === "--rate") {
      args.rate = argv[i + 1];
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
  const article = loadArticle(slug);
  const author = resolveAuthor(article.data.author);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  const imagePath = resolveImage(article, outputDir, args.image);
  const narration = args.narrationFile
    ? fs.readFileSync(path.resolve(args.narrationFile), "utf8").trim()
    : buildNarration(article);
  const highlights = buildHighlights(article);

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
    localVoice: args.voice,
    localRate: args.rate,
  });

  const sourceAudioPath = narrationAudio.sourcePath;
  const finalAudioPath = narrationAudio.m4aPath;

  const copiedImageName = toSlugAssetName(imagePath, ".png");
  const copiedAudioName = "narration.m4a";
  copyFile(imagePath, path.join(remotionAssetDir, copiedImageName));
  copyFile(finalAudioPath, path.join(remotionAssetDir, copiedAudioName));

  const durationSeconds = getMediaDuration(finalAudioPath);
  const durationInFrames = Math.ceil(durationSeconds * FPS) + 12;

  const props = {
    slug,
    title: String(article.data.title || ""),
    excerpt: String(article.data.excerpt || ""),
    category: String(article.data.category || ""),
    authorName: author.name,
    micHandle: author.micHandle,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    imageSrc: `renders/${slug}/${copiedImageName}`,
    audioSrc: `renders/${slug}/${copiedAudioName}`,
    callToAction: "Leia a matéria completa no site",
    followCallToAction: "Para mais notícias de futebol, siga o canal",
    followHandle: "@beiradocampotv",
    highlights,
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
    voice: narrationAudio.provider === "local" ? args.voice : args.geminiVoice,
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
