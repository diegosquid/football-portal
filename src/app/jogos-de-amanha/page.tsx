import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { GameSchedule } from "@/components/GameSchedule";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/JsonLd";
import {
  buildDayFaq,
  matchesItemListJsonLd,
  sportsEventJsonLd,
} from "@/lib/schedule-seo";
import {
  formatDateLongBR,
  formatDateShortBR,
  getScheduleMeta,
  getTomorrowBRT,
  getTomorrowMatches,
} from "@/lib/matches";

export const revalidate = 900; // 15 min

export function generateMetadata(): Metadata {
  const tomorrow = getTomorrowBRT();
  const games = getTomorrowMatches();
  const dateShort = formatDateShortBR(tomorrow);
  const dateLong = formatDateLongBR(tomorrow);

  const title = `Jogos de Futebol Amanhã (${dateShort}): Horários e Onde Assistir`;
  const description =
    games.length > 0
      ? `Veja os ${games.length} jogos de futebol amanhã, ${dateLong}: horários, canais de TV e onde assistir ao vivo. Programação atualizada diariamente.`
      : `Confira a programação dos jogos de futebol de amanhã, ${dateLong}, com horários e canais de TV. Atualizado diariamente.`;

  return {
    title,
    description,
    keywords: [
      "jogos de amanhã",
      "jogos de futebol amanhã",
      "futebol amanhã na tv",
      "programação futebol amanhã",
      "onde assistir futebol amanhã",
    ],
    alternates: {
      canonical: `${siteConfig.url}/jogos-de-amanha`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/jogos-de-amanha`,
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

export default function JogosDeAmanhaPage() {
  const games = getTomorrowMatches();
  const { updatedAt } = getScheduleMeta();
  const tomorrow = getTomorrowBRT();
  const faq = buildDayFaq(games, "amanhã", tomorrow);

  const jsonLd = games.map(sportsEventJsonLd);
  const itemListJsonLd = matchesItemListJsonLd(
    `Jogos de futebol amanhã (${formatDateShortBR(tomorrow)})`,
    "/jogos-de-amanha",
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
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Jogos de hoje", url: "/jogos-futebol-hoje" },
          { name: "Jogos de amanhã", url: "/jogos-de-amanha" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Agenda
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Jogos de Futebol Amanhã
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Todos os jogos de amanhã com horários, canais de TV e streaming.
          Programe-se para não perder nenhuma partida.
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/jogos-futebol-hoje"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            ← Jogos de hoje
          </Link>
          <Link
            href="/jogos-da-semana"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Agenda da semana →
          </Link>
        </nav>

        <GameSchedule
          games={games}
          date={tomorrow}
          updatedAt={updatedAt}
          emptyMessage="Nenhum jogo programado para amanhã."
        />

        <ArticleFAQ items={faq} />

        <section className="mt-12 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Que jogos vão passar amanhã na TV?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              O <strong>Beira do Campo</strong> lista os jogos de futebol de
              amanhã com horário de Brasília, competição e canal de transmissão
              — TV aberta, fechada e streaming. A agenda cobre{" "}
              <strong>Brasileirão</strong>, <strong>Copa do Mundo</strong>,{" "}
              <strong>Libertadores</strong>, <strong>Copa do Brasil</strong> e
              os principais campeonatos internacionais.
            </p>
            <p>
              Quer ver o que rola agora? Confira os{" "}
              <Link
                href="/jogos-futebol-hoje"
                className="font-medium text-primary hover:underline"
              >
                jogos de futebol de hoje
              </Link>{" "}
              ou a{" "}
              <Link
                href="/jogos-da-semana"
                className="font-medium text-primary hover:underline"
              >
                agenda completa da semana
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
