import { siteConfig } from "@/lib/site";
import { buildAtom, getFeedArticles } from "@/lib/feeds";

export const revalidate = 3600;

export async function GET() {
  const xml = buildAtom({
    title: `${siteConfig.name} — Notícias de Futebol`,
    description: siteConfig.description,
    feedUrl: `${siteConfig.url}/atom.xml`,
    pageUrl: siteConfig.url,
    articles: getFeedArticles(),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
