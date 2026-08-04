import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import {
  daysUntil,
  formatDateLongBR,
  getAllKnownMatches,
  type Match,
} from "@/lib/matches";
import { siteConfig, truncateForMeta } from "@/lib/site";
import { getTeam, teamPlaysInGame } from "@/lib/teams";

/**
 * Hub permanente da Seleção Brasileira — o "o que vem agora".
 *
 * Divisão de papéis com /time/selecao-brasileira, que já existe: aquela página
 * é o ARQUIVO de notícias do time (como a de qualquer clube); esta é a agenda
 * do ciclo — próximo jogo, calendário e convocação. As duas se linkam para o
 * buscador entender que não são a mesma coisa.
 */

export const revalidate = 900; // 15 min

const PATH = "/selecao-brasileira";
const TEAM_SLUG = "selecao-brasileira";

/**
 * Calendário do ciclo pós-Copa. É texto porque não existe fonte estruturada de
 * Data Fifa no plano da API — quando o jogo entra no jogos.json, ele aparece
 * sozinho no bloco de próximos jogos acima.
 */
const CICLO = [
  {
    janela: "Setembro de 2026",
    descricao:
      "Primeira Data Fifa após a Copa do Mundo. Costuma ser a janela de renovação do elenco, com testes de jogadores novos em amistosos.",
  },
  {
    janela: "Outubro e novembro de 2026",
    descricao:
      "Datas Fifa de fim de ano, normalmente com amistosos contra seleções europeias ou sul-americanas.",
  },
  {
    janela: "2027",
    descricao:
      "Início da preparação para o próximo ciclo competitivo, com a Copa América e as Eliminatórias no horizonte.",
  },
];

async function getSelecaoMatches(): Promise<{
  upcoming: Match[];
  past: Match[];
}> {
  const matches = (await getAllKnownMatches()).filter((m) =>
    teamPlaysInGame(TEAM_SLUG, m.home, m.away),
  );
  return {
    upcoming: matches
      .filter((m) => daysUntil(m.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date)),
    past: matches
      .filter((m) => daysUntil(m.date) < 0)
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { upcoming } = await getSelecaoMatches();
  const next = upcoming[0];

  const title = next
    ? `Seleção Brasileira: próximo jogo, convocação e calendário`
    : `Seleção Brasileira: próximo jogo, convocação e calendário`;
  const description = truncateForMeta(
    next
      ? `Próximo jogo da Seleção Brasileira: ${next.home} x ${next.away}, ${formatDateLongBR(next.date)} às ${next.time}. Convocação, calendário do ciclo e todas as notícias.`
      : `Tudo sobre a Seleção Brasileira: próximo jogo, convocação, calendário do ciclo pós-Copa do Mundo e as últimas notícias, atualizado todos os dias.`,
    165,
  );

  return {
    title,
    description,
    keywords: [
      "próximo jogo da seleção brasileira",
      "seleção brasileira",
      "convocação da seleção brasileira",
      "calendário da seleção brasileira",
      "quando a seleção joga",
      "jogos da seleção brasileira",
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

export default async function SelecaoBrasileiraPage() {
  const team = getTeam(TEAM_SLUG);
  const { upcoming, past } = await getSelecaoMatches();
  const next = upcoming[0];

  const articles = (await getPublishedArticles())
    .filter((a) => a.teams.includes(TEAM_SLUG))
    .slice(0, 9);

  const nextAnswer = next
    ? `O próximo jogo da Seleção Brasileira é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)}, às ${next.time} (horário de Brasília)${next.channel ? `, com transmissão de ${next.channel}` : ""}.`
    : "A Seleção Brasileira não tem jogo marcado na agenda no momento. O calendário é atualizado assim que a CBF confirma as datas da próxima janela — normalmente algumas semanas antes da Data Fifa.";

  const faq = [
    { question: "Quando é o próximo jogo da Seleção Brasileira?", answer: nextAnswer },
    {
      question: "Quando sai a próxima convocação da Seleção?",
      answer:
        "A CBF costuma anunciar a lista de convocados de sete a dez dias antes do primeiro jogo da janela. Publicamos a convocação completa aqui e na página de notícias da Seleção assim que ela é divulgada.",
    },
    {
      question: "O que vem depois da Copa do Mundo de 2026?",
      answer:
        "O calendário volta pelas Datas Fifa, com amistosos e renovação de elenco, até o início do próximo ciclo competitivo. As janelas de setembro, outubro e novembro são as primeiras do novo ciclo.",
    },
    {
      question: "Onde assistir aos jogos da Seleção Brasileira?",
      answer: next?.channel
        ? `O próximo jogo tem transmissão de ${next.channel}. A emissora de cada partida aparece na agenda assim que é confirmada.`
        : "A emissora de cada jogo aparece na nossa agenda assim que é confirmada pela CBF e pelos detentores dos direitos.",
    },
  ];

  return (
    <>
      <CollectionPageJsonLd
        name="Seleção Brasileira"
        description="Próximo jogo, convocação, calendário e notícias da Seleção Brasileira."
        url={PATH}
        items={articles.map((a) => ({ name: a.title, url: `/${a.slug}` }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Seleção Brasileira", url: PATH },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Seleção
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Seleção Brasileira
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Próximo jogo, convocação, calendário do ciclo e a cobertura completa
          da Seleção — atualizado todos os dias.
        </p>

        <section className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            Próximo jogo
          </p>
          <p className="mt-2 leading-relaxed text-ink">{nextAnswer}</p>
        </section>

        {upcoming.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Agenda da Seleção
            </h2>
            <UpcomingMatches matches={upcoming.slice(0, 10)} />
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Calendário do ciclo
          </h2>
          <p className="mb-5 mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            As janelas em que a Seleção entra em campo depois da Copa do Mundo.
            Datas confirmadas aparecem na agenda acima assim que saem.
          </p>
          <div className="space-y-3">
            {CICLO.map((item) => (
              <div
                key={item.janela}
                className="border-l-4 border-primary bg-white p-4"
              >
                <p className="font-semibold text-ink">{item.janela}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </section>

        {past.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimos jogos
            </h2>
            <UpcomingMatches matches={past.slice(0, 5)} />
          </section>
        )}

        <nav className="mt-12 flex flex-wrap gap-2 text-sm">
          {[
            { href: `/time/${TEAM_SLUG}`, label: "Todas as notícias da Seleção" },
            { href: `/proximos-jogos/${TEAM_SLUG}`, label: "Próximos jogos" },
            { href: "/copa-do-mundo-feminina-2027", label: "Copa do Mundo Feminina 2027" },
            { href: "/categoria/selecao", label: "Categoria Seleção" },
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

        {articles.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Notícias da Seleção
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
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
            <p className="mt-5 text-sm">
              <Link
                href={`/time/${TEAM_SLUG}`}
                className="font-medium text-primary hover:underline"
              >
                Ver todas as notícias {team ? `da ${team.name}` : "da Seleção"} →
              </Link>
            </p>
          </section>
        )}

        <ArticleFAQ items={faq} />
      </div>
    </>
  );
}
