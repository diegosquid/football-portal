import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { resolveTeamSlug } from "@/lib/teams";
import { compDo, getCompetition, resolveCompetitionSlug } from "@/lib/competitions";
import { pelaCompetition } from "@/lib/schedule-seo";
import { ProbabilityPanel } from "@/components/ProbabilityPanel";
import { getTeamRaces } from "@/lib/race";
import { hasStandings, standingsPath } from "@/lib/standings";
import { hasTopScorers, topScorersPath } from "@/lib/topscorers";
import { ChannelLanding } from "@/components/ChannelLanding";
import {
  channelPath,
  getChannel,
  getChannelSchedule,
  getPublishableChannels,
  type Channel,
} from "@/lib/channels";
import { ShareWhatsApp } from "@/components/ShareWhatsApp";
import { MatchPromoBanner } from "@/components/MatchPromoBanner";
import { buildMatchShareText } from "@/lib/share";
import {
  getPredictionFor,
  type Prediction,
} from "@/lib/probabilities";
import { absoluteUrl, siteConfig, truncateForMeta } from "@/lib/site";
import {
  daysUntil,
  getAllKnownMatches,
  getMatchBySlug,
  type Match,
} from "@/lib/matches";

/**
 * Slugs placeholder ("espanha-x-a-definir-2026-07-19") ficam indexados até o
 * confronto real ser definido — resolve pro slug atual do mesmo dia/time.
 */
async function resolvePlaceholderSlug(slug: string): Promise<string | undefined> {
  const parsed = slug.match(/^(.+)-x-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!parsed) return undefined;
  const [, homePart, awayPart, date] = parsed;
  if (!homePart.includes("a-definir") && !awayPart.includes("a-definir")) {
    return undefined;
  }
  const known = homePart.includes("a-definir") ? awayPart : homePart;
  if (known.includes("a-definir")) return undefined;
  return (await getAllKnownMatches()).find(
    (m) =>
      m.date === date &&
      (m.slug.startsWith(`${known}-x-`) || m.slug.includes(`-x-${known}-`)),
  )?.slug;
}

export const revalidate = 900; // 15 min — mesmo ritmo de jogos-futebol-hoje

/**
 * Canal que ganha jogo depois do build precisa de página sem esperar deploy.
 * Slug fora do generateStaticParams renderiza sob demanda e passa a ser cacheado.
 */
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Dois tipos de página moram nesta rota: jogo
 * ("flamengo-x-palmeiras-2026-08-10") e canal ("premiere").
 *
 * Ficam juntas de propósito para a URL do canal ser /onde-assistir/premiere, e
 * não /onde-assistir/canal/premiere — nessa SERP a URL curta é o ativo. Não há
 * risco de colisão: slug de jogo sempre tem a forma "-x-" + data, e a lista de
 * canais é curada em src/lib/channels.ts.
 */
export async function generateStaticParams() {
  const [matches, channelList] = await Promise.all([
    getAllKnownMatches(),
    getPublishableChannels(),
  ]);
  return [
    ...matches.map((m) => ({ slug: m.slug })),
    ...channelList.map((c) => ({ slug: c.slug })),
  ];
}

function formatMatchDateBR(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
}

function formatCountdown(days: number): string | null {
  if (days < 0) return "Jogo já realizado";
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

function channelIsDefined(channel: string): boolean {
  const normalized = channel.trim().toLowerCase();
  return (
    normalized !== "" &&
    normalized !== "a definir" &&
    normalized !== "tbd" &&
    normalized !== "a confirmar"
  );
}

function buildFaq(match: Match, prediction?: Prediction) {
  const dateFormatted = formatMatchDateBR(match.startDateIso);
  const isPast = daysUntil(match.date) < 0;
  const competicaoText = match.round
    ? `${match.competition} — ${match.round}`
    : match.competition;

  const faq: { question: string; answer: string }[] = [
    {
      question: `Que horas ${isPast ? "foi" : "é"} ${match.home} x ${match.away}?`,
      answer: `${match.home} x ${match.away} ${isPast ? "foi marcado" : "começa"} às ${match.time} (horário de Brasília), ${dateFormatted}.`,
    },
    {
      question: isPast
        ? `Onde passou ${match.home} x ${match.away}?`
        : `Onde assistir ${match.home} x ${match.away} ao vivo?`,
      answer: channelIsDefined(match.channel)
        ? `A transmissão ${isPast ? "foi" : "fica"} de ${match.channel}.`
        : isPast
          ? "A emissora da partida não foi registrada na agenda."
          : "A emissora ainda não foi confirmada. A programação é atualizada diariamente — volte para conferir.",
    },
    {
      question: "Qual é a competição?",
      answer: `Partida válida ${pelaCompetition(competicaoText)}.`,
    },
  ];

  if (channelIsDefined(match.channel)) {
    const passaNaGlobo = /\bglobo\b/i.test(match.channel);
    faq.push({
      question: `${match.home} x ${match.away} vai passar na Globo?`,
      answer: passaNaGlobo
        ? `${isPast ? "Sim. A Globo esteve" : "Sim! A Globo está"} entre as emissoras da partida. Transmissão completa: ${match.channel}.`
        : `${isPast ? "Não houve" : "Não haverá"} transmissão da TV Globo. ${isPast ? "A partida passou" : "Quem transmite"} em ${match.channel}.`,
    });
  }

  if (match.stadium) {
    faq.push({
      question: "Onde é o jogo?",
      answer: `O confronto será no ${match.stadium}.`,
    });
  }

  if (prediction) {
    const casa = Math.round(prediction.resultado.casa * 100);
    const empate = Math.round(prediction.resultado.empate * 100);
    const fora = Math.round(prediction.resultado.fora * 100);
    faq.push({
      question: `Qual é o palpite para ${match.home} x ${match.away}?`,
      answer: `O modelo do Beira do Campo calculou ${casa}% de chance para ${match.home}, ${empate}% de empate e ${fora}% para ${match.away}. O placar individual mais provável foi ${prediction.placarProvavel}.`,
    });
  }

  return faq;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const channel = getChannel(slug);
  if (channel) return channelMetadata(channel);

  const match = await getMatchBySlug(slug);
  if (!match) return {};

  const days = daysUntil(match.date);
  const prediction = await getPredictionFor(
    match.home,
    match.away,
    match.date,
  );
  const isPast = days < 0;
  const dateShort = match.date.split("-").reverse().slice(0, 2).join("/");
  const whenWord = days === 0 ? "hoje" : days === 1 ? "amanhã" : `dia ${dateShort}`;
  // "hoje (22/07)" / "amanhã (22/07)" / "(22/07)" — data no title ajuda o CTR
  const whenTitle = days === 0 || days === 1 ? `${whenWord} (${dateShort})` : `(${dateShort})`;
  const title = prediction
    ? prediction.actualResult
      ? `${match.home} ${prediction.actualResult.homeGoals} x ${prediction.actualResult.awayGoals} ${match.away}: resultado e palpite`
      : isPast
        ? `${match.home} x ${match.away} (${dateShort}): palpite e probabilidades`
        : `${match.home} x ${match.away} ${whenTitle}: palpite e onde assistir`
    : `${match.home} x ${match.away} ${whenTitle}: que horas é o jogo e onde assistir`;
  const descChannelPart = channelIsDefined(match.channel)
    ? ` Transmissão: ${match.channel}.`
    : " Emissora a definir.";
  const probabilityPart = prediction
    ? ` Palpite: ${Math.round(prediction.resultado.casa * 100)}% ${match.home}, ${Math.round(prediction.resultado.empate * 100)}% empate e ${Math.round(prediction.resultado.fora * 100)}% ${match.away}.`
    : "";
  const metaDescription = truncateForMeta(
    isPast
      ? `${match.home} x ${match.away}, ${dateShort}: veja o palpite estatístico, as probabilidades e as informações da partida ${pelaCompetition(match.competition)}.${probabilityPart}`
      : `${match.home} x ${match.away} ${whenWord}, às ${match.time} (Brasília): palpite, probabilidades e onde assistir.${probabilityPart}${descChannelPart}`,
    165,
  );
  const canonical = `/onde-assistir/${match.slug}`;

  return {
    title,
    description: metaDescription,
    alternates: { canonical },
    openGraph: {
      title,
      description: metaDescription,
      type: "website",
      url: `${siteConfig.url}${canonical}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
    },
  };
}

/** Metadata da landing de canal — a pergunta da busca vira o title. */
async function channelMetadata(channel: Channel): Promise<Metadata> {
  const schedule = await getChannelSchedule(channel.slug);
  const canonical = channelPath(channel.slug);
  const title = `Jogos de hoje no ${channel.name}: programação e horários`;
  const description = truncateForMeta(
    schedule.today.length > 0
      ? `${channel.name} transmite hoje: ${schedule.today
          .map((m) => `${m.home} x ${m.away} (${m.time})`)
          .join(", ")}. Veja a programação completa e os próximos jogos.`
      : `Programação de futebol do ${channel.name}: os jogos de hoje, os próximos e como assistir. Atualizado todos os dias.`,
    165,
  );

  return {
    title,
    description,
    keywords: channel.keywords,
    alternates: { canonical: `${siteConfig.url}${canonical}` },
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

export default async function OndeAssistirPage({ params }: Props) {
  const { slug } = await params;

  const channel = getChannel(slug);
  if (channel) {
    const schedule = await getChannelSchedule(slug);
    // Canal sem jogo nenhum na base não vira página: melhor 404 do que uma
    // landing vazia disputando "jogos de hoje no <canal>".
    if (schedule.total === 0) notFound();
    return <ChannelLanding channel={channel} schedule={schedule} />;
  }

  const match = await getMatchBySlug(slug);
  if (!match) {
    const resolved = await resolvePlaceholderSlug(slug);
    if (resolved) permanentRedirect(`/onde-assistir/${resolved}`);
    notFound();
  }

  const homeSlug = resolveTeamSlug(match.home);
  const awaySlug = resolveTeamSlug(match.away);

  const teamSlugs = [homeSlug, awaySlug].filter(
    (s): s is string => typeof s === "string",
  );
  const relatedArticles =
    teamSlugs.length > 0
      ? (await getPublishedArticles())
          .filter((a) => a.teams.some((t) => teamSlugs.includes(t)))
          .slice(0, 6)
      : [];

  const dateFormatted = formatMatchDateBR(match.startDateIso);
  const daysToGo = daysUntil(match.date);
  const countdown = formatCountdown(daysToGo);
  const hasChannel = channelIsDefined(match.channel);

  const competitionSlug = resolveCompetitionSlug(match.competition);
  const competitionHub = competitionSlug
    ? getCompetition(competitionSlug)
    : undefined;

  const prediction = await getPredictionFor(
    match.home,
    match.away,
    match.date,
  );
  const faq = buildFaq(match, prediction);

  // Destinos desta pagina, do que mais converte pro que menos.
  const standingsSlug = competitionSlug ?? "";
  const [raceHome, raceAway, showStandings, showScorers] = await Promise.all([
    homeSlug ? getTeamRaces(homeSlug) : Promise.resolve([]),
    awaySlug ? getTeamRaces(awaySlug) : Promise.resolve([]),
    standingsSlug ? hasStandings(standingsSlug) : Promise.resolve(false),
    standingsSlug ? hasTopScorers(standingsSlug) : Promise.resolve(false),
  ]);

  const teamLinks: { href: string; label: string }[] = [
    ...(raceHome.length > 0 && homeSlug
      ? [{ href: `/probabilidades/${homeSlug}`, label: `Chances do ${match.home}` }]
      : []),
    ...(raceAway.length > 0 && awaySlug
      ? [{ href: `/probabilidades/${awaySlug}`, label: `Chances do ${match.away}` }]
      : []),
    ...(showStandings
      ? [
          {
            href: standingsPath(standingsSlug),
            label: `Tabela ${competitionHub ? compDo(competitionHub) : ""}`.trim(),
          },
        ]
      : []),
    ...(showScorers
      ? [
          {
            href: topScorersPath(standingsSlug),
            label: `Artilharia ${competitionHub ? compDo(competitionHub) : ""}`.trim(),
          },
        ]
      : []),
    ...(competitionHub
      ? [
          {
            href: `/jogos-futebol-hoje/${competitionHub.slug}`,
            label: `Jogos ${compDo(competitionHub)} hoje`,
          },
        ]
      : []),
    ...(homeSlug ? [{ href: `/time/${homeSlug}`, label: `Notícias do ${match.home}` }] : []),
    ...(awaySlug ? [{ href: `/time/${awaySlug}`, label: `Notícias do ${match.away}` }] : []),
  ];

  // SportsEvent schema (enriched vs. /jogos-futebol-hoje)
  const channelForSchema = hasChannel ? match.channel : "A definir";
  const homeTeamSchema = { "@type": "SportsTeam", name: match.home };
  const awayTeamSchema = { "@type": "SportsTeam", name: match.away };
  const sportsEventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.home} x ${match.away}`,
    sport: "Futebol",
    startDate: match.startDateIso,
    eventStatus:
      daysToGo < 0
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: match.stadium
      ? { "@type": "Place", name: match.stadium }
      : undefined,
    homeTeam: homeTeamSchema,
    awayTeam: awayTeamSchema,
    competitor: [homeTeamSchema, awayTeamSchema],
    description: `${match.competition}${match.round ? ` — ${match.round}` : ""} — Transmissão: ${channelForSchema}`,
    url: absoluteUrl(`/onde-assistir/${match.slug}`),
  };

  // BroadcastEvent — elegibilidade pra rich results de transmissão ao vivo
  const broadcastServices = hasChannel
    ? match.channel
        .split("/")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
  const broadcastJsonLd =
    broadcastServices.length > 0 && daysToGo >= 0
      ? {
          "@context": "https://schema.org",
          "@type": "BroadcastEvent",
          name: `Transmissão ao vivo: ${match.home} x ${match.away}`,
          isLiveBroadcast: true,
          inLanguage: "pt-BR",
          startDate: match.startDateIso,
          broadcastOfEvent: {
            "@type": "SportsEvent",
            name: `${match.home} x ${match.away}`,
            startDate: match.startDateIso,
            url: absoluteUrl(`/onde-assistir/${match.slug}`),
          },
          publishedOn: broadcastServices.map((name) => ({
            "@type": "BroadcastService",
            name,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventJsonLd) }}
      />
      {broadcastJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(broadcastJsonLd) }}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Jogos de hoje", url: "/jogos-futebol-hoje" },
          {
            name: `${match.home} x ${match.away}`,
            url: `/onde-assistir/${match.slug}`,
          },
        ]}
      />
      <FAQPageJsonLd items={faq} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb visual */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link href="/jogos-futebol-hoje" className="hover:text-primary">
            Jogos de hoje
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">
            {match.home} x {match.away}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {match.competition}
              {match.round ? ` — ${match.round}` : ""}
            </span>
            {countdown && (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  daysToGo === 0
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {countdown}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight text-secondary lg:text-4xl">
            {prediction?.actualResult
              ? `${match.home} ${prediction.actualResult.homeGoals} x ${prediction.actualResult.awayGoals} ${match.away}: resultado e palpite`
              : prediction && daysToGo < 0
                ? `${match.home} x ${match.away}: palpite e informações do jogo`
                : prediction
                  ? `${match.home} x ${match.away}: palpite e onde assistir`
              : `Onde assistir ${match.home} x ${match.away}`}
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:text-lg">
            {match.home} e {match.away}{" "}
            {daysToGo < 0 ? "se enfrentaram" : "se enfrentam"} {dateFormatted} às{" "}
            <strong>{match.time}</strong> (horário de Brasília)
            {match.stadium ? <>, no <strong>{match.stadium}</strong></> : null}.{" "}
            {hasChannel ? (
              <>
                A transmissão {daysToGo < 0 ? "ficou" : "fica"} com{" "}
                <strong>{match.channel}</strong>.
              </>
            ) : (
              <>
                {daysToGo < 0
                  ? "A emissora não foi registrada na agenda."
                  : "A emissora ainda não foi confirmada."}
              </>
            )}
          </p>
        </header>

        {/* Resposta direta — intenção "que horas é o jogo" */}
        <section className="mb-8 border-l-4 border-primary bg-surface p-5">
          <h2 className="text-lg font-bold text-secondary">
            Que horas {daysToGo < 0 ? "foi" : "é"} {match.home} x {match.away}?
          </h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            O jogo entre {match.home} e {match.away}{" "}
            {daysToGo < 0 ? "foi marcado para" : "começa"} às{" "}
            <strong className="text-secondary">{match.time}</strong> (horário
            de Brasília), {dateFormatted}
            {hasChannel ? (
              <>
                , com transmissão de <strong>{match.channel}</strong>
              </>
            ) : null}
            .
          </p>
        </section>

        {/* Ficha técnica */}
        <section className="mb-10 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 bg-gray-50 px-5 py-3 text-sm font-bold uppercase tracking-wider text-gray-600">
            Ficha do jogo
          </h2>
          <dl className="divide-y divide-gray-100 text-sm">
            <div className="flex justify-between px-5 py-3">
              <dt className="font-medium text-gray-500">Horário</dt>
              <dd className="font-semibold text-secondary">
                {match.time} (Brasília)
              </dd>
            </div>
            <div className="flex justify-between px-5 py-3">
              <dt className="font-medium text-gray-500">Transmissão</dt>
              <dd className="font-semibold text-secondary">
                {hasChannel ? match.channel : "A definir"}
              </dd>
            </div>
            <div className="flex justify-between px-5 py-3">
              <dt className="font-medium text-gray-500">Competição</dt>
              <dd className="font-semibold text-secondary">
                {match.competition}
                {match.round ? ` — ${match.round}` : ""}
              </dd>
            </div>
            {match.stadium && (
              <div className="flex justify-between px-5 py-3">
                <dt className="font-medium text-gray-500">Estádio</dt>
                <dd className="font-semibold text-secondary">
                  {match.stadium}
                </dd>
              </div>
            )}
            <div className="flex justify-between px-5 py-3">
              <dt className="font-medium text-gray-500">Data</dt>
              <dd className="font-semibold capitalize text-secondary">
                {dateFormatted}
              </dd>
            </div>
          </dl>
        </section>

        {/* Probabilidades — modelo próprio (aparece quando há predição do jogo) */}
        {prediction && (
          <section className="mb-10">
            <h2 className="mb-1 text-lg font-bold text-secondary">
              {prediction.actualResult
                ? "Palpite do modelo e resultado"
                : "Palpite e probabilidades: quem tem mais chance?"}
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Estimativa do nosso modelo estatístico para {match.home} x{" "}
              {match.away}.
            </p>
            <ProbabilityPanel prediction={prediction} />
            {prediction.actualResult && (
              <div className="mt-3 border-l-4 border-primary bg-surface p-4 text-sm text-gray-700">
                Resultado registrado:{" "}
                <strong>
                  {match.home} {prediction.actualResult.homeGoals} x{" "}
                  {prediction.actualResult.awayGoals} {match.away}
                </strong>
                . Este jogo já entra no acompanhamento público de desempenho do
                modelo.
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Estimativa estatística (modelo de Poisson) — não é garantia de
              resultado.{" "}
              <Link
                href="/probabilidades"
                className="font-medium text-primary hover:underline"
              >
                Veja como calculamos e acompanhamos o desempenho
              </Link>
              .
            </p>
          </section>
        )}

        <div className="mb-10">
          <MatchPromoBanner matchSlug={match.slug} />
        </div>

        {/* Compartilhar o jogo — intenção alta: "que horas é e onde passa" */}
        <section className="mb-10 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            Passa pra frente
          </p>
          <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Manda no grupo quem vai assistir
          </h2>
          <p className="mb-4 mt-1.5 text-sm leading-relaxed text-gray-700">
            Mensagem pronta com horário, canal
            {prediction ? " e o palpite do nosso modelo" : ""} — é só colar.
          </p>
          <ShareWhatsApp
            text={buildMatchShareText(match, {
              whenLabel:
                daysToGo === 0
                  ? "Hoje"
                  : daysToGo === 1
                    ? "Amanhã"
                    : dateFormatted,
              odds: prediction
                ? {
                    casa: Math.round(prediction.resultado.casa * 100),
                    empate: Math.round(prediction.resultado.empate * 100),
                    fora: Math.round(prediction.resultado.fora * 100),
                  }
                : undefined,
            })}
            contentType="jogo"
            itemId={match.slug}
            label="Mandar no grupo"
            size="large"
            fullWidth
          />
        </section>

        {/*
          Para onde esta pagina empurra o leitor.

          A ordem segue o Search Console (mai-ago/2026), nao a intuicao: estas
          paginas de jogo sao 67% dos cliques organicos do site, entao sao elas
          que distribuem autoridade. Antes, os primeiros links iam para
          /time/<slug>, que fez 225 impressoes e ZERO cliques em 92 dias.
          /probabilidades converte a 9,3% — o melhor CTR do site — e quase nao
          recebe impressao. Inverter a ordem e a mudanca mais barata que existe
          aqui.
        */}
        {(homeSlug || awaySlug || competitionHub) && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold text-secondary">
              Continue por aqui
            </h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {teamLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest articles */}
        {relatedArticles.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-secondary">
              Últimas notícias
            </h2>
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

        {/* FAQ */}
        <ArticleFAQ items={faq} />

        {/* CTA for full schedule */}
        <section className="mt-10 rounded-lg bg-surface p-6 text-sm text-gray-600">
          <p>
            Veja a{" "}
            <Link
              href="/jogos-futebol-hoje"
              className="font-medium text-primary hover:underline"
            >
              programação completa dos jogos de hoje
            </Link>{" "}
            com horários e canais de TV para todas as competições.
          </p>
        </section>
      </div>
    </>
  );
}
