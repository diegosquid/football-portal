#!/usr/bin/env node

/**
 * Daily Recap Short — "Resumo do Dia"
 *
 * Gera um short vertical (1080x1920) com o resumo de todas as matérias do dia.
 * Cada matéria vira um card com foto + título + categoria + efeitos visuais.
 *
 * Usage:
 *   node scripts/render-daily-recap.js [--date YYYY-MM-DD] [--skip-tts] [--tts minimax|gemini]
 *
 * Exemplos:
 *   node scripts/render-daily-recap.js                    # artigos de hoje
 *   node scripts/render-daily-recap.js --date 2026-03-19  # data específica
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const {
  PROJECT_DIR,
  SITE_NAME,
  SITE_URL,
  ensureDir,
  run,
  loadArticle,
  resolveImage,
  getMediaDuration,
  copyFile,
  synthesizeSpeechWithMiniMax,
  synthesizeSpeechWithGemini,
  sanitizeForTTS,
  countWords,
  stripMarkdown,
} = require("./lib/short-video-data");

const {analyzeEmotions} = require("./lib/minimax-emotions");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

const FPS = 30;
const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "daily-recaps");
const ARTICLES_DIR = path.join(PROJECT_DIR, "content", "articles");

const INTRO_FRAMES = 90; // 3s
const OUTRO_FRAMES = 72; // 2.4s
const ITEM_DURATION_FRAMES = 180; // 6s per item
const GAP_BETWEEN_ITEMS_FRAMES = 0; // crossfade handled in composition

const MINIMAX_VOICES = {
  Fernanda: process.env.MINIMAX_VOICE_FERNANDA || "Portuguese_LovelyLady",
};

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// ─────────────────────────────────────────────────────────
// Parse CLI args
// ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    date: null,
    skipTts: false,
    ttsProvider: "minimax",
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--date") {
      args.date = argv[++i];
    } else if (token === "--skip-tts") {
      args.skipTts = true;
    } else if (token === "--tts") {
      args.ttsProvider = argv[++i];
    }
  }
  return args;
}

// ─────────────────────────────────────────────────────────
// Listar artigos do dia
// ─────────────────────────────────────────────────────────
function getArticlesForDate(dateStr) {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));
  const articles = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const {data, content} = matter(raw);
    const articleDate = String(data.date || "").split("T")[0];
    if (articleDate === dateStr && !data.draft) {
      articles.push({
        path: path.join(ARTICLES_DIR, file),
        slug: String(data.slug || file.replace(/\.mdx$/, "")),
        data,
        body: content,
      });
    }
  }

  // Ordenar por data (mais antigo primeiro)
  articles.sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)));
  return articles;
}

// ─────────────────────────────────────────────────────────
// Curadoria: Gemini analisa e sintetiza matérias do dia
// (ex: pré-jogo + pós-jogo = só resultado)
// ─────────────────────────────────────────────────────────
async function curateArticles(articles) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const summaries = articles.map((a, i) => {
    const text = stripMarkdown(a.body).slice(0, 400);
    return `INDEX ${i}: [slug: ${a.slug}] "${a.data.title}" (categoria: ${a.data.category}, times: ${(a.data.teams || []).join(", ")})\n   ${text}`;
  });

  const systemPrompt = `Voce eh um editor-chefe de um canal esportivo brasileiro.
Sua tarefa: analisar as materias publicadas HOJE e decidir quais sao RELEVANTES para o resumo do dia,
eliminando redundancias e agrupando materias sobre o mesmo assunto.

REGRAS DE CURADORIA:
1. Se tem pre-jogo E pos-jogo do MESMO jogo: mantenha APENAS o pos-jogo (resultado eh mais relevante que previa)
2. Se tem noticia de transferencia e radar de transferencias cobrindo os mesmos jogadores: mantenha apenas uma
3. Se tem materias muito parecidas (mesmo time, mesmo tema): agrupe e mantenha a mais completa
4. PRIORIZE: resultados de jogos > polemicas > analises > transferencias > previas de jogos futuros
5. Mantenha entre 3-6 materias no maximo (ideal para short de 30-50 segundos)
6. Retorne a ORDEM que devem aparecer no video (mais impactante primeiro)
7. Use os indices EXATOS (0-based) mostrados como "INDEX N" antes de cada materia. Indices validos: 0 a ${articles.length - 1}

Responda APENAS com JSON valido, sem markdown, sem backticks.
O campo "reason" deve ter NO MAXIMO 10 palavras.
{"selected": [2, 0, 4], "reason": "removido pre-jogo duplicado"}`;

  const userPrompt = `Materias de hoje (${articles.length} total):\n\n${summaries.join("\n\n")}`;

  console.log("  🧠 Analisando matérias com IA (curadoria)...");

  const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: `${systemPrompt}\n\n${userPrompt}`}]}],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    console.log("  ⚠️  Curadoria falhou, usando todas as matérias");
    return {selected: articles.map((_, i) => i), reason: "fallback — sem curadoria"};
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  if (!textPart) {
    return {selected: articles.map((_, i) => i), reason: "fallback — resposta vazia"};
  }

  try {
    let raw = textPart.text.trim();
    if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      // JSON truncado — tentar extrair o array "selected" via regex
      const match = raw.match(/"selected"\s*:\s*\[([0-9,\s]+)\]/);
      if (match) {
        const indices = match[1].split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        result = {selected: indices, reason: "parsed from truncated JSON"};
      } else {
        console.log(`  ⚠️  Não consegui parsear: ${raw.slice(0, 200)}`);
        return {selected: articles.map((_, i) => i), reason: "fallback — parse error"};
      }
    }

    if (!Array.isArray(result.selected) || result.selected.length === 0) {
      return {selected: articles.map((_, i) => i), reason: "fallback — formato inválido"};
    }
    // Validar índices
    const valid = result.selected.filter((i) => i >= 0 && i < articles.length);
    return {selected: valid, reason: result.reason || ""};
  } catch (err) {
    console.log(`  ⚠️  Erro: ${err.message}`);
    return {selected: articles.map((_, i) => i), reason: "fallback — erro"};
  }
}

// ─────────────────────────────────────────────────────────
// Gerar narração via Gemini (estilo âncora esportiva)
// ─────────────────────────────────────────────────────────
async function generateRecapNarration(articles) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const summaries = articles.map((a, i) => {
    const text = stripMarkdown(a.body).slice(0, 500);
    return `${i + 1}. "${a.data.title}" (${a.data.category}): ${text}`;
  });

  const systemPrompt = `Voce eh uma ancora esportiva brasileira do canal "Beira do Campo".
Escreva uma NARRACAO CURTA em formato de plantao esportivo resumindo as materias do dia.
As materias ja foram curadas — cada uma eh relevante e unica, nao ha redundancias.

REGRAS:
- Comece com "Fala, galera! Aqui eh o resumo do dia no Beira do Campo."
- Para cada materia, escreva 1-2 frases impactantes resumindo a noticia
- Use linguagem coloquial mas profissional (estilo SporTV/ESPN)
- Conecte as materias com transicoes naturais ("Alem disso", "E olha so", "Pra fechar")
- Termine com "Isso eh o Beira do Campo de hoje. Ate amanha!"
- Total: ${articles.length * 25 + 30} palavras no maximo
- IMPORTANTE: quando houver "x" entre times, use "versus" ou "contra"
- NUNCA use R$ — sempre escreva o valor por extenso (ex: "3 milhoes de reais")
- NAO use asteriscos, parenteses ou emojis
- Voce PODE usar interjeicoes naturais: (laughs), (sighs), (gasps) — maximo 2 no total`;

  const userPrompt = `Materias de hoje:\n${summaries.join("\n\n")}`;

  console.log("  📝 Gerando narração do resumo com Gemini...");

  const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: `${systemPrompt}\n\n${userPrompt}`}]}],
      generationConfig: {temperature: 0.7, maxOutputTokens: 2048},
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Gemini failed (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  if (!textPart) throw new Error("Gemini returned no text");

  return textPart.text.trim();
}

// ─────────────────────────────────────────────────────────
// Sintetizar TTS com emoções por trecho
// ─────────────────────────────────────────────────────────
async function synthesizeRecapAudio({narrationText, outputDir, ttsProvider = "minimax"}) {
  ensureDir(outputDir);
  const isMiniMax = ttsProvider === "minimax";

  // Dividir narração em frases para TTS com emoções
  const sentences = narrationText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 3);

  // Montar "turns" fake para analyzeEmotions
  const turns = sentences.map((text) => ({speaker: "Fernanda", text}));

  // Analisar emoções
  let enrichedTurns = turns;
  if (isMiniMax) {
    try {
      const enriched = await analyzeEmotions(turns);
      for (const e of enriched) {
        if (e.index < turns.length) {
          turns[e.index].emotion = e.emotion;
          turns[e.index].textWithTags = e.textWithTags;
        }
      }
      enrichedTurns = turns;
    } catch (err) {
      console.log(`  ⚠️  Emotion analysis failed: ${err.message}`);
    }
  }

  // Sintetizar tudo em um bloco (mais natural que frase por frase)
  const fullText = enrichedTurns
    .map((t) => sanitizeForTTS(t.textWithTags || t.text))
    .join(" ");

  // Usar emoção dominante
  const emotions = enrichedTurns.map((t) => t.emotion || "neutral");
  const emotionCounts = {};
  for (const e of emotions) emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

  console.log(`  🎭 Emoção dominante: ${dominantEmotion}`);
  console.log(`  📊 Distribuição: ${JSON.stringify(emotionCounts)}`);

  const voiceId = MINIMAX_VOICES.Fernanda;

  if (isMiniMax) {
    console.log(`  🎙️  TTS MiniMax (${voiceId}) [${dominantEmotion}]: ${countWords(fullText)} palavras`);
    const result = await synthesizeSpeechWithMiniMax({
      text: fullText,
      outputDir,
      voiceId,
      speed: 1.0,
      emotion: dominantEmotion,
    });
    return result;
  }

  // Fallback Gemini
  console.log(`  🎙️  TTS Gemini: ${countWords(fullText)} palavras`);
  const result = await synthesizeSpeechWithGemini({
    text: fullText,
    outputDir,
    voiceName: "Kore",
    stylePrompt: "Leia em portugues do Brasil, com tom de ancora esportivo, firme e natural.",
  });
  return result;
}

// ─────────────────────────────────────────────────────────
// Formatar data em português
// ─────────────────────────────────────────────────────────
function formatDatePt(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS_PT[month - 1]} de ${year}`;
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Data alvo
  const today = new Date();
  const targetDate = args.date || today.toISOString().split("T")[0];
  const dateLabel = formatDatePt(targetDate);

  const slug = `resumo-do-dia-${targetDate}`;
  const outputDir = path.join(GENERATED_ROOT, slug);
  ensureDir(outputDir);

  console.log(`\n📰 Resumo do Dia: ${dateLabel}`);
  console.log("═".repeat(60));

  // 1. Buscar artigos do dia
  const articles = getArticlesForDate(targetDate);
  if (articles.length === 0) {
    console.log(`❌ Nenhum artigo encontrado para ${targetDate}`);
    process.exit(1);
  }
  console.log(`📄 ${articles.length} artigos encontrados:\n`);
  articles.forEach((a, i) => {
    console.log(`   ${i + 1}. [${a.data.category}] ${a.data.title}`);
  });

  // 2. Curadoria: IA seleciona e ordena matérias relevantes
  const curation = await curateArticles(articles);
  const curatedArticles = curation.selected.map((i) => articles[i]);
  console.log(`\n🧠 Curadoria: ${curatedArticles.length}/${articles.length} matérias selecionadas`);
  console.log(`   Motivo: ${curation.reason}`);
  curatedArticles.forEach((a, i) => {
    console.log(`   ${i + 1}. [${a.data.category}] ${a.data.title}`);
  });

  // Usar artigos curados daqui pra frente
  const finalArticles = curatedArticles;
  console.log();

  // 3. Resolver imagens de cada artigo
  console.log("📸 Resolvendo imagens...");
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  ensureDir(remotionAssetDir);

  const itemImages = [];
  for (let i = 0; i < finalArticles.length; i++) {
    const a = finalArticles[i];
    try {
      const imagePath = resolveImage(a, outputDir);
      const ext = path.extname(imagePath) || ".png";
      const destName = `item-${i}${ext}`;
      copyFile(imagePath, path.join(remotionAssetDir, destName));
      itemImages.push(`renders/${slug}/${destName}`);
      console.log(`   ✅ ${i + 1}. ${a.data.title.slice(0, 50)}...`);
    } catch (err) {
      console.log(`   ⚠️  ${i + 1}. Sem imagem: ${err.message}`);
      itemImages.push(null);
    }
  }

  // 3. Gerar narração
  let narrationText;
  const scriptPath = path.join(outputDir, "narration-script.txt");

  narrationText = await generateRecapNarration(finalArticles);
  fs.writeFileSync(scriptPath, narrationText, "utf8");
  console.log(`\n✅ Narração (${countWords(narrationText)} palavras):`);
  console.log(`   ${narrationText.slice(0, 200)}...`);

  // 4. TTS
  let audioDuration;
  const finalM4a = path.join(outputDir, "narration.m4a");

  if (!args.skipTts) {
    console.log(`\n🔊 Sintetizando TTS [${args.ttsProvider}]...`);
    const ttsResult = await synthesizeRecapAudio({
      narrationText,
      outputDir,
      ttsProvider: args.ttsProvider,
    });
    // Copiar para asset dir do Remotion
    if (ttsResult.m4aPath) {
      copyFile(ttsResult.m4aPath, path.join(remotionAssetDir, "narration.m4a"));
    }
    audioDuration = getMediaDuration(ttsResult.m4aPath || ttsResult.wavPath);
  } else {
    console.log("\n⏩ Pulando TTS (--skip-tts)");
    audioDuration = finalArticles.length * 6 + 5; // estimativa
  }

  console.log(`   ⏱️  Duração do áudio: ${audioDuration.toFixed(1)}s`);

  // 5. Calcular timings
  const totalAudioFrames = Math.ceil(audioDuration * FPS);
  const itemDurationFrames = Math.floor((totalAudioFrames - INTRO_FRAMES) / finalArticles.length);
  const adjustedItemDuration = Math.max(itemDurationFrames, 120); // min 4s per item

  const items = finalArticles.map((a, i) => ({
    title: String(a.data.title || ""),
    category: String(a.data.category || "noticias"),
    imageSrc: itemImages[i],
    startFrame: INTRO_FRAMES + i * adjustedItemDuration,
    durationFrames: adjustedItemDuration,
  }));

  const lastItemEnd = items[items.length - 1].startFrame + items[items.length - 1].durationFrames;
  const durationInFrames = lastItemEnd + OUTRO_FRAMES;

  console.log(`\n⚙️  Timings:`);
  console.log(`   Intro: 0-${INTRO_FRAMES} (${(INTRO_FRAMES / FPS).toFixed(1)}s)`);
  items.forEach((item, i) => {
    const end = item.startFrame + item.durationFrames;
    console.log(`   Item ${i + 1}: ${item.startFrame}-${end} (${(item.durationFrames / FPS).toFixed(1)}s) — ${item.category}`);
  });
  console.log(`   Outro: ${lastItemEnd}-${durationInFrames} (${(OUTRO_FRAMES / FPS).toFixed(1)}s)`);
  console.log(`   Total: ${durationInFrames} frames (${(durationInFrames / FPS).toFixed(1)}s)`);

  // 6. Props
  const props = {
    slug,
    title: "Resumo do Dia",
    date: dateLabel,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    followHandle: "@beiradocampotv",
    audioSrc: `renders/${slug}/narration.m4a`,
    callToAction: "Para mais notícias de futebol, siga o canal",
    items,
    durationInFrames,
    fps: FPS,
  };

  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  // 7. Render Remotion
  const videoPath = path.join(outputDir, `${slug}.mp4`);
  console.log(`\n🎥 Renderizando (${durationInFrames} frames)...`);

  run("npm", [
    "--prefix", VIDEO_STUDIO_DIR,
    "run", "render:article",
    "--",
    "--props-file", propsPath,
    "--composition-id", "DailyRecapShort",
    "--out", videoPath,
  ], {stdio: "inherit"});

  // 8. Manifest
  const manifest = {
    slug,
    date: targetDate,
    dateLabel,
    articleCount: finalArticles.length,
    articles: finalArticles.map((a) => ({slug: a.slug, title: a.data.title, category: a.data.category})),
    videoPath,
    audioDuration,
    durationSeconds: durationInFrames / FPS,
    youtube: {
      title: `📰 Resumo do Dia — ${dateLabel} | Beira do Campo`,
      description: [
        `🎙️ Confira o resumo de ${finalArticles.length} matérias do dia ${dateLabel}:`,
        "",
        ...finalArticles.map((a, i) => `${i + 1}. ${a.data.title}`),
        "",
        `📰 Leia as matérias completas: https://beiradocampo.com.br`,
        "",
        "#futebol #brasileirao #resumododia #beiradocampo #shorts",
      ].join("\n"),
    },
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n📺 YouTube:`);
  console.log(`   Título: ${manifest.youtube.title}`);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ Resumo do Dia gerado!`);
  console.log(`   📁 ${videoPath}`);
  console.log(`   ⏱️  ${(durationInFrames / FPS).toFixed(1)}s`);
  console.log(`   📄 ${finalArticles.length} matérias`);
  console.log("═".repeat(60));
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
