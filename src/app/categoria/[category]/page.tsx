import { articles } from "#content";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/JsonLd";
import { getAllCategories, getCategory } from "@/lib/categories";
import { siteConfig, truncateForMeta } from "@/lib/site";
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

  const metaDescription = truncateForMeta(cat.longDescription, 160);

  return {
    title: `${cat.label} — Notícias`,
    description: metaDescription,
    alternates: {
      canonical: `/categoria/${category}`,
      types: {
        "application/rss+xml": [
          {
            url: `/categoria/${category}/feed.xml`,
            title: `${cat.label} — ${siteConfig.name} (RSS)`,
          },
        ],
        "application/atom+xml": [
          {
            url: `/categoria/${category}/atom.xml`,
            title: `${cat.label} — ${siteConfig.name} (Atom)`,
          },
        ],
      },
    },
    openGraph: {
      title: `${cat.label} — ${siteConfig.name}`,
      description: metaDescription,
      url: `${siteConfig.url}/categoria/${category}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.label} — ${siteConfig.name}`,
      description: metaDescription,
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
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: cat.label, url: basePath },
        ]}
      />
      {result && result.items.length > 0 && (
        <CollectionPageJsonLd
          name={`${cat.label} — Notícias`}
          description={cat.longDescription}
          url={basePath}
          items={result.items.map((a) => ({
            name: a.title,
            url: `/${a.slug}`,
          }))}
        />
      )}

      {/* Breadcrumb visual */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <span className="h-1 w-1 rotate-45 bg-gray-400" />
        <span className="text-gray-700">{cat.label}</span>
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
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-600">
          {cat.longDescription}
        </p>
      </header>

      {result && result.items.length > 0 ? (
        <>
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
