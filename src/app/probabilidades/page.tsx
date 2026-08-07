import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { ProbabilityPanel } from "@/components/ProbabilityPanel";
import { VupiAdBanner } from "@/components/VupiAdBanner";
import { PushOptIn } from "@/components/PushOptIn";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { SeoHubLinks, type SeoHubLink } from "@/components/SeoHubLinks";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { getProbabilitiesData, type Prediction } from "@/lib/probabilities";
import {
  buildMatchSlug,
  formatDateLongBR,
  formatDateShortBR,
  getAllKnownMatches,
  getTodayBRT,
  getTomorrowBRT,
} from "@/lib/matches";
import { getAllRaceTeamSlugs } from "@/lib/race";
import { getTeam } from "@/lib/teams";

export const revalidate = 900; // 15 min

const PAGE_DESCRIPTION =
  "Veja as probabilidades dos jogos de hoje para vitória, empate, gols e ambos marcam, calculadas por modelo estatístico próprio. Estimativas não garantem resultados.";

export async function generateMetadata(): Promise<Metadata> {
  const today = getTodayBRT();
  const data = await getProbabilitiesData();
  const title = `Probabilidades dos Jogos de Hoje (${formatDateShortBR(today)}) | Palpites Estatísticos`;
  const description =
    data && data.predictions.length > 0
      ? `${PAGE_DESCRIPTION} ${data.predictions.length} jogos analisados.`
      : PAGE_DESCRIPTION;

  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.url}/probabilidades` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/probabilidades`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: "/og-probabilidades.jpg",
          width: 1200,
          height: 630,
          alt: "Probabilidades dos jogos de hoje — resultado, gols e placar",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-probabilidades.jpg"],
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

function formatGeneratedAt(timestamp?: string): string | null {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}

function dataIsFresh(timestamp?: string): boolean {
  if (!timestamp) return false;
  const generatedAt = Date.parse(timestamp);
  if (!Number.isFinite(generatedAt)) return false;

  const age = Date.now() - generatedAt;
  return age >= 0 && age <= 36 * 60 * 60 * 1000;
}

const FAQ = [
  {
    question: "Como o Beira do Campo calcula as probabilidades?",
    answer:
      "Usamos um modelo estatístico próprio (distribuição de Poisson) que mede a força de ataque e defesa de cada time, separando desempenho como mandante e visitante, para estimar a chance de vitória, empate, mais de 2.5 gols e ambos marcam.",
  },
  {
    question: "As probabilidades garantem o resultado?",
    answer:
      "Não. São estimativas estatísticas baseadas nos resultados recentes de cada time. Futebol é imprevisível — use as probabilidades como referência, nunca como certeza.",
  },
  {
    question: "Com que frequência as probabilidades são atualizadas?",
    answer:
      "As probabilidades são recalculadas com os resultados mais recentes de cada rodada, refletindo a forma atual dos times.",
  },
  {
    question: "As probabilidades do Beira do Campo são gratuitas?",
    answer:
      "Sim. Todas as probabilidades do Beira do Campo são gratuitas e têm finalidade exclusivamente informativa.",
  },
];

export default async function ProbabilidadesPage() {
  const [data, knownMatches, raceTeamSlugs] = await Promise.all([
    getProbabilitiesData(),
    getAllKnownMatches(),
    getAllRaceTeamSlugs(),
  ]);
  const predictions = data?.predictions ?? [];
  // Slugs com página própria em /onde-assistir — resolvidos uma vez só.
  const matchSlugs = new Set(knownMatches.map((m) => m.slug));
  const today = getTodayBRT();
  const tomorrow = getTomorrowBRT();
  const updatedAt = formatGeneratedAt(data?.generatedAt);
  const freshData = dataIsFresh(data?.generatedAt);

  // Agrupa por data e separa partidas atuais das já encerradas.
  const byDate = new Map<string, Prediction[]>();
  for (const p of predictions) {
    byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  }
  const currentDateGroups = [...byDate.entries()]
    .filter(([date]) => date >= today)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const pastDateGroups = [...byDate.entries()]
    .filter(([date]) => date < today)
    .sort((a, b) => b[0].localeCompare(a[0]));
  const currentPredictions = currentDateGroups.flatMap(([, items]) => items);
  const showAdvertising = freshData && currentPredictions.length > 0;

  const collectionItems = currentPredictions.map((p) => {
    const slug = buildMatchSlug(p.home, p.away, p.date);
    return {
      name: `${p.home} x ${p.away}`,
      url: matchSlugs.has(slug)
        ? `/onde-assistir/${slug}`
        : `/probabilidades#${slug}`,
    };
  });

  const collectionTitle = `Probabilidades dos Jogos de Hoje (${formatDateShortBR(today)})`;
  const priorityTeamSlugs = [
    "bahia",
    "vitoria",
    "flamengo",
    "palmeiras",
    "corinthians",
    "sao-paulo",
  ];
  const orderedTeamSlugs = [
    ...priorityTeamSlugs.filter((slug) => raceTeamSlugs.includes(slug)),
    ...raceTeamSlugs.filter((slug) => !priorityTeamSlugs.includes(slug)),
  ];
  const probabilityLinks: SeoHubLink[] = [
    {
      href: "/probabilidades/titulo",
      eyebrow: "Brasileirão",
      title: "Chances de título",
      description:
        "Veja quem pode ser campeão após 10 mil simulações dos jogos restantes.",
    },
    {
      href: "/probabilidades/rebaixamento",
      eyebrow: "Brasileirão",
      title: "Chances de rebaixamento",
      description:
        "Confira o risco de queda de cada time e quem está mais ameaçado pelo Z4.",
    },
    {
      href: "/metodologia-dos-palpites",
      eyebrow: "Transparência",
      title: "Como calculamos os palpites",
      description:
        "Entenda o modelo de Poisson, as limitações e o acompanhamento de desempenho.",
    },
    ...orderedTeamSlugs.slice(0, 6).flatMap<SeoHubLink>((slug) => {
      const team = getTeam(slug);
      return team
        ? [
            {
              href: `/probabilidades/${slug}`,
              eyebrow: "Por time",
              title: `Chances do ${team.name}`,
              description:
                "Título, classificação e risco de rebaixamento reunidos em uma página.",
            },
          ]
        : [];
    }),
  ];

  return (
    <>
      <CollectionPageJsonLd
        name={collectionTitle}
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
          Probabilidades dos Jogos de Hoje
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Estimativas de vitória, empate, gols e ambos marcam calculadas pelo
          nosso modelo estatístico a partir do desempenho recente dos times.
          Probabilidades ajudam a comparar cenários, mas não garantem resultados.
        </p>
        <div
          className={`mt-5 border-l-4 px-4 py-3 text-sm ${
            freshData
              ? "border-primary bg-primary/5 text-gray-600"
              : "border-amber-600 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="font-bold text-ink">
            {freshData ? "Dados atualizados" : "Atualização dos dados pendente"}
          </p>
          <p className="mt-1">
            {updatedAt ? (
              <>
                Último cálculo em{" "}
                <time dateTime={data?.generatedAt}>{updatedAt}</time>.{" "}
              </>
            ) : (
              <>Horário do último cálculo indisponível. </>
            )}
            {!freshData &&
              "A publicidade fica suspensa até a próxima atualização do modelo. "}
            Modelo Poisson v1 · Fonte: API-Football ·{" "}
            <Link
              href="/metodologia-dos-palpites"
              className="font-semibold text-primary hover:underline"
            >
              metodologia e desempenho
            </Link>
          </p>
        </div>

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
          <Link
            href="/tabela-do-brasileirao"
            className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Tabela do Brasileirão
          </Link>
        </nav>

        {showAdvertising && (
          <div className="mb-10">
            <VupiAdBanner placement="palpites_topo" priority />
          </div>
        )}

        {currentDateGroups.length > 0 ? (
          <div className="space-y-12">
            {currentDateGroups.map(([date, preds], groupIndex) => (
              <div key={date}>
                <section>
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
                      const hasMatchPage = matchSlugs.has(slug);
                      const heading = `${p.home} x ${p.away}`;
                      return (
                        <article key={slug} id={slug} className="scroll-mt-24">
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

                {showAdvertising &&
                  groupIndex === 0 &&
                  currentDateGroups.length > 1 && (
                  <div className="mt-12">
                    <VupiAdBanner placement="palpites_entre_jogos" compact />
                  </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-amber-600/30 bg-amber-50 p-6 text-amber-950">
            <p className="font-bold">Nenhuma probabilidade atual disponível.</p>
            <p className="mt-1 text-sm">
              O modelo está aguardando a próxima atualização de jogos. Volte em
              breve.
            </p>
          </div>
        )}

        {pastDateGroups.length > 0 && (
          <details className="group mt-12 border border-ink/15 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg font-extrabold text-ink marker:content-none">
              Resultados e probabilidades anteriores
              <span
                aria-hidden="true"
                className="text-primary transition group-open:rotate-180"
              >
                ↓
              </span>
            </summary>
            <div className="space-y-10 border-t border-ink/10 px-5 py-6">
              {pastDateGroups.map(([date, preds]) => (
                <section key={date}>
                  <div className="mb-5 flex items-center gap-3 border-b border-ink/15 pb-2">
                    <h2 className="font-display text-xl font-extrabold capitalize tracking-tight text-ink">
                      {formatDateLongBR(date)}
                    </h2>
                    <span className="font-mono text-xs text-gray-500">
                      {formatDateShort(date)} · {preds.length} jogo
                      {preds.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {preds.map((p) => {
                      const slug = buildMatchSlug(p.home, p.away, p.date);
                      const hasMatchPage = matchSlugs.has(slug);
                      const heading = `${p.home} x ${p.away}`;
                      return (
                        <article key={slug} id={slug} className="scroll-mt-24">
                          <h3 className="mb-2 font-display text-lg font-extrabold tracking-tight text-ink">
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
          </details>
        )}

        <div className="mt-10">
          <PushOptIn />
        </div>

        <div className="mt-12">
          <SeoHubLinks
            title="Explore as probabilidades"
            description="Partidas, disputas da temporada e chances de cada clube, calculadas pelo nosso modelo estatístico."
            links={probabilityLinks}
          />
        </div>

        {/* Como calculamos — E-E-A-T + disclaimer (compliance) */}
        <section className="mt-14 rounded-lg bg-surface p-6">
          <h2 className="mb-3 text-lg font-bold text-secondary">
            Como calculamos as probabilidades
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
              As probabilidades são <strong>estimativas estatísticas</strong> e
              não garantem resultado — futebol é imprevisível por natureza.
              Conteúdo informativo. Apostas são para maiores de 18 anos; jogue
              com responsabilidade.
            </p>
            <p>
              <Link
                href="/metodologia-dos-palpites"
                className="font-medium text-primary hover:underline"
              >
                Leia a metodologia completa, as limitações e o acompanhamento
                de desempenho do modelo →
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ visível: responde dúvidas reais; o schema apenas descreve o conteúdo. */}
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Perguntas frequentes sobre as probabilidades
          </h2>
          <ArticleFAQ items={FAQ} />
        </section>
      </div>
    </>
  );
}
