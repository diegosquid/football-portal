import { articles } from "#content";
import { ArticleCard } from "@/components/ArticleCard";
import { categories } from "@/lib/categories";
import Link from "next/link";

export const revalidate = 3600;

export default function HomePage() {
  const published = articles
    .filter((a) => !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featured = published[0];
  const latest = published.slice(1, 13);

  return (
    <>
      {/* Hero */}
      {featured && (
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <ArticleCard
            title={featured.title}
            slug={featured.slug}
            excerpt={featured.excerpt}
            date={featured.date}
            author={featured.author}
            category={featured.category}
            image={featured.image}
            readingTime={featured.readingTime}
            featured
          />
        </section>
      )}

      {/* Category quick nav */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className={`badge-${cat.slug} rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest articles grid */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="mb-6 text-2xl font-black text-secondary">
          Últimas Notícias
        </h2>
        {latest.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((article) => (
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
            Nenhuma notícia publicada ainda. As matérias aparecem aqui
            automaticamente.
          </p>
        )}
      </section>
    </>
  );
}
