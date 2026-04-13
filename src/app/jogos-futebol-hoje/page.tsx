import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { siteConfig } from "@/lib/site";
import { GameSchedule } from "@/components/GameSchedule";

export const revalidate = 900; // 15 min

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

function getSchedule(): ScheduleData {
  const filePath = join(process.cwd(), "content", "jogos-hoje.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ScheduleData;
}

export const metadata: Metadata = {
  title: "Jogos de Futebol Hoje — Programação Completa na TV",
  description:
    "Confira todos os jogos de futebol hoje com horários, canais de TV e onde assistir ao vivo. Brasileirão, Libertadores, Champions League, Premier League e mais.",
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
    title: "Jogos de Futebol Hoje — Programação Completa na TV",
    description:
      "Todos os jogos de futebol de hoje com horários e canais. Atualizado diariamente.",
    url: `${siteConfig.url}/jogos-futebol-hoje`,
    siteName: siteConfig.name,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jogos de Futebol Hoje — Programação na TV",
    description:
      "Confira todos os jogos de futebol hoje com horários e canais de TV.",
  },
};

function buildJsonLd(schedule: ScheduleData) {
  return schedule.games.map((game) => ({
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
}

export default function JogosFutebolHojePage() {
  const schedule = getSchedule();
  const jsonLd = buildJsonLd(schedule);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* H1 */}
        <h1 className="mb-2 text-3xl font-black text-secondary sm:text-4xl">
          Jogos de Futebol Hoje
        </h1>
        <p className="mb-8 text-gray-500">
          Programação completa dos jogos de futebol na TV aberta, fechada e
          streaming. Atualizado diariamente.
        </p>

        {/* Schedule */}
        <GameSchedule
          games={schedule.games}
          date={schedule.date}
          updatedAt={schedule.updatedAt}
        />

        {/* SEO content */}
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
              Prime Video). Acompanhe também nossos{" "}
              <a
                href="/categoria/brasileirao"
                className="font-medium text-primary hover:underline"
              >
                artigos sobre o Brasileirão
              </a>{" "}
              e as{" "}
              <a
                href="/categoria/libertadores"
                className="font-medium text-primary hover:underline"
              >
                últimas da Libertadores
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
