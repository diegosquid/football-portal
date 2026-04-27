import { articles } from "#content";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllTeams } from "@/lib/teams";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Times — Notícias por clube",
  description:
    "Cobertura completa dos principais times do futebol brasileiro e europeu: notícias, transferências, análises e resultados.",
  alternates: { canonical: "/time" },
  openGraph: {
    title: `Times — ${siteConfig.name}`,
    description:
      "Notícias por clube: Flamengo, Palmeiras, Corinthians, São Paulo e mais.",
    url: `${siteConfig.url}/time`,
  },
};

export default function TeamsIndexPage() {
  const counts = new Map<string, number>();
  for (const article of articles) {
    if (article.draft) continue;
    for (const slug of article.teams) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const allTeams = getAllTeams();
  const brTeams = allTeams
    .filter((t) => t.state !== "ESP")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const intlTeams = allTeams
    .filter((t) => t.state === "ESP")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-secondary lg:text-4xl">
          Times
        </h1>
        <p className="mt-2 text-sm text-gray-500 lg:text-base">
          Cobertura por clube — notícias, transferências, análises e
          resultados.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-5 text-xl font-black text-secondary">Brasileirão</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brTeams.map((team) => (
            <Link
              key={team.slug}
              href={`/time/${team.slug}`}
              className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                {team.shortName}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-secondary group-hover:text-primary">
                  {team.name}
                </p>
                <p className="text-xs text-gray-500">
                  {team.state} ·{" "}
                  {counts.get(team.slug) ?? 0}{" "}
                  {(counts.get(team.slug) ?? 0) === 1 ? "matéria" : "matérias"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {intlTeams.length > 0 && (
        <section>
          <h2 className="mb-5 text-xl font-black text-secondary">Europa</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intlTeams.map((team) => (
              <Link
                key={team.slug}
                href={`/time/${team.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                  {team.shortName}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-secondary group-hover:text-primary">
                    {team.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {team.state} ·{" "}
                    {counts.get(team.slug) ?? 0}{" "}
                    {(counts.get(team.slug) ?? 0) === 1
                      ? "matéria"
                      : "matérias"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
