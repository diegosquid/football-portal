import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import {
  getProbabilitiesData,
  type TeamStrength,
} from "@/lib/probabilities";
import { getTeam, resolveTeamSlug } from "@/lib/teams";

/**
 * Nomes vêm da API ("Flamengo RJ", "Sao Paulo"). Resolve pro nome de exibição
 * em PT-BR do nosso cadastro e, quando existe, pro link do calendário do time.
 */
function displayTeam(apiName: string): { name: string; slug?: string } {
  const slug = resolveTeamSlug(apiName);
  const team = slug ? getTeam(slug) : undefined;
  return { name: team?.name ?? apiName, slug: team?.slug };
}

export const revalidate = 900; // 15 min

const PAGE_TITLE =
  "Estatísticas do Brasileirão: Melhor Ataque e Melhor Defesa";
const PAGE_DESCRIPTION =
  "Quem tem o melhor ataque e a melhor defesa do Brasileirão, medido contra a média da liga pelo nosso modelo estatístico. Série A, B e Feminino.";

export function generateMetadata(): Metadata {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    keywords: [
      "estatísticas brasileirão",
      "melhor ataque do brasileirão",
      "melhor defesa do brasileirão",
      "defesa menos vazada",
      "números do brasileirão",
    ],
    alternates: { canonical: `${siteConfig.url}/estatisticas` },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${siteConfig.url}/estatisticas`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
    },
  };
}

/** Ordem de exibição — competições mais buscadas primeiro. */
const COMPETITION_ORDER = [
  "Brasileirão Série A",
  "Brasileirão Série B",
  "Brasileirão Série C",
  "Brasileirão Série D",
  "Brasileirão Feminino A1",
];

function sortCompetitions(comps: string[]): string[] {
  return [...comps].sort((a, b) => {
    const ia = COMPETITION_ORDER.indexOf(a);
    const ib = COMPETITION_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

const FAQ = [
  {
    question: "Quem tem o melhor ataque do Brasileirão?",
    answer:
      "O índice de ataque mede quantos gols o time marca em relação à média da liga. Um índice de 1,30 significa que o time marca 30% mais gols do que a média — quanto maior, melhor o ataque.",
  },
  {
    question: "O que significa o índice de defesa?",
    answer:
      "Mede quantos gols o time sofre em relação à média da liga. Aqui, quanto MENOR, melhor: 0,80 significa que o time sofre 20% menos gols que a média da competição.",
  },
  {
    question: "Como esses números são calculados?",
    answer:
      "A partir dos resultados reais de cada time na temporada, separando desempenho como mandante e como visitante. Times com poucos jogos têm o índice puxado para a média da liga, para não distorcer com amostra pequena.",
  },
  {
    question: "Com que frequência as estatísticas são atualizadas?",
    answer:
      "Os índices são recalculados a cada rodada, com os resultados mais recentes, refletindo a forma atual de cada time.",
  },
];

export default async function EstatisticasPage() {
  const data = await getProbabilitiesData();
  const strengths = data?.teamStrengths ?? {};
  const competitions = sortCompetitions(Object.keys(strengths));

  const collectionItems = competitions.map((c) => ({
    name: `Estatísticas ${c}`,
    url: "/estatisticas",
  }));

  return (
    <>
      <CollectionPageJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        url="/estatisticas"
        items={collectionItems}
      />
      <FAQPageJsonLd items={FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Estatísticas", url: "/estatisticas" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Modelo estatístico
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
          Melhor ataque e melhor defesa
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Quem ataca e quem defende melhor que a média, segundo o nosso modelo.
          Não é gol somado na tabela: é o desempenho de cada time{" "}
          <strong>comparado à média da própria competição</strong>, o que
          permite comparar times de rodadas e adversários diferentes.
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/probabilidades"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Palpites dos jogos
          </Link>
          <Link
            href="/jogos-futebol-hoje"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de hoje
          </Link>
        </nav>

        {competitions.length > 0 ? (
          <div className="space-y-14">
            {competitions.map((comp) => {
              const rows = strengths[comp] ?? [];
              if (rows.length === 0) return null;
              const bestAttack = [...rows].sort((a, b) => b.ataque - a.ataque)[0];
              const bestDefense = [...rows].sort((a, b) => a.defesa - b.defesa)[0];
              const avg = data?.leagueAverages?.[comp];

              return (
                <section key={comp}>
                  <h2 className="mb-1 border-b-2 border-ink pb-2 font-display text-2xl font-extrabold tracking-tight text-ink">
                    {comp}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600">
                    Melhor ataque:{" "}
                    <strong>{displayTeam(bestAttack.time).name}</strong> (
                    {bestAttack.ataque.toFixed(2)}) · Melhor defesa:{" "}
                    <strong>{displayTeam(bestDefense.time).name}</strong> (
                    {bestDefense.defesa.toFixed(2)})
                    {avg && (
                      <>
                        {" "}
                        · Média da liga: {avg.golsCasa} gols em casa,{" "}
                        {avg.golsFora} fora
                      </>
                    )}
                  </p>
                  <StrengthTable rows={rows} />
                </section>
              );
            })}
          </div>
        ) : (
          <p className="border border-ink/15 bg-white p-6 text-gray-600">
            Estatísticas indisponíveis no momento. Volte em breve.
          </p>
        )}

        {/* Como ler — E-E-A-T */}
        <section className="mt-14 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Como ler estes números
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              O valor <strong>1,00 é a média da competição</strong>. No índice
              de <strong>ataque</strong>, quanto maior, melhor: 1,30 quer dizer
              que o time marca 30% mais gols do que um time médio daquela liga.
              No índice de <strong>defesa</strong>, quanto menor, melhor: 0,80
              significa que sofre 20% menos gols que a média.
            </p>
            <p>
              O <strong>saldo</strong> é a diferença entre os dois — é o número
              que ordena a tabela e resume se o time, no conjunto, está acima ou
              abaixo da média da competição.
            </p>
            <p>
              Comparar com a média (e não com o número absoluto de gols) é o que
              permite avaliar times que jogaram quantidades diferentes de
              partidas ou enfrentaram adversários diferentes. Times com poucos
              jogos têm o índice puxado para a média, para não distorcer com
              amostra pequena. É a mesma base que alimenta os{" "}
              <Link
                href="/probabilidades"
                className="font-medium text-primary hover:underline"
              >
                palpites do modelo
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Perguntas frequentes
          </h2>
          <ArticleFAQ items={FAQ} />
        </section>
      </div>
    </>
  );
}

function StrengthTable({ rows }: { rows: TeamStrength[] }) {
  return (
    <div className="overflow-x-auto border border-ink/15 bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-ink/15 bg-gray-50 text-left">
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-gray-500">
              #
            </th>
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-gray-500">
              Time
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wide text-gray-500">
              Ataque
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wide text-gray-500">
              Defesa
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wide text-gray-500">
              Saldo
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wide text-gray-500">
              Jogos
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr
              key={t.time}
              className={i > 0 ? "border-t border-ink/10" : undefined}
            >
              <td className="px-3 py-2 font-mono text-xs text-gray-500">
                {i + 1}
              </td>
              <td className="px-3 py-2 font-display font-bold text-ink">
                {(() => {
                  const { name, slug } = displayTeam(t.time);
                  return slug ? (
                    <Link
                      href={`/proximos-jogos/${slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {name}
                    </Link>
                  ) : (
                    name
                  );
                })()}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                {t.ataque.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                {t.defesa.toFixed(2)}
              </td>
              <td
                className={`px-3 py-2 text-right font-mono font-bold tabular-nums ${
                  t.saldo > 0 ? "text-primary" : "text-gray-500"
                }`}
              >
                {t.saldo > 0 ? "+" : ""}
                {t.saldo.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-gray-500">
                {t.jogos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
