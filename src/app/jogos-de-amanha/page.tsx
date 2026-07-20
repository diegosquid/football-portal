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

  const title = `Jogos de Futebol Amanhã na TV (${dateShort}): Horários e Onde Assistir`;
  const description =
    games.length > 0
      ? `Veja os ${games.length} jogos de futebol amanhã na TV, ${dateLong}: horários, canais e onde assistir ao vivo. Programação atualizada diariamente.`
      : `Confira a programação dos jogos de futebol de amanhã na TV, ${dateLong}, com horários e canais. Atualizado diariamente.`;

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

  // Agrupa por canal individual (um jogo "Globo / SporTV" aparece nos dois)
  const channelMap = new Map<string, typeof games>();
  for (const g of games) {
    const norm = g.channel.trim().toLowerCase();
    if (!norm || ["a definir", "tbd", "a confirmar"].includes(norm)) continue;
    for (const c of g.channel.split("/").map((s) => s.trim()).filter(Boolean)) {
      channelMap.set(c, [...(channelMap.get(c) ?? []), g]);
    }
  }
  const channelGroups = [...channelMap.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

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
          Jogos de Futebol Amanhã na TV
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

        {channelGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
              Onde vai passar: jogos de amanhã por canal
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {channelGroups.map(([channel, list]) => (
                <div
                  key={channel}
                  className="border border-ink/15 bg-white p-4"
                >
                  <h3 className="font-bold text-ink">{channel}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                    {list.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/onde-assistir/${g.slug}`}
                          className="font-medium text-secondary transition-colors hover:text-primary"
                        >
                          {g.home} x {g.away}
                        </Link>{" "}
                        — {g.time}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

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
