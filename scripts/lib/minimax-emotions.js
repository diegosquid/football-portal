/**
 * MiniMax Emotion Harness
 *
 * Usa Gemini para analisar cada fala do podcast e atribuir:
 * - Emoção adequada (happy, sad, angry, surprised, neutral, etc.)
 * - Interjeições naturais inline: (laughs), (sighs), (gasps), etc.
 * - Pausas dramáticas: <#0.3#> antes de revelações
 *
 * Torna o TTS do MiniMax muito mais expressivo e natural.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

// ---------------------------------------------------------------------------
// Emoções suportadas pelo MiniMax TTS
// ---------------------------------------------------------------------------
const MINIMAX_EMOTIONS = [
  "happy",      // gols, vitórias, comemorações
  "sad",        // derrotas, lesões, despedidas
  "angry",      // polêmicas, injustiças, arbitragem
  "fearful",    // tensão, decisão, risco de rebaixamento
  "disgusted",  // indignação, escândalos
  "surprised",  // viradas, zebras, números chocantes
  "neutral",    // análises, transições, dados
];

// ---------------------------------------------------------------------------
// Interjeições suportadas pelo MiniMax (inseridas inline no texto)
// ---------------------------------------------------------------------------
const MINIMAX_INTERJECTIONS = [
  "(laughs)",        // humor, ironia
  "(sighs)",         // lamento, frustração
  "(gasps)",         // espanto, surpresa
  "(clears throat)", // transição formal
  "(sniffs)",        // emoção contida
  "(groans)",        // desaprovação
];

// ---------------------------------------------------------------------------
// Fallback: mapeamento por palavras-chave esportivas → emoção
// Usado quando o Gemini não está disponível
// ---------------------------------------------------------------------------
const SPORT_KEYWORDS = {
  happy: [
    "gol", "golaço", "vitória", "vitoria", "título", "titulo", "campeão", "campeao",
    "classificação", "classificacao", "festa", "artilheiro", "hat-trick", "goleada",
    "celebração", "comemorando", "alegria", "incrível", "incrivel", "espetacular",
  ],
  sad: [
    "derrota", "rebaixamento", "rebaixado", "lesão", "lesao", "eliminação", "eliminacao",
    "adeus", "despedida", "fracasso", "vexame", "lanterna", "último", "ultimo",
    "tristeza", "lamentável", "lamentavel", "decepção", "decepcao",
  ],
  angry: [
    "polêmica", "polemica", "escândalo", "escandalo", "absurdo", "vergonha",
    "arbitragem", "árbitro", "arbitro", "var", "expulsão", "expulsao",
    "briga", "confusão", "confusao", "revolta", "indignação", "indignacao",
    "injustiça", "injustica", "corrupção", "corrupcao",
  ],
  surprised: [
    "virada", "surpreendente", "surpresa", "zebra", "inesperado",
    "impressionante", "chocante", "ninguém esperava", "ninguem esperava",
    "bizarro", "inacreditável", "inacreditavel", "reviravolta", "bomba",
  ],
  fearful: [
    "tensão", "tensao", "decisivo", "final", "risco", "perigo",
    "rebaixamento", "z4", "zona de rebaixamento", "penalidade", "pênalti",
  ],
};

// ---------------------------------------------------------------------------
// analyzeEmotions — enriquece turns com emoção + tags via Gemini
// ---------------------------------------------------------------------------

async function analyzeEmotions(turns) {
  if (!GEMINI_API_KEY) {
    console.log("  ⚠️  GEMINI_API_KEY ausente — usando fallback de keywords para emoções");
    return fallbackEmotions(turns);
  }

  const turnsForPrompt = turns.map((t, i) => ({
    index: i,
    speaker: t.speaker,
    text: t.text,
  }));

  const systemPrompt = `Voce eh um diretor de audio de podcast esportivo brasileiro.
Sua tarefa: analisar cada fala do dialogo e atribuir a EMOCAO mais adequada para o TTS,
alem de inserir INTERJEICOES e PAUSAS naturais no texto.

EMOCOES disponiveis (escolha UMA por fala):
- "happy" — gols, vitorias, comemoracoes, momentos positivos
- "sad" — derrotas, lesoes, despedidas, momentos tristes
- "angry" — polemicas, arbitragem, injusticas, indignacao
- "surprised" — viradas, zebras, numeros chocantes, revelacoes
- "fearful" — tensao, decisao, risco, situacao critica
- "neutral" — analises, transicoes, apresentacoes, dados frios

INTERJEICOES que voce pode inserir NO TEXTO (use com moderacao, 2-4 no dialogo todo):
- (laughs) — humor, ironia leve
- (sighs) — lamento, frustracoes
- (gasps) — espanto, surpresa grande

PAUSAS DRAMATICAS (use com moderacao, 2-3 no dialogo todo):
- <#0.3#> — pausa curta antes de dados impactantes ou revelacoes
- <#0.5#> — pausa mais longa para momento dramatico

REGRAS CRITICAS:
1. NAO altere o conteudo/significado do texto — apenas insira tags e escolha emocao. Excecao: se houver "R$" no texto, substitua por valor por extenso (ex: "R$ 3,4 milhoes" → "3,4 milhoes de reais")
2. Interjeicoes vao NO INICIO ou NO MEIO da fala, nunca no final
3. Pausas vao ANTES de numeros ou revelacoes impactantes
4. A primeira fala (abertura) normalmente eh "neutral" ou "happy"
5. A ultima fala (encerramento) normalmente eh "happy" ou "neutral"
6. Varie as emocoes! Nao repita a mesma emocao em mais de 3 falas seguidas
7. O Ricardo tende a ser mais analitico (neutral/angry), a Fernanda mais expressiva (happy/surprised)
8. Se a fala for uma transicao simples ("Exatamente, Ricardo"), use "neutral"

Responda APENAS com JSON valido, sem markdown, sem backticks. Array de objetos:
[{"index": 0, "emotion": "neutral", "textWithTags": "texto original com tags inseridas"}]`;

  const userPrompt = `Falas do dialogo:\n${JSON.stringify(turnsForPrompt, null, 2)}`;

  console.log("  🎭 Analisando emoções de cada fala com Gemini...");

  try {
    const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          temperature: 0.4, // mais determinístico para anotações
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.log(`  ⚠️  Gemini emotions failed (${response.status}): ${errText.slice(0, 200)}`);
      return fallbackEmotions(turns);
    }

    const data = await response.json();
    const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
    if (!textPart) {
      console.log("  ⚠️  Gemini retornou vazio para emoções — usando fallback");
      return fallbackEmotions(turns);
    }

    // Parsear JSON (pode vir com backticks às vezes)
    let raw = textPart.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const enriched = JSON.parse(raw);

    // Validar resultado
    if (!Array.isArray(enriched) || enriched.length === 0) {
      console.log("  ⚠️  Gemini retornou formato inválido — usando fallback");
      return fallbackEmotions(turns);
    }

    // Validar cada item
    const validated = enriched.map((item, i) => {
      const emotion = MINIMAX_EMOTIONS.includes(item.emotion) ? item.emotion : "neutral";
      const textWithTags = typeof item.textWithTags === "string" && item.textWithTags.length > 0
        ? item.textWithTags
        : turns[item.index || i]?.text || "";

      return {
        index: item.index ?? i,
        emotion,
        textWithTags,
      };
    });

    // Log resumo
    const emotionSummary = validated.map((v) => `${turns[v.index]?.speaker}:${v.emotion}`).join(", ");
    console.log(`  🎭 Emoções atribuídas: ${emotionSummary}`);

    return validated;
  } catch (err) {
    console.log(`  ⚠️  Erro ao analisar emoções: ${err.message} — usando fallback`);
    return fallbackEmotions(turns);
  }
}

// ---------------------------------------------------------------------------
// Fallback: emoção por palavras-chave no texto
// ---------------------------------------------------------------------------

function fallbackEmotions(turns) {
  console.log("  🔄 Usando fallback de keywords para emoções...");

  const results = turns.map((turn, i) => {
    const lower = turn.text.toLowerCase();
    let bestEmotion = "neutral";
    let bestScore = 0;

    for (const [emotion, keywords] of Object.entries(SPORT_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestEmotion = emotion;
      }
    }

    // Primeira e última fala: preferir neutral/happy
    if (i === 0 && bestScore < 2) bestEmotion = "neutral";
    if (i === turns.length - 1 && bestScore < 2) bestEmotion = "happy";

    return {
      index: i,
      emotion: bestEmotion,
      textWithTags: turn.text, // sem tags no fallback
    };
  });

  const emotionSummary = results.map((r) => `${turns[r.index]?.speaker}:${r.emotion}`).join(", ");
  console.log(`  🔄 Emoções (fallback): ${emotionSummary}`);

  return results;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  MINIMAX_EMOTIONS,
  MINIMAX_INTERJECTIONS,
  SPORT_KEYWORDS,
  analyzeEmotions,
  fallbackEmotions,
};
