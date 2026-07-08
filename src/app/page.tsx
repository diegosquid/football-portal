import { articles } from "#content";
import { ArticleCard, timeAgo } from "@/components/ArticleCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { categories, getCategory } from "@/lib/categories";
import Link from "next/link";

export const revalidate = 3600;

function todayLong(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-3 w-3 rotate-45 border border-ink/30 bg-lima" />
      <h2 className="shrink-0 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
        {title}
      </h2>
      <div className="h-px flex-1 bg-ink/15" />
    </div>
  );
}

export default function HomePage() {
  const published = articles
    .filter((a) => !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featured = published[0];
  const recent = published.slice(1, 6);
  const grid = published.slice(6, 18);

  return (
    <>
      {/* Cabeçalho editorial */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-14">
        <div className="border-b-2 border-ink pb-8">
          <p className="rise flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-gray-500">
            <span className="inline-block h-2 w-2 bg-lima" />
            Edição de {todayLong()}
          </p>
          <h1 className="rise-1 mt-5 max-w-4xl font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Notícias de futebol, análises táticas e{" "}
            <em className="font-serif font-normal italic text-primary">
              mercado da bola
            </em>
          </h1>
          <p className="rise-2 mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Cobertura diária do Brasileirão, Libertadores, Champions League e
            seleções. Pré-jogo, pós-jogo, radar de transferências e opinião —
            do chute inicial ao apito final, contado por quem assiste à beira
            do campo.
          </p>
        </div>
      </section>

      {/* Destaque + mais recentes */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 lg:grid-cols-12">
        {featured && (
          <div className="rise-2 lg:col-span-8">
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
          </div>
        )}

        <aside className="rise-3 lg:col-span-4">
          <div className="mb-2 flex items-center gap-3">
            <h2 className="shrink-0 font-display text-xl font-extrabold uppercase tracking-tight text-ink">
              Mais recentes
            </h2>
            <div className="h-px flex-1 bg-ink/15" />
          </div>
          <ol className="divide-y divide-ink/10">
            {recent.map((article, i) => (
              <li key={article.slug}>
                <Link
                  href={`/${article.slug}`}
                  className="group flex gap-4 py-4"
                >
                  <span className="num-jersey mt-0.5 shrink-0 text-3xl leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500">
                      {getCategory(article.category)?.label ?? article.category}
                      <span className="mx-2 text-gray-300">/</span>
                      {timeAgo(article.date)}
                    </p>
                    <h3 className="mt-1.5 font-display text-base font-bold leading-snug tracking-tight text-ink">
                      <span className="title-underline">{article.title}</span>
                    </h3>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href="/categoria/brasileirao"
            className="mt-2 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary transition-colors hover:text-ink"
          >
            Ver todas as notícias <span aria-hidden>→</span>
          </Link>
        </aside>
      </section>

      {/* Faixa de categorias */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="group flex items-center gap-2 border border-ink/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cal"
            >
              <span
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Chamada de newsletter */}
      <section className="relative overflow-hidden bg-campo">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 w-[420px] -translate-y-1/2 text-lima/[0.08]"
        >
          <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="2" />
          <circle cx="200" cy="200" r="6" fill="currentColor" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-lima">
              <span className="inline-block h-2 w-2 bg-lima" />
              Newsletter
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-cal sm:text-4xl">
              O pós-jogo no seu e-mail,{" "}
              <em className="font-serif font-normal italic text-lima">
                sem enrolação
              </em>
              .
            </h2>
          </div>
          <div className="lg:max-w-md lg:justify-self-end lg:w-full">
            <NewsletterForm />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-cal/40">
              Grátis · sem spam · cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Últimas notícias */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader title="Últimas notícias" />
        {grid.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((article) => (
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
