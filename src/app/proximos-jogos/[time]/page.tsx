import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { getAllTeams, getTeam, teamPlaysInGame } from "@/lib/teams";
import { getPredictionResolver } from "@/lib/probabilities";
import { absoluteUrl, siteConfig, truncateForMeta } from "@/lib/site";
import {
  daysUntil,
  formatDateLongBR,
  formatDateShortBR,
  getAllKnownMatches,
  getTodayBRT,
  type Match,
} from "@/lib/matches";

export const revalidate = 900; // 15 min

interface Props {
  params: Promise<{ time: string }>;
}

/** Todos os confrontos conhecidos do time, ordenados por data ascendente. */
async function matchesOfTeam(teamSlug: string): Promise<Match[]> {
  return (await getAllKnownMatches())
    .filter((m) => teamPlaysInGame(teamSlug, m.home, m.away))
    .sort((a, b) =>
      a.date === b.date
        ? a.time.localeCompare(b.time)
        : a.date.localeCompare(b.date),
    );
}

function splitByDate(matches: Match[]) {
  const today = getTodayBRT();
  return {
    upcoming: matches.filter((m) => m.date >= today),
    past: matches.filter((m) => m.date < today).reverse(), // mais recente primeiro
  };
}

/** Só gera páginas para times que realmente têm jogos na base. */
export async function generateStaticParams() {
  const known = await getAllKnownMatches();
  return getAllTeams()
    .filter((t) =>
      known.some((m) => teamPlaysInGame(t.slug, m.home, m.away)),
    )
    .map((t) => ({ time: t.slug }));
}

function opponentOf(match: Match, teamName: string) {
  const isHome = match.home.includes(teamName) || teamName.includes(match.home);
  return {
    isHome,
    opponent: isHome ? match.away : match.home,
  };
}

function channelIsDefined(channel: string): boolean {
  const n = channel.trim().toLowerCase();
  return n !== "" && n !== "a definir" && n !== "tbd" && n !== "a confirmar";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { time } = await params;
  const team = getTeam(time);
  if (!team) return {};

  const { upcoming } = splitByDate(await matchesOfTeam(team.slug));
  const next = upcoming[0];

  const title = `Próximo jogo do ${team.name}: data, horário e onde assistir`;
  const description = next
    ? truncateForMeta(
        `Quando joga o ${team.name}? Próximo jogo é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)} às ${next.time} (Brasília). Veja o calendário completo com datas, horários e onde assistir.`,
        165,
      )
    : `Calendário do ${team.name}: veja os próximos jogos com datas, horários, competição e onde assistir cada partida.`;

  const canonical = `/proximos-jogos/${team.slug}`;

  return {
    title,
    description,
    keywords: [
      `próximo jogo do ${team.name}`,
      `próximos jogos do ${team.name}`,
      `calendário do ${team.name}`,
      `quando joga o ${team.name}`,
      `jogos do ${team.name}`,
      `agenda do ${team.name}`,
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}${canonical}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProximosJogosPage({ params }: Props) {
  const { time } = await params;
  const team = getTeam(time);
  if (!team) notFound();

  const [all, predictionFor] = await Promise.all([
    matchesOfTeam(team.slug),
    getPredictionResolver(),
  ]);
  if (all.length === 0) notFound();

  const { upcoming, past } = splitByDate(all);
  const next = upcoming[0];
  const recentPast = past.slice(0, 5);

  const faq = [
    {
      question: `Quando é o próximo jogo do ${team.name}?`,
      answer: next
        ? `O próximo jogo do ${team.name} é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)}, às ${next.time} (horário de Brasília), ${next.round ? `${next.competition} — ${next.round}` : next.competition}.`
        : `Não há jogos confirmados do ${team.name} na agenda no momento. A programação é atualizada diariamente.`,
    },
    {
      question: `Onde assistir os jogos do ${team.name}?`,
      answer:
        next && channelIsDefined(next.channel)
          ? `A transmissão do próximo jogo fica com ${next.channel}. Cada partida do calendário tem a emissora indicada — os canais variam por competição e por mandante.`
          : `Os canais variam por competição e por mandante. Consulte o calendário acima: cada jogo mostra a emissora confirmada.`,
    },
    {
      question: `Quantos jogos o ${team.name} tem pela frente?`,
      answer: `Há ${upcoming.length} ${upcoming.length === 1 ? "jogo confirmado" : "jogos confirmados"} do ${team.name} na agenda do Beira do Campo, com data, horário e transmissão.`,
    },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Próximos jogos do ${team.name}`,
    url: absoluteUrl(`/proximos-jogos/${team.slug}`),
    numberOfItems: upcoming.length,
    itemListElement: upcoming.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.home} x ${m.away}`,
      url: absoluteUrl(`/onde-assistir/${m.slug}`),
    })),
  };

  const teamJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Futebol",
    url: absoluteUrl(`/proximos-jogos/${team.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }}
      />
      {upcoming.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Times", url: "/time" },
          {
            name: `Próximo jogo do ${team.name}`,
            url: `/proximos-jogos/${team.slug}`,
          },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Calendário
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
          Próximo jogo do {team.name}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Veja quando o {team.name} joga, o horário, a competição e onde
          assistir. A agenda completa aparece logo abaixo e é atualizada
          diariamente.
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href={`/jogos-futebol-hoje/${team.slug}`}
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {team.name} hoje
          </Link>
          <Link
            href={`/time/${team.slug}`}
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Notícias do {team.name}
          </Link>
          <Link
            href="/probabilidades"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Palpites
          </Link>
        </nav>

        {/* Próximo jogo em destaque — responde "quando joga o X?" */}
        {next && (
          <section className="mb-10 border-l-4 border-primary bg-surface p-5">
            <h2 className="text-lg font-bold text-secondary">
              Quando é o próximo jogo do {team.name}?
            </h2>
            <p className="mt-2 leading-relaxed text-gray-700">
              <Link
                href={`/onde-assistir/${next.slug}`}
                className="font-bold text-secondary hover:text-primary"
              >
                {next.home} x {next.away}
              </Link>{" "}
              <span className="font-mono text-xs uppercase tracking-wide text-gray-500">
                {next.competition}
                {next.round ? ` · ${next.round}` : ""}
              </span>{" "}
              — {formatDateLongBR(next.date)}, às{" "}
              <strong className="text-secondary">{next.time}</strong> (Brasília)
              {next.stadium ? <>, no {next.stadium}</> : null}.{" "}
              {channelIsDefined(next.channel) ? (
                <>
                  Transmissão: <strong>{next.channel}</strong>.
                </>
              ) : (
                <>Emissora ainda não confirmada.</>
              )}{" "}
              <span className="font-mono text-xs uppercase tracking-wide text-gray-500">
                {daysUntil(next.date) === 0
                  ? "· hoje"
                  : daysUntil(next.date) === 1
                    ? "· amanhã"
                    : `· em ${daysUntil(next.date)} dias`}
              </span>
            </p>
          </section>
        )}

        {/* Agenda */}
        <section className="mb-12">
          <h2 className="mb-4 border-b-2 border-ink pb-2 font-display text-2xl font-extrabold tracking-tight text-ink">
            Calendário do {team.name}
          </h2>
          {upcoming.length > 0 ? (
            <div className="border border-ink/15 bg-white">
              {upcoming.map((m, idx) => {
                const { isHome, opponent } = opponentOf(m, team.name);
                const pred = predictionFor(m.home, m.away, m.date);
                const teamChance = pred
                  ? Math.round(
                      (isHome ? pred.resultado.casa : pred.resultado.fora) * 100,
                    )
                  : null;
                return (
                  <Link
                    key={m.slug}
                    href={`/onde-assistir/${m.slug}`}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-lima/20 sm:gap-4 ${
                      idx > 0 ? "border-t border-ink/10" : ""
                    }`}
                  >
                    <div className="w-14 shrink-0 border-r border-ink/10 pr-3 text-center">
                      <div className="font-mono text-sm font-bold text-primary">
                        {formatDateShortBR(m.date)}
                      </div>
                      <div className="font-mono text-[11px] text-gray-500">
                        {m.time}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-bold text-ink sm:text-base">
                        <span className="font-mono text-[11px] uppercase text-gray-500">
                          {isHome ? "casa" : "fora"}
                        </span>{" "}
                        {opponent}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-gray-500">
                        {m.competition}
                        {m.round ? ` · ${m.round}` : ""}
                        {teamChance !== null && (
                          <span className="text-primary">
                            {" "}
                            · {teamChance}% de chance
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="border border-ink/15 bg-cal px-2 py-1 font-mono text-[11px] font-medium text-gray-700">
                        {channelIsDefined(m.channel) ? m.channel : "A definir"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="border border-ink/15 bg-white p-6 text-gray-600">
              Nenhum jogo confirmado do {team.name} na agenda no momento. A
              programação é atualizada diariamente — volte para conferir.
            </p>
          )}
        </section>

        {/* Últimos jogos — aproveita o histórico */}
        {recentPast.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 border-b-2 border-ink pb-2 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimos jogos do {team.name}
            </h2>
            <div className="border border-ink/15 bg-white/40">
              {recentPast.map((m, idx) => {
                const pred = predictionFor(m.home, m.away, m.date);
                const score = pred?.actualResult;
                return (
                  <Link
                    key={m.slug}
                    href={`/onde-assistir/${m.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-lima/20 ${
                      idx > 0 ? "border-t border-ink/10" : ""
                    }`}
                  >
                    <span className="w-14 shrink-0 font-mono text-xs text-gray-500">
                      {formatDateShortBR(m.date)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-ink">
                      {m.home}{" "}
                      {score ? (
                        <span className="font-mono text-primary">
                          {score.homeGoals} x {score.awayGoals}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-gray-400">
                          ×
                        </span>
                      )}{" "}
                      {m.away}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-gray-500">
                      {m.competition}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <ArticleFAQ items={faq} />

        <section className="mt-10 rounded-lg bg-surface p-6 text-sm leading-relaxed text-gray-600">
          <p>
            Procurando os jogos de outros times? Veja a{" "}
            <Link
              href="/jogos-futebol-hoje"
              className="font-medium text-primary hover:underline"
            >
              programação completa de hoje
            </Link>
            , a{" "}
            <Link
              href="/jogos-da-semana"
              className="font-medium text-primary hover:underline"
            >
              agenda da semana
            </Link>{" "}
            ou os{" "}
            <Link
              href="/probabilidades"
              className="font-medium text-primary hover:underline"
            >
              palpites do nosso modelo estatístico
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
