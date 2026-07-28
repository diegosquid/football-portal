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

export const revalidate = 900; // 15 min

const TITLE = "Tabelas de Classificação: Brasileirão, Série B e mais";
const DESCRIPTION =
  "Todas as tabelas de classificação do Beira do Campo em um lugar: pontos, saldo, aproveitamento e as chances de título, acesso e rebaixamento de cada competição.";

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
export default function TabelaHubPage() {
  const updatedAt = formatUpdatedAt(getStandingsData()?.generatedAt);

  // Só entra no hub a competição que já tem tabela publicada no JSON.
  const tables = getAllStandingsCopy()
    .map((copy) => ({ copy, table: getStandingsTable(copy.slug) }))
    .filter((item) => item.table !== null);

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

        <nav className="mt-10 flex flex-wrap gap-2 text-sm">
          <Link
            href="/jogos-futebol-hoje"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de hoje
          </Link>
          <Link
            href="/probabilidades"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Palpites de hoje
          </Link>
          <Link
            href="/estatisticas"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Estatísticas
          </Link>
        </nav>
      </div>
    </>
  );
}
