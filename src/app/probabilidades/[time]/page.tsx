import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/JsonLd";
import { getAllRaceTeamSlugs, getTeamRaces, type TeamRace } from "@/lib/race";
import { formatChance, formatUpdatedAt, getStandingsData } from "@/lib/standings";
import { getStandingsCopy } from "@/lib/standings-competitions";
import { getTeam } from "@/lib/teams";
import { hasTopScorers, topScorersPath } from "@/lib/topscorers";
import { siteConfig, truncateForMeta } from "@/lib/site";

/**
 * "Chances do [time]" — a leitura por clube da mesma simulação que alimenta
 * /probabilidades/rebaixamento e /probabilidades/titulo.
 *
 * Rota dinâmica convive com os slugs estáticos (`rebaixamento`, `titulo`)
 * porque o Next resolve segmento fixo antes de dinâmico, e nenhum time tem
 * esses slugs.
 */

export const revalidate = 900; // 15 min

interface Props {
  params: Promise<{ time: string }>;
}

export async function generateStaticParams() {
  return (await getAllRaceTeamSlugs()).map((time) => ({ time }));
}

/** Objetivo mais marcante do time — é o que vira título e resposta direta. */
function headline(race: TeamRace, teamName: string): string {
  const c = race.row.chances!;
  if (c.rebaixamento >= 25) {
    return `${teamName} tem ${formatChance(c.rebaixamento)} de chance de ser rebaixado`;
  }
  if (c.titulo >= 15) {
    return `${teamName} tem ${formatChance(c.titulo)} de chance de ser campeão`;
  }
  if (c.promocao >= 15) {
    return `${teamName} tem ${formatChance(c.promocao)} de chance de terminar no ${race.promotionLabel}`;
  }
  return `${teamName} deve terminar em ${Math.round(c.posicaoMedia)}º, com ${c.pontosProjetados} pontos`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { time } = await params;
  const team = getTeam(time);
  const races = await getTeamRaces(time);
  if (!team || races.length === 0) return {};

  const main = races[0];
  const c = main.row.chances!;
  const title = `Chances do ${team.name} ${main.season}: título, ${main.promotionLabel} e rebaixamento`;
  const description = truncateForMeta(
    `${headline(main, team.name)}. Hoje é o ${main.row.position}º da ${main.competition} com ${main.row.points} pontos. ` +
      `Título ${formatChance(c.titulo)}, ${main.promotionLabel} ${formatChance(c.promocao)}, rebaixamento ${formatChance(c.rebaixamento)} — por 10 mil simulações.`,
    165,
  );

  return {
    title,
    description,
    keywords: [
      `chances do ${team.name.toLowerCase()}`,
      `${team.name.toLowerCase()} rebaixamento`,
      `${team.name.toLowerCase()} chance de título`,
      `o ${team.name.toLowerCase()} vai cair`,
      `probabilidades do ${team.name.toLowerCase()}`,
    ],
    alternates: { canonical: `${siteConfig.url}/probabilidades/${time}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/probabilidades/${time}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function ChanceCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "good" | "bad" | "neutral";
}) {
  const color =
    tone === "bad"
      ? "text-transferencias"
      : tone === "good"
        ? "text-primary"
        : "text-ink";
  return (
    <div className="border border-ink/15 bg-white p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${color}`}>
        {formatChance(value)}
      </p>
      <p className="mt-1 text-xs leading-snug text-gray-500">{hint}</p>
    </div>
  );
}

export default async function TeamChancesPage({ params }: Props) {
  const { time } = await params;
  const team = getTeam(time);
  const races = await getTeamRaces(time);
  if (!team || races.length === 0) notFound();

  const data = await getStandingsData();
  const updatedAt = formatUpdatedAt(data?.generatedAt);
  const main = races[0];
  const c = main.row.chances!;
  const copy = getStandingsCopy(main.slug);
  const showTopScorers = await hasTopScorers(main.slug);

  const faq = [
    {
      question: `O ${team.name} vai ser rebaixado em ${main.season}?`,
      answer:
        c.rebaixamento < 1
          ? `O risco de queda do ${team.name} é praticamente nulo: menos de 1% das 10 mil simulações terminam com o time na zona de rebaixamento.`
          : `Em ${formatChance(c.rebaixamento)} das 10 mil simulações do restante da ${main.competition}, o ${team.name} termina na zona de rebaixamento. Hoje o time é o ${main.row.position}º de ${main.totalTeams}, com ${main.row.points} pontos.`,
    },
    {
      question: `Qual a chance de título do ${team.name}?`,
      answer:
        c.titulo < 1
          ? `Menos de 1%. Matematicamente ainda é possível, mas o ${team.name} termina em primeiro em pouquíssimos cenários.`
          : `${formatChance(c.titulo)}. É a fatia das simulações em que o ${team.name} termina em primeiro na ${main.competition}.`,
    },
    {
      question: `Quantos pontos o ${team.name} deve fazer?`,
      answer: `A projeção é de ${c.pontosProjetados} pontos ao fim da ${main.competition}, com posição média de ${Math.round(c.posicaoMedia)}º. Faltam ${main.remainingMatches} jogos na competição.`,
    },
    {
      question: "De onde vêm esses números?",
      answer:
        "De 10 mil simulações dos jogos que faltam. Cada partida é sorteada por um modelo de Poisson alimentado pela força de ataque e defesa dos times nesta temporada. Não é previsão: é a distribuição dos desfechos possíveis a partir de hoje.",
    },
  ];

  return (
    <>
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Probabilidades", url: "/probabilidades" },
          { name: team.name, url: `/probabilidades/${time}` },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Probabilidades · {main.competition}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
          Chances do {team.name} em {main.season}
        </h1>

        <div className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {headline(main, team.name)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            Hoje o {team.name} é o <strong>{main.row.position}º</strong> de{" "}
            {main.totalTeams} na {main.competition}, com{" "}
            <strong>{main.row.points} pontos</strong> em {main.row.played} jogos.
            A projeção para o fim do campeonato é de{" "}
            <strong>{c.pontosProjetados} pontos</strong>, terminando em{" "}
            {Math.round(c.posicaoMedia)}º em média.
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={data?.generatedAt}>{updatedAt}</time>
              {" · "}
            </>
          )}
          {main.roundsPlayed}ª de {main.totalRounds} rodadas ·{" "}
          {main.remainingMatches} jogos restantes
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <ChanceCard
            label="Título"
            value={c.titulo}
            hint={`Terminar em 1º na ${main.shortName}`}
            tone="good"
          />
          <ChanceCard
            label={main.promotionLabel}
            value={c.promocao}
            hint={copy?.promotionHint ?? "Terminar na zona de cima"}
            tone="good"
          />
          <ChanceCard
            label="Rebaixamento"
            value={c.rebaixamento}
            hint={`Cair para a ${copy?.faq.relegationTarget ?? "divisão de baixo"}`}
            tone="bad"
          />
        </section>

        {c.secundaria !== null && copy?.faq.zoneTerm && (
          <p className="mt-4 text-sm text-gray-600">
            Chance de terminar na zona secundária (
            {copy.promotionRaceTitle.toLowerCase()}):{" "}
            <strong className="text-ink">{formatChance(c.secundaria)}</strong>.
          </p>
        )}

        {races.length > 1 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
              Em outras competições
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {races.slice(1).map((race) => (
                <div
                  key={race.slug}
                  className="border border-ink/15 bg-white p-4"
                >
                  <p className="font-semibold text-ink">{race.competition}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {race.row.position}º com {race.row.points} pontos · título{" "}
                    {formatChance(race.row.chances!.titulo)} · rebaixamento{" "}
                    {formatChance(race.row.chances!.rebaixamento)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <nav className="mt-12 flex flex-wrap gap-2 text-sm">
          {[
            { href: `/time/${time}`, label: `Página do ${team.name}` },
            { href: `/proximos-jogos/${time}`, label: `Próximos jogos` },
            ...(main.standingsPath
              ? [{ href: main.standingsPath, label: `Tabela da ${main.shortName}` }]
              : []),
            ...(showTopScorers
              ? [
                  {
                    href: topScorersPath(main.slug),
                    label: `Artilharia da ${main.shortName}`,
                  },
                ]
              : []),
            { href: "/probabilidades/rebaixamento", label: "Chances de rebaixamento" },
            { href: "/probabilidades/titulo", label: "Chances de título" },
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
          Estimativas estatísticas de modelo próprio — não são garantia de
          resultado.{" "}
          <Link
            href="/metodologia-dos-palpites"
            className="font-medium text-primary hover:underline"
          >
            Veja a metodologia e o desempenho do modelo →
          </Link>
        </p>
      </div>
    </>
  );
}
