import { articles } from "#content";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { getAllCategories, getCategory } from "@/lib/categories";
import { siteConfig, truncateForMeta } from "@/lib/site";
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

  const metaDescription = truncateForMeta(
    `${cat.description} — Página ${pageNum} de ${result.totalPages}. ${cat.longDescription}`,
    160,
  );

  return {
    title: `${cat.label} — Página ${pageNum}`,
    description: metaDescription,
    alternates: { canonical: urls.canonical },
    openGraph: {
      title: `${cat.label} — Página ${pageNum} | ${siteConfig.name}`,
      description: metaDescription,
      url: `${siteConfig.url}${urls.canonical}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.label} — Página ${pageNum} | ${siteConfig.name}`,
      description: metaDescription,
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
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: cat.label, url: basePath },
          { name: `Página ${pageNum}`, url: `${basePath}/pagina/${pageNum}` },
        ]}
      />

      <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <span className="h-1 w-1 rotate-45 bg-gray-400" />
        <Link href={basePath} className="transition-colors hover:text-primary">
          {cat.label}
        </Link>
        <span className="h-1 w-1 rotate-45 bg-gray-400" />
        <span className="text-gray-700">Página {pageNum}</span>
      </nav>

      <header className="mb-10 border-b-2 border-ink pb-8">
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: cat.color }}
          />
          Editoria
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          {cat.label}
        </h1>
        <p className="mt-4 text-gray-600">
          {cat.description} — Página {pageNum} de {result.totalPages}
        </p>
      </header>

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
