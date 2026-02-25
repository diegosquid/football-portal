import { articles } from "#content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getAllAuthors, getAuthor } from "@/lib/authors";
import { siteConfig } from "@/lib/site";

interface Props {
  params: Promise<{ authorSlug: string }>;
}

export async function generateStaticParams() {
  return getAllAuthors().map((a) => ({ authorSlug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { authorSlug } = await params;
  const author = getAuthor(authorSlug);
  if (!author) return {};

  return {
    title: `${author.name} — ${author.role}`,
    description: author.bio,
    alternates: { canonical: `/autor/${authorSlug}` },
    openGraph: {
      title: `${author.name} — ${siteConfig.name}`,
      description: author.bio,
      url: `${siteConfig.url}/autor/${authorSlug}`,
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { authorSlug } = await params;
  const author = getAuthor(authorSlug);
  if (!author) notFound();

  const authorArticles = articles
    .filter((a) => a.author === authorSlug && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Author profile */}
      <header className="mb-10 flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          {author.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-black text-secondary">{author.name}</h1>
          <p className="text-lg font-medium text-primary">{author.role}</p>
          <p className="mt-1 text-sm text-gray-500">{author.specialty}</p>
          <p className="mt-3 max-w-2xl text-gray-600">{author.bio}</p>
          {author.social && (
            <div className="mt-3 flex gap-3 text-sm">
              {author.social.twitter && (
                <span className="text-gray-400">@{author.social.twitter}</span>
              )}
              {author.social.instagram && (
                <span className="text-gray-400">
                  @{author.social.instagram}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Author's articles */}
      <h2 className="mb-6 text-2xl font-black text-secondary">
        Matérias de {author.name.split(" ")[0]}
      </h2>

      {authorArticles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {authorArticles.map((article) => (
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
      ) : (
        <p className="text-gray-500">
          Nenhuma matéria publicada por este autor ainda.
        </p>
      )}
    </div>
  );
}
