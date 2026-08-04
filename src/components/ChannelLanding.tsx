import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import {
  channelKindLabel,
  channelPath,
  type Channel,
  type ChannelSchedule,
} from "@/lib/channels";
import { formatDateLongBR, getTodayBRT, type Match } from "@/lib/matches";
import { pelaCompetition } from "@/lib/schedule-seo";

function MatchLine({ match }: { match: Match }) {
  return (
    <Link
      href={`/onde-assistir/${match.slug}`}
      className="group flex items-baseline gap-3 border-b border-ink/10 py-3 last:border-0 hover:bg-lima/20"
    >
      <span className="w-14 shrink-0 font-mono text-sm font-bold text-primary">
        {match.time}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink group-hover:underline">
          {match.home} x {match.away}
        </span>
        <span className="block text-xs text-gray-500">
          {match.competition}
          {match.round ? ` — ${match.round}` : ""}
          {match.stadium ? ` · ${match.stadium}` : ""}
        </span>
      </span>
    </Link>
  );
}

/**
 * Landing de um canal de transmissão.
 *
 * A intenção da busca é sempre a mesma pergunta ("o que passa no Premiere
 * hoje?"), então a resposta vem antes de qualquer outra coisa — inclusive
 * quando a resposta é "hoje não tem jogo", que também é uma resposta útil.
 */
export function ChannelLanding({
  channel,
  schedule,
}: {
  channel: Channel;
  schedule: ChannelSchedule;
}) {
  const today = getTodayBRT();
  const todayLabel = formatDateLongBR(today);
  const path = channelPath(channel.slug);
  const hasToday = schedule.today.length > 0;
  const nextMatch = schedule.upcoming[0];

  const h1 = `Jogos de hoje ${channel.kind === "youtube" || channel.kind === "streaming" ? "no" : channel.kind === "tv-aberta" && channel.name === "Globo" ? "na" : "no"} ${channel.name}`;

  const todayAnswer = hasToday
    ? `${channel.name} transmite ${schedule.today.length} ${schedule.today.length === 1 ? "jogo" : "jogos"} hoje: ${schedule.today
        .map((m) => `${m.home} x ${m.away}, às ${m.time}`)
        .join("; ")}.`
    : nextMatch
      ? `Hoje não há jogo no ${channel.name}. A próxima transmissão é ${nextMatch.home} x ${nextMatch.away}, em ${formatDateLongBR(nextMatch.date)}, às ${nextMatch.time}.`
      : `Não há jogo do ${channel.name} na agenda no momento. A programação é atualizada todos os dias.`;

  const faq = [
    {
      question: `Que jogo passa no ${channel.name} hoje?`,
      answer: todayAnswer,
    },
    {
      question: `Como assistir ao ${channel.name}?`,
      answer: channel.howToWatch,
    },
    {
      question: `O ${channel.name} é de graça?`,
      answer: channel.free
        ? `Sim. ${channel.howToWatch}`
        : `Não. ${channel.howToWatch}`,
    },
    ...(nextMatch
      ? [
          {
            question: `Qual o próximo jogo no ${channel.name}?`,
            answer: `${nextMatch.home} x ${nextMatch.away}, ${pelaCompetition(nextMatch.competition)}, em ${formatDateLongBR(nextMatch.date)} às ${nextMatch.time} (horário de Brasília).`,
          },
        ]
      : []),
  ];

  return (
    <>
      <CollectionPageJsonLd
        name={h1}
        description={`Programação de futebol do ${channel.name}: jogos de hoje e próximas transmissões, com horário e competição.`}
        url={path}
        items={[...schedule.today, ...schedule.upcoming]
          .slice(0, 20)
          .map((m) => ({
            name: `${m.home} x ${m.away} — ${m.date} às ${m.time}`,
            url: `/onde-assistir/${m.slug}`,
          }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Jogos de hoje", url: "/jogos-futebol-hoje" },
          { name: channel.name, url: path },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          {channelKindLabel(channel.kind)}
          {channel.free ? " · grátis" : ""}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          {channel.about}
        </p>

        {/* Resposta direta — é literalmente a pergunta da busca */}
        <section className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            Hoje · <span className="capitalize">{todayLabel}</span>
          </p>
          <p className="mt-2 leading-relaxed text-ink">{todayAnswer}</p>
        </section>

        {hasToday && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Programação de hoje no {channel.name}
            </h2>
            <div className="border border-ink/15 bg-white px-4">
              {schedule.today.map((match) => (
                <MatchLine key={match.slug} match={match} />
              ))}
            </div>
          </section>
        )}

        {schedule.upcoming.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Próximos jogos no {channel.name}
            </h2>
            <UpcomingMatches matches={schedule.upcoming.slice(0, 15)} />
          </section>
        )}

        <section className="mt-10 border border-ink/15 bg-white p-5">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
            Como assistir ao {channel.name}
          </h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            {channel.howToWatch}
          </p>
        </section>

        {schedule.past.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimas transmissões
            </h2>
            <div className="border border-ink/15 bg-white px-4">
              {schedule.past.slice(0, 8).map((match) => (
                <MatchLine key={match.slug} match={match} />
              ))}
            </div>
          </section>
        )}

        <nav className="mt-10 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/jogos-futebol-hoje", label: "Todos os jogos de hoje" },
            { href: "/jogos-de-amanha", label: "Jogos de amanhã" },
            { href: "/jogos-da-semana", label: "Jogos da semana" },
            { href: "/probabilidades", label: "Palpites de hoje" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <ArticleFAQ items={faq} />

        <p className="mt-10 border-l-4 border-primary bg-surface p-4 text-xs leading-relaxed text-gray-600">
          A grade de transmissão muda com frequência e pode variar por região.
          Confirme na programação oficial do {channel.name} antes do jogo.
        </p>
      </div>
    </>
  );
}
