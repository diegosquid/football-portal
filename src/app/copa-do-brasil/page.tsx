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
  currentRound,
  describeTie,
  getBracket,
  teamLabel,
} from "@/lib/brackets";
import {
  daysUntil,
  formatDateLongBR,
  getAllKnownMatches,
  getScheduleMeta,
  type Match,
} from "@/lib/matches";
import { formatUpdatedAt } from "@/lib/standings";
import { siteConfig, truncateForMeta } from "@/lib/site";

/**
 * Hub da Copa do Brasil.
 *
 * Existia um buraco: a competição é o segundo maior assunto do site em busca
 * — 22 páginas dela somam 15.326 impressões e 77 cliques, 6,7% do total
 * (Search Console, mai-ago/2026) — mas não tinha porta de entrada. Os artigos
 * são arquivados na categoria `brasileirao`, então ela nunca aparecia no menu,
 * e o card da categoria apontava para esta URL, que não existia.
 *
 * A página não repete o chaveamento inteiro: mostra a fase atual e manda pra
 * /chaveamento-da-copa-do-brasil, que é a página especializada.
 */

export const revalidate = 900; // 15 min

const PATH = "/copa-do-brasil";
const COMPETITION = "Copa do Brasil";

async function competitionMatches(): Promise<{
  upcoming: Match[];
  past: Match[];
}> {
  const all = (await getAllKnownMatches()).filter(
    (m) => m.competition === COMPETITION,
  );
  return {
    upcoming: all
      .filter((m) => daysUntil(m.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    past: all
      .filter((m) => daysUntil(m.date) < 0)
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}

/** Artigos da competição: não há tag própria, então casa por título/resumo. */
async function competitionArticles() {
  const needle = /copa do brasil/i;
  return (await getPublishedArticles())
    .filter((a) => needle.test(a.title) || needle.test(a.excerpt))
    .slice(0, 6);
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ upcoming }, bracket] = await Promise.all([
    competitionMatches(),
    getBracket("copa-do-brasil"),
  ]);
  const season = bracket?.season ?? String(new Date().getFullYear());
  const now = bracket ? currentRound(bracket) : undefined;
  const next = upcoming[0];

  const title = `Copa do Brasil ${season}: jogos, chaveamento e classificados`;
  const description = truncateForMeta(
    next
      ? `Próximo jogo: ${next.home} x ${next.away}, ${formatDateLongBR(next.date)} às ${next.time}. ` +
          (now ? `${now.name}: ${now.decided} de ${now.ties.length} confrontos definidos. ` : "") +
          "Chaveamento, palpites e cobertura completa."
      : `Tudo da Copa do Brasil ${season}: chaveamento, próximos jogos, quem se classificou e a cobertura completa do torneio.`,
    165,
  );

  return {
    title,
    description,
    keywords: [
      "copa do brasil",
      "copa do brasil 2026",
      "jogos da copa do brasil",
      "chaveamento copa do brasil",
      "quem se classificou na copa do brasil",
      "tabela da copa do brasil",
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

export default async function CopaDoBrasilPage() {
  const [{ upcoming, past }, bracket, articles, schedule] = await Promise.all([
    competitionMatches(),
    getBracket("copa-do-brasil"),
    competitionArticles(),
    getScheduleMeta(),
  ]);

  const season = bracket?.season ?? String(new Date().getFullYear());
  const now = bracket ? currentRound(bracket) : undefined;
  const next = upcoming[0];
  const updatedAt = formatUpdatedAt(schedule.updatedAt);

  const resumo = now
    ? `A Copa do Brasil ${season} está ${now.name.toLowerCase()}, com ${now.decided} de ${now.ties.length} confrontos definidos.`
    : `Acompanhe a Copa do Brasil ${season}.`;

  const faq = [
    {
      question: `Quando é o próximo jogo da Copa do Brasil?`,
      answer: next
        ? `${next.home} x ${next.away}, ${formatDateLongBR(next.date)}, às ${next.time} (horário de Brasília)${next.channel && next.channel !== "A definir" ? `, com transmissão de ${next.channel}` : ""}.`
        : "Não há jogo marcado na agenda no momento. O calendário é atualizado todos os dias.",
    },
    {
      question: `Em que fase está a Copa do Brasil ${season}?`,
      answer: now
        ? `${resumo} ${now.ties.slice(0, 3).map(describeTie).join(" ")}`
        : "O chaveamento ainda não foi sorteado.",
    },
    {
      question: "Como funciona o mata-mata da Copa do Brasil?",
      answer:
        "Os confrontos são em ida e volta, e avança quem soma mais gols no agregado. Empate no agregado leva a decisão para os pênaltis — não há gol qualificado como critério de desempate.",
    },
  ];

  return (
    <>
      <CollectionPageJsonLd
        name={`Copa do Brasil ${season}`}
        description={`Jogos, chaveamento e cobertura da Copa do Brasil ${season}.`}
        url={PATH}
        items={upcoming.slice(0, 20).map((m) => ({
          name: `${m.home} x ${m.away} — ${m.date} às ${m.time}`,
          url: `/onde-assistir/${m.slug}`,
        }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Copa do Brasil", url: PATH },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Mata-mata nacional
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Copa do Brasil {season}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Os jogos, o chaveamento, quem já se classificou e a cobertura completa
          do torneio — atualizado todos os dias.
        </p>

        <section className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            {now ? `Fase atual · ${now.name}` : "Situação"}
          </p>
          <p className="mt-2 leading-relaxed text-ink">
            {resumo}
            {next && (
              <>
                {" "}
                O próximo jogo é{" "}
                <strong>
                  {next.home} x {next.away}
                </strong>
                , {formatDateLongBR(next.date)} às {next.time}.
              </>
            )}
          </p>
        </section>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/chaveamento-da-copa-do-brasil", label: "Chaveamento completo" },
            { href: "/jogos-futebol-hoje/copa-do-brasil", label: "Jogos de hoje" },
            { href: "/probabilidades", label: "Palpites" },
            { href: "/categoria/brasileirao", label: "Notícias" },
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

        {upcoming.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Próximos jogos
            </h2>
            <UpcomingMatches matches={upcoming.slice(0, 10)} />
          </section>
        )}

        {now && (
          <section className="mt-14">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                {now.name}
              </h2>
              <Link
                href="/chaveamento-da-copa-do-brasil"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver o chaveamento completo →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {now.ties.map((tie) => {
                const [a, b] = tie.teams;
                return (
                  <div
                    key={tie.teams.join("-")}
                    className="border border-ink/15 bg-white p-4"
                  >
                    <p className="font-semibold text-ink">
                      {teamLabel(a).name} x {teamLabel(b).name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {describeTie(tie)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimos jogos
            </h2>
            <UpcomingMatches matches={past.slice(0, 6)} />
          </section>
        )}

        <ArticleFAQ items={faq} />

        {articles.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Notícias da Copa do Brasil
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
          </section>
        )}

        {updatedAt && (
          <p className="mt-10 text-sm text-gray-500">
            Atualizado em {updatedAt}
          </p>
        )}
      </div>
    </>
  );
}
