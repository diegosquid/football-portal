const fs = require("fs");
const path = require("path");
const {
  loadArticle,
  stripMarkdown,
  splitSentences,
  uniqueSentences,
  countWords,
  resolveAuthor,
  resolveImage,
  ensureDir,
  run,
  copyFile,
  getMediaDuration,
  synthesizeSpeechWithGemini,
  SITE_NAME,
  SITE_URL,
  PROJECT_DIR,
} = require("./short-video-data");

const FPS = 30;
const INTRO_FRAMES = 150; // 5 seconds
const OUTRO_FRAMES = 180; // 6 seconds
const TRANSITION_OVERLAP = 30; // 1 second crossfade
const MAX_NARRATION_WORDS = 750;
const MIN_NARRATION_WORDS = 500;
const SILENCE_BETWEEN_CHUNKS_MS = 300;

// ---------------------------------------------------------------------------
// Scene splitting
// ---------------------------------------------------------------------------

function splitIntoScenes(article) {
  const body = article.body;
  const lines = body.split("\n");
  const scenes = [];
  let current = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (current) scenes.push(current);
      current = {heading: h2Match[1].trim(), body: ""};
    } else {
      if (!current) {
        current = {heading: "", body: ""};
      }
      current.body += line + "\n";
    }
  }

  if (current && current.body.trim()) {
    scenes.push(current);
  }

  // Filter out empty scenes
  return scenes.filter((s) => stripMarkdown(s.body).trim().length > 30);
}

// ---------------------------------------------------------------------------
// Narration building (long version — almost complete article)
// ---------------------------------------------------------------------------

function buildLongformNarration(article) {
  const excerpt = stripMarkdown(String(article.data.excerpt || "").trim());
  const scenes = splitIntoScenes(article);

  const parts = [];
  if (excerpt) {
    parts.push(excerpt);
  }

  for (const scene of scenes) {
    const text = stripMarkdown(scene.body);
    const sentences = splitSentences(text);
    // Keep most sentences, trimming only very redundant ones
    const unique = uniqueSentences(sentences);
    parts.push(unique.join(" "));
  }

  const outro =
    "Quer saber todos os detalhes? Acesse a materia completa no site Beira do Campo. E se curtiu o conteudo, inscreva-se no canal para mais videos de futebol.";

  let fullText = parts.join(" ");

  // Trim to max words if needed
  const words = fullText.trim().split(/\s+/);
  if (words.length > MAX_NARRATION_WORDS) {
    fullText = words.slice(0, MAX_NARRATION_WORDS).join(" ") + ".";
  }

  return `${fullText} ${outro}`;
}

// ---------------------------------------------------------------------------
// Per-scene narration chunks (for TTS chunking)
// ---------------------------------------------------------------------------

function buildSceneNarrationChunks(article) {
  const excerpt = stripMarkdown(String(article.data.excerpt || "").trim());
  const scenes = splitIntoScenes(article);
  const chunks = [];

  // Intro chunk — excerpt
  if (excerpt) {
    chunks.push({
      sceneIndex: 0,
      type: "intro",
      text: excerpt,
    });
  }

  // Content chunks — one per scene
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const text = stripMarkdown(scene.body);
    const sentences = uniqueSentences(splitSentences(text));

    // Keep sentences up to ~180 words per chunk
    const kept = [];
    let total = 0;
    for (const s of sentences) {
      const wc = countWords(s);
      if (total + wc > 180) break;
      kept.push(s);
      total += wc;
    }

    if (kept.length > 0) {
      chunks.push({
        sceneIndex: i + 1,
        type: "content",
        heading: scene.heading,
        text: kept.join(" "),
      });
    }
  }

  // Outro chunk
  chunks.push({
    sceneIndex: chunks.length,
    type: "outro",
    text: "Quer saber todos os detalhes? Acesse a materia completa no site Beira do Campo. E se curtiu o conteudo, inscreva-se no canal para mais videos de futebol.",
  });

  // Trim total if too long
  let totalWords = chunks.reduce((sum, c) => sum + countWords(c.text), 0);
  while (totalWords > MAX_NARRATION_WORDS && chunks.length > 3) {
    // Remove the second-to-last content chunk (keep intro, outro, at least 1 content)
    const removeIdx = chunks.length - 2;
    totalWords -= countWords(chunks[removeIdx].text);
    chunks.splice(removeIdx, 1);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Image prompts
// ---------------------------------------------------------------------------

function sanitizeForBash(text) {
  // Remove characters that break JSON inside bash scripts
  return text
    .replace(/[""]/g, "")
    .replace(/'/g, "")
    .replace(/\\/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildImagePrompt(scene, article) {
  const category = String(article.data.category || "noticias");
  const teams = Array.isArray(article.data.teams) ? article.data.teams : [];
  const teamsStr = teams.length > 0 ? `Teams involved: ${teams.join(", ")}. ` : "";
  const heading = sanitizeForBash(scene.heading || "");
  const bodyPreview = sanitizeForBash(stripMarkdown(scene.body).slice(0, 200));

  return sanitizeForBash(
    `Brazilian football scene for news article. ${teamsStr}Section: ${heading}. Context: ${bodyPreview}. Style: photojournalistic, cinematic 16:9 landscape, stadium atmosphere, dramatic lighting, shallow depth of field. Category: ${category}. No text, no logos, no identifiable faces.`
  );
}

// ---------------------------------------------------------------------------
// TTS synthesis per chunk + concatenation
// ---------------------------------------------------------------------------

async function synthesizeLongNarration({chunks, outputDir}) {
  ensureDir(outputDir);

  const chunkPaths = [];
  const stylePrompt = [
    "Leia em portugues do Brasil, com tom de ancora esportivo, firme, claro e natural.",
    "Mantenha ritmo jornalistico, com energia moderada.",
    "Nao adicione palavras alem do texto fornecido.",
  ].join(" ");

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  🎙️  TTS chunk ${i + 1}/${chunks.length}: ${countWords(chunk.text)} palavras`);

    const result = await synthesizeSpeechWithGemini({
      text: chunk.text,
      outputDir,
      stylePrompt,
    });

    // Rename to chunk-specific name
    const chunkWav = path.join(outputDir, `chunk-${i}.wav`);
    if (result.wavPath && fs.existsSync(result.wavPath)) {
      fs.renameSync(result.wavPath, chunkWav);
    } else {
      // Convert M4A back to WAV for concatenation
      run("ffmpeg", ["-y", "-i", result.m4aPath, chunkWav]);
    }
    chunkPaths.push(chunkWav);

    // Clean up intermediary files
    const pcmPath = path.join(outputDir, "narration-gemini.pcm");
    if (fs.existsSync(pcmPath)) fs.unlinkSync(pcmPath);
    const geminiWav = path.join(outputDir, "narration-gemini.wav");
    if (fs.existsSync(geminiWav) && geminiWav !== chunkWav) {
      try { fs.unlinkSync(geminiWav); } catch {}
    }
    const tempM4a = path.join(outputDir, "narration.m4a");
    if (fs.existsSync(tempM4a)) {
      try { fs.unlinkSync(tempM4a); } catch {}
    }
  }

  // Build ffmpeg concat file with silence between chunks
  const silencePath = path.join(outputDir, "silence.wav");
  const silenceMs = SILENCE_BETWEEN_CHUNKS_MS;
  run("ffmpeg", [
    "-y", "-f", "lavfi", "-i",
    `anullsrc=r=24000:cl=mono`,
    "-t", String(silenceMs / 1000),
    silencePath,
  ]);

  const concatList = path.join(outputDir, "concat.txt");
  const lines = [];
  for (let i = 0; i < chunkPaths.length; i++) {
    lines.push(`file '${chunkPaths[i]}'`);
    if (i < chunkPaths.length - 1) {
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
    chunkPaths,
  };
}

// ---------------------------------------------------------------------------
// Timing calculation
// ---------------------------------------------------------------------------

function calculateSceneTiming({chunkPaths, fps = FPS}) {
  const timings = [];
  let currentFrame = 0;

  // Intro scene
  timings.push({
    type: "intro",
    startFrame: 0,
    durationInFrames: INTRO_FRAMES,
  });
  currentFrame = INTRO_FRAMES - TRANSITION_OVERLAP;

  // Content scenes — duration based on audio chunk duration
  for (let i = 0; i < chunkPaths.length; i++) {
    let durationSeconds;
    try {
      durationSeconds = getMediaDuration(chunkPaths[i]);
    } catch {
      durationSeconds = 10; // fallback
    }

    // Add padding (1s before + 0.5s after)
    const durationFrames = Math.ceil((durationSeconds + 1.5) * fps);

    timings.push({
      type: "content",
      chunkIndex: i,
      startFrame: currentFrame,
      durationInFrames: durationFrames,
    });

    currentFrame += durationFrames - TRANSITION_OVERLAP;
  }

  // Outro scene
  timings.push({
    type: "outro",
    startFrame: currentFrame,
    durationInFrames: OUTRO_FRAMES,
  });

  const totalFrames = currentFrame + OUTRO_FRAMES;

  return {timings, totalFrames};
}

// ---------------------------------------------------------------------------
// Ken Burns params (randomized per scene for variety)
// ---------------------------------------------------------------------------

function generateKenBurnsParams(sceneCount) {
  const params = [];
  for (let i = 0; i < sceneCount; i++) {
    const zoomIn = i % 2 === 0;
    const panXRange = 15 + Math.random() * 20;
    const panYRange = 10 + Math.random() * 15;
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
// Extract highlights for overlay cards
// ---------------------------------------------------------------------------

function extractHighlightsFromScene(sceneBody) {
  const sentences = splitSentences(sceneBody);
  const highlights = [];

  for (const s of sentences) {
    // Sentences with numbers are good highlights
    if (/\d/.test(s) && s.length > 30 && s.length < 160) {
      const trimmed = s.length > 80 ? s.slice(0, 77) + "..." : s;
      highlights.push(trimmed);
    }
  }

  return highlights.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Generate images for scenes using generate-image.sh
// ---------------------------------------------------------------------------

async function generateSceneImages({scenes, article, outputDir}) {
  ensureDir(outputDir);
  const scriptPath = path.join(PROJECT_DIR, "scripts", "generate-image.sh");
  const imagePaths = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const imageName = `scene-${i}.png`;
    const localPath = path.join(outputDir, imageName);

    if (i === 0) {
      // First scene: try to use the article's og:image
      try {
        const articleImage = resolveImage(article, outputDir);
        if (articleImage !== localPath) {
          copyFile(articleImage, localPath);
        }
        console.log(`  📸 Cena ${i}: imagem do artigo`);
        imagePaths.push(localPath);
        continue;
      } catch {
        console.log(`  ⚠️  Cena ${i}: og:image nao disponivel, gerando com Gemini...`);
      }
    }

    // Generate with Gemini
    const prompt = buildImagePrompt(scene, article);
    console.log(`  🎨 Cena ${i}: gerando imagem com Gemini...`);

    try {
      const result = run("bash", [scriptPath, `${article.slug}-scene-${i}`, prompt]);
      // The script outputs the R2 URL as last line
      const urlLines = result.split("\n").filter(Boolean);
      const publicUrl = urlLines[urlLines.length - 1];

      // Download the generated image locally
      run("curl", ["-L", "--fail", "--silent", publicUrl, "-o", localPath]);
      console.log(`  ✅ Cena ${i}: imagem gerada`);
    } catch (error) {
      console.warn(`  ⚠️  Cena ${i}: falha ao gerar imagem (${error.message}). Usando fallback.`);
      // Fallback: copy first available image
      if (imagePaths.length > 0 && fs.existsSync(imagePaths[0])) {
        copyFile(imagePaths[0], localPath);
      }
    }

    imagePaths.push(localPath);
  }

  return imagePaths;
}

// ---------------------------------------------------------------------------
// Build complete props for Remotion
// ---------------------------------------------------------------------------

function buildLongformProps({
  article,
  chunks,
  chunkPaths,
  imagePaths,
  audioRelativePath,
  rendersDir,
  slug,
}) {
  const {timings, totalFrames} = calculateSceneTiming({chunkPaths});
  const articleScenes = splitIntoScenes(article);
  const kenBurnsAll = generateKenBurnsParams(timings.length);
  const author = resolveAuthor(article.data.author);

  const scenes = timings.map((timing, index) => {
    const kenBurns = kenBurnsAll[index];

    if (timing.type === "intro") {
      return {
        type: "intro",
        heading: "",
        imageSrc: `renders/${slug}/scene-0.png`,
        startFrame: timing.startFrame,
        durationInFrames: timing.durationInFrames,
        kenBurns,
      };
    }

    if (timing.type === "outro") {
      return {
        type: "outro",
        startFrame: timing.startFrame,
        durationInFrames: timing.durationInFrames,
      };
    }

    // Content scene
    const chunkIdx = timing.chunkIndex;
    const chunk = chunks[chunkIdx];
    const articleScene = articleScenes[chunkIdx] || {};
    const sceneImageIdx = Math.min(chunkIdx + 1, imagePaths.length - 1);

    const highlightTexts = extractHighlightsFromScene(articleScene.body || "");
    const highlights = highlightTexts.map((text, hIdx) => ({
      text,
      appearAtFrame: 90 + hIdx * 140,
      durationFrames: 120,
    }));

    return {
      type: "content",
      heading: chunk.heading || articleScene.heading || "",
      imageSrc: `renders/${slug}/scene-${sceneImageIdx}.png`,
      startFrame: timing.startFrame,
      durationInFrames: timing.durationInFrames,
      kenBurns,
      highlights,
      stats: [],
    };
  });

  return {
    slug,
    title: String(article.data.title || ""),
    excerpt: String(article.data.excerpt || ""),
    category: String(article.data.category || "noticias"),
    authorName: author.name,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    followHandle: "@beiradocampotv",
    audioSrc: audioRelativePath,
    durationInFrames: totalFrames,
    fps: FPS,
    scenes,
  };
}

module.exports = {
  splitIntoScenes,
  buildLongformNarration,
  buildSceneNarrationChunks,
  buildImagePrompt,
  generateSceneImages,
  synthesizeLongNarration,
  calculateSceneTiming,
  generateKenBurnsParams,
  extractHighlightsFromScene,
  buildLongformProps,
  FPS,
  INTRO_FRAMES,
  OUTRO_FRAMES,
};
