import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

/* ── Tipos ─────────────────────────────────────────── */

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  // snake_case variant (some API versions)
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: { message: string; code: number };
}

/* ── Config ─────────────────────────────────────────── */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-image-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/* ── POST /api/images/generate ─────────────────────── */

/**
 * POST /api/images/generate
 *
 * Body (JSON):
 * {
 *   "prompt": "Descrição detalhada da imagem desejada",
 *   "slug": "nome-do-artigo" (usado como nome do arquivo no R2),
 *   "aspectRatio": "16:9" (opcional, default "16:9")
 * }
 *
 * Retorna:
 * {
 *   "url": "https://pub-xxx.r2.dev/articles/nome-do-artigo.png",
 *   "prompt": "prompt usado",
 *   "source": "gemini"
 * }
 */
export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no .env.local" },
      { status: 500 }
    );
  }

  let body: { prompt?: string; slug?: string; aspectRatio?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido. Envie JSON com { prompt, slug }." },
      { status: 400 }
    );
  }

  const { prompt, slug } = body;

  if (!prompt || !slug) {
    return NextResponse.json(
      { error: "Campos 'prompt' e 'slug' são obrigatórios." },
      { status: 400 }
    );
  }

  /* ── Gerar imagem com Gemini ───────────────────────── */

  const systemPrompt = [
    "You are a creative image generator for a Brazilian football news portal.",
    "Generate a unique, visually striking editorial illustration for a news article.",
    "STYLE GUIDELINES:",
    "- Vary the visual approach: use cinematic compositions, creative angles, dramatic close-ups, artistic lighting, aerial views, silhouettes, or abstract sports concepts.",
    "- DO NOT default to a generic football field or stadium — be creative and specific to the article topic.",
    "- For transfer news: show the player, city skyline, airport, or symbolic imagery.",
    "- For tactical analysis: use bird's-eye formations, chalkboard style, or dynamic player movements.",
    "- For opinion pieces: use expressive, editorial-style illustrations with mood and emotion.",
    "- For match previews: show the rivalry, fans, iconic stadium details, or face-off compositions.",
    "- For match results: show celebration, dejection, key moments, or dramatic action shots.",
    "- Use rich, vibrant colors and professional sports photography or editorial illustration style.",
    "IMPORTANT: Do NOT include any text, watermarks, logos, or written words in the image.",
  ].join(" ");

  const geminiPayload = {
    contents: [
      {
        parts: [{ text: `${systemPrompt}\n\nGenerate an image: ${prompt}` }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  try {
    console.log(`[images/generate] Gerando imagem para: ${slug}`);
    console.log(`[images/generate] Prompt: ${prompt.slice(0, 100)}...`);

    const geminiRes = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error(`[images/generate] Gemini ${geminiRes.status}: ${errText}`);
      return NextResponse.json(
        {
          error: `Gemini API retornou ${geminiRes.status}`,
          details: errText,
        },
        { status: 502 }
      );
    }

    const data: GeminiResponse = await geminiRes.json();

    /* ── Extrair imagem do response ─────────────────── */

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "Resposta do Gemini sem conteúdo", raw: data },
        { status: 502 }
      );
    }

    // Gemini retorna camelCase (inlineData) ou snake_case (inline_data)
    const imagePart = parts.find(
      (p) =>
        p.inlineData?.mimeType?.startsWith("image/") ||
        p.inline_data?.mime_type?.startsWith("image/")
    );

    const imageData = imagePart?.inlineData || imagePart?.inline_data;
    const imageMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type;
    const imageBase64 = imageData?.data;

    if (!imageBase64 || !imageMime) {
      const textPart = parts.find((p) => p.text);
      return NextResponse.json(
        {
          error: "Gemini não retornou imagem",
          geminiText: textPart?.text || "Sem resposta",
          partKeys: parts.map((p) => Object.keys(p)),
        },
        { status: 422 }
      );
    }

    /* ── Upload para R2 ─────────────────────────────── */

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const mimeType = imageMime;
    const ext = mimeType === "image/jpeg" ? "jpg" : "png";
    const key = `articles/${slug}.${ext}`;

    console.log(
      `[images/generate] Upload para R2: ${key} (${(imageBuffer.length / 1024).toFixed(0)}KB)`
    );

    const publicUrl = await uploadToR2(key, imageBuffer, mimeType);

    console.log(`[images/generate] Sucesso: ${publicUrl}`);

    return NextResponse.json({
      url: publicUrl,
      key,
      prompt,
      source: "gemini",
      size: imageBuffer.length,
    });
  } catch (error) {
    console.error("[images/generate] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno na geração de imagem", details: String(error) },
      { status: 500 }
    );
  }
}

/* ── GET /api/images/generate?test=true ──────────── */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("test") !== "true") {
    return NextResponse.json({
      info: "POST /api/images/generate — Gera imagem com IA e hospeda no R2.",
      usage: {
        method: "POST",
        body: { prompt: "descrição da imagem", slug: "nome-do-artigo" },
      },
      test: "GET /api/images/generate?test=true — Testa conexão com Gemini e R2.",
    });
  }

  /* ── Teste de diagnóstico ─────────────────────────── */

  const results: Record<string, unknown> = {};

  // 1. Testar Gemini
  if (!GEMINI_API_KEY) {
    results.gemini = { status: "error", message: "GEMINI_API_KEY não configurada" };
  } else {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
      );
      results.gemini = {
        status: res.ok ? "ok" : "error",
        httpStatus: res.status,
        message: res.ok ? "API key válida" : "API key inválida ou sem permissão",
      };
    } catch (err) {
      results.gemini = { status: "network_error", message: String(err) };
    }
  }

  // 2. Testar R2
  const r2Vars = {
    CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "(not set)",
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "(not set)",
  };

  const allR2Set = r2Vars.CLOUDFLARE_ACCOUNT_ID && r2Vars.R2_ACCESS_KEY_ID && r2Vars.R2_SECRET_ACCESS_KEY;
  results.r2 = {
    status: allR2Set ? "ok" : "missing_vars",
    vars: r2Vars,
  };

  // 3. Teste real: upload de 1x1 pixel transparente
  if (allR2Set) {
    try {
      // PNG 1x1 transparente (67 bytes)
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      const testUrl = await uploadToR2("_test/pixel.png", pixel, "image/png");
      results.r2Upload = { status: "ok", url: testUrl };
    } catch (err) {
      results.r2Upload = { status: "error", message: String(err) };
    }
  }

  return NextResponse.json(results);
}
