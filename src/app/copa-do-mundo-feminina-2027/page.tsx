import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";

/**
 * Hub da Copa do Mundo Feminina de 2027, no Brasil.
 *
 * Aposta de first-mover: o torneio é em junho de 2027 e a SERP ainda não tem
 * dono. Página evergreen, sem dependência de API — os fatos (datas, sedes,
 * formato) já estão confirmados pela Fifa e pela CBF e mudam pouco.
 *
 * O que NÃO está aqui de propósito: qual estádio recebe a abertura e a final.
 * A Fifa anunciou as oito sedes, mas a distribuição dos jogos por estádio não
 * foi confirmada — chutar isso numa página que quer ser referência é o começo
 * do fim da autoridade dela.
 */

export const revalidate = 86400; // 24 h

const PATH = "/copa-do-mundo-feminina-2027";

const SEDES = [
  { cidade: "Rio de Janeiro", uf: "RJ", estadio: "Maracanã" },
  { cidade: "São Paulo", uf: "SP", estadio: "Arena Itaquera (Neo Química Arena)" },
  { cidade: "Belo Horizonte", uf: "MG", estadio: "Mineirão" },
  { cidade: "Brasília", uf: "DF", estadio: "Estádio Nacional (Mané Garrincha)" },
  { cidade: "Salvador", uf: "BA", estadio: "Arena Fonte Nova" },
  { cidade: "Fortaleza", uf: "CE", estadio: "Arena Castelão" },
  { cidade: "Porto Alegre", uf: "RS", estadio: "Beira-Rio" },
  { cidade: "Recife", uf: "PE", estadio: "Arena de Pernambuco" },
];

const CALENDARIO = [
  { fase: "Fase de grupos", periodo: "24 de junho a 8 de julho de 2027" },
  { fase: "Oitavas de final", periodo: "10 a 13 de julho de 2027" },
  { fase: "Quartas de final", periodo: "16 e 17 de julho de 2027" },
  { fase: "Semifinais", periodo: "20 e 21 de julho de 2027" },
  { fase: "Disputa de 3º lugar", periodo: "24 de julho de 2027" },
  { fase: "Final", periodo: "25 de julho de 2027" },
];

export async function generateMetadata(): Promise<Metadata> {
  const title =
    "Copa do Mundo Feminina 2027 no Brasil: datas, sedes e estádios";
  const description =
    "A Copa do Mundo Feminina de 2027 será no Brasil, de 24 de junho a 25 de julho, em 8 cidades-sede. Veja os estádios, o calendário completo e como funciona o torneio.";

  return {
    title,
    description,
    keywords: [
      "copa do mundo feminina 2027",
      "copa do mundo feminina 2027 no brasil",
      "sedes da copa do mundo feminina 2027",
      "estádios da copa do mundo feminina 2027",
      "datas da copa do mundo feminina 2027",
      "ingressos copa do mundo feminina 2027",
    ],
    alternates: { canonical: `${siteConfig.url}${PATH}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${PATH}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CopaFeminina2027Page() {
  const related = (await getPublishedArticles())
    .filter((a) => a.category === "selecao")
    .slice(0, 3);

  const faq = [
    {
      question: "Quando é a Copa do Mundo Feminina de 2027?",
      answer:
        "De 24 de junho a 25 de julho de 2027. A fase de grupos vai até 8 de julho, e a final está marcada para 25 de julho.",
    },
    {
      question: "Onde vai ser a Copa do Mundo Feminina de 2027?",
      answer:
        "No Brasil. É a primeira vez que um país da América do Sul recebe uma Copa do Mundo Feminina. Serão oito cidades-sede: Rio de Janeiro, São Paulo, Belo Horizonte, Brasília, Salvador, Fortaleza, Porto Alegre e Recife.",
    },
    {
      question: "Quais são os estádios da Copa do Mundo Feminina 2027?",
      answer:
        "Maracanã (Rio de Janeiro), Arena Itaquera (São Paulo), Mineirão (Belo Horizonte), Estádio Nacional (Brasília), Arena Fonte Nova (Salvador), Arena Castelão (Fortaleza), Beira-Rio (Porto Alegre) e Arena de Pernambuco (Recife).",
    },
    {
      question: "Quantas seleções disputam a Copa do Mundo Feminina de 2027?",
      answer:
        "32 seleções, no mesmo formato da edição anterior: oito grupos de quatro, com os dois primeiros de cada grupo avançando às oitavas de final.",
    },
    {
      question: "Como comprar ingressos para a Copa do Mundo Feminina 2027?",
      answer:
        "Os ingressos são vendidos pelos canais oficiais da Fifa. O cadastro de interesse foi aberto em 2026 e as fases de venda são anunciadas pela entidade ao longo do período que antecede o torneio. Desconfie de qualquer venda fora do site oficial.",
    },
  ];

  return (
    <>
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Copa do Mundo Feminina 2027", url: PATH },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: "Copa do Mundo Feminina da FIFA de 2027",
            sport: "Futebol",
            startDate: "2027-06-24",
            endDate: "2027-07-25",
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              "https://schema.org/OfflineEventAttendanceMode",
            location: SEDES.map((sede) => ({
              "@type": "Place",
              name: sede.estadio,
              address: {
                "@type": "PostalAddress",
                addressLocality: sede.cidade,
                addressRegion: sede.uf,
                addressCountry: "BR",
              },
            })),
            url: `${siteConfig.url}${PATH}`,
          }),
        }}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Copa do Mundo Feminina
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Copa do Mundo Feminina 2027
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Pela primeira vez, uma Copa do Mundo Feminina será disputada na
          América do Sul. O Brasil recebe a 10ª edição do torneio em oito
          cidades-sede, com 32 seleções.
        </p>

        <section className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            Quando e onde
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            24 de junho a 25 de julho de 2027
          </p>
          <p className="mt-1 text-sm text-gray-700">
            8 cidades-sede no Brasil · 32 seleções · 64 jogos
          </p>
        </section>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/selecao-brasileira", label: "Seleção Brasileira" },
            { href: "/categoria/selecao", label: "Notícias da Seleção" },
            { href: "/jogos-futebol-hoje", label: "Jogos de hoje" },
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

        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Cidades-sede e estádios
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SEDES.map((sede) => (
              <div
                key={sede.cidade}
                className="border border-ink/15 bg-white p-4"
              >
                <p className="font-semibold text-ink">
                  {sede.cidade}
                  <span className="ml-1 font-mono text-xs text-gray-500">
                    {sede.uf}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-gray-600">{sede.estadio}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            A Fifa ainda não divulgou quais jogos cada estádio recebe. Assim que
            a distribuição sair, ela entra aqui.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Calendário do torneio
          </h2>
          <div className="overflow-hidden border border-ink/15 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-gray-50 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  <th scope="col" className="py-2 pl-3 pr-3 font-bold">
                    Fase
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Quando
                  </th>
                </tr>
              </thead>
              <tbody>
                {CALENDARIO.map((item) => (
                  <tr
                    key={item.fase}
                    className="border-b border-ink/10 last:border-0"
                  >
                    <td className="py-3 pl-3 pr-3 font-semibold text-ink">
                      {item.fase}
                    </td>
                    <td className="py-3 pr-3 text-sm text-gray-600">
                      {item.periodo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Como funciona o torneio
          </h2>
          <div className="space-y-3 leading-relaxed text-gray-700">
            <p>
              São <strong>32 seleções</strong> divididas em oito grupos de
              quatro. Cada equipe joga três partidas na primeira fase, e as duas
              melhores de cada grupo avançam às oitavas de final.
            </p>
            <p>
              A partir das oitavas, o torneio é mata-mata em jogo único: empate
              no tempo normal leva à prorrogação e, se persistir, aos pênaltis.
              São <strong>64 jogos</strong> no total, da abertura à final.
            </p>
            <p>
              É a <strong>primeira Copa do Mundo Feminina na América do Sul</strong>{" "}
              e a segunda Copa disputada no Brasil desde 2014, contando as
              competições masculinas.
            </p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Ingressos
          </h2>
          <p className="leading-relaxed text-gray-700">
            A venda é feita exclusivamente pelos canais oficiais da Fifa, em
            fases anunciadas ao longo do período que antecede o torneio. O
            cadastro de interesse foi aberto em 2026. Não existe venda oficial
            fora do site da Fifa — qualquer outro canal cobrando por prioridade
            ou reserva antecipada é golpe.
          </p>
        </section>

        <ArticleFAQ items={faq} />

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Mais sobre seleções
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
