import { getPublishedArticles } from "@/lib/articles";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { SeoHubLinks, type SeoHubLink } from "@/components/SeoHubLinks";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/JsonLd";
import { getAllCategories, getCategory } from "@/lib/categories";
import { siteConfig, truncateForMeta } from "@/lib/site";
import { paginate, buildPaginationUrls } from "@/lib/pagination";
import { getStandingsTable } from "@/lib/standings";
import { getTopScorers } from "@/lib/topscorers";

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

  const isBrasileirao = category === "brasileirao";
  const standings = isBrasileirao
    ? await getStandingsTable("brasileirao")
    : null;
  const season = standings?.season ?? String(new Date().getFullYear());
  const title = isBrasileirao
    ? `Brasileirão ${season}: tabela, jogos e notícias`
    : `${cat.label} — Notícias`;
  const metaDescription = truncateForMeta(
    isBrasileirao
      ? `Brasileirão ${season}: tabela atualizada, jogos de hoje, artilharia, chances de título e rebaixamento, além das últimas notícias.`
      : cat.longDescription,
    160,
  );

  return {
    title,
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
      title: isBrasileirao ? title : `${cat.label} — ${siteConfig.name}`,
      description: metaDescription,
      url: `${siteConfig.url}/categoria/${category}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: isBrasileirao ? title : `${cat.label} — ${siteConfig.name}`,
      description: metaDescription,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const isBrasileirao = category === "brasileirao";
  const [articles, standings, scorers] = await Promise.all([
    getPublishedArticles(),
    isBrasileirao ? getStandingsTable("brasileirao") : Promise.resolve(null),
    isBrasileirao ? getTopScorers("brasileirao") : Promise.resolve(null),
  ]);
  const categoryArticles = articles.filter(
    (a) => a.category === category,
  );

  const result = paginate(categoryArticles, 1);
  const basePath = `/categoria/${category}`;
  const { pageUrl } = buildPaginationUrls(basePath, 1, result?.totalPages ?? 1);
  const season = standings?.season ?? String(new Date().getFullYear());
  const leader = standings?.rows[0];
  const topScorer = scorers?.scorers[0];
  const hubDescription = isBrasileirao
    ? `Brasileirão ${season}: tabela, jogos, artilharia, probabilidades e notícias em um único guia.`
    : cat.longDescription;
  const hubLinks: SeoHubLink[] = isBrasileirao
    ? [
        {
          href: "/tabela-do-brasileirao",
          eyebrow: "Classificação",
          title: `Tabela do Brasileirão ${season}`,
          description:
            "Posição, pontos, saldo, últimos resultados e desempenho como mandante e visitante.",
          value: leader
            ? `Líder: ${leader.displayName} · ${leader.points} pts`
            : "Ver tabela",
        },
        {
          href: "/jogos-futebol-hoje/brasileirao",
          eyebrow: "Agenda",
          title: "Jogos do Brasileirão hoje",
          description:
            "Horários, canais e próximos confrontos da Série A em uma página sempre atualizada.",
        },
        {
          href: "/artilharia-do-brasileirao",
          eyebrow: "Artilharia",
          title: `Artilheiros do Brasileirão ${season}`,
          description:
            "Ranking de gols por jogador e clube, conferido com os placares da competição.",
          value: topScorer
            ? `${topScorer.displayName} · ${topScorer.goals} gols`
            : "Ver ranking",
        },
        {
          href: "/probabilidades/titulo",
          eyebrow: "Simulações",
          title: "Chances de título",
          description:
            "Veja quem aparece como favorito após 10 mil simulações dos jogos restantes.",
        },
        {
          href: "/probabilidades/rebaixamento",
          eyebrow: "Simulações",
          title: "Chances de rebaixamento",
          description:
            "O risco de queda de cada time, atualizado conforme a tabela e o calendário.",
        },
        {
          // Aponta pro chaveamento, que existe. Um hub /copa-do-brasil ainda
          // não foi criado, e link pra 404 num bloco de navegação é pior que
          // link pra página parcial.
          href: "/chaveamento-da-copa-do-brasil",
          eyebrow: "Mata-mata",
          title: "Chaveamento da Copa do Brasil",
          description:
            "Os confrontos do mata-mata com placar agregado, pênaltis e quem avançou em cada chave.",
        },
      ]
    : [];

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
          name={
            isBrasileirao
              ? `Brasileirão ${season}: tabela, jogos e notícias`
              : `${cat.label} — Notícias`
          }
          description={hubDescription}
          url={basePath}
          items={[
            ...hubLinks.map((item) => ({
              name: item.title,
              url: item.href,
            })),
            ...result.items.map((a) => ({
              name: a.title,
              url: `/${a.slug}`,
            })),
          ]}
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
          {isBrasileirao ? "Guia da competição" : "Editoria"}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          {isBrasileirao ? `Brasileirão ${season}` : cat.label}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-600">
          {hubDescription}
        </p>
      </header>

      {isBrasileirao && (
        <SeoHubLinks
          title="Tudo sobre o Brasileirão"
          description="Cada página abaixo atende uma busca específica, enquanto este hub organiza a cobertura sem trocar nenhuma URL que já recebe tráfego."
          links={hubLinks}
        />
      )}

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
