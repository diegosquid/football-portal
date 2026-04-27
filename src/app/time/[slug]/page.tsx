import { articles } from "#content";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getAllTeams, getTeam } from "@/lib/teams";
import { siteConfig } from "@/lib/site";
import { paginate, buildPaginationUrls } from "@/lib/pagination";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTeams().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) return {};

  return {
    title: `${team.name} — Notícias, Análises e Transferências`,
    description: `Todas as notícias do ${team.name}: transferências, análises táticas, resultados e muito mais.`,
    alternates: { canonical: `/time/${slug}` },
    openGraph: {
      title: `${team.name} — ${siteConfig.name}`,
      description: `Cobertura completa do ${team.name} no Beira do Campo.`,
      url: `${siteConfig.url}/time/${slug}`,
    },
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) notFound();

  const teamArticles = articles
    .filter((a) => a.teams.includes(slug) && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const result = paginate(teamArticles, 1);
  const basePath = `/time/${slug}`;
  const { pageUrl } = buildPaginationUrls(basePath, 1, result?.totalPages ?? 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Team header */}
      <header className="mb-10 flex flex-wrap items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-black text-white">
          {team.shortName}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black text-secondary lg:text-4xl">
            {team.name}
          </h1>
          <p className="text-sm text-gray-500">{team.state}</p>
        </div>
        <Link
          href={`/jogos-futebol-hoje/${slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {team.name} joga hoje?
        </Link>
      </header>

      {/* Articles */}
      <h2 className="mb-6 text-xl font-black text-secondary">
        {teamArticles.length}{" "}
        {teamArticles.length === 1 ? "matéria" : "matérias"} sobre o{" "}
        {team.name}
      </h2>

      {result && result.items.length > 0 ? (
        <>
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
            currentPage={1}
            totalPages={result.totalPages}
            pageUrl={pageUrl}
          />
        </>
      ) : (
        <p className="text-gray-500">
          Nenhuma matéria sobre o {team.name} por enquanto. Em breve teremos
          cobertura completa!
        </p>
      )}
    </div>
  );
}
