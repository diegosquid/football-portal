import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/articles";
import { getAllCategories } from "@/lib/categories";
import { getAllAuthors } from "@/lib/authors";
import { getAllTeams, teamPlaysInGame } from "@/lib/teams";
import { getAllCompetitions } from "@/lib/competitions";
import { getAllKnownMatches, getScheduleMeta } from "@/lib/matches";
import { getProbabilitiesData } from "@/lib/probabilities";
import { getStandingsData } from "@/lib/standings";
import { getAllStandingsCopy } from "@/lib/standings-competitions";
import { getAllTopScorersSlugs } from "@/lib/topscorers";
import { getAllTopScorersCopy } from "@/lib/topscorers-competitions";
import { getAllRaceTeamSlugs } from "@/lib/race";
import { getPublishableChannels } from "@/lib/channels";
import { getBracketsData } from "@/lib/brackets";
import { getAllBracketCopy } from "@/lib/brackets-route";
import { getVenuesData } from "@/lib/venues";
import { siteConfig } from "@/lib/site";
import { ARTICLES_PER_PAGE } from "@/lib/pagination";

// Artigo publicado sem build precisa entrar no sitemap sem build também.
// Sem este revalidate a rota é estática e congela no último deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const [
    probabilities,
    standings,
    knownMatches,
    articles,
    topScorersSlugs,
    raceTeamSlugs,
    publishableChannels,
    brackets,
    venues,
  ] = await Promise.all([
    getProbabilitiesData(),
    getStandingsData(),
    getAllKnownMatches(),
    getPublishedArticles(),
    getAllTopScorersSlugs(),
    getAllRaceTeamSlugs(),
    getPublishableChannels(),
    getBracketsData(),
    getVenuesData(),
  ]);
  const probabilitiesUpdatedAt =
    probabilities?.generatedAt ?? new Date().toISOString();
  const standingsUpdatedAt =
    standings?.generatedAt ?? new Date().toISOString();

  /**
   * `lastModified` precisa apontar pra quando o CONTEÚDO mudou, não pra quando
   * o sitemap foi gerado.
   *
   * Como este arquivo tem `revalidate = 3600`, um `new Date()` fazia toda URL
   * do site — inclusive `/sobre`, que não muda há meses — se declarar recém-
   * atualizada de hora em hora. Sitemap que grita "tudo novo" o tempo todo
   * ensina o buscador a ignorar o campo, e aí ele deixa de ajudar justamente
   * nas páginas que mudam de verdade.
   *
   * Cada bloco abaixo usa a data da sua própria fonte: agenda, dado ou artigo.
   */
  const scheduleUpdatedAt = (await getScheduleMeta()).updatedAt;
  const scheduleDate = scheduleUpdatedAt
    ? new Date(scheduleUpdatedAt)
    : new Date(probabilitiesUpdatedAt);

  const newestOf = (list: { date: string; updated?: string }[]): Date => {
    let best = 0;
    for (const a of list) {
      const t = new Date(a.updated ?? a.date).getTime();
      if (Number.isFinite(t) && t > best) best = t;
    }
    return best > 0 ? new Date(best) : scheduleDate;
  };

  const newestArticle = newestOf(articles);

  /**
   * Páginas de texto fixo. A data sai daqui, na mão, e só muda quando alguém
   * mexe no conteúdo — é o único jeito honesto, já que não há fonte de dado
   * por trás delas.
   */
  const STATIC_CONTENT_UPDATED = new Date("2026-08-05T00:00:00-03:00");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: newestArticle, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/jogos-futebol-hoje`, lastModified: scheduleDate, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/jogos-de-amanha`, lastModified: scheduleDate, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/jogos-da-semana`, lastModified: scheduleDate, changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/probabilidades`, lastModified: new Date(probabilitiesUpdatedAt), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/tabela`, lastModified: new Date(standingsUpdatedAt), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/metodologia-dos-palpites`, lastModified: new Date(probabilitiesUpdatedAt), changeFrequency: "monthly", priority: 0.65 },
    { url: `${baseUrl}/estatisticas`, lastModified: new Date(probabilitiesUpdatedAt), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/time`, lastModified: newestArticle, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/selecao-brasileira`, lastModified: newestArticle, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/copa-do-mundo-feminina-2027`, lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/sobre`, lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/feed.xml`, lastModified: newestArticle, changeFrequency: "hourly", priority: 0.5 },
    { url: `${baseUrl}/atom.xml`, lastModified: newestArticle, changeFrequency: "hourly", priority: 0.5 },
  ];

  // Landings de classificação — entram sozinhas quando a competição ganha
  // tabela publicada (config em src/lib/standings-competitions.ts).
  const standingsPages: MetadataRoute.Sitemap = getAllStandingsCopy()
    .filter((copy) => Boolean(standings?.tables?.[copy.slug]))
    .map((copy) => ({
      url: `${baseUrl}${copy.path}`,
      lastModified: new Date(standingsUpdatedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

  // Landings de artilharia — entram sozinhas quando a competição passa na
  // conferência do build-topscorers.js.
  const topScorersPages: MetadataRoute.Sitemap = getAllTopScorersCopy()
    .filter((copy) => topScorersSlugs.includes(copy.slug))
    .map((copy) => ({
      url: `${baseUrl}${copy.path}`,
      lastModified: new Date(standingsUpdatedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

  // Probabilidades por objetivo + uma página por time simulado.
  const racePages: MetadataRoute.Sitemap =
    raceTeamSlugs.length === 0
      ? []
      : [
          ...["rebaixamento", "titulo"].map((objective) => ({
            url: `${baseUrl}/probabilidades/${objective}`,
            lastModified: new Date(standingsUpdatedAt),
            changeFrequency: "daily" as const,
            priority: 0.9,
          })),
          ...raceTeamSlugs.map((slug) => ({
            url: `${baseUrl}/probabilidades/${slug}`,
            lastModified: new Date(standingsUpdatedAt),
            changeFrequency: "daily" as const,
            priority: 0.75,
          })),
        ];

  // Canais de transmissão — só os que têm jogo suficiente na base.
  const channelPages: MetadataRoute.Sitemap = publishableChannels.map(
    (channel) => ({
      url: `${baseUrl}/onde-assistir/${channel.slug}`,
      lastModified: scheduleDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }),
  );

  // Chaveamentos — só competição com fase aprovada na conferência estrutural.
  const bracketPages: MetadataRoute.Sitemap = getAllBracketCopy()
    .filter((copy) => Boolean(brackets?.competitions?.[copy.slug]))
    .map((copy) => ({
      url: `${baseUrl}${copy.path}`,
      lastModified: new Date(brackets?.generatedAt ?? Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  // Estádios — evergreen, só entra quando o dado existe.
  const venuePages: MetadataRoute.Sitemap = venues?.competitions?.brasileirao
    ? [
        {
          url: `${baseUrl}/estadios-do-brasileirao`,
          lastModified: new Date(venues.generatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        },
      ]
    : [];

  // Feeds por categoria (RSS + Atom)
  const categoryFeedPages: MetadataRoute.Sitemap = getAllCategories().flatMap(
    (cat) => [
      {
        url: `${baseUrl}/categoria/${cat.slug}/feed.xml`,
        lastModified: newestOf(articles.filter((a) => a.category === cat.slug)),
        changeFrequency: "hourly" as const,
        priority: 0.4,
      },
      {
        url: `${baseUrl}/categoria/${cat.slug}/atom.xml`,
        lastModified: newestOf(articles.filter((a) => a.category === cat.slug)),
        changeFrequency: "hourly" as const,
        priority: 0.4,
      },
    ],
  );

  // Categorias — página 1
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: newestOf(articles.filter((a) => a.category === cat.slug)),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Categorias — páginas 2+
  const categoryPaginatedPages: MetadataRoute.Sitemap = getAllCategories().flatMap((cat) => {
    const count = articles.filter((a) => a.category === cat.slug).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/categoria/${cat.slug}/pagina/${i + 2}`,
      lastModified: newestOf(articles.filter((a) => a.category === cat.slug)),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  });

  // Autores — página 1
  const authorPages: MetadataRoute.Sitemap = getAllAuthors().map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
    lastModified: newestOf(articles.filter((a) => a.author === author.slug)),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Autores — páginas 2+
  const authorPaginatedPages: MetadataRoute.Sitemap = getAllAuthors().flatMap((author) => {
    const count = articles.filter((a) => a.author === author.slug).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/autor/${author.slug}/pagina/${i + 2}`,
      lastModified: newestOf(articles.filter((a) => a.author === author.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  });

  // Times "hoje" — /jogos-futebol-hoje/[team]
  const teamHojePages: MetadataRoute.Sitemap = getAllTeams().map((team) => ({
    url: `${baseUrl}/jogos-futebol-hoje/${team.slug}`,
    lastModified: scheduleDate,
    changeFrequency: "hourly" as const,
    priority: 0.85,
  }));

  // Calendário por time — /proximos-jogos/[time] (só times com jogos na base)
  const proximosJogosPages: MetadataRoute.Sitemap = getAllTeams()
    .filter((team) =>
      knownMatches.some((m) => teamPlaysInGame(team.slug, m.home, m.away)),
    )
    .map((team) => ({
      url: `${baseUrl}/proximos-jogos/${team.slug}`,
      lastModified: scheduleDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  // Competições "hoje" — /jogos-futebol-hoje/[competicao]
  const competitionHojePages: MetadataRoute.Sitemap = getAllCompetitions().map(
    (comp) => ({
      url: `${baseUrl}/jogos-futebol-hoje/${comp.slug}`,
      lastModified: scheduleDate,
      changeFrequency: "hourly" as const,
      priority: 0.85,
    }),
  );

  // Times — página 1
  const teamPages: MetadataRoute.Sitemap = getAllTeams().map((team) => ({
    url: `${baseUrl}/time/${team.slug}`,
    lastModified: newestOf(articles.filter((a) => a.teams.includes(team.slug))),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Times — páginas 2+
  const teamPaginatedPages: MetadataRoute.Sitemap = getAllTeams().flatMap((team) => {
    const count = articles.filter((a) => a.teams.includes(team.slug)).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/time/${team.slug}/pagina/${i + 2}`,
      lastModified: newestOf(articles.filter((a) => a.teams.includes(team.slug))),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  });

  // Artigos
  const articlePages: MetadataRoute.Sitemap = articles
    .map((article) => ({
      url: `${baseUrl}/${article.slug}`,
      lastModified: new Date(article.updated ?? article.date),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  // Páginas de "onde assistir" — uma por jogo em jogos-hoje.json.
  // Silencioso se o arquivo estiver ausente no build.
  let matchPages: MetadataRoute.Sitemap = [];
  try {
    matchPages = knownMatches.map((m) => ({
      url: `${baseUrl}/onde-assistir/${m.slug}`,
      lastModified: new Date(`${m.date}T${m.time}:00-03:00`),
      changeFrequency: "hourly" as const,
      priority: 0.85,
    }));
  } catch {
    // jogos-hoje.json ausente/corrompido — seguir sem matches.
  }

  return [
    ...staticPages,
    ...standingsPages,
    ...topScorersPages,
    ...racePages,
    ...channelPages,
    ...bracketPages,
    ...venuePages,
    ...categoryPages,
    ...categoryFeedPages,
    ...categoryPaginatedPages,
    ...authorPages,
    ...authorPaginatedPages,
    ...teamHojePages,
    ...proximosJogosPages,
    ...competitionHojePages,
    ...teamPages,
    ...teamPaginatedPages,
    ...matchPages,
    ...articlePages,
  ];
}
