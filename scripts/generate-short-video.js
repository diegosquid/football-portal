#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const matter = require("gray-matter");

const PROJECT_DIR = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(PROJECT_DIR, "content", "articles");
const OUTPUT_ROOT = path.join(PROJECT_DIR, "generated", "shorts");
const DEFAULT_FONT = "/System/Library/Fonts/Helvetica.ttc";
const DEFAULT_VOICE = "Eddy (Portuguese (Brazil))";
const DEFAULT_RATE = "178";
const SITE_NAME = "Beira do Campo";
const SITE_URL = "beiradocampo.com.br";

const MIC_HANDLES = {
  "renato-caldeira": "@renatocaldeira",
  "patricia-mendes": "@patmendes",
  "marcos-vinicius": "@mvsfutebol",
  "neide-ferreira": "@neideferreira",
  "thiago-borges": "@thiagoborges",
};

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    image: null,
    narrationFile: null,
    voice: DEFAULT_VOICE,
    rate: DEFAULT_RATE,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--latest") {
      args.latest = true;
    } else if (token === "--image") {
      args.image = argv[i + 1];
      i += 1;
    } else if (token === "--narration-file") {
      args.narrationFile = argv[i + 1];
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

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status ?? "unknown"}): ${(result.stderr || result.stdout || "").trim()}`
    );
  }

  return result.stdout.trim();
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
    if (seen.has(key)) continue;
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
  const outro = `Quer entender o cenário completo? Veja a matéria completa no site ${SITE_NAME}.`;
  const maxWords = 70;
  const available = maxWords - countWords(outro);
  const chosen = [];

  for (const segment of [excerpt, ...picks]) {
    const candidate = normalizeSentence(segment);
    if (!candidate) continue;
    if (countWords([...chosen, candidate].join(" ")) > available) break;
    chosen.push(candidate);
  }

  const narration = [...chosen, outro].join(" ");
  return normalizeSentence(truncateWords(narration, maxWords));
}

function wrapText(text, lineLength) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > lineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.join("\n");
}

function resolveMicHandle(authorSlug) {
  if (MIC_HANDLES[authorSlug]) return MIC_HANDLES[authorSlug];
  return `@${String(authorSlug || "reporter").replace(/[^a-z0-9]+/gi, "")}`;
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

function getAudioDuration(audioPath) {
  const output = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ]);

  const duration = Number.parseFloat(output);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read audio duration from ${audioPath}`);
  }
  return duration;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createRenderFiles(article, outputDir, narration) {
  const title = wrapText(String(article.data.title || ""), 26);
  const excerpt = wrapText(String(article.data.excerpt || ""), 42);
  const mic = `MIC ${resolveMicHandle(String(article.data.author || ""))}`;
  const cta = wrapText(`Leia a matéria completa em ${SITE_URL}`, 30);

  const files = {
    title: path.join(outputDir, "overlay-title.txt"),
    excerpt: path.join(outputDir, "overlay-excerpt.txt"),
    mic: path.join(outputDir, "overlay-mic.txt"),
    cta: path.join(outputDir, "overlay-cta.txt"),
    narration: path.join(outputDir, "narration.txt"),
  };

  fs.writeFileSync(files.title, title);
  fs.writeFileSync(files.excerpt, excerpt);
  fs.writeFileSync(files.mic, mic);
  fs.writeFileSync(files.cta, cta);
  fs.writeFileSync(files.narration, narration);

  return files;
}

function renderVideo({ imagePath, audioPath, outputPath, overlayFiles, duration }) {
  const frames = Math.max(1, Math.ceil(duration * 25));
  const font = fs.existsSync(DEFAULT_FONT) ? DEFAULT_FONT : "/System/Library/Fonts/Supplemental/Arial.ttf";

  const filter = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.00035,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=25,boxblur=20:8[bg]`,
    `[0:v]scale=920:1200:force_original_aspect_ratio=decrease,pad=920:1200:(ow-iw)/2:(oh-ih)/2:color=0x11111100,zoompan=z='min(zoom+0.00045,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=920x1200:fps=25[fg]`,
    `[bg][fg]overlay=(W-w)/2:320:shortest=1,drawbox=x=0:y=0:w=iw:h=265:color=black@0.44:t=fill,drawbox=x=54:y=1380:w=972:h=180:color=black@0.38:t=fill,drawbox=x=54:y=1582:w=972:h=235:color=black@0.56:t=fill,drawtext=fontfile=${font}:textfile='${overlayFiles.title}':fontcolor=white:fontsize=62:line_spacing=14:x=60:y=70,drawtext=fontfile=${font}:textfile='${overlayFiles.excerpt}':fontcolor=white@0.92:fontsize=34:line_spacing=10:x=60:y=1410,drawtext=fontfile=${font}:textfile='${overlayFiles.mic}':fontcolor=white:fontsize=36:x=60:y=1618,drawtext=fontfile=${font}:text='Resumo jornalistico':fontcolor=0x93c5fd:fontsize=28:x=60:y=1668,drawtext=fontfile=${font}:textfile='${overlayFiles.cta}':fontcolor=0xfacc15:fontsize=34:line_spacing=10:x=60:y=1718,format=yuv420p[v]`,
  ].join(";");

  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-framerate",
    "25",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-shortest",
    outputPath,
  ]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug || (args.latest ? getLatestArticleSlug() : getLatestArticleSlug());
  const article = loadArticle(slug);
  const outputDir = path.join(OUTPUT_ROOT, slug);
  ensureDir(outputDir);

  const imagePath = resolveImage(article, outputDir, args.image);
  const narration = args.narrationFile
    ? fs.readFileSync(path.resolve(args.narrationFile), "utf8").trim()
    : buildNarration(article);
  const overlayFiles = createRenderFiles(article, outputDir, narration);
  const audioPath = path.join(outputDir, "narration.aiff");
  const videoPath = path.join(outputDir, `${slug}-short.mp4`);
  const manifestPath = path.join(outputDir, "manifest.json");

  run("say", [
    "-v",
    args.voice,
    "-r",
    String(args.rate),
    "-f",
    overlayFiles.narration,
    "-o",
    audioPath,
  ]);

  const duration = getAudioDuration(audioPath);

  renderVideo({
    imagePath,
    audioPath,
    outputPath: videoPath,
    overlayFiles,
    duration,
  });

  const manifest = {
    slug,
    articlePath: article.path,
    imagePath,
    audioPath,
    videoPath,
    voice: args.voice,
    rate: Number(args.rate),
    durationSeconds: Number(duration.toFixed(2)),
    narration,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify(manifest, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
