import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { formatChance, formatUpdatedAt } from "@/lib/standings";
import {
  raceSummary,
  RACE_COPY,
  type RaceCompetition,
  type RaceObjective,
} from "@/lib/race";

/** Barra proporcional à chance — leitura instantânea sem virar gráfico. */
function ChanceBar({
  value,
  objective,
}: {
  value: number;
  objective: RaceObjective;
}) {
  const tone =
    objective === "rebaixamento"
      ? value >= 50
        ? "bg-transferencias"
        : "bg-transferencias/45"
      : value >= 50
        ? "bg-primary"
        : "bg-primary/45";
  return (
    <span className="block h-1.5 w-full bg-ink/8" aria-hidden="true">
      <span
        className={`block h-full ${tone}`}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </span>
  );
}

function CompetitionBlock({
  competition,
  objective,
}: {
  competition: RaceCompetition;
  objective: RaceObjective;
}) {
  const copy = RACE_COPY[objective];
  const summary = raceSummary(competition, objective);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {competition.competition}
        </h2>
        {competition.standingsPath && (
          <Link
            href={competition.standingsPath}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver a tabela completa →
          </Link>
        )}
      </div>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-gray-500">
        {competition.roundsPlayed}ª de {competition.totalRounds} rodadas ·{" "}
        {competition.remainingMatches} jogos restantes
      </p>
      {summary && (
        <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">{summary}</p>
      )}

      <div className="mt-5 overflow-hidden border border-ink/15 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink/15 bg-gray-50 font-mono text-[10px] uppercase tracking-wider text-gray-500">
              <th scope="col" className="py-2 pl-3 pr-2 font-bold">
                Pos
              </th>
              <th scope="col" className="py-2 pr-3 font-bold">
                Time
              </th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-bold sm:table-cell">
                Pts
              </th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-bold sm:table-cell">
                Projeção
              </th>
              <th scope="col" className="w-32 py-2 pr-3 text-right font-bold sm:w-40">
                {copy.chanceLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {competition.rows.map((row) => {
              const chance = row.chances?.[objective] ?? 0;
              return (
                <tr key={row.teamId} className="border-b border-ink/10 last:border-0">
                  <td className="py-3 pl-3 pr-2 font-mono text-xs text-gray-500">
                    {row.position}
                  </td>
                  <td className="py-3 pr-3">
                    {row.teamSlug ? (
                      <Link
                        href={`/probabilidades/${row.teamSlug}`}
                        className="font-semibold text-ink hover:text-primary hover:underline"
                      >
                        {row.displayName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">
                        {row.displayName}
                      </span>
                    )}
                  </td>
                  <td className="hidden py-3 pr-3 text-right font-mono text-sm tabular-nums text-gray-600 sm:table-cell">
                    {row.points}
                  </td>
                  <td className="hidden py-3 pr-3 text-right font-mono text-sm tabular-nums text-gray-500 sm:table-cell">
                    {row.chances?.pontosProjetados ?? "—"}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="block text-right font-mono text-sm font-bold tabular-nums text-ink">
                      {formatChance(chance)}
                    </span>
                    <ChanceBar value={chance} objective={objective} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Landing de um objetivo (rebaixamento ou título), atravessando as divisões.
 * Não recalcula nada: lê `chances` da simulação que já roda em build-standings.
 */
export function RaceLanding({
  objective,
  competitions,
  season,
  generatedAt,
}: {
  objective: RaceObjective;
  competitions: RaceCompetition[];
  season: string;
  generatedAt?: string;
}) {
  const copy = RACE_COPY[objective];
  const updatedAt = formatUpdatedAt(generatedAt);
  const main = competitions[0];
  const h1 = copy.h1(season);

  const faq = [
    {
      question: copy.question(season),
      answer: main
        ? raceSummary(main, objective)
        : "A simulação ainda não tem dados suficientes para esta temporada.",
    },
    {
      question: "Como essa probabilidade é calculada?",
      answer:
        "Simulamos os jogos que faltam 10 mil vezes. Cada jogo é sorteado por um modelo de Poisson que usa a força de ataque e de defesa dos dois times, medida pelos resultados desta temporada. A chance mostrada é a fatia das 10 mil simulações em que aquele desfecho aconteceu.",
    },
    {
      question: "Com que frequência os números mudam?",
      answer:
        "Todos os dias. A simulação roda junto com a atualização da tabela, então cada rodada disputada muda as chances de todo mundo.",
    },
    {
      question: "A probabilidade é uma previsão?",
      answer:
        "Não. É uma estimativa estatística do que costuma acontecer a partir da situação atual — um time com 5% de chance de cair ainda cai em 1 de cada 20 cenários. Serve para dimensionar o risco, não para garantir desfecho.",
    },
  ];

  return (
    <>
      <CollectionPageJsonLd
        name={h1}
        description={copy.description(season)}
        url={copy.path}
        items={(main?.rows ?? []).slice(0, 20).map((row) => ({
          name: `${row.displayName} — ${formatChance(row.chances?.[objective] ?? 0)}`,
          url: row.teamSlug ? `/probabilidades/${row.teamSlug}` : copy.path,
        }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Probabilidades", url: "/probabilidades" },
          { name: copy.h1(season), url: copy.path },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          {copy.intro}
        </p>

        {main && (
          <div className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
              {copy.question(season)}
            </p>
            <p className="mt-2 leading-relaxed text-ink">
              {raceSummary(main, objective)}
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={generatedAt}>{updatedAt}</time>
              {" · "}
            </>
          )}
          10.000 simulações por competição
        </p>

        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          {[
            {
              href:
                objective === "rebaixamento"
                  ? "/probabilidades/titulo"
                  : "/probabilidades/rebaixamento",
              label:
                objective === "rebaixamento"
                  ? "Chances de título"
                  : "Chances de rebaixamento",
            },
            { href: "/probabilidades", label: "Palpites de hoje" },
            { href: "/tabela", label: "Todas as tabelas" },
            { href: "/metodologia-dos-palpites", label: "Metodologia" },
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

        {competitions.length === 0 ? (
          <p className="mt-12 border-l-4 border-primary bg-surface p-5 text-gray-600">
            Nenhuma competição com simulação disponível no momento. As chances
            voltam assim que a tabela for atualizada.
          </p>
        ) : (
          competitions.map((competition) => (
            <CompetitionBlock
              key={competition.slug}
              competition={competition}
              objective={objective}
            />
          ))
        )}

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
