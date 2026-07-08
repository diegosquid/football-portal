import { articles } from "#content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MDXContent } from "@/components/mdx/MDXContent";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleImage } from "@/components/ArticleImage";
import {
  BreadcrumbJsonLd,
  FAQPageJsonLd,
  NewsArticleJsonLd,
} from "@/components/JsonLd";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { SourceAttribution } from "@/components/mdx/SourceAttribution";
import { getAuthor } from "@/lib/authors";
import { getCategory } from "@/lib/categories";
import { getFallbackImage } from "@/lib/images";
import { siteConfig, truncateForMeta } from "@/lib/site";

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
  const metaDescription = truncateForMeta(
    article.seoDescription ?? article.excerpt,
    160,
  );

  return {
    title: article.title,
    description: metaDescription,
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      title: article.title,
      description: metaDescription,
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
      description: metaDescription,
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
  const category = getCategory(article.category);
  const related = getRelated(article);
  const faq = article.faq ?? [];

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
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          {
            name: category?.label ?? article.category,
            url: `/categoria/${article.category}`,
          },
          { name: article.title, url: `/${article.slug}` },
        ]}
      />
      {faq.length > 0 && <FAQPageJsonLd items={faq} />}

      <article className="mx-auto max-w-4xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">
          <Link href="/" className="transition-colors hover:text-primary">
            Início
          </Link>
          <span className="h-1 w-1 rotate-45 bg-gray-400" />
          <Link
            href={`/categoria/${article.category}`}
            className="transition-colors hover:text-primary"
          >
            {category?.label ?? article.category}
          </Link>
        </nav>

        {/* Cabeçalho */}
        <header>
          <CategoryBadge category={article.category} linked />

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-ink lg:text-5xl">
            {article.title}
          </h1>

          <p className="mt-5 font-serif text-xl italic leading-relaxed text-gray-600 lg:text-2xl">
            {article.excerpt}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-ink/15 py-3.5 font-mono text-xs uppercase tracking-[0.1em] text-gray-500">
            {author && (
              <Link
                href={`/autor/${author.slug}`}
                className="flex items-center gap-2.5 font-bold normal-case tracking-normal text-ink transition-colors hover:text-primary"
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-lima">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </span>
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
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rotate-45 bg-lima" />
              {article.readingTime} min de leitura
            </span>
          </div>
        </header>

        {/* Imagem de destaque */}
        <figure className="mt-8">
          <ArticleImage
            src={article.image}
            alt={article.title}
            width={900}
            height={506}
            className="w-full object-cover"
            priority
            fallbackSrc={getFallbackImage(article.category)}
          />
          {article.imageCaption && (
            <figcaption className="mt-2.5 border-l-2 border-lima pl-3 text-left font-mono text-xs text-gray-500">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>

        {/* Corpo do artigo */}
        <div className="prose-article mt-10">
          <MDXContent code={article.body} />
        </div>

        {/* FAQ */}
        {faq.length > 0 && <ArticleFAQ items={faq} />}

        {/* Fonte */}
        {article.source && (
          <SourceAttribution
            name={article.source.name}
            url={article.source.url}
          />
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="border border-ink/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Caixa do autor */}
        {author && (
          <div className="mt-12 border-y-2 border-ink bg-gray-50/60 px-6 py-6">
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Quem escreve
            </p>
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-lima">
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
                  className="font-display text-lg font-bold text-ink transition-colors hover:text-primary"
                >
                  {author.name}
                </Link>
                <p className="font-serif text-sm italic text-gray-500">
                  {author.role}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {author.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Leia também */}
      {related.length > 0 && (
        <section className="border-t-2 border-ink bg-surface/60">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 border border-ink/30 bg-lima" />
              <h2 className="shrink-0 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
                Leia também
              </h2>
              <div className="h-px flex-1 bg-ink/15" />
            </div>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
