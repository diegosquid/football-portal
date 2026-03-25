#!/usr/bin/env node

/**
 * render-compilation-short.js
 *
 * Gera um short de compilação (Top 5 gols, melhores dribles, etc.)
 * a partir de clipes de vídeo fornecidos pelo usuário.
 *
 * Uso:
 *   node scripts/render-compilation-short.js <compilation.json> [--tts-provider fish|minimax|gemini] [--fish-voice ID]
 */

const fs = require("fs");
const path = require("path");
const {spawnSync} = require("child_process");
require("dotenv").config({path: path.resolve(__dirname, "../.env.local")});

const PROJECT_DIR = path.resolve(__dirname, "..");
const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "compilation-shorts");
const FPS = 30;
const SITE_NAME = "Beira do Campo";

const {
  ensureDir,
  run,
  getMediaDuration,
  copyFile,
  synthesizeNarration,
  sanitizeForTTS,
} = require("./lib/short-video-data");

function parseArgs(argv) {
  const args = {
    compilationFile: null,
    ttsProvider: "fish",
    fishVoice: process.env.FISH_VOICE_DEFAULT || "16a44fcd0a404937bdc18160ce998619",
    minimaxVoice: "Portuguese_Jovialman",
    geminiVoice: process.env.GEMINI_TTS_VOICE || "Kore",
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--tts-provider") {
      args.ttsProvider = argv[++i];
    } else if (token === "--fish-voice") {
      args.fishVoice = argv[++i];
    } else if (token === "--minimax-voice") {
      args.minimaxVoice = argv[++i];
    } else if (token === "--gemini-voice") {
      args.geminiVoice = argv[++i];
    } else if (!token.startsWith("--") && !args.compilationFile) {
      args.compilationFile = token;
    }
  }

  return args;
}

/**
 * Converte timestamp "M:SS" ou "MM:SS" para segundos
 */
function parseTimestamp(ts) {
  if (typeof ts === "number") return ts;
  const parts = String(ts).split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(ts) || 0;
}

/**
 * Detecta se a source é uma URL do YouTube
 */
function isYouTubeUrl(source) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(source);
}

/**
 * Baixa um trecho de vídeo do YouTube com yt-dlp
 * Retorna o path do arquivo baixado
 */
function downloadYouTubeClip(url, start, end, outputPath, outputDir) {
  const startSec = parseTimestamp(start);
  const endSec = parseTimestamp(end);

  // yt-dlp com --download-sections pra baixar só o trecho
  const sectionArg = `*${startSec}-${endSec}`;
  const tempPath = path.join(outputDir, `yt-temp-${Date.now()}.mp4`);

  const dlArgs = [
    "-f", "best[height<=1080][ext=mp4]/best[height<=1080]/best",
    "--download-sections", sectionArg,
    "--force-keyframes-at-cuts",
    "-o", tempPath,
    "--no-playlist",
    "--quiet",
    url,
  ];

  console.log(`      📥 Baixando de YouTube: ${url} [${start} → ${end}]`);
  const result = spawnSync("yt-dlp", dlArgs, {stdio: "pipe", timeout: 120000});
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().slice(-300) || "";
    throw new Error(`yt-dlp download failed: ${stderr}`);
  }

  // Converter pra vertical 1080x1920 com ffmpeg
  const ffArgs = [
    "-i", tempPath,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-an",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-y",
    outputPath,
  ];

  const ff = spawnSync("ffmpeg", ffArgs, {stdio: "pipe"});
  if (ff.status !== 0) {
    const stderr = ff.stderr?.toString().slice(-300) || "";
    throw new Error(`ffmpeg convert failed: ${stderr}`);
  }

  // Limpar temp
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  return outputPath;
}

/**
 * Corta um clipe de vídeo local com ffmpeg para 1080x1920 vertical
 */
function cutClip(sourcePath, start, end, outputPath) {
  const startSec = parseTimestamp(start);
  const endSec = parseTimestamp(end);

  const ffArgs = [
    "-ss", String(startSec),
    "-to", String(endSec),
    "-i", sourcePath,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-an",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-y",
    outputPath,
  ];

  const result = spawnSync("ffmpeg", ffArgs, {stdio: "pipe"});
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().slice(-300) || "";
    throw new Error(`ffmpeg cut failed for ${sourcePath}: ${stderr}`);
  }
}

/**
 * Sintetiza TTS por segmento e retorna timings (mesmo padrão do countdown)
 */
async function synthesizeSegments(segments, outputDir, args) {
  const segmentDir = path.join(outputDir, "segments");
  ensureDir(segmentDir);

  const timings = [];
  let cumulativeFrames = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segFile = path.join(segmentDir, `${String(i).padStart(2, "0")}-${seg.key}.txt`);
    fs.writeFileSync(segFile, seg.text);

    console.log(`   🎙️  [${seg.key}] "${seg.text.slice(0, 60)}..."`);

    const audio = await synthesizeNarration({
      text: seg.text,
      textPath: segFile,
      outputDir: segmentDir,
      provider: args.ttsProvider,
      geminiVoiceName: args.geminiVoice,
      minimaxVoiceId: args.minimaxVoice,
      fishVoiceId: args.fishVoice,
    });

    const segM4a = path.join(segmentDir, `${String(i).padStart(2, "0")}-${seg.key}.m4a`);
    if (audio.m4aPath && fs.existsSync(audio.m4aPath)) {
      fs.renameSync(audio.m4aPath, segM4a);
    }

    const durationSec = getMediaDuration(segM4a);
    const durationFrames = Math.ceil(durationSec * FPS);
    const pauseFrames = seg.key === "cta" ? 0 : 6; // 0.2s pause

    timings.push({
      key: seg.key,
      text: seg.text,
      audioPath: segM4a,
      durationSeconds: Number(durationSec.toFixed(2)),
      startFrame: cumulativeFrames,
      durationFrames: durationFrames + pauseFrames,
    });

    cumulativeFrames += durationFrames + pauseFrames;
    console.log(`      ⏱️  ${durationSec.toFixed(1)}s (${durationFrames} frames)`);
  }

  // Concatenar áudio
  const inputs = [];
  const filterParts = [];
  for (let i = 0; i < timings.length; i++) {
    inputs.push("-i", timings[i].audioPath);
    const pauseDur = timings[i].key === "cta" ? 0 : 0.2;
    if (pauseDur > 0) {
      filterParts.push(`[${i}]apad=pad_dur=${pauseDur}[a${i}]`);
    } else {
      filterParts.push(`[${i}]acopy[a${i}]`);
    }
  }
  const concatLabels = timings.map((_, i) => `[a${i}]`).join("");
  filterParts.push(`${concatLabels}concat=n=${timings.length}:v=0:a=1[out]`);

  const finalM4a = path.join(outputDir, "narration.m4a");
  const ff = spawnSync("ffmpeg", [
    ...inputs,
    "-filter_complex", filterParts.join(";"),
    "-map", "[out]",
    "-c:a", "aac", "-b:a", "192k",
    "-y", finalM4a,
  ], {stdio: "pipe"});

  if (ff.status !== 0) {
    console.error("ffmpeg stderr:", ff.stderr?.toString().slice(-500));
    throw new Error(`ffmpeg concat failed (exit ${ff.status})`);
  }

  console.log(`\n✅ Áudio concatenado: ${finalM4a}`);
  return {timings, finalM4aPath: finalM4a};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.compilationFile) {
    console.error("Uso: node scripts/render-compilation-short.js <compilation.json> [--tts-provider fish|minimax|gemini]");
    process.exit(1);
  }

  const compilationPath = path.resolve(args.compilationFile);
  const compilation = JSON.parse(fs.readFileSync(compilationPath, "utf8"));
  const slug = compilation.slug || path.basename(compilationPath, ".json");

  console.log(`\n🎬 Compilation Short: ${compilation.title}`);
  console.log(`   Clips: ${compilation.clips.length}`);
  console.log(`   TTS: ${args.ttsProvider}\n`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // 1. Cortar clipes com ffmpeg
  console.log("✂️  Cortando clipes...\n");
  const clipsWithPaths = [];

  for (const clip of compilation.clips) {
    const clipFilename = `clip-${clip.rank}.mp4`;
    const clipOutputPath = path.join(outputDir, clipFilename);

    if (isYouTubeUrl(clip.source)) {
      console.log(`   #${clip.rank}: 🌐 YouTube [${clip.start} → ${clip.end}]`);
      downloadYouTubeClip(clip.source, clip.start, clip.end, clipOutputPath, outputDir);
    } else {
      const sourcePath = path.resolve(clip.source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Clip não encontrado: ${sourcePath}`);
      }
      console.log(`   #${clip.rank}: ${path.basename(clip.source)} [${clip.start} → ${clip.end}]`);
      cutClip(sourcePath, clip.start, clip.end, clipOutputPath);
    }

    // Copiar pro Remotion assets
    copyFile(clipOutputPath, path.join(remotionAssetDir, clipFilename));

    clipsWithPaths.push({
      ...clip,
      videoSrc: `renders/${slug}/${clipFilename}`,
      localPath: clipOutputPath,
    });
    console.log(`      ✅ Cortado: ${clipFilename}`);
  }

  // 2. Verificar segmentos de narração
  if (!compilation.segments || compilation.segments.length === 0) {
    throw new Error("compilation.json precisa ter 'segments' com narração pré-gerada pela skill");
  }

  const segments = compilation.segments.map((s) => ({
    ...s,
    text: sanitizeForTTS(s.text),
  }));

  const fullNarration = segments.map((s) => s.text).join(" ");
  console.log(`\n📝 ${segments.length} segmentos (${fullNarration.split(/\s+/).length} palavras)\n`);

  for (const seg of segments) {
    console.log(`   [${seg.key}] ${seg.text}`);
  }

  const narrationTextPath = path.join(outputDir, "narration.txt");
  fs.writeFileSync(narrationTextPath, fullNarration);

  // 3. TTS por segmento
  console.log("\n🎙️  Sintetizando segmentos...\n");
  const {timings, finalM4aPath} = await synthesizeSegments(segments, outputDir, args);

  copyFile(finalM4aPath, path.join(remotionAssetDir, "narration.m4a"));

  // 4. Calcular duração e mapear timings
  const durationSeconds = getMediaDuration(finalM4aPath);
  const durationInFrames = Math.ceil(durationSeconds * FPS) + 12;

  console.log(`\n⏱️  Duração total: ${durationSeconds.toFixed(1)}s (${durationInFrames} frames)`);

  const introTiming = timings.find((t) => t.key === "intro");
  const sortedClips = clipsWithPaths.slice().sort((a, b) => b.rank - a.rank);
  const clipTimings = sortedClips.map((clip) => {
    const t = timings.find((t) => t.key === `item-${clip.rank}`);
    return t ? {rank: clip.rank, startFrame: t.startFrame, durationFrames: t.durationFrames} : null;
  }).filter(Boolean);

  console.log("\n📊 Timings sincronizados:");
  console.log(`   Intro: frame 0 → ${introTiming?.durationFrames || 0}`);
  for (const ct of clipTimings) {
    console.log(`   Clip #${ct.rank}: frame ${ct.startFrame} → ${ct.startFrame + ct.durationFrames}`);
  }

  // 5. Montar props Remotion
  const props = {
    slug,
    title: compilation.title,
    category: compilation.category || "curiosidades",
    siteName: SITE_NAME,
    siteUrl: "beiradocampo.com.br",
    followHandle: "@beiradocampotv",
    followCallToAction: "Para mais compilações de futebol, siga o canal",
    audioSrc: `renders/${slug}/narration.m4a`,
    clips: sortedClips.map((clip) => {
      const t = clipTimings.find((ct) => ct.rank === clip.rank);
      return {
        rank: clip.rank,
        videoSrc: clip.videoSrc,
        label: clip.label || "",
        context: clip.context || "",
        startFrame: t?.startFrame ?? 0,
        durationFrames: t?.durationFrames ?? 150,
      };
    }),
    introEndFrame: introTiming ? introTiming.startFrame + introTiming.durationFrames : 75,
    durationInFrames,
    fps: FPS,
  };

  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  // 6. Renderizar
  const videoPath = path.join(outputDir, `${slug}-compilation.mp4`);

  console.log("\n🎬 Renderizando com Remotion...");
  run("npm", [
    "--prefix", VIDEO_STUDIO_DIR,
    "run", "render:article",
    "--",
    "--props-file", propsPath,
    "--composition-id", "CompilationShort",
    "--out", videoPath,
  ], {stdio: "inherit"});

  // 7. Manifest
  const manifest = {
    slug,
    type: "compilation",
    title: compilation.title,
    category: compilation.category || "curiosidades",
    narrationTextPath,
    narrationAudioPath: finalM4aPath,
    videoPath,
    propsPath,
    ttsProvider: args.ttsProvider,
    durationSeconds: Number(durationSeconds.toFixed(2)),
    durationInFrames,
    narration: fullNarration,
    timings,
    clips: compilation.clips,
    youtubeTitle: compilation.youtubeTitle || compilation.title,
    youtubeDescription: compilation.youtubeDescription || `${compilation.title}\n\n${compilation.clips.sort((a, b) => b.rank - a.rank).map((c) => `#${c.rank} ${c.label}`).join("\n")}\n\nSiga o canal!\n#BeiradoCampo #futebol #compilacao`,
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Compilation Short gerado!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   📋 ${manifestPath}`);
  process.stdout.write(`\n${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((err) => {
  console.error("❌ Erro:", err.message || err);
  process.exit(1);
});
