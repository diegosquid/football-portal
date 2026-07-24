import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import {
  getProbabilitiesData,
  getProbabilityHistory,
} from "@/lib/probabilities";
import { siteConfig } from "@/lib/site";

const title = "Metodologia dos Palpites: Como Calculamos as Probabilidades";
const description =
  "Entenda como o modelo estatístico do Beira do Campo calcula probabilidades, placares e gols, quais dados usa e como seu desempenho é acompanhado.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteConfig.url}/metodologia-dos-palpites` },
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/metodologia-dos-palpites`,
    type: "article",
    images: [
      {
        url: "/og-probabilidades.jpg",
        width: 1200,
        height: 630,
        alt: "Metodologia dos palpites do Beira do Campo",
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

function formatUpdatedAt(timestamp?: string): string | null {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}

export default function MetodologiaDosPalpitesPage() {
  const current = getProbabilitiesData();
  const history = getProbabilityHistory();
  const metrics = history?.metrics;
  const hasReliableSample = Boolean(
    metrics && metrics.evaluated >= metrics.minimumSample,
  );
  const updatedAt = formatUpdatedAt(
    history?.updatedAt ?? current?.generatedAt,
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Palpites", url: "/probabilidades" },
          { name: "Metodologia", url: "/metodologia-dos-palpites" },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Transparência do modelo
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          Como calculamos os palpites e probabilidades
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-600">
          O modelo transforma resultados reais em estimativas de vitória,
          empate, gols e placar provável. Esta página explica o processo, suas
          limitações e como acompanhamos o desempenho sem esconder os erros.
        </p>
        {updatedAt && (
          <p className="mt-3 text-sm text-gray-500">
            Metodologia e histórico atualizados em {updatedAt}.
          </p>
        )}

        <div className="mt-10 space-y-10 leading-relaxed text-gray-700">
          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Quem mantém o modelo
            </h2>
            <p className="mt-3">
              O modelo foi desenvolvido e é mantido pela equipe do{" "}
              <Link href="/sobre" className="font-medium text-primary hover:underline">
                Beira do Campo
              </Link>
              . A automação executa os cálculos; a metodologia, os textos
              explicativos e as regras de publicação são responsabilidade
              editorial do portal.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Dados utilizados
            </h2>
            <p className="mt-3">
              Usamos resultados da temporada corrente fornecidos pela
              API-Football. Para cada equipe, separamos o desempenho como
              mandante e visitante: gols marcados, gols sofridos e quantidade
              de partidas consideradas. O painel de cada confronto informa o
              tamanho da amostra usada.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Como a probabilidade é calculada
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5">
              <li>Calculamos a média de gols da competição em casa e fora.</li>
              <li>
                Medimos a força de ataque e defesa de cada time em relação à
                média da liga.
              </li>
              <li>
                Combinamos ataque, defesa e mando para estimar os gols esperados
                de cada equipe.
              </li>
              <li>
                Aplicamos a distribuição de Poisson aos placares de 0 a 10 gols
                e somamos os cenários de vitória, empate e derrota.
              </li>
              <li>
                Da mesma matriz saem mais de 2,5 gols, ambos marcam e o placar
                individual mais provável.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Amostras pequenas
            </h2>
            <p className="mt-3">
              Quando um time tem poucos jogos, sua força é aproximada da média
              da competição. Essa regressão evita que uma goleada isolada ou um
              início atípico de temporada distorça excessivamente a previsão.
              O peso dos dados do próprio time cresce conforme a amostra
              aumenta.
            </p>
          </section>

          <section className="border border-ink/15 bg-white p-6">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Desempenho histórico
            </h2>
            {hasReliableSample && metrics ? (
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Jogos avaliados
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-extrabold text-ink">
                    {metrics.evaluated}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Acerto 1x2
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-extrabold text-ink">
                    {Math.round(metrics.hitRate * 100)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Brier normalizado
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-extrabold text-ink">
                    {metrics.brierScore.toFixed(2)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3">
                O acompanhamento já está ativo, mas só publicaremos percentuais
                depois de pelo menos {metrics?.minimumSample ?? 20} partidas
                encerradas. Até agora, {metrics?.evaluated ?? 0} jogos foram
                avaliados. Isso evita apresentar uma taxa instável como se
                fosse evidência sólida.
              </p>
            )}
            <p className="mt-4 text-sm text-gray-500">
              “Acerto 1x2” compara o resultado mais provável com vitória,
              empate ou derrota real. O Brier mede a qualidade de todas as
              probabilidades; quanto menor, melhor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Limitações
            </h2>
            <p className="mt-3">
              O modelo não conhece escalações de última hora, lesões, clima,
              expulsões futuras, prioridade no calendário ou mudanças táticas.
              Probabilidade não é certeza e o placar mais provável costuma ter
              chance individual baixa, mesmo quando é o maior valor da matriz.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Conteúdo informativo. Não oferecemos garantia de resultado.
              Apostas são para maiores de 18 anos; aposte com responsabilidade.
            </p>
          </section>
        </div>

        <Link
          href="/probabilidades"
          className="mt-10 inline-flex border border-primary px-5 py-3 font-bold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Ver os palpites de hoje →
        </Link>
      </article>
    </>
  );
}
