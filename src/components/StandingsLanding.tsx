import Link from "next/link";
import { articles } from "#content";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { StandingsProjection } from "@/components/StandingsProjection";
import { StandingsSplits } from "@/components/StandingsSplits";
import { StandingsLegend, StandingsTable } from "@/components/StandingsTable";
import type { StandingsCompetitionCopy } from "@/lib/standings-competitions";
import { formatUpdatedAt, type EnrichedStandingsTable } from "@/lib/standings";
import {
  buildStandingsFaq,
  buildStandingsSummary,
} from "@/lib/standings-seo";

/**
 * Corpo compartilhado das landings de classificação.
 * Cada competição traz o próprio texto (src/lib/standings-competitions.ts);
 * a estrutura (tabela, projeção, splits, FAQ) é a mesma pra todas.
 */
export function StandingsLanding({
  table,
  copy,
  generatedAt,
}: {
  table: EnrichedStandingsTable;
  copy: StandingsCompetitionCopy;
  generatedAt?: string;
}) {
  const faq = buildStandingsFaq(table, copy);
  const summary = buildStandingsSummary(table, copy);
  const updatedAt = formatUpdatedAt(generatedAt);
  const promotion = {
    label: copy.promotionLabel,
    hint: copy.promotionHint,
    raceTitle: copy.promotionRaceTitle,
  };
  const h1 = copy.h1(table.season);

  const related = articles
    .filter((article) => article.category === copy.categorySlug && !article.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <>
      <CollectionPageJsonLd
        name={h1}
        description={copy.description(table.season)}
        url={copy.path}
        items={table.rows.map((row) => ({
          name: `${row.position}º ${row.displayName} — ${row.points} pontos`,
          url: row.teamSlug ? `/time/${row.teamSlug}` : copy.path,
        }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Tabelas", url: "/tabela" },
          { name: copy.eyebrow, url: copy.path },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          {copy.intro}
        </p>
        {summary && (
          <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">
            {summary}
          </p>
        )}
        <p className="mt-3 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={generatedAt}>{updatedAt}</time>
              {" · "}
            </>
          )}
          {table.roundsPlayed}ª de {table.totalRounds} rodadas ·{" "}
          {table.remainingMatches} jogos restantes
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          {[...copy.links, { href: "/tabela", label: "Todas as tabelas" }].map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            {copy.tableHeading}
          </h2>
          <StandingsTable table={table} promotion={promotion} />
          <StandingsLegend table={table} zoneLabels={copy.zoneLabels} />
        </section>

        {table.simulation && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {copy.projectionHeading}
            </h2>
            <p className="mb-5 mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              Rodamos {table.simulation.runs.toLocaleString("pt-BR")} simulações
              dos {table.remainingMatches} jogos que faltam com o nosso modelo de
              Poisson — o mesmo que calcula os{" "}
              <Link
                href="/probabilidades"
                className="font-medium text-primary hover:underline"
              >
                palpites de cada jogo
              </Link>
              . A chance de cada time é a fatia de simulações em que ele termina
              naquela faixa da tabela.
            </p>
            <StandingsProjection table={table} promotion={promotion} />
            <p className="mt-4 text-xs text-gray-500">
              Estimativas estatísticas de modelo próprio — não são garantia de
              resultado.{" "}
              <Link
                href="/metodologia-dos-palpites"
                className="font-medium text-primary hover:underline"
              >
                Veja a metodologia e o desempenho do modelo →
              </Link>
            </p>
          </section>
        )}

        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
            Tabela em casa e fora
          </h2>
          <StandingsSplits table={table} />
        </section>

        <ArticleFAQ items={faq} />

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimas notícias
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
          </section>
        )}
      </div>
    </>
  );
}
