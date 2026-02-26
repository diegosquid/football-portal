import { articles } from "#content";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getAllTeams, getTeam } from "@/lib/teams";
import { siteConfig } from "@/lib/site";
import {
  paginate,
  getPageNumbers,
  buildPaginationUrls,
} from "@/lib/pagination";

interface Props {
  params: Promise<{ slug: string; page: string }>;
}

function getTeamArticles(slug: string) {
  return articles
    .filter((a) => a.teams.includes(slug) && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function generateStaticParams() {
  const allParams: { slug: string; page: string }[] = [];

  for (const team of getAllTeams()) {
    const teamArticles = getTeamArticles(team.slug);
    const pageNumbers = getPageNumbers(teamArticles.length);
    for (const p of pageNumbers) {
      allParams.push({ slug: team.slug, page: String(p) });
    }
  }

  return allParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  const pageNum = parseInt(page, 10);
  const team = getTeam(slug);
  if (!team || isNaN(pageNum)) return {};

  const basePath = `/time/${slug}`;
  const teamArticles = getTeamArticles(slug);
  const result = paginate(teamArticles, pageNum);
  if (!result) return {};

  const urls = buildPaginationUrls(basePath, pageNum, result.totalPages);

  return {
    title: `${team.name} — Página ${pageNum}`,
    description: `Notícias do ${team.name} — Página ${pageNum} de ${result.totalPages}`,
    alternates: { canonical: urls.canonical },
    openGraph: {
      title: `${team.name} — Página ${pageNum} | ${siteConfig.name}`,
      description: `Cobertura do ${team.name} — Página ${pageNum}`,
      url: `${siteConfig.url}${urls.canonical}`,
    },
  };
}

export default async function TeamPaginatedPage({ params }: Props) {
  const { slug, page } = await params;
  const pageNum = parseInt(page, 10);

  if (pageNum === 1) {
    permanentRedirect(`/time/${slug}`);
  }

  const team = getTeam(slug);
  if (!team || isNaN(pageNum)) notFound();

  const teamArticles = getTeamArticles(slug);
  const result = paginate(teamArticles, pageNum);
  if (!result) notFound();

  const basePath = `/time/${slug}`;
  const { pageUrl } = buildPaginationUrls(basePath, pageNum, result.totalPages);

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
          <p className="text-sm text-gray-500">
            {team.state} — Página {pageNum} de {result.totalPages}
          </p>
        </div>
      </header>

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
