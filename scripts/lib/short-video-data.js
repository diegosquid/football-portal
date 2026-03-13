const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const matter = require("gray-matter");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

const PROJECT_DIR = path.resolve(__dirname, "../..");
const ARTICLES_DIR = path.join(PROJECT_DIR, "content", "articles");
const SITE_NAME = "Beira do Campo";
const SITE_URL = "beiradocampo.com.br";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`;
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";

const AUTHOR_META = {
  "renato-caldeira": {
    name: "Renato Caldeira",
    micHandle: "@renatocaldeira",
  },
  "patricia-mendes": {
    name: "Patrícia Mendes",
    micHandle: "@patmendes",
  },
  "marcos-vinicius": {
    name: "Marcos Vinícius Santos",
    micHandle: "@mvsfutebol",
  },
  "neide-ferreira": {
    name: "Neide Ferreira",
    micHandle: "@neideferreira",
  },
  "thiago-borges": {
    name: "Thiago Borges",
    micHandle: "@thiagoborges",
  },
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  });
  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  const stderr = typeof result.stderr === "string" ? result.stderr : "";

  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status ?? "unknown"}): ${(stderr || stdout).trim()}`
    );
  }

  return stdout.trim();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getLatestArticleSlug() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((file) => file.endsWith(".mdx"));
  const dated = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
      const { data } = matter(raw);
      return {
        slug: String(data.slug || file.replace(/\.mdx$/, "")),
        date: String(data.date || ""),
      };
    })
    .filter((item) => item.date);

  if (dated.length === 0) {
    throw new Error("No dated articles found in content/articles.");
  }

  dated.sort((a, b) => a.date.localeCompare(b.date));
  return dated[dated.length - 1].slug;
}

function loadArticle(slug) {
  const articlePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article not found: ${articlePath}`);
  }

  const raw = fs.readFileSync(articlePath, "utf8");
  const parsed = matter(raw);

  return {
    path: articlePath,
    slug,
    data: parsed.data,
    body: parsed.content,
  };
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/^\|?[-:\s|]+\|?$/gm, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  return stripMarkdown(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function uniqueSentences(sentences) {
  const seen = new Set();
  const output = [];

  for (const sentence of sentences) {
    const key = sentence.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(sentence);
  }

  return output;
}

function truncateWords(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeSentence(text) {
  return text
    .replace(/\.\.+/g, ".")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

// Sanitiza texto para TTS: placares, abreviações, símbolos
function sanitizeForTTS(text) {
  return text
    // Placares: 2x1, 5x0, 0X3 → "2 a 1", "5 a 0", "0 a 3"
    .replace(/(\d+)\s*[xX]\s*(\d+)/g, "$1 a $2")
    // "vs" / "vs." → "versus"
    .replace(/\bvs\.?\b/gi, "versus")
    // R$ 10 milhões → "10 milhões de reais"
    .replace(/R\$\s*([\d.,]+)\s*(milh[õo]es|bilh[õo]es|mil)?/gi, (_, val, unit) =>
      unit ? `${val} ${unit} de reais` : `${val} reais`
    )
    // USD → "dólares"
    .replace(/USD\s*([\d.,]+)\s*(milh[õo]es|bilh[õo]es|mil)?/gi, (_, val, unit) =>
      unit ? `${val} ${unit} de dólares` : `${val} dólares`
    )
    // % → "por cento"
    .replace(/(\d+)%/g, "$1 por cento")
    // "1º" → "primeiro", "2ª" → "segunda" (mais comuns)
    .replace(/\b1[ºo]\b/g, "primeiro").replace(/\b1[ªa]\b/g, "primeira")
    .replace(/\b2[ºo]\b/g, "segundo").replace(/\b2[ªa]\b/g, "segunda")
    .replace(/\b3[ºo]\b/g, "terceiro").replace(/\b3[ªa]\b/g, "terceira")
    // Remover ** (bold markdown)
    .replace(/\*\*/g, "")
    // Limpar múltiplos espaços
    .replace(/\s{2,}/g, " ")
    .trim();
}

function shortenSentence(sentence, maxWords) {
  const clauses = sentence
    .split(/[,:;—-]\s+/)
    .map((clause) => normalizeSentence(clause))
    .filter(Boolean);

  if (clauses[0] && countWords(clauses[0]) <= maxWords) {
    return /[.!?]$/.test(clauses[0]) ? clauses[0] : `${clauses[0]}.`;
  }

  for (const clause of clauses) {
    if (countWords(clause) <= maxWords) {
      return /[.!?]$/.test(clause) ? clause : `${clause}.`;
    }
  }

  return normalizeSentence(truncateWords(sentence, maxWords));
}

function scoreSentence(sentence, keywords) {
  let score = 0;
  if (/\d/.test(sentence)) score += 4;
  if (sentence.length > 60 && sentence.length < 220) score += 2;
  if (/(final|titulo|vantagem|gols|historico|mata-mata|decis|analise|estat)/i.test(sentence)) score += 3;

  const normalized = sentence.toLowerCase();
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) score += 2;
  }

  return score;
}

// Hooks de abertura por categoria — quebram a monotonia e prendem atenção
const CATEGORY_HOOKS = {
  "post-match": ["E o jogo acabou!", "Apita o árbitro!", "Resultado definido!"],
  "pre-match": ["Bola vai rolar!", "É dia de decisão!", "Tudo pronto!"],
  opiniao: ["Opinião quente!", "Hora de falar a verdade.", "Atenção, torcedor."],
  "transfer-radar": ["Movimentação no mercado!", "Radar de transferências!", "Mercado agitado!"],
  "stat-analysis": ["Os números não mentem.", "Análise completa!", "Dados que impressionam."],
  libertadores: ["Libertadores em jogo!", "Noite de Libertadores!", "É continental!"],
  brasileirao: ["Brasileirão na área!", "Rodada quente!", "Série A em ação!"],
};

const TRANSITIONS = ["E tem mais.", "Olha esse dado.", "Presta atenção.", "E não para por aí."];

const OUTROS = [
  "Leia a matéria completa no site. Siga o canal pra ficar por dentro!",
  "Matéria completa no site. Se inscreva e ative o sininho!",
  "Todos os detalhes no site. Siga o canal!",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildNarration(article) {
  const excerpt = stripMarkdown(String(article.data.excerpt || "").trim());
  const category = String(article.data.category || "noticias");
  const bodySentences = splitSentences(article.body);
  const keywords = [
    ...(Array.isArray(article.data.teams) ? article.data.teams : []),
    ...(Array.isArray(article.data.tags) ? article.data.tags : []),
  ]
    .map((item) => String(item).toLowerCase())
    .filter(Boolean);

  const scored = bodySentences
    .map((sentence) => ({
      sentence,
      score: scoreSentence(sentence, keywords),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sentence);

  const picks = uniqueSentences([bodySentences[0], ...scored.slice(0, 4)])
    .slice(0, 3)
    .map((sentence) => shortenSentence(sentence, 18));

  // Hook de abertura baseado na categoria
  const hooks = CATEGORY_HOOKS[category] || ["Atenção, torcedor!"];
  const hook = pickRandom(hooks);
  const outro = pickRandom(OUTROS);
  const maxWords = 85;
  const available = maxWords - countWords(hook) - countWords(outro);
  const chosen = [];

  const segments = [excerpt, ...picks];
  for (let i = 0; i < segments.length; i++) {
    const candidate = normalizeSentence(segments[i]);
    if (!candidate) continue;
    // Transição natural entre o 2º e 3º dado
    const prefix = chosen.length === 2 ? pickRandom(TRANSITIONS) + " " : "";
    const full = prefix + candidate;
    if (countWords([...chosen, full].join(" ")) > available) break;
    chosen.push(full);
  }

  return sanitizeForTTS(normalizeSentence([hook, ...chosen, outro].join(" ")));
}

function extractHeadings(body) {
  return body
    .split("\n")
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter(Boolean);
}

function buildHighlights(article) {
  const headings = extractHeadings(article.body).slice(0, 3);
  if (headings.length > 0) return headings;

  const sentences = splitSentences(article.body)
    .filter((sentence) => sentence.length > 45)
    .slice(0, 3)
    .map((sentence) => shortenSentence(sentence, 10));

  return sentences;
}

function resolveAuthor(authorSlug) {
  const meta = AUTHOR_META[String(authorSlug || "")];
  return {
    slug: String(authorSlug || ""),
    name: meta?.name || String(authorSlug || "Repórter"),
    micHandle:
      meta?.micHandle ||
      `@${String(authorSlug || "reporter").replace(/[^a-z0-9]+/gi, "")}`,
  };
}

function copyFile(source, destination) {
  fs.copyFileSync(source, destination);
}

function resolveImage(article, outputDir, explicitImage) {
  if (explicitImage) {
    const imagePath = path.resolve(explicitImage);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }
    return imagePath;
  }

  const image = String(article.data.image || "").trim();
  if (!image) {
    throw new Error("Article has no image. Pass --image with a local file.");
  }

  if (/^https?:\/\//i.test(image)) {
    ensureDir(outputDir);
    const ext = path.extname(new URL(image).pathname) || ".png";
    const downloadPath = path.join(outputDir, `source${ext}`);
    run("curl", ["-kL", "--fail", "--silent", "--show-error", image, "-o", downloadPath]);
    return downloadPath;
  }

  const localPath = path.resolve(PROJECT_DIR, image.replace(/^\//, ""));
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local article image not found: ${localPath}`);
  }
  return localPath;
}

function getMediaDuration(mediaPath) {
  const output = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    mediaPath,
  ]);

  const duration = Number.parseFloat(output);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read media duration from ${mediaPath}`);
  }

  return duration;
}

async function synthesizeSpeechWithGemini({
  text,
  outputDir,
  voiceName = GEMINI_TTS_VOICE,
  languageCode = "pt-BR",
  stylePrompt,
}) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  const prompt = stylePrompt
    ? `${stylePrompt}\n\nTexto:\n${text}`
    : text;

  const response = await fetch(GEMINI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          languageCode,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
      model: GEMINI_TTS_MODEL,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini TTS failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(
    (candidatePart) =>
      candidatePart?.inlineData?.mimeType?.startsWith("audio/") ||
      candidatePart?.inline_data?.mime_type?.startsWith("audio/")
  );

  const inlineData = part?.inlineData || part?.inline_data;
  const pcmBase64 = inlineData?.data;

  if (!pcmBase64) {
    throw new Error(`Gemini TTS returned no audio payload: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const pcmPath = path.join(outputDir, "narration-gemini.pcm");
  const wavPath = path.join(outputDir, "narration-gemini.wav");
  const m4aPath = path.join(outputDir, "narration.m4a");

  fs.writeFileSync(pcmPath, Buffer.from(pcmBase64, "base64"));

  run("ffmpeg", [
    "-y",
    "-f",
    "s16le",
    "-ar",
    "24000",
    "-ac",
    "1",
    "-i",
    pcmPath,
    wavPath,
  ]);

  run("ffmpeg", [
    "-y",
    "-i",
    wavPath,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    m4aPath,
  ]);

  return {
    provider: "gemini",
    voiceName,
    wavPath,
    m4aPath,
    sourcePath: pcmPath,
  };
}

// ---------------------------------------------------------------------------
// MiniMax TTS — vozes mais realistas com suporte a emoção
// ---------------------------------------------------------------------------

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_TTS_MODEL = process.env.MINIMAX_TTS_MODEL || "speech-02-hd";
const MINIMAX_TTS_BASE = "https://api.minimaxi.chat/v1/t2a_v2";

async function synthesizeSpeechWithMiniMax({
  text,
  outputDir,
  voiceId = "Portuguese_SentimentalLady",
  speed = 1.0,
  emotion = "neutral",
  pitch = 0,
}) {
  if (!MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is not configured in .env.local");
  }
  if (!MINIMAX_GROUP_ID) {
    throw new Error("MINIMAX_GROUP_ID is not configured in .env.local (find it at platform.minimax.io → Account)");
  }

  ensureDir(outputDir);

  const response = await fetch(`${MINIMAX_TTS_BASE}?GroupId=${MINIMAX_GROUP_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: MINIMAX_TTS_MODEL,
      text,
      stream: false,
      language_boost: "Portuguese",
      voice_setting: {
        voice_id: voiceId,
        speed,
        emotion,
        pitch,
      },
      audio_setting: {
        sample_rate: 24000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`MiniMax TTS failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();

  if (data?.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax TTS error: ${data?.base_resp?.status_msg || JSON.stringify(data).slice(0, 300)}`);
  }

  const audioHex = data?.data?.audio;
  if (!audioHex) {
    throw new Error("MiniMax TTS returned no audio data");
  }

  const mp3Path = path.join(outputDir, "narration-minimax.mp3");
  const wavPath = path.join(outputDir, "narration-minimax.wav");
  const m4aPath = path.join(outputDir, "narration.m4a");

  // Hex string → buffer → mp3
  fs.writeFileSync(mp3Path, Buffer.from(audioHex, "hex"));

  // mp3 → wav (para compatibilidade com concat)
  run("ffmpeg", ["-y", "-i", mp3Path, "-ar", "24000", "-ac", "1", wavPath]);

  // mp3 → m4a
  run("ffmpeg", ["-y", "-i", mp3Path, "-c:a", "aac", "-b:a", "192k", m4aPath]);

  return {
    provider: "minimax",
    voiceId,
    wavPath,
    m4aPath,
    sourcePath: mp3Path,
  };
}

// ---------------------------------------------------------------------------
// ElevenLabs TTS — vozes ultra-realistas
// ---------------------------------------------------------------------------

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

async function synthesizeSpeechWithElevenLabs({
  text,
  outputDir,
  voiceId,
  speed = 1.0,
  stability = 0.5,
  similarityBoost = 0.75,
}) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured in .env.local");
  }

  ensureDir(outputDir);

  const response = await fetch(
    `${ELEVENLABS_BASE}/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        language_code: "pt",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          speed,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const mp3Path = path.join(outputDir, "narration-elevenlabs.mp3");
  const wavPath = path.join(outputDir, "narration-elevenlabs.wav");
  const m4aPath = path.join(outputDir, "narration.m4a");

  // Response é binary MP3
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(mp3Path, buffer);

  // mp3 → wav (para concat)
  run("ffmpeg", ["-y", "-i", mp3Path, "-ar", "24000", "-ac", "1", wavPath]);

  // mp3 → m4a
  run("ffmpeg", ["-y", "-i", mp3Path, "-c:a", "aac", "-b:a", "192k", m4aPath]);

  return {
    provider: "elevenlabs",
    voiceId,
    wavPath,
    m4aPath,
    sourcePath: mp3Path,
  };
}

function synthesizeSpeechLocally({
  textPath,
  outputDir,
  voice = "Eddy (Portuguese (Brazil))",
  rate = "176",
}) {
  const aiffPath = path.join(outputDir, "narration.aiff");
  const m4aPath = path.join(outputDir, "narration.m4a");

  run("say", [
    "-v",
    voice,
    "-r",
    String(rate),
    "-f",
    textPath,
    "-o",
    aiffPath,
  ]);

  run("ffmpeg", [
    "-y",
    "-i",
    aiffPath,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    m4aPath,
  ]);

  return {
    provider: "local",
    voiceName: voice,
    sourcePath: aiffPath,
    m4aPath,
  };
}

const DEFAULT_MINIMAX_NARRATOR = process.env.MINIMAX_NARRATOR_VOICE || "Portuguese_News_Reporter_v1";
const DEFAULT_ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_FERNANDA || "RGymW84CSmfVugnA5tvA";

async function synthesizeNarration({
  text: rawText,
  textPath,
  outputDir,
  provider = "auto",
  geminiVoiceName,
  minimaxVoiceId,
  elevenlabsVoiceId,
  localVoice,
  localRate,
}) {
  const text = sanitizeForTTS(rawText);
  const stylePrompt = [
    "Leia em português do Brasil, com tom de âncora esportivo, firme, claro e natural.",
    "Mantenha ritmo jornalístico, com energia moderada.",
    "Não adicione palavras além do texto fornecido.",
  ].join(" ");

  if (provider === "local") {
    return synthesizeSpeechLocally({
      textPath,
      outputDir,
      voice: localVoice,
      rate: localRate,
    });
  }

  if (provider === "minimax") {
    return synthesizeSpeechWithMiniMax({
      text,
      outputDir,
      voiceId: minimaxVoiceId || DEFAULT_MINIMAX_NARRATOR,
      speed: 1.0,
      emotion: "neutral",
    });
  }

  if (provider === "elevenlabs") {
    return synthesizeSpeechWithElevenLabs({
      text,
      outputDir,
      voiceId: elevenlabsVoiceId || DEFAULT_ELEVENLABS_VOICE,
    });
  }

  try {
    return await synthesizeSpeechWithGemini({
      text,
      outputDir,
      voiceName: geminiVoiceName,
      stylePrompt,
    });
  } catch (error) {
    if (provider === "gemini") {
      throw error;
    }

    return synthesizeSpeechLocally({
      textPath,
      outputDir,
      voice: localVoice,
      rate: localRate,
    });
  }
}

module.exports = {
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
  stripMarkdown,
  splitSentences,
  uniqueSentences,
  countWords,
  synthesizeSpeechWithGemini,
  synthesizeSpeechWithMiniMax,
  synthesizeSpeechWithElevenLabs,
  sanitizeForTTS,
};
