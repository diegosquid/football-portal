import { siteConfig } from "@/lib/site";
import { buildAtom, getFeedArticles } from "@/lib/feeds";
import { getAllCategories, getCategory } from "@/lib/categories";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.slug }));
}

interface Params {
  params: Promise<{ category: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) {
    return new Response("Categoria não encontrada", { status: 404 });
  }

  const feedUrl = `${siteConfig.url}/categoria/${category}/atom.xml`;
  const pageUrl = `${siteConfig.url}/categoria/${category}`;

  const xml = buildAtom({
    title: `${siteConfig.name} — ${cat.label}`,
    description: cat.longDescription,
    feedUrl,
    pageUrl,
    articles: getFeedArticles((a) => a.category === category),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
