import { NextResponse } from "next/server";
import { getFallbackImage } from "@/lib/images";

interface UnsplashPhoto {
  urls: {
    raw: string;
  };
  user: {
    name: string;
  };
  description: string | null;
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/**
 * GET /api/images/search?q=futebol+estadio&category=brasileirao
 *
 * Busca imagens na Unsplash API e retorna uma URL estável.
 * Se a API key não estiver configurada ou a busca não retornar resultado,
 * retorna uma imagem do banco de fallbacks por categoria.
 *
 * O cron job usa esta rota para obter imagens reais e verificadas.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category") || undefined;

  if (!query) {
    return NextResponse.json(
      { error: "Parâmetro 'q' é obrigatório." },
      { status: 400 }
    );
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  // Se não tem API key, retorna fallback direto
  if (!accessKey) {
    const fallback = getFallbackImage(category);
    return NextResponse.json({
      url: fallback,
      caption: `Imagem ilustrativa — ${query}`,
      photographer: "Unsplash",
      source: "fallback",
    });
  }

  try {
    const searchUrl = new URL("https://api.unsplash.com/search/photos");
    searchUrl.searchParams.set("query", `${query} football soccer`);
    searchUrl.searchParams.set("per_page", "5");
    searchUrl.searchParams.set("orientation", "landscape");
    searchUrl.searchParams.set("content_filter", "high");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      next: { revalidate: 3600 }, // cache 1 hora
    });

    if (!response.ok) {
      console.error(
        `Unsplash API error: ${response.status} ${response.statusText}`
      );
      const fallback = getFallbackImage(category);
      return NextResponse.json({
        url: fallback,
        caption: `Imagem ilustrativa — ${query}`,
        photographer: "Unsplash",
        source: "fallback",
      });
    }

    const data: UnsplashSearchResponse = await response.json();

    if (data.results.length === 0) {
      const fallback = getFallbackImage(category);
      return NextResponse.json({
        url: fallback,
        caption: `Imagem ilustrativa — ${query}`,
        photographer: "Unsplash",
        source: "fallback",
      });
    }

    // Pega a primeira imagem relevante
    const photo = data.results[0];
    const imageUrl = `${photo.urls.raw}&w=800&h=450&fit=crop&q=80`;
    const caption =
      photo.description ||
      photo.alt_description ||
      `Imagem ilustrativa — ${query}`;

    return NextResponse.json({
      url: imageUrl,
      caption,
      photographer: photo.user.name,
      source: "unsplash",
    });
  } catch (error) {
    console.error("Image search error:", error);
    const fallback = getFallbackImage(category);
    return NextResponse.json({
      url: fallback,
      caption: `Imagem ilustrativa — ${query}`,
      photographer: "Unsplash",
      source: "fallback",
    });
  }
}
