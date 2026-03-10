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

function buildNarration(article) {
  const excerpt = stripMarkdown(String(article.data.excerpt || "").trim());
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

  const outro =
    "Quer entender o cenário completo? Veja a matéria completa no site. Para mais notícias de futebol, siga este canal.";
  const maxWords = 82;
  const available = maxWords - countWords(outro);
  const chosen = [];

  for (const segment of [excerpt, ...picks]) {
    const candidate = normalizeSentence(segment);
    if (!candidate) continue;
    if (countWords([...chosen, candidate].join(" ")) > available) break;
    chosen.push(candidate);
  }

  return normalizeSentence(truncateWords([...chosen, outro].join(" "), maxWords));
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
    run("curl", ["-L", "--fail", "--silent", "--show-error", image, "-o", downloadPath]);
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

async function synthesizeNarration({
  text,
  textPath,
  outputDir,
  provider = "auto",
  geminiVoiceName,
  localVoice,
  localRate,
}) {
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
};
