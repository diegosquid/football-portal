import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articles } from "#content";
import { siteConfig } from "@/lib/site";
import { getAllTeams, getTeam, teamPlaysInGame, type Team } from "@/lib/teams";
import {
  compDo,
  competitionHasGame,
  getAllCompetitions,
  getCompetition,
  type Competition,
} from "@/lib/competitions";
import { ArticleCard } from "@/components/ArticleCard";
import { GameSchedule } from "@/components/GameSchedule";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { FAQPageJsonLd } from "@/components/JsonLd";
import { pelaCompetition, sportsEventJsonLd } from "@/lib/schedule-seo";
import {
  formatDateLongBR,
  getScheduleMeta,
  getTodayBRT,
  getTodayMatches,
  getUpcomingMatches,
  type Match,
} from "@/lib/matches";

export const revalidate = 900;

interface Props {
  params: Promise<{ team: string }>;
}

export function generateStaticParams() {
  return [
    ...getAllTeams().map((team) => ({ team: team.slug })),
    ...getAllCompetitions().map((comp) => ({ team: comp.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { team: slug } = await params;

  const comp = getCompetition(slug);
  if (comp) {
    const title = `Jogos ${compDo(comp)} Hoje: Horários, Canais e Onde Assistir`;
    const description = `Jogos ${compDo(comp)} hoje: horários, canais de transmissão e onde assistir ao vivo — mais os jogos de amanhã e os próximos da competição. Atualizado diariamente.`;
    return {
      title,
      description,
      keywords: [
        `jogos ${compDo(comp).toLowerCase()} hoje`,
        `jogos de hoje ${comp.shortName.toLowerCase()}`,
        `tem jogo ${compDo(comp).toLowerCase()} hoje`,
        `${comp.shortName.toLowerCase()} hoje`,
        `quem joga hoje pel${comp.artigo} ${comp.shortName.toLowerCase()}`,
        `jogos ${comp.shortName.toLowerCase()} amanhã`,
        `onde assistir ${comp.shortName.toLowerCase()}`,
        `próximos jogos ${comp.shortName.toLowerCase()}`,
      ],
      alternates: {
        canonical: `${siteConfig.url}/jogos-futebol-hoje/${comp.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}/jogos-futebol-hoje/${comp.slug}`,
        siteName: siteConfig.name,
        locale: "pt_BR",
        type: "website",
      },
    };
  }

  const team = getTeam(slug);
  if (!team) return {};

  const title = `${team.name} Hoje: Jogo, Horário, Onde Assistir e Próximo Jogo`;
  const description = `Veja se o ${team.name} joga hoje, o horário do jogo, canal de transmissão, o próximo jogo e as últimas notícias. Atualizado diariamente.`;

  return {
    title,
    description,
    keywords: [
      `${team.name.toLowerCase()} hoje`,
      `jogo do ${team.name.toLowerCase()} hoje`,
      `${team.name.toLowerCase()} joga hoje`,
      `próximo jogo do ${team.name.toLowerCase()}`,
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

function buildTeamFaq(
  team: Team,
  todayGames: Match[],
  upcoming: Match[],
): { question: string; answer: string }[] {
  const faq: { question: string; answer: string }[] = [];
  const next = upcoming[0];

  if (todayGames.length > 0) {
    const g = todayGames[0];
    faq.push({
      question: `O ${team.name} joga hoje?`,
      answer: `Sim! Hoje tem ${g.home} x ${g.away} às ${g.time} (horário de Brasília), ${pelaCompetition(g.competition)}${g.round ? ` — ${g.round}` : ""}. Transmissão: ${g.channel}.`,
    });
    faq.push({
      question: `Onde assistir o jogo do ${team.name} hoje?`,
      answer: `A transmissão de ${g.home} x ${g.away} fica com ${g.channel}.`,
    });
  } else {
    faq.push({
      question: `O ${team.name} joga hoje?`,
      answer: next
        ? `Não, o ${team.name} não joga hoje. O próximo jogo é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)} às ${next.time}, ${pelaCompetition(next.competition)}.`
        : `Não, o ${team.name} não tem jogo hoje nem nos próximos dias da nossa agenda. A programação é atualizada diariamente.`,
    });
  }

  if (next) {
    faq.push({
      question: `Qual é o próximo jogo do ${team.name}?`,
      answer: `O próximo jogo do ${team.name} é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)} às ${next.time} (Brasília), ${pelaCompetition(next.competition)}${next.round ? ` — ${next.round}` : ""}. Transmissão: ${next.channel}.`,
    });
  }

  return faq;
}

function CompetitionHojeView({ comp }: { comp: Competition }) {
  const todayGames = getTodayMatches().filter((g) =>
    competitionHasGame(comp, g.competition),
  );
  const upcoming = getUpcomingMatches().filter((g) =>
    competitionHasGame(comp, g.competition),
  );
  const { updatedAt } = getScheduleMeta();
  const today = getTodayBRT();

  const relatedArticles = comp.categorySlug
    ? articles
        .filter((a) => !a.draft && a.category === comp.categorySlug)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6)
    : [];

  const faq: { question: string; answer: string }[] = [
    todayGames.length > 0
      ? {
          question: `Tem jogo ${compDo(comp)} hoje?`,
          answer: `Sim! Hoje tem ${todayGames.length} ${todayGames.length === 1 ? "jogo" : "jogos"} ${compDo(comp)}: ${todayGames.map((g) => `${g.home} x ${g.away} às ${g.time} (${g.channel})`).join("; ")}.`,
        }
      : {
          question: `Tem jogo ${compDo(comp)} hoje?`,
          answer:
            upcoming.length > 0
              ? `Não, hoje não tem jogo ${compDo(comp)}. O próximo é ${upcoming[0].home} x ${upcoming[0].away}, ${formatDateLongBR(upcoming[0].date)} às ${upcoming[0].time}.`
              : `Não há jogos ${compDo(comp)} hoje nem nos próximos dias da nossa agenda. A programação é atualizada diariamente.`,
        },
  ];

  const jsonLd = [...todayGames, ...upcoming].map(sportsEventJsonLd);

  return (
    <>
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <FAQPageJsonLd items={faq} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-black text-secondary sm:text-4xl">
          Jogos {compDo(comp)} Hoje
        </h1>
        <p className="mb-8 text-gray-500">
          Confira os jogos {compDo(comp)} hoje — horários, canais de
          transmissão e onde assistir ao vivo — e os próximos jogos da
          competição. Veja também os{" "}
          <Link
            href="/jogos-de-amanha"
            className="font-medium text-primary hover:underline"
          >
            jogos de amanhã
          </Link>
          .
        </p>

        <section className="mb-10">
          <GameSchedule
            games={todayGames}
            date={today}
            updatedAt={updatedAt}
            emptyMessage={`Nenhum jogo ${compDo(comp)} hoje.`}
          />
        </section>

        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-secondary">
              Próximos jogos {compDo(comp)}
            </h2>
            <UpcomingMatches matches={upcoming} />
          </section>
        )}

        {relatedArticles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">
                Últimas {compDo(comp)}
              </h2>
              {comp.categorySlug && (
                <Link
                  href={`/categoria/${comp.categorySlug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver todas →
                </Link>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => (
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

        <ArticleFAQ items={faq} />

        <section className="mt-10 rounded-lg bg-surface p-6 text-sm text-gray-600">
          <p>
            Veja também a{" "}
            <Link
              href="/jogos-futebol-hoje"
              className="font-medium text-primary hover:underline"
            >
              programação completa dos jogos de hoje
            </Link>
            , os{" "}
            <Link
              href="/jogos-de-amanha"
              className="font-medium text-primary hover:underline"
            >
              jogos de amanhã
            </Link>{" "}
            e a{" "}
            <Link
              href="/jogos-da-semana"
              className="font-medium text-primary hover:underline"
            >
              agenda da semana
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}

export default async function TeamHojePage({ params }: Props) {
  const { team: slug } = await params;

  const comp = getCompetition(slug);
  if (comp) return <CompetitionHojeView comp={comp} />;

  const team = getTeam(slug);
  if (!team) notFound();

  const todayGames = getTodayMatches().filter((g) =>
    teamPlaysInGame(team.slug, g.home, g.away),
  );
  const upcomingGames = getUpcomingMatches().filter((g) =>
    teamPlaysInGame(team.slug, g.home, g.away),
  );
  const { updatedAt } = getScheduleMeta();
  const today = getTodayBRT();

  const teamArticles = articles
    .filter((a) => !a.draft && a.teams.includes(team.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const faq = buildTeamFaq(team, todayGames, upcomingGames);
  const jsonLd = [...todayGames, ...upcomingGames].map(sportsEventJsonLd);

  return (
    <>
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <FAQPageJsonLd items={faq} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-black text-secondary sm:text-4xl">
          {team.name} Hoje
        </h1>
        <p className="mb-8 text-gray-500">
          Confira se o {team.name} joga hoje, horário, canal, o próximo jogo e
          as últimas notícias do time.
        </p>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-secondary">
            Jogo do {team.name} Hoje
          </h2>

          {todayGames.length > 0 ? (
            <GameSchedule
              games={todayGames}
              date={today}
              updatedAt={updatedAt}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-lg font-semibold text-secondary">
                O {team.name} não joga hoje
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {upcomingGames.length > 0 ? (
                  <>
                    O próximo jogo é{" "}
                    <Link
                      href={`/onde-assistir/${upcomingGames[0].slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {upcomingGames[0].home} x {upcomingGames[0].away}
                    </Link>
                    , {formatDateLongBR(upcomingGames[0].date)} às{" "}
                    {upcomingGames[0].time}.
                  </>
                ) : (
                  <>
                    Confira a{" "}
                    <Link
                      href="/jogos-futebol-hoje"
                      className="font-medium text-primary hover:underline"
                    >
                      programação completa
                    </Link>{" "}
                    de todos os jogos de hoje ou veja as últimas notícias
                    abaixo.
                  </>
                )}
              </p>
            </div>
          )}
        </section>

        {upcomingGames.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-secondary">
              Próximos jogos do {team.name}
            </h2>
            <UpcomingMatches matches={upcomingGames} />
          </section>
        )}

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

        <ArticleFAQ items={faq} />

        <section className="mt-10 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            {team.name} joga hoje? Onde assistir?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              Acompanhe no <strong>Beira do Campo</strong> se o{" "}
              <strong>{team.name}</strong> joga hoje, o próximo jogo e onde
              assistir. Esta página é atualizada diariamente com os horários dos
              jogos, canais de transmissão na TV aberta, TV fechada e streaming,
              além das últimas notícias e artigos sobre o time.
            </p>
            <p>
              Confira também a{" "}
              <Link
                href="/jogos-futebol-hoje"
                className="font-medium text-primary hover:underline"
              >
                programação completa de todos os jogos de hoje
              </Link>
              , os{" "}
              <Link
                href="/jogos-de-amanha"
                className="font-medium text-primary hover:underline"
              >
                jogos de amanhã
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
