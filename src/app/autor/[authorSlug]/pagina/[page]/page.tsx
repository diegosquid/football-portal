import { articles } from "#content";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getAllAuthors, getAuthor } from "@/lib/authors";
import { siteConfig } from "@/lib/site";
import {
  paginate,
  getPageNumbers,
  buildPaginationUrls,
} from "@/lib/pagination";

interface Props {
  params: Promise<{ authorSlug: string; page: string }>;
}

function getAuthorArticles(authorSlug: string) {
  return articles
    .filter((a) => a.author === authorSlug && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function generateStaticParams() {
  const allParams: { authorSlug: string; page: string }[] = [];

  for (const author of getAllAuthors()) {
    const authorArticles = getAuthorArticles(author.slug);
    const pageNumbers = getPageNumbers(authorArticles.length);
    for (const p of pageNumbers) {
      allParams.push({ authorSlug: author.slug, page: String(p) });
    }
  }

  return allParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { authorSlug, page } = await params;
  const pageNum = parseInt(page, 10);
  const author = getAuthor(authorSlug);
  if (!author || isNaN(pageNum)) return {};

  const basePath = `/autor/${authorSlug}`;
  const authorArticles = getAuthorArticles(authorSlug);
  const result = paginate(authorArticles, pageNum);
  if (!result) return {};

  const urls = buildPaginationUrls(basePath, pageNum, result.totalPages);

  return {
    title: `${author.name} — Página ${pageNum}`,
    description: `${author.bio} — Página ${pageNum} de ${result.totalPages}`,
    alternates: { canonical: urls.canonical },
    openGraph: {
      title: `${author.name} — Página ${pageNum} | ${siteConfig.name}`,
      description: `Artigos de ${author.name} — Página ${pageNum}`,
      url: `${siteConfig.url}${urls.canonical}`,
    },
  };
}

export default async function AuthorPaginatedPage({ params }: Props) {
  const { authorSlug, page } = await params;
  const pageNum = parseInt(page, 10);

  if (pageNum === 1) {
    permanentRedirect(`/autor/${authorSlug}`);
  }

  const author = getAuthor(authorSlug);
  if (!author || isNaN(pageNum)) notFound();

  const authorArticles = getAuthorArticles(authorSlug);
  const result = paginate(authorArticles, pageNum);
  if (!result) notFound();

  const basePath = `/autor/${authorSlug}`;
  const { pageUrl } = buildPaginationUrls(basePath, pageNum, result.totalPages);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Author profile */}
      <header className="mb-10 flex items-start gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/20">
          <Image
            src={author.avatar}
            alt={author.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black text-secondary">{author.name}</h1>
          <p className="text-lg font-medium text-primary">{author.role}</p>
          <p className="mt-1 text-sm text-gray-500">{author.specialty}</p>
          <p className="mt-3 max-w-2xl text-gray-600">{author.bio}</p>
        </div>
      </header>

      <h2 className="mb-6 text-2xl font-black text-secondary">
        Matérias de {author.name.split(" ")[0]} — Página {pageNum}
      </h2>

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
