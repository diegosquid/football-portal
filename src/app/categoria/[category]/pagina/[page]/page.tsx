import { articles } from "#content";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getAllCategories, getCategory } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import {
  paginate,
  getPageNumbers,
  buildPaginationUrls,
} from "@/lib/pagination";

interface Props {
  params: Promise<{ category: string; page: string }>;
}

function getCategoryArticles(category: string) {
  return articles
    .filter((a) => a.category === category && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function generateStaticParams() {
  const allParams: { category: string; page: string }[] = [];

  for (const cat of getAllCategories()) {
    const catArticles = getCategoryArticles(cat.slug);
    const pageNumbers = getPageNumbers(catArticles.length);
    for (const p of pageNumbers) {
      allParams.push({ category: cat.slug, page: String(p) });
    }
  }

  return allParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, page } = await params;
  const pageNum = parseInt(page, 10);
  const cat = getCategory(category);
  if (!cat || isNaN(pageNum)) return {};

  const basePath = `/categoria/${category}`;
  const catArticles = getCategoryArticles(category);
  const result = paginate(catArticles, pageNum);
  if (!result) return {};

  const urls = buildPaginationUrls(basePath, pageNum, result.totalPages);

  return {
    title: `${cat.label} — Página ${pageNum}`,
    description: `${cat.description} — Página ${pageNum} de ${result.totalPages}`,
    alternates: { canonical: urls.canonical },
    openGraph: {
      title: `${cat.label} — Página ${pageNum} | ${siteConfig.name}`,
      description: `${cat.description} — Página ${pageNum}`,
      url: `${siteConfig.url}${urls.canonical}`,
    },
  };
}

export default async function CategoryPaginatedPage({ params }: Props) {
  const { category, page } = await params;
  const pageNum = parseInt(page, 10);

  if (pageNum === 1) {
    permanentRedirect(`/categoria/${category}`);
  }

  const cat = getCategory(category);
  if (!cat || isNaN(pageNum)) notFound();

  const catArticles = getCategoryArticles(category);
  const result = paginate(catArticles, pageNum);
  if (!result) notFound();

  const basePath = `/categoria/${category}`;
  const { pageUrl } = buildPaginationUrls(basePath, pageNum, result.totalPages);

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
        <p className="mt-2 text-gray-600">
          {cat.description} — Página {pageNum} de {result.totalPages}
        </p>
      </header>

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
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        pageUrl={pageUrl}
      />
    </div>
  );
}
