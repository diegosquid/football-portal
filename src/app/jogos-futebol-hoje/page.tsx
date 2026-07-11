import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { GameSchedule } from "@/components/GameSchedule";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { FAQPageJsonLd } from "@/components/JsonLd";
import { getAllCompetitions } from "@/lib/competitions";
import {
  buildDayFaq,
  matchesItemListJsonLd,
  sportsEventJsonLd,
} from "@/lib/schedule-seo";
import {
  formatDateLongBR,
  formatDateShortBR,
  getScheduleMeta,
  getTodayBRT,
  getTodayMatches,
  getTomorrowMatches,
} from "@/lib/matches";

export const revalidate = 900; // 15 min

export function generateMetadata(): Metadata {
  const today = getTodayBRT();
  const games = getTodayMatches();
  const dateShort = formatDateShortBR(today);
  const dateLong = formatDateLongBR(today);

  const title = `Jogos de Futebol Hoje (${dateShort}): Horários e Onde Assistir`;
  const description =
    games.length > 0
      ? `Veja os ${games.length} jogos de futebol hoje, ${dateLong}: horários, canais de TV e onde assistir ao vivo. Brasileirão, Copa do Mundo, Libertadores e mais.`
      : `Confira a programação dos jogos de futebol hoje, ${dateLong}, com horários, canais de TV e onde assistir ao vivo. Atualizado diariamente.`;

  return {
    title,
    description,
    keywords: [
      "jogos futebol hoje",
      "jogos de hoje",
      "futebol hoje na tv",
      "programação futebol hoje",
      "onde assistir futebol hoje",
      "jogos de futebol hoje ao vivo",
    ],
    alternates: {
      canonical: `${siteConfig.url}/jogos-futebol-hoje`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/jogos-futebol-hoje`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function JogosFutebolHojePage() {
  const games = getTodayMatches();
  const tomorrowGames = getTomorrowMatches();
  const { updatedAt } = getScheduleMeta();
  const today = getTodayBRT();
  const faq = buildDayFaq(games, "hoje", today);

  const jsonLd = games.map(sportsEventJsonLd);
  const itemListJsonLd = matchesItemListJsonLd(
    `Jogos de futebol hoje (${formatDateShortBR(today)})`,
    "/jogos-futebol-hoje",
    games,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {games.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <FAQPageJsonLd items={faq} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Em campo
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Jogos de Futebol Hoje
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Programação completa dos jogos de futebol na TV aberta, fechada e
          streaming. Atualizado diariamente.
        </p>

        {/* Navegação entre agendas */}
        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/jogos-de-amanha"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de amanhã →
          </Link>
          <Link
            href="/jogos-da-semana"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Agenda da semana →
          </Link>
        </nav>

        <GameSchedule games={games} date={today} updatedAt={updatedAt} />

        {/* Hubs por competição */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-extrabold text-ink">
            Jogos de hoje por competição
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {getAllCompetitions().map((comp) => (
              <Link
                key={comp.slug}
                href={`/jogos-futebol-hoje/${comp.slug}`}
                className="border border-ink/15 bg-white px-3 py-1.5 font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
              >
                {comp.shortName}
              </Link>
            ))}
          </div>
        </section>

        {/* Teaser de amanhã — interlinking + frescor */}
        {tomorrowGames.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-ink">
                Amanhã no futebol
              </h2>
              <Link
                href="/jogos-de-amanha"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <UpcomingMatches matches={tomorrowGames.slice(0, 5)} />
          </section>
        )}

        <ArticleFAQ items={faq} />

        <section className="mt-12 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Onde assistir futebol hoje?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              O <strong>Beira do Campo</strong> traz a programação completa dos
              jogos de futebol de hoje com todos os horários, canais de
              transmissão e competições. Aqui você encontra os jogos do{" "}
              <strong>Brasileirão</strong>, <strong>Copa do Brasil</strong>,{" "}
              <strong>Libertadores</strong>, <strong>Champions League</strong>,{" "}
              <strong>Premier League</strong>, <strong>La Liga</strong>,{" "}
              <strong>Serie A italiana</strong> e todas as outras competições que
              passam na TV brasileira.
            </p>
            <p>
              A lista é atualizada diariamente com os jogos que serão
              transmitidos na <strong>TV aberta</strong> (Globo, Band, Record),{" "}
              <strong>TV fechada</strong> (ESPN, SporTV, Premiere, TNT Sports) e{" "}
              <strong>streaming</strong> (Disney+, Paramount+, CazéTV, Amazon
              Prime Video). Veja também os{" "}
              <Link
                href="/jogos-de-amanha"
                className="font-medium text-primary hover:underline"
              >
                jogos de amanhã
              </Link>
              , a{" "}
              <Link
                href="/jogos-da-semana"
                className="font-medium text-primary hover:underline"
              >
                agenda da semana
              </Link>{" "}
              e nossos{" "}
              <Link
                href="/categoria/brasileirao"
                className="font-medium text-primary hover:underline"
              >
                artigos sobre o Brasileirão
              </Link>{" "}
              e as{" "}
              <Link
                href="/categoria/libertadores"
                className="font-medium text-primary hover:underline"
              >
                últimas da Libertadores
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
