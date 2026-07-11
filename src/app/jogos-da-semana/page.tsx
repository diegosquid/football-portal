import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { GameSchedule } from "@/components/GameSchedule";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/JsonLd";
import {
  matchesItemListJsonLd,
  sportsEventJsonLd,
} from "@/lib/schedule-seo";
import {
  formatDateLongBR,
  getAllMatches,
  getScheduleMeta,
  getTodayBRT,
  type Match,
} from "@/lib/matches";

export const revalidate = 900; // 15 min

export function generateMetadata(): Metadata {
  const matches = getAllMatches();

  const title = "Jogos da Semana: Agenda do Futebol com Datas, Horários e Canais";
  const description =
    matches.length > 0
      ? `Agenda do futebol: ${matches.length} jogos nos próximos dias com data, horário e onde assistir. Brasileirão, Copa do Mundo, Libertadores e mais.`
      : "Agenda do futebol com os jogos dos próximos dias: data, horário e onde assistir. Atualizada diariamente.";

  return {
    title,
    description,
    keywords: [
      "jogos da semana",
      "agenda de jogos",
      "jogos de futebol da semana",
      "próximos jogos",
      "programação do futebol",
    ],
    alternates: {
      canonical: `${siteConfig.url}/jogos-da-semana`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/jogos-da-semana`,
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

function buildWeekFaq(matches: Match[]): { question: string; answer: string }[] {
  if (matches.length === 0) {
    return [
      {
        question: "Quais são os jogos da semana?",
        answer:
          "A agenda dos próximos dias ainda não foi publicada. Ela é atualizada diariamente com horários e canais de transmissão.",
      },
    ];
  }

  const faq: { question: string; answer: string }[] = [];
  const highlights = matches
    .filter(
      (m) =>
        m.competition.startsWith("Copa do Mundo") ||
        m.competition.startsWith("Brasileirão Série A") ||
        m.competition === "Libertadores",
    )
    .slice(0, 6);
  const list = (highlights.length > 0 ? highlights : matches.slice(0, 6))
    .map(
      (m) =>
        `${m.home} x ${m.away} (${formatDateLongBR(m.date)}, ${m.time}, ${m.channel})`,
    )
    .join("; ");

  faq.push({
    question: "Quais são os principais jogos da semana?",
    answer: `Os destaques da agenda são: ${list}.`,
  });

  const competitions = [...new Set(matches.map((m) => m.competition))];
  faq.push({
    question: "Quais competições têm jogos nesta semana?",
    answer: `A agenda da semana tem jogos de: ${competitions.join(", ")}.`,
  });

  return faq;
}

export default function JogosDaSemanaPage() {
  const matches = getAllMatches();
  const { updatedAt } = getScheduleMeta();
  const today = getTodayBRT();

  const byDate = matches.reduce<Record<string, Match[]>>((acc, m) => {
    (acc[m.date] ??= []).push(m);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();

  const faq = buildWeekFaq(matches);
  const jsonLd = matches.map(sportsEventJsonLd);
  const itemListJsonLd = matchesItemListJsonLd(
    "Jogos da semana — agenda do futebol",
    "/jogos-da-semana",
    matches,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {matches.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Jogos de hoje", url: "/jogos-futebol-hoje" },
          { name: "Jogos da semana", url: "/jogos-da-semana" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Agenda
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Jogos da Semana
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Agenda do futebol nos próximos dias: data, horário de Brasília,
          competição e onde assistir cada partida.
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/jogos-futebol-hoje"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            ← Jogos de hoje
          </Link>
          <Link
            href="/jogos-de-amanha"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de amanhã →
          </Link>
        </nav>

        {dates.length === 0 ? (
          <GameSchedule
            games={[]}
            date={today}
            updatedAt={updatedAt}
            emptyMessage="Agenda em atualização — volte em breve."
          />
        ) : (
          <div className="space-y-12">
            {dates.map((date, i) => (
              <GameSchedule
                key={date}
                games={byDate[date]}
                date={date}
                updatedAt={i === 0 ? updatedAt : undefined}
              />
            ))}
          </div>
        )}

        <ArticleFAQ items={faq} />

        <section className="mt-12 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Agenda do futebol na TV
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            O <strong>Beira do Campo</strong> reúne aqui os jogos confirmados
            dos próximos dias com canal de transmissão na TV aberta, fechada e
            streaming. Para a programação detalhada do dia, veja os{" "}
            <Link
              href="/jogos-futebol-hoje"
              className="font-medium text-primary hover:underline"
            >
              jogos de hoje
            </Link>{" "}
            e os{" "}
            <Link
              href="/jogos-de-amanha"
              className="font-medium text-primary hover:underline"
            >
              jogos de amanhã
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
