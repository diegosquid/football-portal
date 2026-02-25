import { NextResponse } from "next/server";
import { getFallbackImage } from "@/lib/images";

/* ── Tipos ─────────────────────────────────────────── */

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    regular: string;
    small: string;
  };
  user: {
    name: string;
    links: { html: string };
  };
  links: {
    download_location: string;
  };
  description: string | null;
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/* ── Rate-limit tracking (in-memory, per instance) ── */

let rateLimitRemaining = 50;
let rateLimitResetAt = 0; // timestamp ms

function updateRateLimit(headers: Headers) {
  const remaining = headers.get("X-Ratelimit-Remaining");
  if (remaining !== null) rateLimitRemaining = parseInt(remaining, 10);

  // Unsplash reseta a cada hora
  rateLimitResetAt = Date.now() + 60 * 60 * 1000;
}

function isRateLimited(): boolean {
  // Se já passou o reset, libera
  if (Date.now() > rateLimitResetAt) {
    rateLimitRemaining = 50;
    return false;
  }
  return rateLimitRemaining <= 2; // guarda margem de 2
}

/* ── In-memory cache (evita gastar cota repetindo buscas) ── */

const cache = new Map<string, { data: ReturnType<typeof buildResponse>; ts: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: ReturnType<typeof buildResponse>) {
  // Limita cache a 200 entradas pra não estourar memória
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

/* ── Helper ─────────────────────────────────────────── */

function buildResponse(
  url: string,
  caption: string,
  photographer: string,
  source: "unsplash" | "fallback",
  extra?: { photographerUrl?: string; unsplashId?: string }
) {
  return {
    url,
    caption,
    photographer,
    source,
    ...(extra?.photographerUrl && { photographerUrl: extra.photographerUrl }),
    ...(extra?.unsplashId && { unsplashId: extra.unsplashId }),
  };
}

function buildFallbackResponse(query: string, category?: string) {
  const fallback = getFallbackImage(category);
  return buildResponse(
    fallback,
    `Imagem ilustrativa — ${query}`,
    "Unsplash",
    "fallback"
  );
}

/* ── Trigger download (Unsplash guideline compliance) ── */

async function triggerDownload(downloadLocation: string, accessKey: string) {
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
  } catch {
    // silently fail — not critical
  }
}

/* ── GET /api/images/search ────────────────────────── */

/**
 * GET /api/images/search?q=futebol+estadio&category=brasileirao
 *
 * Busca imagens na Unsplash API e retorna uma URL estável.
 * Se a API key não estiver configurada, busca falhar, ou rate limit
 * estourar, retorna imagem do banco de fallbacks por categoria.
 *
 * Rate limit: 50 req/hora (Demo). Resultados cacheados 4h em memória.
 *
 * GET /api/images/search?test=true
 *   → Endpoint de diagnóstico: testa se a API key funciona.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  /* ── Modo teste / diagnóstico ─────────────────────── */
  if (searchParams.get("test") === "true") {
    if (!accessKey) {
      return NextResponse.json({
        status: "no_key",
        message: "UNSPLASH_ACCESS_KEY não está configurada no .env.local",
        keyLength: 0,
        rateLimitRemaining,
      });
    }

    try {
      const res = await fetch(
        "https://api.unsplash.com/photos/random?count=1&query=football",
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );

      const body = await res.text();
      updateRateLimit(res.headers);

      if (res.ok) {
        return NextResponse.json({
          status: "ok",
          message: "API key válida! Unsplash funcionando.",
          httpStatus: res.status,
          rateLimitRemaining,
          keyPreview: `${accessKey.slice(0, 6)}...${accessKey.slice(-4)}`,
          keyLength: accessKey.length,
          keyChars: [...accessKey].map((c) => `${c}(${c.charCodeAt(0)})`).join(""),
        });
      } else {
        return NextResponse.json({
          status: "error",
          message: "API key inválida ou app não aprovado no Unsplash.",
          httpStatus: res.status,
          unsplashError: body,
          keyPreview: `${accessKey.slice(0, 6)}...${accessKey.slice(-4)}`,
          keyLength: accessKey.length,
          keyChars: [...accessKey].map((c) => `${c}(${c.charCodeAt(0)})`).join(""),
          help: [
            "1. Acesse https://unsplash.com/oauth/applications",
            "2. Clique no seu app (ID 882551)",
            "3. Verifique se o app está ativo e não 'Suspended'",
            "4. Copie a Access Key novamente (cuidado com copy/paste)",
            "5. Cole no .env.local como UNSPLASH_ACCESS_KEY=sua_key",
            "6. Reinicie o dev server (npm run dev)",
          ],
        });
      }
    } catch (error) {
      return NextResponse.json({
        status: "network_error",
        message: "Não conseguiu conectar na Unsplash API",
        error: String(error),
      });
    }
  }

  /* ── Busca normal ─────────────────────────────────── */
  const query = searchParams.get("q");
  const category = searchParams.get("category") || undefined;

  if (!query) {
    return NextResponse.json(
      { error: "Parâmetro 'q' é obrigatório. Use ?test=true para diagnóstico." },
      { status: 400 }
    );
  }

  // Sem API key → fallback direto
  if (!accessKey) {
    return NextResponse.json(buildFallbackResponse(query, category));
  }

  // Rate limited → fallback pra não perder cota
  if (isRateLimited()) {
    console.warn(
      `[images] Rate limited (${rateLimitRemaining} remaining). Usando fallback.`
    );
    return NextResponse.json(buildFallbackResponse(query, category));
  }

  // Checa cache primeiro
  const cacheKey = `${query}:${category || "generic"}`.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const searchUrl = new URL("https://api.unsplash.com/search/photos");
    searchUrl.searchParams.set("query", `${query} futebol`);
    searchUrl.searchParams.set("per_page", "5");
    searchUrl.searchParams.set("orientation", "landscape");
    searchUrl.searchParams.set("content_filter", "high");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      next: { revalidate: 3600 },
    });

    // Atualiza rate limit tracking
    updateRateLimit(response.headers);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        `[images] Unsplash ${response.status}: ${errorBody}`
      );
      return NextResponse.json(buildFallbackResponse(query, category));
    }

    const data: UnsplashSearchResponse = await response.json();

    if (data.results.length === 0) {
      const result = buildFallbackResponse(query, category);
      setCache(cacheKey, result);
      return NextResponse.json(result);
    }

    // Escolhe foto randomicamente entre as top 5 (mais variedade)
    const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5));
    const photo = data.results[randomIndex];
    const imageUrl = `${photo.urls.raw}&w=800&h=450&fit=crop&q=80`;
    const caption =
      photo.description ||
      photo.alt_description ||
      `Imagem ilustrativa — ${query}`;

    // Unsplash API guidelines: trigger download endpoint
    triggerDownload(photo.links.download_location, accessKey);

    const result = buildResponse(imageUrl, caption, photo.user.name, "unsplash", {
      photographerUrl: photo.user.links.html,
      unsplashId: photo.id,
    });

    setCache(cacheKey, result);
    return NextResponse.json({ ...result, rateLimitRemaining });
  } catch (error) {
    console.error("[images] Search error:", error);
    return NextResponse.json(buildFallbackResponse(query, category));
  }
}
