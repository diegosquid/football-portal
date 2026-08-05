import { getPublishedArticles } from "@/lib/articles";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { SeoHubLinks, type SeoHubLink } from "@/components/SeoHubLinks";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/JsonLd";
import { getAllTeams, getTeam, teamPlaysInGame } from "@/lib/teams";
import { siteConfig, truncateForMeta } from "@/lib/site";
import { paginate, buildPaginationUrls } from "@/lib/pagination";
import {
  formatDateLongBR,
  formatDateShortBR,
  getAllKnownMatches,
  getTodayBRT,
} from "@/lib/matches";
import { getTeamRaces } from "@/lib/race";
import { formatChance } from "@/lib/standings";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTeams().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) return {};

  const next = (await getAllKnownMatches())
    .filter(
      (match) =>
        match.date >= getTodayBRT() &&
        teamPlaysInGame(team.slug, match.home, match.away),
    )
    .sort((a, b) =>
      a.date === b.date
        ? a.time.localeCompare(b.time)
        : a.date.localeCompare(b.date),
    )[0];
  const description = truncateForMeta(
    next
      ? `${team.name}: notícias, próximo jogo, tabela e probabilidades. A próxima partida é ${next.home} x ${next.away}, ${formatDateLongBR(next.date)}, às ${next.time}.`
      : `${team.name}: últimas notícias, jogos, tabela, classificação, transferências e probabilidades atualizadas.`,
    160,
  );

  return {
    title: `${team.name}: notícias, jogos, tabela e classificação`,
    description,
    alternates: { canonical: `/time/${slug}` },
    openGraph: {
      title: `${team.name}: notícias, jogos e tabela`,
      description,
      url: `${siteConfig.url}/time/${slug}`,
    },
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) notFound();

  const [articles, allMatches, teamRaces] = await Promise.all([
    getPublishedArticles(),
    getAllKnownMatches(),
    getTeamRaces(slug),
  ]);
  const teamArticles = articles.filter((article) => article.teams.includes(slug));
  const today = getTodayBRT();
  const matches = allMatches
    .filter(
      (match) =>
        match.date >= today &&
        teamPlaysInGame(team.slug, match.home, match.away),
    )
    .sort((a, b) =>
      a.date === b.date
        ? a.time.localeCompare(b.time)
        : a.date.localeCompare(b.date),
    );
  const todayMatch = matches.find((match) => match.date === today);
  const nextMatch = matches[0];
  const primaryRace =
    teamRaces.find((race) => race.slug === "brasileirao") ?? teamRaces[0];

  const result = paginate(teamArticles, 1);
  const basePath = `/time/${slug}`;
  const { pageUrl } = buildPaginationUrls(basePath, 1, result?.totalPages ?? 1);
  const hubLinks: SeoHubLink[] = [
    {
      href: `/proximos-jogos/${slug}`,
      eyebrow: "Agenda",
      title: `Próximo jogo do ${team.name}`,
      description: nextMatch
        ? `${nextMatch.home} x ${nextMatch.away}, ${formatDateLongBR(nextMatch.date)}, às ${nextMatch.time}.`
        : "Confira a agenda completa, com datas, horários e competições.",
      value: nextMatch ? formatDateShortBR(nextMatch.date) : "Ver calendário",
    },
    {
      href: `/jogos-futebol-hoje/${slug}`,
      eyebrow: "Hoje",
      title: `${team.name} joga hoje?`,
      description: todayMatch
        ? `${todayMatch.home} x ${todayMatch.away}, às ${todayMatch.time}, pelo ${todayMatch.competition}.`
        : "Veja se há partida hoje e consulte os próximos compromissos.",
      value: todayMatch ? `Sim · ${todayMatch.time}` : "Ver programação",
    },
    {
      href: primaryRace?.standingsPath ?? "/tabela",
      eyebrow: "Classificação",
      title: `Tabela do ${team.name}`,
      description: primaryRace
        ? `Posição, pontos, desempenho e situação no ${primaryRace.shortName}.`
        : "Posição, pontos e desempenho nas principais competições.",
      value: primaryRace
        ? `${primaryRace.row.position}º · ${primaryRace.row.points} pts`
        : "Ver tabelas",
    },
    {
      href: teamRaces.length > 0 ? `/probabilidades/${slug}` : "/probabilidades",
      eyebrow: "Simulações",
      title: `Chances do ${team.name}`,
      description:
        "Probabilidades calculadas a partir de 10 mil simulações dos jogos restantes.",
      value:
        primaryRace?.row.chances != null
          ? `${formatChance(primaryRace.row.chances.titulo)} título · ${formatChance(primaryRace.row.chances.rebaixamento)} queda`
          : "Ver probabilidades",
    },
  ];
  const description = `${team.name}: notícias, próximo jogo, tabela, classificação e probabilidades atualizadas.`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: team.name, url: basePath },
        ]}
      />
      <CollectionPageJsonLd
        name={`${team.name}: notícias, jogos e tabela`}
        description={description}
        url={basePath}
        items={hubLinks.map((item) => ({
          name: item.title,
          url: item.href,
        }))}
      />

      <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <span className="h-1 w-1 rotate-45 bg-gray-400" />
        <span className="text-gray-700">{team.name}</span>
      </nav>

      <header className="mb-10 flex flex-wrap items-center gap-5 border-b-2 border-ink pb-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-black text-white">
          {team.shortName}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            Central do time
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink lg:text-5xl">
            {team.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Notícias, próximo jogo, tabela, classificação e probabilidades do {team.name}. Acompanhe tudo em um só lugar.
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
            {team.state}
          </p>
        </div>
      </header>

      <SeoHubLinks
        title={`Acompanhe o ${team.name}`}
        description="Atalhos para as páginas que respondem cada intenção de busca, sem misturar notícias, agenda e probabilidades."
        links={hubLinks}
      />

      {/* Articles */}
      <h2 className="mb-6 text-xl font-black text-secondary">
        {teamArticles.length}{" "}
        {teamArticles.length === 1 ? "matéria" : "matérias"} sobre o{" "}
        {team.name}
      </h2>

      {result && result.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
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
          <Pagination
            currentPage={1}
            totalPages={result.totalPages}
            pageUrl={pageUrl}
          />
        </>
      ) : (
        <p className="text-gray-500">
          Nenhuma matéria sobre o {team.name} por enquanto. Em breve teremos
          cobertura completa!
        </p>
      )}
    </div>
  );
}
