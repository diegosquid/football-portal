import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { ProbabilityPanel } from "@/components/ProbabilityPanel";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { getProbabilitiesData, type Prediction } from "@/lib/probabilities";
import {
  buildMatchSlug,
  formatDateLongBR,
  getMatchBySlug,
  getTodayBRT,
  getTomorrowBRT,
} from "@/lib/matches";

export const revalidate = 900; // 15 min

const PAGE_TITLE =
  "Palpites e Probabilidades dos Jogos de Hoje: Quem Vai Ganhar";
const PAGE_DESCRIPTION =
  "Palpites e probabilidades dos jogos de hoje calculados por modelo estatístico próprio: quem tem mais chance de vencer, gols e ambos marcam. Atualizado a cada rodada.";

export function generateMetadata(): Metadata {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    keywords: [
      "palpites de hoje",
      "palpites futebol",
      "probabilidades futebol",
      "quem vai ganhar",
      "prognóstico dos jogos",
      "palpites brasileirão",
    ],
    alternates: { canonical: `${siteConfig.url}/probabilidades` },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${siteConfig.url}/probabilidades`,
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

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

/** "Hoje" / "Amanhã" / "domingo, 26 de julho" — cabeçalho de cada grupo. */
function dayLabel(dateStr: string, today: string, tomorrow: string): string {
  if (dateStr === today) return "Hoje";
  if (dateStr === tomorrow) return "Amanhã";
  return formatDateLongBR(dateStr);
}

const FAQ = [
  {
    question: "Como o Beira do Campo calcula os palpites e probabilidades?",
    answer:
      "Usamos um modelo estatístico próprio (distribuição de Poisson) que mede a força de ataque e defesa de cada time, separando desempenho como mandante e visitante, para estimar a chance de vitória, empate, mais de 2.5 gols e ambos marcam.",
  },
  {
    question: "Os palpites são confiáveis?",
    answer:
      "São estimativas estatísticas baseadas nos resultados reais de cada time, não garantia de resultado. Futebol é imprevisível — use as probabilidades como referência, não como certeza.",
  },
  {
    question: "Com que frequência as probabilidades são atualizadas?",
    answer:
      "As probabilidades são recalculadas com os resultados mais recentes de cada rodada, refletindo a forma atual dos times.",
  },
  {
    question: "Os palpites do Beira do Campo são gratuitos?",
    answer:
      "Sim. Todas as probabilidades e palpites do Beira do Campo são gratuitos e servem apenas como informação.",
  },
];

export default function ProbabilidadesPage() {
  const data = getProbabilitiesData();
  const predictions = data?.predictions ?? [];
  const today = getTodayBRT();
  const tomorrow = getTomorrowBRT();

  // Agrupa por data (Hoje, Amanhã, próximos) para escaneabilidade e SEO.
  const byDate = new Map<string, Prediction[]>();
  for (const p of predictions) {
    byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  }
  const dateGroups = [...byDate.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const collectionItems = predictions.map((p) => ({
    name: `${p.home} x ${p.away}`,
    url: "/probabilidades",
  }));

  return (
    <>
      <CollectionPageJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        url="/probabilidades"
        items={collectionItems}
      />
      <FAQPageJsonLd items={FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Palpites e Probabilidades", url: "/probabilidades" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Modelo estatístico
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Palpites e Probabilidades dos Jogos
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Quem tem mais chance de vencer cada jogo, com o palpite do nosso
          modelo estatístico próprio. Calculamos a força de ataque e defesa de
          cada time para estimar resultado, gols e ambos marcam — não é palpite
          de achismo, é dado.
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/jogos-futebol-hoje"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de hoje
          </Link>
          <Link
            href="/jogos-de-amanha"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Jogos de amanhã
          </Link>
        </nav>

        {dateGroups.length > 0 ? (
          <div className="space-y-12">
            {dateGroups.map(([date, preds]) => (
              <section key={date}>
                <div className="mb-5 flex items-center gap-3 border-b-2 border-ink pb-2">
                  <h2 className="font-display text-2xl font-extrabold capitalize tracking-tight text-ink">
                    {dayLabel(date, today, tomorrow)}
                  </h2>
                  <span className="font-mono text-xs text-gray-500">
                    {formatDateShort(date)} · {preds.length} jogo
                    {preds.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-6">
                  {preds.map((p) => {
                    const slug = buildMatchSlug(p.home, p.away, p.date);
                    const hasMatchPage = Boolean(getMatchBySlug(slug));
                    const heading = `${p.home} x ${p.away}`;
                    return (
                      <article key={slug}>
                        <h3 className="mb-2 font-display text-xl font-extrabold tracking-tight text-ink">
                          {hasMatchPage ? (
                            <Link
                              href={`/onde-assistir/${slug}`}
                              className="transition-colors hover:text-primary"
                            >
                              {heading}
                            </Link>
                          ) : (
                            heading
                          )}
                        </h3>
                        <ProbabilityPanel prediction={p} />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="border border-ink/15 bg-white p-6 text-gray-600">
            Nenhum palpite disponível no momento. Volte em breve.
          </p>
        )}

        {/* Como calculamos — E-E-A-T + disclaimer (compliance) */}
        <section className="mt-14 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Como calculamos os palpites
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              Usamos um <strong>modelo de Poisson</strong>, o método estatístico
              consagrado para prever placares de futebol. Para cada time,
              medimos a <strong>força de ataque</strong> (gols marcados acima ou
              abaixo da média da liga) e a <strong>força de defesa</strong> (gols
              sofridos), separando desempenho como mandante e como visitante.
            </p>
            <p>
              Disso estimamos os gols esperados de cada lado e, pela
              distribuição de Poisson, a probabilidade de vitória, empate,
              derrota, mais de 2.5 gols e ambos marcam. Quando um time tem
              poucos jogos na temporada, a estimativa é puxada para a média da
              liga para não exagerar com amostra pequena.
            </p>
            <p className="text-xs text-gray-500">
              Os palpites são <strong>estimativas estatísticas</strong> e não
              garantem resultado — futebol é imprevisível por natureza. Conteúdo
              informativo. Apostas são para maiores de 18 anos; aposte com
              responsabilidade.
            </p>
          </div>
        </section>

        {/* FAQ — featured snippet / AI Overview */}
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Perguntas frequentes sobre os palpites
          </h2>
          <ArticleFAQ items={FAQ} />
        </section>
      </div>
    </>
  );
}
