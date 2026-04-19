import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articles } from "#content";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { resolveTeamSlug } from "@/lib/teams";
import { absoluteUrl, siteConfig, truncateForMeta } from "@/lib/site";
import {
  daysUntil,
  getAllMatches,
  getMatchBySlug,
  type Match,
} from "@/lib/matches";

export const revalidate = 900; // 15 min — mesmo ritmo de jogos-futebol-hoje

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllMatches().map((m) => ({ slug: m.slug }));
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

function buildFaq(match: Match) {
  const dateFormatted = formatMatchDateBR(match.startDateIso);
  const competicaoText = match.round
    ? `${match.competition} — ${match.round}`
    : match.competition;

  const faq: { question: string; answer: string }[] = [
    {
      question: `Que horas é ${match.home} x ${match.away}?`,
      answer: `${match.home} x ${match.away} começa às ${match.time} (horário de Brasília), ${dateFormatted}.`,
    },
    {
      question: `Onde assistir ${match.home} x ${match.away} ao vivo?`,
      answer: channelIsDefined(match.channel)
        ? `A transmissão fica com ${match.channel}.`
        : "A emissora ainda não foi confirmada. A programação é atualizada diariamente — volte para conferir.",
    },
    {
      question: "Qual é a competição?",
      answer: `Partida válida pelo ${competicaoText}.`,
    },
  ];

  if (match.stadium) {
    faq.push({
      question: "Onde é o jogo?",
      answer: `O confronto será no ${match.stadium}.`,
    });
  }

  return faq;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = getMatchBySlug(slug);
  if (!match) return {};

  const days = daysUntil(match.date);
  const whenWord = days === 0 ? "hoje" : days === 1 ? "amanhã" : `dia ${match.date.split("-").reverse().slice(0, 2).join("/")}`;
  const title = `${match.home} x ${match.away}: horário, onde assistir e canal`;
  const descChannelPart = channelIsDefined(match.channel)
    ? ` Transmissão: ${match.channel}.`
    : " Emissora a definir.";
  const metaDescription = truncateForMeta(
    `${match.home} x ${match.away} ${whenWord} pelo ${match.competition}: horário (${match.time}) e onde assistir ao vivo.${descChannelPart}`,
    160,
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

export default async function OndeAssistirPage({ params }: Props) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);
  if (!match) notFound();

  const homeSlug = resolveTeamSlug(match.home);
  const awaySlug = resolveTeamSlug(match.away);

  const teamSlugs = [homeSlug, awaySlug].filter(
    (s): s is string => typeof s === "string",
  );
  const relatedArticles =
    teamSlugs.length > 0
      ? articles
          .filter(
            (a) =>
              !a.draft && a.teams.some((t) => teamSlugs.includes(t)),
          )
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 6)
      : [];

  const faq = buildFaq(match);
  const dateFormatted = formatMatchDateBR(match.startDateIso);
  const daysToGo = daysUntil(match.date);
  const countdown = formatCountdown(daysToGo);
  const hasChannel = channelIsDefined(match.channel);

  // SportsEvent schema (enriched vs. /jogos-futebol-hoje)
  const channelForSchema = hasChannel ? match.channel : "A definir";
  const sportsEventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.home} x ${match.away}`,
    startDate: match.startDateIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: match.stadium
      ? { "@type": "Place", name: match.stadium }
      : undefined,
    homeTeam: { "@type": "SportsTeam", name: match.home },
    awayTeam: { "@type": "SportsTeam", name: match.away },
    description: `${match.competition}${match.round ? ` — ${match.round}` : ""} — Transmissão: ${channelForSchema}`,
    url: absoluteUrl(`/onde-assistir/${match.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventJsonLd) }}
      />
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
            Onde assistir {match.home} x {match.away}
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:text-lg">
            {match.home} e {match.away} se enfrentam {dateFormatted} às{" "}
            <strong>{match.time}</strong> (horário de Brasília)
            {match.stadium ? <>, no <strong>{match.stadium}</strong></> : null}.{" "}
            {hasChannel ? (
              <>
                A transmissão fica com <strong>{match.channel}</strong>.
              </>
            ) : (
              <>A emissora ainda não foi confirmada.</>
            )}
          </p>
        </header>

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

        {/* Team hubs */}
        {(homeSlug || awaySlug) && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold text-secondary">
              Mais sobre os times
            </h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {homeSlug && (
                <Link
                  href={`/time/${homeSlug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  Página do {match.home}
                </Link>
              )}
              {awaySlug && (
                <Link
                  href={`/time/${awaySlug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  Página do {match.away}
                </Link>
              )}
              {homeSlug && (
                <Link
                  href={`/jogos-futebol-hoje/${homeSlug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {match.home} hoje
                </Link>
              )}
              {awaySlug && (
                <Link
                  href={`/jogos-futebol-hoje/${awaySlug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {match.away} hoje
                </Link>
              )}
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
