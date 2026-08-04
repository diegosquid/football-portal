import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/JsonLd";
import { getAllStandingsCopy } from "@/lib/standings-competitions";
import {
  formatChance,
  formatUpdatedAt,
  getStandingsData,
  getStandingsTable,
} from "@/lib/standings";
import { getAllTopScorersCopy } from "@/lib/topscorers-competitions";
import { getTopScorers, goalsLabel } from "@/lib/topscorers";
import { getAllBracketCopy } from "@/lib/brackets-route";
import { currentRound, getBracket } from "@/lib/brackets";
import { getAllRaceTeamSlugs } from "@/lib/race";

export const revalidate = 900; // 15 min

const TITLE = "Tabelas, artilharia e chaveamentos: Brasileirão, Série B e mais";
const DESCRIPTION =
  "Todos os dados do Beira do Campo em um lugar: tabelas de classificação, artilharia de cada competição, chaveamentos de mata-mata e as chances de título e rebaixamento time a time.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
      "tabelas de classificação",
      "tabela de futebol",
      "classificação campeonatos",
      "tabela do brasileirão",
      "tabela da série b",
      "artilharia do brasileirão",
      "chaveamento copa do brasil",
    ],
    alternates: { canonical: `${siteConfig.url}/tabela` },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `${siteConfig.url}/tabela`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
  };
}

/**
 * Hub das classificações: uma porta de entrada só, que cresce sozinha conforme
 * novas competições entram em standings-competitions.ts.
 */
export default async function TabelaHubPage() {
  const updatedAt = formatUpdatedAt((await getStandingsData())?.generatedAt);

  // Cada bloco só aparece quando o dado existe — o hub cresce sozinho conforme
  // os builders publicam competição nova, sem editar esta página.
  const [tables, scorers, brackets, raceTeams] = await Promise.all([
    Promise.all(
      getAllStandingsCopy().map(async (copy) => ({
        copy,
        table: await getStandingsTable(copy.slug),
      })),
    ).then((items) => items.filter((item) => item.table !== null)),

    Promise.all(
      getAllTopScorersCopy().map(async (copy) => ({
        copy,
        ranking: await getTopScorers(copy.slug),
      })),
    ).then((items) =>
      items.filter((item) => (item.ranking?.scorers.length ?? 0) > 0),
    ),

    Promise.all(
      getAllBracketCopy().map(async (copy) => ({
        copy,
        competition: await getBracket(copy.slug),
      })),
    ).then((items) =>
      items.filter((item) => (item.competition?.rounds.length ?? 0) > 0),
    ),

    getAllRaceTeamSlugs(),
  ]);

  const hasRace = raceTeams.length > 0;

  return (
    <>
      <CollectionPageJsonLd
        name={TITLE}
        description={DESCRIPTION}
        url="/tabela"
        items={tables.map(({ copy, table }) => ({
          name: copy.h1(table!.season),
          url: copy.path,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Tabelas", url: "/tabela" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Classificação
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Tabelas de Classificação
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          A classificação de cada campeonato que cobrimos, atualizada rodada a
          rodada — com aproveitamento, forma recente e as chances de título,
          acesso e rebaixamento calculadas pelo nosso modelo estatístico.
        </p>
        {updatedAt && (
          <p className="mt-3 text-sm text-gray-500">
            Atualizado em {updatedAt}
          </p>
        )}

        {tables.length > 0 ? (
          <div className="mt-10 space-y-4">
            {tables.map(({ copy, table }) => {
              const leader = table!.rows[0];
              return (
                <Link
                  key={copy.slug}
                  href={copy.path}
                  className="group block border border-ink/15 bg-white p-5 transition-colors hover:border-primary"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary">
                      {copy.h1(table!.season)}
                    </h2>
                    <span className="font-mono text-xs uppercase tracking-wider text-gray-500">
                      {table!.roundsPlayed}ª de {table!.totalRounds} rodadas
                    </span>
                  </div>
                  {leader && (
                    <p className="mt-2 text-sm text-gray-600">
                      Líder: <strong className="text-ink">{leader.displayName}</strong>{" "}
                      com {leader.points} pontos
                      {leader.chances &&
                        ` · ${formatChance(leader.chances.titulo)} de chance de título`}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-10 border border-ink/15 bg-white p-6 text-gray-600">
            Nenhuma tabela disponível no momento. Volte em breve.
          </p>
        )}

        {scorers.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              Artilharia
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-600">
              Quem mais fez gol em cada competição, atualizado a cada rodada.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {scorers.map(({ copy, ranking }) => {
                const top = ranking!.scorers[0];
                return (
                  <Link
                    key={copy.slug}
                    href={copy.path}
                    className="group block border border-ink/15 bg-white p-4 transition-colors hover:border-primary"
                  >
                    <p className="font-display text-lg font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary">
                      {copy.h1(ranking!.season)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {top.displayName} ({top.teamName}) ·{" "}
                      <strong className="text-ink">{goalsLabel(top.goals)}</strong>
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {hasRace && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              Probabilidades
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-600">
              10 mil simulações do restante de cada campeonato, por objetivo.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/probabilidades/titulo",
                  title: "Chances de título",
                  hint: "Quem pode ser campeão, time a time",
                },
                {
                  href: "/probabilidades/rebaixamento",
                  title: "Chances de rebaixamento",
                  hint: "Quem corre risco de cair, time a time",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block border border-ink/15 bg-white p-4 transition-colors hover:border-primary"
                >
                  <p className="font-display text-lg font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{item.hint}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {brackets.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              Chaveamentos
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-600">
              Os confrontos de mata-mata, com agregado e quem avançou.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {brackets.map(({ copy, competition }) => {
                const now = currentRound(competition!);
                return (
                  <Link
                    key={copy.slug}
                    href={copy.path}
                    className="group block border border-ink/15 bg-white p-4 transition-colors hover:border-primary"
                  >
                    <p className="font-display text-lg font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary">
                      {copy.h1(competition!.season)}
                    </p>
                    {now && (
                      <p className="mt-1 text-sm text-gray-600">
                        {now.name} · {now.decided} de {now.ties.length}{" "}
                        confrontos definidos
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <nav className="mt-14 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/jogos-futebol-hoje", label: "Jogos de hoje" },
            { href: "/probabilidades", label: "Palpites de hoje" },
            { href: "/estatisticas", label: "Estatísticas" },
            { href: "/estadios-do-brasileirao", label: "Estádios do Brasileirão" },
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
      </div>
    </>
  );
}
