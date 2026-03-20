const fs = require("fs");
const path = require("path");
const {
  loadArticle,
  stripMarkdown,
  splitSentences,
  countWords,
  resolveImage,
  ensureDir,
  run,
  copyFile,
  getMediaDuration,
  synthesizeSpeechWithGemini,
  synthesizeSpeechWithMiniMax,
  synthesizeSpeechWithElevenLabs,
  sanitizeForTTS,
  SITE_NAME,
  SITE_URL,
  PROJECT_DIR,
} = require("./short-video-data");

const { analyzeEmotions } = require("./minimax-emotions");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

const FPS = 30;
const INTRO_FRAMES = 180; // 6 seconds
const OUTRO_FRAMES = 180; // 6 seconds
const GAP_BETWEEN_TURNS_S = 0.4;
const VOICES = {
  Fernanda: "Kore",
  Ricardo: "Puck",
};

const MINIMAX_VOICES = {
  Fernanda: process.env.MINIMAX_VOICE_FERNANDA || "Portuguese_LovelyLady",
  Ricardo: process.env.MINIMAX_VOICE_RICARDO || "Portuguese_Casual_Speaker_v1",
  Marcos: process.env.MINIMAX_VOICE_MARCOS || "Portuguese_Raspy_Commentator_v1",
};

const ELEVENLABS_VOICES = {
  Fernanda: process.env.ELEVENLABS_VOICE_FERNANDA || "RGymW84CSmfVugnA5tvA",
  Ricardo: process.env.ELEVENLABS_VOICE_RICARDO || "36rVQA1AOIPwpA3Hg1tC",
};
const SPEAKER_COLORS = {
  Fernanda: "#facc15",
  Ricardo: "#7dd3fc",
};

// ---------------------------------------------------------------------------
// Dialogue script generation via Gemini text
// ---------------------------------------------------------------------------

async function generateDialogueScript(article) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  const articleText = stripMarkdown(article.body);
  const title = String(article.data.title || "");
  const category = String(article.data.category || "noticias");

  const systemPrompt = `Voce eh um roteirista de podcast esportivo brasileiro chamado "Beira do Campo".
Converta o artigo abaixo em um dialogo natural entre:
- Fernanda: apresentadora que guia a conversa, faz perguntas e transicoes
- Ricardo: comentarista/analista que traz opiniao, dados e contexto

Regras:
- Comece com a Fernanda apresentando o tema brevemente
- Alterne entre os dois a cada 2-4 frases
- Eles devem se chamar pelo nome durante a conversa (ex: "Ricardo, o que voce acha?", "Exatamente, Fernanda")
- Use linguagem coloquial mas profissional (estilo ESPN/SporTV)
- Inclua reacoes naturais ("Exatamente", "Olha so", "Eh verdade", "Com certeza")
- Mantenha todas as informacoes factuais do artigo
- O dialogo deve ter entre 600-800 palavras
- Termine com a Fernanda fazendo um resumo rapido e convidando pra acessar o site
- Formato EXATO de cada fala:
  Fernanda: texto da fala aqui.
  Ricardo: texto da fala aqui.
- NAO use asteriscos ou indicacoes de acao
- NAO use emojis
- Voce PODE usar interjeicoes naturais entre parenteses quando fizer sentido: (laughs), (sighs), (gasps). Use com moderacao (2-3 vezes no maximo no dialogo todo). Exemplo: "(laughs) Eh verdade, Ricardo, ninguem esperava isso."
- Cada fala deve ter no maximo 3-4 frases
- IMPORTANTE: quando houver "x" entre nomes de times (ex: "Palmeiras x Corinthians"), escreva por extenso "versus" ou "contra" para leitura correta no TTS
- IMPORTANTE: NUNCA escreva "R$". Sempre escreva o valor por extenso: "3,4 milhoes de reais", "500 mil reais", "dois bilhoes de reais"`;

  const userPrompt = `Titulo: ${title}
Categoria: ${category}

Artigo:
${articleText}`;

  console.log("  📝 Gerando roteiro de dialogo com Gemini...");

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
// Parse dialogue into turns
// ---------------------------------------------------------------------------

function parseDialogueTurns(script) {
  const turns = [];
  // Match lines starting with speaker name (Fernanda/Ricardo)
  // Handle multiline turns (text continues until next speaker label)
  const lines = script.split("\n");
  let currentTurn = null;

  for (const line of lines) {
    const match = line.match(/^\*{0,2}(Fernanda|Ricardo)\*{0,2}:\s*(.+)/);
    if (match) {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        speaker: match[1],
        text: match[2].trim(),
      };
    } else if (currentTurn && line.trim()) {
      // Continuation of current turn
      currentTurn.text += " " + line.trim();
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

// ---------------------------------------------------------------------------
// TTS per turn with exact timing
// ---------------------------------------------------------------------------

async function synthesizePodcastAudio({turns, outputDir, ttsProvider = "gemini"}) {
  ensureDir(outputDir);

  const stylePrompt =
    "Leia em portugues do Brasil, com tom de ancora esportivo, firme, claro e natural. Mantenha ritmo jornalistico, com energia e naturalidade. Nao adicione palavras alem do texto fornecido.";

  const useElevenlabs = ttsProvider === "elevenlabs";
  const useMinimax = ttsProvider === "minimax";
  const voiceMap = useElevenlabs ? ELEVENLABS_VOICES : useMinimax ? MINIMAX_VOICES : VOICES;
  const providerLabel = useElevenlabs ? "ElevenLabs" : useMinimax ? "MiniMax" : "Gemini";
  console.log(`  🔊 TTS provider: ${providerLabel}`);

  // Enriquecer turns com emoções e tags (apenas MiniMax)
  if (useMinimax) {
    try {
      const enriched = await analyzeEmotions(turns);
      for (const e of enriched) {
        if (e.index < turns.length) {
          turns[e.index].emotion = e.emotion;
          turns[e.index].textWithTags = e.textWithTags;
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Emotion analysis failed, using neutral: ${err.message}`);
    }
  }

  const turnResults = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const voiceName = voiceMap[turn.speaker] || voiceMap.Fernanda;

    // Skip if already generated (resume support)
    const turnWavExisting = path.join(outputDir, `turn-${i}.wav`);
    if (fs.existsSync(turnWavExisting)) {
      const dur = getMediaDuration(turnWavExisting);
      console.log(`  ⏩ Turn ${i + 1}/${turns.length} já existe (${dur.toFixed(1)}s), pulando...`);
      turnResults.push({
        index: i, speaker: turn.speaker, text: turn.text,
        wavPath: turnWavExisting, durationSeconds: dur,
        durationFrames: Math.ceil(dur * FPS),
      });
      continue;
    }

    const turnEmotion = turn.emotion || "neutral";
    const emotionLabel = useMinimax ? ` [${turnEmotion}]` : "";
    console.log(`  🎙️  Turn ${i + 1}/${turns.length} (${turn.speaker}/${voiceName})${emotionLabel}: ${countWords(turn.text)} palavras`);

    // Rate limit: wait between MiniMax calls
    if (useMinimax && i > 0) {
      await new Promise((r) => setTimeout(r, 3000));
    }

    const turnDir = path.join(outputDir, `turn-${i}-tmp`);
    ensureDir(turnDir);

    // Usar texto enriquecido (com tags) se disponível, senão texto original
    const rawText = (useMinimax && turn.textWithTags) ? turn.textWithTags : turn.text;
    const ttsText = sanitizeForTTS(rawText);

    let result;
    if (useElevenlabs) {
      result = await synthesizeSpeechWithElevenLabs({
        text: ttsText,
        outputDir: turnDir,
        voiceId: voiceName,
      });
    } else if (useMinimax) {
      result = await synthesizeSpeechWithMiniMax({
        text: ttsText,
        outputDir: turnDir,
        voiceId: voiceName,
        speed: 1.0,
        emotion: turnEmotion,
      });
    } else {
      result = await synthesizeSpeechWithGemini({
        text: ttsText,
        outputDir: turnDir,
        voiceName,
        stylePrompt,
      });
    }

    // Rename WAV to turn-specific name
    const turnWav = path.join(outputDir, `turn-${i}.wav`);
    if (result.wavPath && fs.existsSync(result.wavPath)) {
      fs.copyFileSync(result.wavPath, turnWav);
    }

    // Get exact duration
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

    // Clean up turn temp dir
    try { fs.rmSync(turnDir, {recursive: true, force: true}); } catch {}
  }

  // Generate silence file
  const silencePath = path.join(outputDir, "silence.wav");
  run("ffmpeg", [
    "-y", "-f", "lavfi", "-i",
    "anullsrc=r=24000:cl=mono",
    "-t", String(GAP_BETWEEN_TURNS_S),
    silencePath,
  ]);

  // Concatenate all turns with silence gaps
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

  return {
    m4aPath: finalM4a,
    wavPath: fullWav,
    turnResults,
  };
}

// ---------------------------------------------------------------------------
// Group turns into thematic blocks (for image association)
// ---------------------------------------------------------------------------

function groupTurnsIntoBlocks(turns, article) {
  // Extract H2 headings from article for topic names
  const headings = [];
  const lines = article.body.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) headings.push(h2[1].trim());
  }

  // Group ~5-6 turns per block
  const turnsPerBlock = Math.max(4, Math.ceil(turns.length / Math.max(headings.length, 3)));
  const blocks = [];
  let blockIndex = 0;

  for (let i = 0; i < turns.length; i += turnsPerBlock) {
    const blockTurns = turns.slice(i, i + turnsPerBlock);
    const heading = headings[blockIndex] || "";
    blocks.push({
      index: blockIndex,
      heading,
      turns: blockTurns,
      turnIndices: blockTurns.map((_, j) => i + j),
      isIntro: blockIndex === 0,
      isOutro: i + turnsPerBlock >= turns.length,
    });
    blockIndex++;
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Image prompts for podcast (simpler, scene-setting)
// ---------------------------------------------------------------------------

function sanitizeForBash(text) {
  return text
    .replace(/[""]/g, "")
    .replace(/'/g, "")
    .replace(/\\/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPodcastImagePrompt(block, article) {
  const category = String(article.data.category || "noticias");
  const teams = Array.isArray(article.data.teams) ? article.data.teams : [];
  const teamsStr = teams.length > 0 ? `Teams: ${teams.join(", ")}. ` : "";
  const heading = sanitizeForBash(block.heading || "");
  // Use first turn text for context
  const context = sanitizeForBash(
    (block.turns[0]?.text || "").slice(0, 180)
  );

  return sanitizeForBash(
    `Brazilian football scene for sports podcast episode. ${teamsStr}Topic: ${heading}. Context: ${context}. Style: photojournalistic, cinematic 16:9 landscape, stadium atmosphere, dramatic lighting, shallow depth of field. Category: ${category}. No text, no logos, no identifiable faces.`
  );
}

async function generatePodcastImages({blocks, article, outputDir}) {
  ensureDir(outputDir);
  const scriptPath = path.join(PROJECT_DIR, "scripts", "generate-image.sh");
  const imagePaths = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const localPath = path.join(outputDir, `block-${i}.png`);

    if (i === 0) {
      // First block: try article's og:image
      try {
        const articleImage = resolveImage(article, outputDir);
        if (articleImage !== localPath) {
          copyFile(articleImage, localPath);
        }
        console.log(`  📸 Bloco ${i}: imagem do artigo`);
        imagePaths.push(localPath);
        continue;
      } catch {
        console.log(`  ⚠️  Bloco ${i}: og:image nao disponivel, gerando...`);
      }
    }

    const prompt = buildPodcastImagePrompt(block, article);
    console.log(`  🎨 Bloco ${i}: gerando imagem com Gemini...`);

    try {
      const result = run("bash", [scriptPath, `${article.slug}-podcast-${i}`, prompt]);
      const urlLines = result.split("\n").filter(Boolean);
      const publicUrl = urlLines[urlLines.length - 1];
      run("curl", ["-kL", "--fail", "--silent", publicUrl, "-o", localPath]);
      console.log(`  ✅ Bloco ${i}: imagem gerada`);
    } catch (error) {
      console.warn(`  ⚠️  Bloco ${i}: fallback para imagem anterior`);
      if (imagePaths.length > 0 && fs.existsSync(imagePaths[0])) {
        copyFile(imagePaths[0], localPath);
      }
    }

    imagePaths.push(localPath);
  }

  return imagePaths;
}

// ---------------------------------------------------------------------------
// Extract key quotes for QuoteCallout
// ---------------------------------------------------------------------------

function extractKeyQuotes(turns) {
  const quotes = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const sentences = splitSentences(turn.text);

    for (const s of sentences) {
      // Sentences with numbers, strong adjectives, or short punchy statements
      if (
        (/\d/.test(s) && s.length > 20 && s.length < 120) ||
        (s.length > 30 && s.length < 80 && /[!]/.test(s))
      ) {
        const trimmed = s.length > 80 ? s.slice(0, 77) + "..." : s;
        quotes.push({text: trimmed, turnIndex: i, speaker: turn.speaker});
      }
    }
  }

  // Return max 4 evenly distributed quotes
  if (quotes.length <= 4) return quotes;
  const step = Math.floor(quotes.length / 4);
  return [quotes[0], quotes[step], quotes[step * 2], quotes[step * 3]];
}

// ---------------------------------------------------------------------------
// Calculate precise timing from turn audio durations
// ---------------------------------------------------------------------------

function calculatePodcastTiming({turnResults, blocks}) {
  const gapFrames = Math.ceil(GAP_BETWEEN_TURNS_S * FPS);

  // Build turn timing
  let currentFrame = INTRO_FRAMES;
  const turnTimings = [];

  for (let i = 0; i < turnResults.length; i++) {
    const tr = turnResults[i];
    turnTimings.push({
      turnIndex: i,
      speaker: tr.speaker,
      startFrame: currentFrame,
      durationInFrames: tr.durationFrames,
      endFrame: currentFrame + tr.durationFrames,
    });
    currentFrame += tr.durationFrames + gapFrames;
  }

  // Build block timing (aggregate from turns)
  const blockTimings = blocks.map((block) => {
    const firstTurn = turnTimings[block.turnIndices[0]];
    const lastTurn = turnTimings[block.turnIndices[block.turnIndices.length - 1]];
    return {
      blockIndex: block.index,
      heading: block.heading,
      startFrame: firstTurn.startFrame,
      endFrame: lastTurn.endFrame,
      durationInFrames: lastTurn.endFrame - firstTurn.startFrame,
      turnIndices: block.turnIndices,
    };
  });

  const contentEndFrame = currentFrame;
  const totalFrames = contentEndFrame + OUTRO_FRAMES;

  return {turnTimings, blockTimings, totalFrames, contentEndFrame};
}

// ---------------------------------------------------------------------------
// Generate Ken Burns params per block
// ---------------------------------------------------------------------------

function generateKenBurnsForBlocks(blockCount) {
  const params = [];
  for (let i = 0; i < blockCount; i++) {
    const zoomIn = i % 2 === 0;
    const panXRange = 12 + Math.random() * 18;
    const panYRange = 8 + Math.random() * 12;
    const panXDir = Math.random() > 0.5 ? 1 : -1;
    const panYDir = Math.random() > 0.5 ? 1 : -1;
    params.push({
      zoomIn,
      panX: [0, panXDir * panXRange],
      panY: [0, panYDir * panYRange],
    });
  }
  return params;
}

// ---------------------------------------------------------------------------
// Build complete props for Remotion PodcastVideo
// ---------------------------------------------------------------------------

function buildPodcastProps({
  article,
  turns,
  turnResults,
  blocks,
  imagePaths,
  keyQuotes,
  audioRelativePath,
  slug,
}) {
  const {turnTimings, blockTimings, totalFrames} = calculatePodcastTiming({turnResults, blocks});
  const kenBurnsAll = generateKenBurnsForBlocks(blocks.length);

  // Map key quotes to frame positions
  const quoteOverlays = keyQuotes.map((q) => {
    const turnTiming = turnTimings[q.turnIndex];
    return {
      text: q.text,
      speaker: q.speaker,
      appearAtFrame: turnTiming ? turnTiming.startFrame + 15 : 0,
      durationFrames: 120,
    };
  });

  // Build scenes array for Remotion
  const scenes = [];

  // Intro scene
  scenes.push({
    type: "intro",
    imageSrc: `renders/${slug}/block-0.png`,
    startFrame: 0,
    durationInFrames: INTRO_FRAMES,
    kenBurns: kenBurnsAll[0] || {zoomIn: true, panX: [0, -15], panY: [0, -10]},
  });

  // Content scenes (one per block)
  for (let i = 0; i < blockTimings.length; i++) {
    const bt = blockTimings[i];
    const imageIdx = Math.min(i, imagePaths.length - 1);

    // Get turn timings for this block
    const blockTurnTimings = bt.turnIndices.map((ti) => turnTimings[ti]);

    // Get quotes in this block
    const blockQuotes = quoteOverlays.filter((q) => {
      return q.appearAtFrame >= bt.startFrame && q.appearAtFrame < bt.endFrame;
    });

    scenes.push({
      type: "content",
      heading: bt.heading,
      imageSrc: `renders/${slug}/block-${imageIdx}.png`,
      startFrame: bt.startFrame,
      durationInFrames: bt.durationInFrames,
      kenBurns: kenBurnsAll[i] || {zoomIn: true, panX: [0, -10], panY: [0, -8]},
      turnTimings: blockTurnTimings,
      quotes: blockQuotes,
    });
  }

  // Outro scene
  scenes.push({
    type: "outro",
    startFrame: blockTimings.length > 0
      ? blockTimings[blockTimings.length - 1].endFrame
      : INTRO_FRAMES,
    durationInFrames: OUTRO_FRAMES,
  });

  return {
    slug,
    title: String(article.data.title || ""),
    excerpt: String(article.data.excerpt || ""),
    category: String(article.data.category || "noticias"),
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    followHandle: "@beiradocampotv",
    audioSrc: audioRelativePath,
    durationInFrames: totalFrames,
    fps: FPS,
    speakerColors: SPEAKER_COLORS,
    scenes,
    // Global turn timings for SpeakerIndicator
    allTurnTimings: turnTimings,
  };
}

module.exports = {
  generateDialogueScript,
  parseDialogueTurns,
  synthesizePodcastAudio,
  groupTurnsIntoBlocks,
  generatePodcastImages,
  extractKeyQuotes,
  calculatePodcastTiming,
  buildPodcastProps,
  VOICES,
  SPEAKER_COLORS,
  FPS,
  INTRO_FRAMES,
  OUTRO_FRAMES,
};
