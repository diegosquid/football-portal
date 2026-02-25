import { articles } from "#content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MDXContent } from "@/components/mdx/MDXContent";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleImage } from "@/components/ArticleImage";
import { NewsArticleJsonLd } from "@/components/JsonLd";
import { SourceAttribution } from "@/components/mdx/SourceAttribution";
import { getAuthor } from "@/lib/authors";
import { getFallbackImage } from "@/lib/images";
import { siteConfig } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug && !a.draft);
}

function getRelated(current: (typeof articles)[number], limit = 3) {
  return articles
    .filter(
      (a) =>
        a.slug !== current.slug &&
        !a.draft &&
        (a.category === current.category ||
          a.teams.some((t) => current.teams.includes(t)))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function generateStaticParams() {
  return articles.filter((a) => !a.draft).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const author = getAuthor(article.author);

  return {
    title: article.title,
    description: article.excerpt,
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      authors: author ? [author.name] : undefined,
      images: article.image ? [{ url: article.image }] : undefined,
      url: `${siteConfig.url}/${article.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.image ? [article.image] : undefined,
    },
    alternates: {
      canonical: `/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const author = getAuthor(article.author);
  const related = getRelated(article);

  return (
    <>
      <NewsArticleJsonLd
        title={article.title}
        excerpt={article.excerpt}
        date={article.date}
        updated={article.updated}
        authorSlug={article.author}
        image={article.image}
        slug={article.slug}
      />

      <article className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/categoria/${article.category}`}
            className="hover:text-primary"
          >
            {article.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{article.title}</span>
        </nav>

        {/* Header */}
        <header>
          <CategoryBadge category={article.category} linked />

          <h1 className="mt-3 text-3xl font-black leading-tight text-secondary lg:text-4xl">
            {article.title}
          </h1>

          <p className="mt-3 text-lg text-gray-600">{article.excerpt}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {author && (
              <Link
                href={`/autor/${author.slug}`}
                className="flex items-center gap-2 font-medium text-secondary hover:text-primary"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                {author.name}
              </Link>
            )}
            <time dateTime={article.date}>
              {(() => {
                const dateInput = article.date.includes('T') ? article.date : article.date + "T12:00:00-03:00";
                const date = new Date(dateInput);
                if (isNaN(date.getTime())) return article.date;
                return date.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "America/Sao_Paulo",
                });
              })()}
            </time>
            <span>{article.readingTime} min de leitura</span>
          </div>
        </header>

        {/* Featured image */}
        <figure className="mt-8">
          <ArticleImage
            src={article.image}
            alt={article.title}
            width={900}
            height={506}
            className="w-full rounded-xl object-cover"
            priority
            fallbackSrc={getFallbackImage(article.category)}
          />
          {article.imageCaption && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>

        {/* Article body */}
        <div className="prose-article mt-8">
          <MDXContent code={article.body} />
        </div>

        {/* Source attribution */}
        {article.source && (
          <SourceAttribution
            name={article.source.name}
            url={article.source.url}
          />
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author box */}
        {author && (
          <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <Link
                  href={`/autor/${author.slug}`}
                  className="font-bold text-secondary hover:text-primary"
                >
                  {author.name}
                </Link>
                <p className="text-sm text-gray-500">{author.role}</p>
                <p className="mt-2 text-sm text-gray-600">{author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="border-t border-gray-200 bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-black text-secondary">
              Leia também
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((article) => (
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
          </div>
        </section>
      )}
    </>
  );
}
