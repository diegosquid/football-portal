import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { formatUpdatedAt } from "@/lib/standings";
import { buildMatchSlug, formatDateShortBR } from "@/lib/matches";
import {
  currentRound,
  describeTie,
  formatLeg,
  teamLabel,
  type BracketCompetition,
  type BracketRound,
  type BracketTie,
} from "@/lib/brackets";

function TeamName({ apiName, bold }: { apiName: string; bold: boolean }) {
  const { name, slug } = teamLabel(apiName);
  const cls = bold ? "font-bold text-ink" : "text-gray-600";
  return slug ? (
    <Link href={`/time/${slug}`} className={`${cls} hover:text-primary hover:underline`}>
      {name}
    </Link>
  ) : (
    <span className={cls}>{name}</span>
  );
}

function TieCard({ tie }: { tie: BracketTie }) {
  const [a, b] = tie.teams;
  const agg = tie.aggregate;

  return (
    <div className="border border-ink/15 bg-white">
      <div className="flex items-stretch">
        <div className="flex-1 p-4">
          {[a, b].map((team) => {
            const isWinner = tie.winner === team;
            const eliminated = tie.decided && !isWinner;
            return (
              <div
                key={team}
                className={`flex items-baseline justify-between gap-3 py-1 ${
                  eliminated ? "opacity-50" : ""
                }`}
              >
                <TeamName apiName={team} bold={isWinner} />
                <span className="shrink-0 font-mono text-base font-bold tabular-nums text-ink">
                  {agg ? agg[team] : "—"}
                  {tie.penalties && (
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      ({tie.penalties[team]})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {tie.decided && (
          <div className="flex w-1.5 shrink-0 bg-lima" aria-hidden="true" />
        )}
      </div>

      <div className="border-t border-ink/10 bg-gray-50 px-4 py-2">
        {tie.legs.map((leg, i) => {
          const slug = buildMatchSlug(leg.home, leg.away, leg.date);
          return (
            <p key={`${leg.date}-${i}`} className="text-xs text-gray-500">
              <Link
                href={`/onde-assistir/${slug}`}
                className="hover:text-primary hover:underline"
              >
                {i === 0 ? "Ida" : "Volta"} · {formatDateShortBR(leg.date)} ·{" "}
                {teamLabel(leg.home).name} {formatLeg(leg)}{" "}
                {teamLabel(leg.away).name}
              </Link>
            </p>
          );
        })}
      </div>
    </div>
  );
}

function RoundBlock({ round }: { round: BracketRound }) {
  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {round.name}
        </h2>
        <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {round.decided} de {round.ties.length} definidos
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {round.ties.map((tie) => (
          <TieCard key={tie.teams.join("-")} tie={tie} />
        ))}
      </div>
    </section>
  );
}

/**
 * Landing de chaveamento. Mostra só as fases que o builder aprovou — no meio da
 * temporada isso costuma ser a fase em andamento e a anterior, e é o correto:
 * a página não inventa uma chave que ainda não foi sorteada.
 */
export async function BracketLanding({
  competition,
  copy,
  generatedAt,
}: {
  competition: BracketCompetition;
  copy: {
    path: string;
    h1: (season: string) => string;
    intro: string;
    possessive: string;
    categorySlug: string;
    links: { href: string; label: string }[];
  };
  generatedAt?: string;
}) {
  const updatedAt = formatUpdatedAt(generatedAt);
  const now = currentRound(competition);
  const h1 = copy.h1(competition.season);
  const decidedTies = competition.rounds
    .flatMap((r) => r.ties)
    .filter((t) => t.decided);

  const faq = [
    {
      question: `Como está o chaveamento ${copy.possessive} ${competition.season}?`,
      answer: now
        ? `A competição está ${now.decided === now.ties.length ? "com a" : "na"} ${now.name.toLowerCase()}, com ${now.decided} de ${now.ties.length} confrontos definidos. ${now.ties.slice(0, 3).map(describeTie).join(" ")}`
        : "O chaveamento ainda não foi sorteado.",
    },
    ...(decidedTies.length > 0
      ? [
          {
            question: `Quem já se classificou ${copy.possessive}?`,
            answer: decidedTies
              .slice(0, 6)
              .map(describeTie)
              .join(" "),
          },
        ]
      : []),
    {
      question: "Como funciona o critério de desempate?",
      answer:
        "Os confrontos são em ida e volta, e passa quem soma mais gols no agregado. Empate no agregado leva a decisão para os pênaltis — o placar da disputa aparece entre parênteses ao lado do agregado.",
    },
  ];

  const related = (await getPublishedArticles())
    .filter((article) => article.category === copy.categorySlug)
    .slice(0, 3);

  return (
    <>
      <CollectionPageJsonLd
        name={h1}
        description={copy.intro}
        url={copy.path}
        items={competition.rounds.flatMap((round) =>
          round.ties.map((tie) => ({
            name: `${round.name}: ${teamLabel(tie.teams[0]).name} x ${teamLabel(tie.teams[1]).name}`,
            url: copy.path,
          })),
        )}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Jogos", url: "/jogos-futebol-hoje" },
          { name: h1, url: copy.path },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Chaveamento
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          {copy.intro}
        </p>

        {now && (
          <div className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
              Fase atual · {now.name}
            </p>
            <p className="mt-2 leading-relaxed text-ink">
              {now.decided} de {now.ties.length} confrontos já definidos.{" "}
              {now.ties.find((t) => !t.decided)
                ? describeTie(now.ties.find((t) => !t.decided)!)
                : ""}
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={generatedAt}>{updatedAt}</time>
            </>
          )}
        </p>

        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          {copy.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {[...competition.rounds].reverse().map((round) => (
          <RoundBlock key={round.sourceStage} round={round} />
        ))}

        <ArticleFAQ items={faq} />

        <p className="mt-10 border-l-4 border-primary bg-surface p-4 text-xs leading-relaxed text-gray-600">
          Só entram aqui as fases em que o calendário oficial fecha como chave
          (número de confrontos igual ao da etapa). Fases ainda não sorteadas
          aparecem assim que a tabela for divulgada. Fonte: apifootball.com.
        </p>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimas notícias
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((article) => (
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
      </div>
    </>
  );
}
