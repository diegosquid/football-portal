import { articles } from "#content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getAllTeams, getTeam } from "@/lib/teams";
import { siteConfig } from "@/lib/site";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Team header */}
      <header className="mb-10 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-black text-white">
          {team.shortName}
        </div>
        <div>
          <h1 className="text-3xl font-black text-secondary lg:text-4xl">
            {team.name}
          </h1>
          <p className="text-sm text-gray-500">{team.state}</p>
        </div>
      </header>

      {/* Articles */}
      <h2 className="mb-6 text-xl font-black text-secondary">
        {teamArticles.length}{" "}
        {teamArticles.length === 1 ? "matéria" : "matérias"} sobre o{" "}
        {team.name}
      </h2>

      {teamArticles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamArticles.map((article) => (
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
          Nenhuma matéria sobre o {team.name} por enquanto. Em breve teremos
          cobertura completa!
        </p>
      )}
    </div>
  );
}
