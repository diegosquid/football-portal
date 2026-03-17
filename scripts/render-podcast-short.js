#!/usr/bin/env node

/**
 * Podcast Short — vertical 1080x1920 with 2 speakers (Fernanda + Ricardo)
 *
 * Usage:
 *   node scripts/render-podcast-short.js <slug> [--latest] [--script-file <path>] [--skip-tts] [--tts gemini|minimax]
 *
 * Gera um short vertical no formato podcast com diálogo entre 2 narradores.
 * Roteiro mais curto que o podcast longo (~300-450 palavras, 30-50s de vídeo).
 *
 * TTS providers:
 *   gemini  — Gemini TTS (padrão): vozes Kore/Puck
 *   minimax — MiniMax Speech-02-HD: vozes portuguesas mais realistas
 */

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
  resolveImage,
  copyFile,
  getMediaDuration,
  synthesizeSpeechWithGemini,
  synthesizeSpeechWithMiniMax,
  countWords,
  stripMarkdown,
  splitSentences,
} = require("./lib/short-video-data");

const {
  parseDialogueTurns,
  VOICES,
  SPEAKER_COLORS,
  FPS,
} = require("./lib/podcast-video-data");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "podcast-shorts");

const INTRO_FRAMES = 90; // 3s (mais curto que podcast longo)
const OUTRO_FRAMES = 72; // ~2.4s (FollowEndCard)
const GAP_BETWEEN_TURNS_S = 0.3; // Mais curto pra shorts

// MiniMax voice mapping (Portuguese Brazilian voices)
const MINIMAX_VOICES = {
  Fernanda: process.env.MINIMAX_VOICE_FERNANDA || "Portuguese_News_Reporter_v1",
  Ricardo: process.env.MINIMAX_VOICE_RICARDO || "Portuguese_Passionate_Commentator_v1",
  Marcos: process.env.MINIMAX_VOICE_MARCOS || "Portuguese_Jovialman",
};

// ---------------------------------------------------------------------------
// Short-form dialogue generation (mais enxuto)
// ---------------------------------------------------------------------------

async function generateShortDialogueScript(article) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  const articleText = stripMarkdown(article.body);
  const title = String(article.data.title || "");
  const category = String(article.data.category || "noticias");

  const systemPrompt = `Voce eh um roteirista de podcast esportivo brasileiro chamado "Beira do Campo".
Converta o artigo abaixo em um DIALOGO CURTO E RAPIDO entre:
- Fernanda: apresentadora que guia a conversa, faz perguntas e transicoes
- Ricardo: comentarista/analista que traz opiniao, dados e contexto

REGRAS PARA SHORT (formato curto, 30-50 segundos):
- MAXIMO 8-12 turnos no total (4-6 cada um)
- Total de 250-400 palavras (NAO mais que isso)
- Cada fala deve ter 1-2 frases CURTAS
- Fernanda abre com 1 frase impactante sobre o tema
- Ricardo complementa com dado ou opiniao forte
- Ritmo RAPIDO: eles se alternam a cada 1-2 frases
- Eles devem se chamar pelo nome 2-3 vezes no dialogo
- Use linguagem coloquial mas profissional (estilo ESPN/SporTV)
- Termine com a Fernanda fazendo convite curto ao site
- Formato EXATO de cada fala:
  Fernanda: texto da fala aqui.
  Ricardo: texto da fala aqui.
- NAO use asteriscos, parenteses ou indicacoes de acao
- NAO use emojis
- IMPORTANTE: quando houver "x" entre nomes de times, escreva "versus" ou "contra"
- Foque nos 2-3 pontos mais impactantes do artigo, nao tente cobrir tudo`;

  const userPrompt = `Titulo: ${title}
Categoria: ${category}

Artigo:
${articleText}`;

  console.log("  📝 Gerando roteiro curto de dialogo com Gemini...");

  const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [
        {role: "user", parts: [{text: `${systemPrompt}\n\n${userPrompt}`}]},
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini text failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  if (!textPart) {
    throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return textPart.text.trim();
}

// ---------------------------------------------------------------------------
// TTS per turn (reutiliza vozes do podcast)
// ---------------------------------------------------------------------------

async function synthesizeShortPodcastAudio({turns, outputDir, ttsProvider = "gemini"}) {
  ensureDir(outputDir);

  const stylePrompt =
    "Leia em portugues do Brasil, com tom de ancora esportivo, firme, claro e natural. Mantenha ritmo jornalistico com energia. Nao adicione palavras.";

  const turnResults = [];
  const isMiniMax = ttsProvider === "minimax";

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];

    let result;
    if (isMiniMax) {
      const voiceId = MINIMAX_VOICES[turn.speaker] || "Portuguese_ConfidentWoman";
      console.log(`  🎙️  Turn ${i + 1}/${turns.length} (${turn.speaker}/${voiceId}) [MiniMax]: ${countWords(turn.text)} palavras`);

      const speakerEmotion = turn.speaker === "Marcos" ? "happy" : "neutral";
      result = await synthesizeSpeechWithMiniMax({
        text: turn.text,
        outputDir,
        voiceId,
        speed: 1.05,
        emotion: speakerEmotion,
      });
    } else {
      const voiceName = VOICES[turn.speaker];
      console.log(`  🎙️  Turn ${i + 1}/${turns.length} (${turn.speaker}/${voiceName}) [Gemini]: ${countWords(turn.text)} palavras`);

      result = await synthesizeSpeechWithGemini({
        text: turn.text,
        outputDir,
        voiceName,
        stylePrompt,
      });
    }

    const turnWav = path.join(outputDir, `turn-${i}.wav`);
    if (result.wavPath && fs.existsSync(result.wavPath)) {
      fs.copyFileSync(result.wavPath, turnWav);
    }

    let durationSeconds;
    try {
      durationSeconds = getMediaDuration(turnWav);
    } catch {
      durationSeconds = getMediaDuration(result.m4aPath);
    }

    turnResults.push({
      index: i,
      speaker: turn.speaker,
      text: turn.text,
      wavPath: turnWav,
      durationSeconds,
      durationFrames: Math.ceil(durationSeconds * FPS),
    });

    // Limpar intermediarios
    const cleanupFiles = isMiniMax
      ? ["narration-minimax.mp3", "narration-minimax.wav", "narration.m4a"]
      : ["narration-gemini.pcm", "narration-gemini.wav", "narration.m4a"];
    for (const f of cleanupFiles) {
      const p = path.join(outputDir, f);
      if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
    }
  }

  // Concatenar com gaps de silencio
  const silencePath = path.join(outputDir, "silence.wav");
  run("ffmpeg", [
    "-y", "-f", "lavfi", "-i",
    "anullsrc=r=24000:cl=mono",
    "-t", String(GAP_BETWEEN_TURNS_S),
    silencePath,
  ]);

  const concatList = path.join(outputDir, "concat.txt");
  const lines = [];
  for (let i = 0; i < turnResults.length; i++) {
    lines.push(`file '${turnResults[i].wavPath}'`);
    if (i < turnResults.length - 1) {
      lines.push(`file '${silencePath}'`);
    }
  }
  fs.writeFileSync(concatList, lines.join("\n"), "utf8");

  const fullWav = path.join(outputDir, "narration-full.wav");
  const finalM4a = path.join(outputDir, "narration.m4a");

  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatList, fullWav]);
  run("ffmpeg", ["-y", "-i", fullWav, "-c:a", "aac", "-b:a", "192k", finalM4a]);

  return {m4aPath: finalM4a, turnResults};
}

// ---------------------------------------------------------------------------
// Extract key quotes
// ---------------------------------------------------------------------------

function extractShortQuotes(turns) {
  const quotes = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const sentences = splitSentences(turn.text);
    for (const s of sentences) {
      if (
        (/\d/.test(s) && s.length > 20 && s.length < 100) ||
        (s.length > 25 && s.length < 70 && /[!]/.test(s))
      ) {
        quotes.push({text: s.length > 70 ? s.slice(0, 67) + "..." : s, turnIndex: i, speaker: turn.speaker});
      }
    }
  }
  // Max 2 quotes para short
  if (quotes.length <= 2) return quotes;
  return [quotes[0], quotes[Math.floor(quotes.length / 2)]];
}

// ---------------------------------------------------------------------------
// YouTube title & description
// ---------------------------------------------------------------------------

const CATEGORY_EMOJIS = {
  "transfer-radar": "🔄",
  "pre-match": "⚽",
  "post-match": "🏟️",
  "stat-analysis": "📊",
  analises: "🔍",
  opiniao: "💬",
  noticias: "📰",
};

function buildYouTubeTitle(articleTitle, category) {
  const emoji = CATEGORY_EMOJIS[category] || "⚽";
  // YouTube shorts titles: max ~100 chars, hook forte
  const clean = articleTitle.replace(/\s*[-–—|]\s*$/, "").trim();
  const title = `${emoji} ${clean}`;
  return title.length > 95 ? title.slice(0, 92) + "..." : title;
}

function buildYouTubeDescription({articleTitle, excerpt, slug, teams, category}) {
  const lines = [];

  // Hook
  lines.push("🎙️ Fernanda e Ricardo debatem:");
  if (excerpt) lines.push(excerpt);
  lines.push("");

  // CTA
  lines.push("📖 Leia a matéria completa:");
  lines.push(`https://beiradocampo.com.br/${slug}`);
  lines.push("");

  // Canal
  lines.push("🔔 Inscreva-se para mais shorts de futebol!");
  lines.push("");

  // Hashtags
  const tags = ["shorts", "futebol", "brasileirao"];
  if (category === "transfer-radar") tags.push("transferencias", "mercado");
  for (const team of teams.slice(0, 3)) {
    tags.push(team.toLowerCase().replace(/\s+/g, ""));
  }
  lines.push(tags.map((t) => `#${t}`).join(" "));

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Build props for Remotion PodcastShort
// ---------------------------------------------------------------------------

function buildPodcastShortProps({article, turns, turnResults, keyQuotes, audioRelativePath, imageRelativePath, slug}) {
  const gapFrames = Math.ceil(GAP_BETWEEN_TURNS_S * FPS);

  // Turn timings
  let currentFrame = INTRO_FRAMES;
  const turnTimings = [];

  for (let i = 0; i < turnResults.length; i++) {
    const tr = turnResults[i];
    turnTimings.push({
      turnIndex: i,
      speaker: tr.speaker,
      text: tr.text,
      startFrame: currentFrame,
      durationInFrames: tr.durationFrames,
      endFrame: currentFrame + tr.durationFrames,
    });
    currentFrame += tr.durationFrames + gapFrames;
  }

  const totalFrames = currentFrame + OUTRO_FRAMES;

  // Map quotes to frame positions
  const quoteOverlays = keyQuotes.map((q) => {
    const turnTiming = turnTimings[q.turnIndex];
    return {
      text: q.text,
      speaker: q.speaker,
      appearAtFrame: turnTiming ? turnTiming.startFrame + 10 : 0,
      durationFrames: 90,
    };
  });

  return {
    slug,
    title: String(article.data.title || ""),
    excerpt: String(article.data.excerpt || ""),
    category: String(article.data.category || "noticias"),
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    followHandle: "@beiradocampotv",
    imageSrc: imageRelativePath,
    audioSrc: audioRelativePath,
    followCallToAction: "Para mais notícias de futebol, siga o canal",
    durationInFrames: totalFrames,
    fps: FPS,
    speakerColors: SPEAKER_COLORS,
    allTurnTimings: turnTimings,
    quotes: quoteOverlays,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {slug: null, latest: false, scriptFile: null, skipTts: false, ttsProvider: "gemini"};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--latest") args.latest = true;
    else if (token === "--script-file") { args.scriptFile = argv[i + 1]; i += 1; }
    else if (token === "--skip-tts") args.skipTts = true;
    else if (token === "--tts") { args.ttsProvider = argv[i + 1]; i += 1; }
    else if (!token.startsWith("--") && !args.slug) args.slug = token;
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug || (args.latest ? getLatestArticleSlug() : null);

  if (!slug) {
    console.error("Usage: node scripts/render-podcast-short.js <slug> [--latest] [--script-file <path>] [--skip-tts] [--tts gemini|minimax]");
    process.exit(1);
  }

  console.log(`\n🎙️  Podcast Short: ${slug}`);
  console.log("═".repeat(60));

  // 1. Load article
  const article = loadArticle(slug);
  console.log(`📄 Artigo: ${article.data.title}`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // 2. Generate short dialogue
  let script;
  if (args.scriptFile) {
    console.log(`📜 Usando roteiro de: ${args.scriptFile}`);
    script = fs.readFileSync(path.resolve(args.scriptFile), "utf8").trim();
  } else {
    script = await generateShortDialogueScript(article);
  }

  const scriptPath = path.join(outputDir, "dialogue-script.txt");
  fs.writeFileSync(scriptPath, script, "utf8");
  console.log(`✅ Roteiro salvo: ${scriptPath}`);

  // 3. Parse turns
  const turns = parseDialogueTurns(script);
  const totalWords = turns.reduce((sum, t) => sum + t.text.split(/\s+/).length, 0);
  const fernandaTurns = turns.filter((t) => t.speaker === "Fernanda").length;
  const ricardoTurns = turns.filter((t) => t.speaker === "Ricardo").length;

  console.log(`\n📊 ${turns.length} turnos (~${totalWords} palavras)`);
  console.log(`   Fernanda: ${fernandaTurns} | Ricardo: ${ricardoTurns}`);

  if (turns.length < 4) {
    throw new Error(`Roteiro muito curto (${turns.length} turnos). Minimo 4.`);
  }

  // 4. Resolve image (article og:image)
  console.log("\n📸 Resolvendo imagem...");
  const imagePath = resolveImage(article, outputDir);
  const imageExt = path.extname(imagePath) || ".png";
  const remotionImagePath = path.join(remotionAssetDir, `source${imageExt}`);
  copyFile(imagePath, remotionImagePath);
  const imageRelativePath = `renders/${slug}/source${imageExt}`;

  // 5. TTS
  let ttsResult;
  if (args.skipTts) {
    console.log("\n🔊 Pulando TTS (--skip-tts), lendo durações dos WAVs existentes...");
    const turnResults = [];
    for (let i = 0; i < turns.length; i++) {
      const wavPath = path.join(outputDir, `turn-${i}.wav`);
      let durationSeconds = 3; // fallback
      if (fs.existsSync(wavPath)) {
        try { durationSeconds = getMediaDuration(wavPath); } catch {}
      }
      turnResults.push({
        index: i, speaker: turns[i].speaker, text: turns[i].text,
        wavPath, durationSeconds, durationFrames: Math.ceil(durationSeconds * FPS),
      });
      console.log(`   Turn ${i + 1}: ${turns[i].speaker} — ${durationSeconds.toFixed(1)}s (${Math.ceil(durationSeconds * FPS)} frames)`);
    }
    ttsResult = {m4aPath: path.join(outputDir, "narration.m4a"), turnResults};
  } else {
    const providerLabel = args.ttsProvider === "minimax" ? "MiniMax" : "Gemini";
    console.log(`\n🔊 Sintetizando TTS (2 vozes) [${providerLabel}]...`);
    ttsResult = await synthesizeShortPodcastAudio({turns, outputDir, ttsProvider: args.ttsProvider});
    console.log(`✅ Audio: ${ttsResult.m4aPath}`);
  }

  // Copy audio to Remotion
  copyFile(ttsResult.m4aPath, path.join(remotionAssetDir, "narration.m4a"));
  const audioRelativePath = `renders/${slug}/narration.m4a`;

  // 6. Extract quotes
  const keyQuotes = extractShortQuotes(turns);
  console.log(`💬 ${keyQuotes.length} quotes de destaque`);

  // 7. Build props
  console.log("\n⚙️  Calculando timing e props...");
  const props = buildPodcastShortProps({
    article, turns, turnResults: ttsResult.turnResults,
    keyQuotes, audioRelativePath, imageRelativePath, slug,
  });

  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  const estimatedDuration = (props.durationInFrames / FPS).toFixed(1);
  console.log(`⏱️  Duracao: ${estimatedDuration}s (${props.durationInFrames} frames)`);

  // 8. Render
  const videoPath = path.join(outputDir, `${slug}-podcast-short.mp4`);
  console.log(`\n🎥 Renderizando (${props.durationInFrames} frames)...`);

  run(
    "npm",
    [
      "--prefix", VIDEO_STUDIO_DIR,
      "run", "render:article", "--",
      "--props-file", propsPath,
      "--composition-id", "PodcastShortClean",
      "--out", videoPath,
    ],
    {stdio: "inherit"}
  );

  // 9. YouTube title & description
  const articleTitle = String(article.data.title || slug);
  const category = String(article.data.category || "noticias");
  const excerpt = String(article.data.excerpt || "");
  const teams = Array.isArray(article.data.teams) ? article.data.teams : [];

  const youtubeTitle = buildYouTubeTitle(articleTitle, category);
  const youtubeDescription = buildYouTubeDescription({articleTitle, excerpt, slug, teams, category});

  console.log(`\n📺 YouTube:`);
  console.log(`   Título: ${youtubeTitle}`);
  console.log(`   Descrição: ${youtubeDescription.split("\n")[0]}...`);

  // 10. Manifest
  const manifest = {
    slug,
    articlePath: article.path,
    videoPath,
    propsPath,
    scriptPath,
    format: "podcast-short",
    compositionId: "PodcastShortClean",
    durationInFrames: props.durationInFrames,
    durationSeconds: Number(estimatedDuration),
    turnCount: turns.length,
    quoteCount: keyQuotes.length,
    voices: {
      Fernanda: args.ttsProvider === "minimax" ? MINIMAX_VOICES.Fernanda : "Kore",
      Ricardo: args.ttsProvider === "minimax" ? MINIMAX_VOICES.Ricardo : "Puck",
    },
    ttsProvider: args.ttsProvider,
    youtubeTitle,
    youtubeDescription,
  };

  fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Podcast Short gerado!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   ⏱️  ${estimatedDuration}s`);
  console.log(`   🎙️  ${fernandaTurns} Fernanda + ${ricardoTurns} Ricardo`);
  console.log("═".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Erro:", error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) console.error(error.stack);
  process.exit(1);
});
