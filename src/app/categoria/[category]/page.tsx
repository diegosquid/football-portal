import { articles } from "#content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getAllCategories, getCategory } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import { paginate, buildPaginationUrls } from "@/lib/pagination";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};

  return {
    title: `${cat.label} — Notícias`,
    description: cat.description,
    alternates: { canonical: `/categoria/${category}` },
    openGraph: {
      title: `${cat.label} — ${siteConfig.name}`,
      description: cat.description,
      url: `${siteConfig.url}/categoria/${category}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const categoryArticles = articles
    .filter((a) => a.category === category && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const result = paginate(categoryArticles, 1);
  const basePath = `/categoria/${category}`;
  const { pageUrl } = buildPaginationUrls(basePath, 1, result?.totalPages ?? 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div
          className={`badge-${category} mb-4 inline-block rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-white`}
        >
          {cat.label}
        </div>
        <h1 className="text-3xl font-black text-secondary lg:text-4xl">
          {cat.label}
        </h1>
        <p className="mt-2 text-gray-600">{cat.description}</p>
      </header>

      {result && result.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <ArticleCard
                key={article.slug}
                title={article.title}
                slug={article.slug}
                excerpt={article.excerpt}
                date={article.date}
                author={article.author}
                category={article.category}
                image={article.image}
                readingTime={article.readingTime}
              />
            ))}
          </div>
          <Pagination
            currentPage={1}
            totalPages={result.totalPages}
            pageUrl={pageUrl}
          />
        </>
      ) : (
        <p className="text-gray-500">
          Nenhuma notícia nesta categoria por enquanto.
        </p>
      )}
    </div>
  );
}
