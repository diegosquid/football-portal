#!/usr/bin/env node

/**
 * render-countdown-short.js
 *
 * Gera um short atemporal no formato Countdown (ranking 5→1).
 * Narração segmentada e sincronizada com os visuais.
 *
 * Uso:
 *   node scripts/render-countdown-short.js <topic.json> [--tts-provider elevenlabs|gemini] [--voice-id ID]
 */

const fs = require("fs");
const path = require("path");
const {spawnSync} = require("child_process");
require("dotenv").config({path: path.resolve(__dirname, "../.env.local")});

const PROJECT_DIR = path.resolve(__dirname, "..");
const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "countdown-shorts");
const FPS = 30;
const SITE_NAME = "Beira do Campo";
const SITE_URL = "beiradocampo.com.br";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

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
    topicFile: null,
    ttsProvider: "minimax",
    voiceId: process.env.MINIMAX_VOICE_COUNTDOWN || "Portuguese_Jovialman",
    geminiVoice: process.env.GEMINI_TTS_VOICE || "Kore",
    fishVoice: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--tts-provider") {
      args.ttsProvider = argv[++i];
    } else if (token === "--voice-id") {
      args.voiceId = argv[++i];
    } else if (token === "--gemini-voice") {
      args.geminiVoice = argv[++i];
    } else if (token === "--fish-voice") {
      args.fishVoice = argv[++i];
    } else if (!token.startsWith("--") && !args.topicFile) {
      args.topicFile = token;
    }
  }

  return args;
}

/**
 * Gera narração segmentada via Gemini — retorna JSON com segmentos
 * { segments: [{key: "intro", text: "..."}, {key: "item-5", text: "..."}, ...] }
 */
async function generateSegmentedNarration(topic) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada em .env.local");
  }

  const itemsList = topic.items
    .slice()
    .sort((a, b) => b.rank - a.rank)
    .map((item) => `${item.rank}º: ${item.name} — ${item.stat}${item.subtitle ? ` (${item.subtitle})` : ""}`)
    .join("\n");

  const numItems = topic.items.length;

  const prompt = `Você é roteirista do canal "Beira do Campo" no YouTube. Escreva uma narração SEGMENTADA para um vídeo vertical (YouTube Shorts) de RANKING/COUNTDOWN.

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem \`\`\`, sem explicações.

O JSON deve ter este formato exato:
{
  "segments": [
    {"key": "intro", "text": "Gancho inicial que prende atenção..."},
    {"key": "item-${numItems}", "text": "No ${numItems}º lugar... (nome + stat + curiosidade)"},
    ${topic.items
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .slice(1)
      .map((item) => `{"key": "item-${item.rank}", "text": "No ${item.rank}º lugar..."}`)
      .join(",\n    ")},
    {"key": "cta", "text": "Matéria completa no site beiradocampo.com.br. Siga nosso canal do youtube!"}
  ]
}

REGRAS:
- Tom: âncora esportivo brasileiro, firme e envolvente (estilo ESPN/SporTV)
- Cada segmento de item deve ter 15-25 palavras (curto e impactante)
- O intro deve ter 10-20 palavras com gancho forte
- Crie suspense antes do número 1 (ex: "Mas o topo absoluto pertence a...")
- NÃO use abreviações (escreva "quinto" em vez de "5º")
- NÃO use "x" para placares — escreva "a"
- NÃO use asteriscos ou markdown
- O CTA final é fixo: "Matéria completa no site beiradocampo.com.br. Siga nosso canal do youtube!"

TEMA: ${topic.title}
CATEGORIA: ${topic.category || "curiosidades"}

RANKING:
${itemsList}

${topic.narrationPrompt ? `CONTEXTO ADICIONAL:\n${topic.narrationPrompt}\n` : ""}
JSON:`;

  const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{parts: [{text: prompt}]}],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        thinkingConfig: {thinkingBudget: 0},
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini text failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || "";

  // Parse JSON (pode vir com ```json wrapper)
  const cleaned = rawText.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.segments || !Array.isArray(parsed.segments)) {
    throw new Error("Gemini não retornou segments válidos");
  }

  // Sanitiza cada segmento
  parsed.segments = parsed.segments.map((s) => ({
    ...s,
    text: sanitizeForTTS(s.text),
  }));

  return parsed;
}

/**
 * Gera áudio individual pra cada segmento e retorna timings
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
      elevenlabsVoiceId: args.voiceId,
      minimaxVoiceId: args.voiceId,
      fishVoiceId: args.fishVoice,
    });

    // Renomear pra não conflitar entre segmentos
    const segM4a = path.join(segmentDir, `${String(i).padStart(2, "0")}-${seg.key}.m4a`);
    const segWav = path.join(segmentDir, `${String(i).padStart(2, "0")}-${seg.key}.wav`);
    if (audio.m4aPath && fs.existsSync(audio.m4aPath)) {
      fs.renameSync(audio.m4aPath, segM4a);
    }
    if (audio.wavPath && fs.existsSync(audio.wavPath)) {
      fs.renameSync(audio.wavPath, segWav);
    }

    const durationSec = getMediaDuration(segM4a);
    const durationFrames = Math.ceil(durationSec * FPS);

    // Adiciona pequena pausa entre segmentos (6 frames = 0.2s)
    const pauseFrames = seg.key === "cta" ? 0 : 6;

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

  // Concatenar todos os segmentos em um único áudio
  const concatListPath = path.join(segmentDir, "concat.txt");
  const concatEntries = timings.map((t) => {
    // Gera silêncio entre segmentos
    const pauseDur = t.key === "cta" ? 0 : 0.2;
    return `file '${path.basename(t.audioPath)}'`;
  });
  fs.writeFileSync(concatListPath, concatEntries.join("\n"));

  const finalM4a = path.join(outputDir, "narration.m4a");

  // Usar ffmpeg pra concatenar com pausas
  const filterParts = [];
  const inputs = [];
  for (let i = 0; i < timings.length; i++) {
    inputs.push("-i", timings[i].audioPath);
    // Adiciona pausa de 0.2s após cada segmento (exceto CTA)
    const pauseDur = timings[i].key === "cta" ? 0 : 0.2;
    if (pauseDur > 0) {
      filterParts.push(`[${i}]apad=pad_dur=${pauseDur}[a${i}]`);
    } else {
      filterParts.push(`[${i}]acopy[a${i}]`);
    }
  }
  const concatLabels = timings.map((_, i) => `[a${i}]`).join("");
  filterParts.push(`${concatLabels}concat=n=${timings.length}:v=0:a=1[out]`);

  const ffmpegArgs = [
    ...inputs,
    "-filter_complex", filterParts.join(";"),
    "-map", "[out]",
    "-c:a", "aac",
    "-b:a", "192k",
    "-y",
    finalM4a,
  ];

  const ff = spawnSync("ffmpeg", ffmpegArgs, {stdio: "pipe"});
  if (ff.status !== 0) {
    console.error("ffmpeg stderr:", ff.stderr?.toString().slice(-500));
    throw new Error(`ffmpeg concat failed (exit ${ff.status})`);
  }

  console.log(`\n✅ Áudio concatenado: ${finalM4a}`);

  return {timings, finalM4aPath: finalM4a};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.topicFile) {
    console.error("Uso: node scripts/render-countdown-short.js <topic.json> [--tts-provider minimax|elevenlabs|gemini]");
    process.exit(1);
  }

  const topicPath = path.resolve(args.topicFile);
  const topic = JSON.parse(fs.readFileSync(topicPath, "utf8"));
  const slug = topic.slug || path.basename(topicPath, ".json");

  console.log(`\n🏆 Countdown Short: ${topic.title}`);
  console.log(`   Items: ${topic.items.length}`);
  console.log(`   TTS: ${args.ttsProvider}\n`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // 1. Gerar narração segmentada
  let segmentedNarration;
  if (topic.segments) {
    console.log("📝 Usando segmentos manuais do JSON");
    segmentedNarration = {segments: topic.segments.map((s) => ({...s, text: sanitizeForTTS(s.text)}))};
  } else {
    console.log("🤖 Gerando roteiro segmentado com Gemini...");
    segmentedNarration = await generateSegmentedNarration(topic);
  }

  const fullNarration = segmentedNarration.segments.map((s) => s.text).join(" ");
  console.log(`📝 ${segmentedNarration.segments.length} segmentos (${fullNarration.split(/\s+/).length} palavras)\n`);

  for (const seg of segmentedNarration.segments) {
    console.log(`   [${seg.key}] ${seg.text}`);
  }
  console.log("");

  const narrationTextPath = path.join(outputDir, "narration.txt");
  fs.writeFileSync(narrationTextPath, fullNarration);
  fs.writeFileSync(path.join(outputDir, "narration-segments.json"), JSON.stringify(segmentedNarration, null, 2));

  // 2. Sintetizar cada segmento separadamente
  console.log("🎙️  Sintetizando segmentos...\n");
  const {timings, finalM4aPath} = await synthesizeSegments(segmentedNarration.segments, outputDir, args);

  copyFile(finalM4aPath, path.join(remotionAssetDir, "narration.m4a"));

  // 3. Copiar imagens dos items
  const itemsWithAssets = topic.items.map((item) => {
    if (item.imageSrc && fs.existsSync(path.resolve(item.imageSrc))) {
      const ext = path.extname(item.imageSrc);
      const assetName = `item-${item.rank}${ext}`;
      copyFile(path.resolve(item.imageSrc), path.join(remotionAssetDir, assetName));
      return {...item, imageSrc: `renders/${slug}/${assetName}`};
    }
    return {...item, imageSrc: undefined};
  });

  // 4. Calcular duração total
  const durationSeconds = getMediaDuration(finalM4aPath);
  const durationInFrames = Math.ceil(durationSeconds * FPS) + 12;

  console.log(`\n⏱️  Duração total: ${durationSeconds.toFixed(1)}s (${durationInFrames} frames)`);

  // 5. Mapear timings pros items — encontrar o timing de cada item-N
  const introTiming = timings.find((t) => t.key === "intro");
  const ctaTiming = timings.find((t) => t.key === "cta");

  // Ordenar items por rank decrescente (5→1) pra match com timings
  const sortedItems = itemsWithAssets.slice().sort((a, b) => b.rank - a.rank);
  const itemTimings = sortedItems.map((item) => {
    const t = timings.find((t) => t.key === `item-${item.rank}`);
    if (!t) return null;
    return {
      rank: item.rank,
      startFrame: t.startFrame,
      durationFrames: t.durationFrames,
    };
  }).filter(Boolean);

  console.log("\n📊 Timings sincronizados:");
  console.log(`   Intro: frame 0 → ${introTiming?.durationFrames || 0}`);
  for (const it of itemTimings) {
    console.log(`   Item #${it.rank}: frame ${it.startFrame} → ${it.startFrame + it.durationFrames}`);
  }
  if (ctaTiming) {
    console.log(`   CTA: frame ${ctaTiming.startFrame} → ${ctaTiming.startFrame + ctaTiming.durationFrames}`);
  }

  // 6. Montar props com timings
  const props = {
    slug,
    title: topic.title,
    category: topic.category || "curiosidades",
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    followHandle: "@beiradocampotv",
    followCallToAction: "Para mais curiosidades de futebol, siga o canal",
    audioSrc: `renders/${slug}/narration.m4a`,
    items: sortedItems.map((item) => {
      const t = itemTimings.find((it) => it.rank === item.rank);
      return {
        ...item,
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

  // 7. Renderizar
  const videoPath = path.join(outputDir, `${slug}-countdown.mp4`);

  console.log("\n🎬 Renderizando com Remotion...");
  run("npm", [
    "--prefix", VIDEO_STUDIO_DIR,
    "run", "render:article",
    "--",
    "--props-file", propsPath,
    "--composition-id", "CountdownShort",
    "--out", videoPath,
  ], {stdio: "inherit"});

  // 8. Manifest
  const manifest = {
    slug,
    type: "countdown",
    title: topic.title,
    category: topic.category || "curiosidades",
    narrationTextPath,
    narrationAudioPath: finalM4aPath,
    videoPath,
    propsPath,
    ttsProvider: args.ttsProvider,
    durationSeconds: Number(durationSeconds.toFixed(2)),
    durationInFrames,
    narration: fullNarration,
    timings,
    items: topic.items,
    youtubeTitle: topic.title,
    youtubeDescription: `${topic.title}\n\n${topic.items.map((i) => `${i.rank}º ${i.name} — ${i.stat}`).join("\n")}\n\nSiga o canal para mais curiosidades de futebol!\n#BeiradoCampo #futebol #top5 #curiosidades #${(topic.category || "futebol").replace(/-/g, "")}`,
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Countdown Short gerado!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   📋 ${manifestPath}`);
  process.stdout.write(`\n${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((err) => {
  console.error("❌ Erro:", err.message || err);
  process.exit(1);
});
