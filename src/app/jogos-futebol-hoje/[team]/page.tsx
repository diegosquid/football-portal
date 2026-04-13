import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articles } from "#content";
import { siteConfig } from "@/lib/site";
import { getAllTeams, getTeam } from "@/lib/teams";
import { ArticleCard } from "@/components/ArticleCard";
import { GameSchedule } from "@/components/GameSchedule";

export const revalidate = 900;

type Game = {
  time: string;
  home: string;
  away: string;
  competition: string;
  round: string;
  channel: string;
  stadium: string;
};

type ScheduleData = {
  date: string;
  updatedAt: string;
  games: Game[];
};

interface Props {
  params: Promise<{ team: string }>;
}

function getSchedule(): ScheduleData {
  const filePath = join(process.cwd(), "content", "jogos-hoje.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ScheduleData;
}

/** Match team name loosely against game home/away fields */
function teamMatchesGame(teamName: string, game: Game): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const tn = normalize(teamName);
  return normalize(game.home).includes(tn) || normalize(game.away).includes(tn);
}

export function generateStaticParams() {
  return getAllTeams().map((team) => ({ team: team.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { team: teamSlug } = await params;
  const team = getTeam(teamSlug);
  if (!team) return {};

  const title = `${team.name} Hoje — Jogo, Horário e Onde Assistir`;
  const description = `Veja se o ${team.name} joga hoje, o horário do jogo, canal de transmissão e as últimas notícias. Programação atualizada diariamente.`;

  return {
    title,
    description,
    keywords: [
      `${team.name.toLowerCase()} hoje`,
      `jogo do ${team.name.toLowerCase()} hoje`,
      `${team.name.toLowerCase()} joga hoje`,
      `horario jogo ${team.name.toLowerCase()}`,
      `onde assistir ${team.name.toLowerCase()}`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/jogos-futebol-hoje/${team.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/jogos-futebol-hoje/${team.slug}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
  };
}

export default async function TeamHojePage({ params }: Props) {
  const { team: teamSlug } = await params;
  const team = getTeam(teamSlug);
  if (!team) notFound();

  const schedule = getSchedule();
  const teamGames = schedule.games.filter((g) => teamMatchesGame(team.name, g));

  // Latest articles for this team
  const teamArticles = articles
    .filter((a) => !a.draft && a.teams.includes(team.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // JSON-LD for team games
  const jsonLd = teamGames.map((game) => ({
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${game.home} x ${game.away}`,
    startDate: `${schedule.date}T${game.time}:00-03:00`,
    location: game.stadium
      ? { "@type": "Place", name: game.stadium }
      : undefined,
    homeTeam: { "@type": "SportsTeam", name: game.home },
    awayTeam: { "@type": "SportsTeam", name: game.away },
    description: `${game.competition}${game.round ? ` — ${game.round}` : ""} — ${game.channel}`,
  }));

  return (
    <>
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* H1 */}
        <h1 className="mb-2 text-3xl font-black text-secondary sm:text-4xl">
          {team.name} Hoje
        </h1>
        <p className="mb-8 text-gray-500">
          Confira se o {team.name} joga hoje, horário, canal e as últimas
          notícias do time.
        </p>

        {/* Today's games */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-secondary">
            Jogo do {team.name} Hoje
          </h2>

          {teamGames.length > 0 ? (
            <GameSchedule
              games={teamGames}
              date={schedule.date}
              updatedAt={schedule.updatedAt}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-lg font-semibold text-secondary">
                O {team.name} não joga hoje
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Confira a{" "}
                <Link
                  href="/jogos-futebol-hoje"
                  className="font-medium text-primary hover:underline"
                >
                  programação completa
                </Link>{" "}
                de todos os jogos de hoje ou veja as últimas notícias abaixo.
              </p>
            </div>
          )}
        </section>

        {/* Latest articles */}
        {teamArticles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">
                Últimas Notícias do {team.name}
              </h2>
              <Link
                href={`/time/${team.slug}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>
        )}

        {/* SEO text */}
        <section className="rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            {team.name} joga hoje? Onde assistir?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              Acompanhe no <strong>Beira do Campo</strong> se o{" "}
              <strong>{team.name}</strong> joga hoje e onde assistir. Esta
              página é atualizada diariamente com os horários dos jogos, canais
              de transmissão na TV aberta, TV fechada e streaming, além das
              últimas notícias e artigos sobre o time.
            </p>
            <p>
              Confira também a{" "}
              <Link
                href="/jogos-futebol-hoje"
                className="font-medium text-primary hover:underline"
              >
                programação completa de todos os jogos de hoje
              </Link>{" "}
              e a{" "}
              <Link
                href={`/time/${team.slug}`}
                className="font-medium text-primary hover:underline"
              >
                página dedicada do {team.name}
              </Link>{" "}
              com todas as notícias, análises e estatísticas do time.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
