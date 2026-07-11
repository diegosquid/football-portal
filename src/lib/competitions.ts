export interface Competition {
  slug: string;
  /** Nome de exibição: "Brasileirão Série A" */
  name: string;
  /** Nome curto pra títulos: "Brasileirão" */
  shortName: string;
  /** Artigo do nome: "o Brasileirão" / "a Série B" — pra concordância nos textos. */
  artigo: "o" | "a";
  /** Strings EXATAS do campo competition em jogos.json que pertencem a este hub. */
  matchNames: string[];
  /** Categoria do portal pra puxar artigos relacionados. */
  categorySlug?: string;
}

/**
 * Hubs de competição em /jogos-futebol-hoje/[slug].
 * Páginas evergreen: mesmo sem jogo no dia, mostram próximos jogos e artigos.
 */
export const competitions: Record<string, Competition> = {
  brasileirao: {
    slug: "brasileirao",
    name: "Brasileirão Série A",
    shortName: "Brasileirão",
    artigo: "o",
    matchNames: ["Brasileirão Série A"],
    categorySlug: "brasileirao",
  },
  "brasileirao-serie-b": {
    slug: "brasileirao-serie-b",
    name: "Brasileirão Série B",
    shortName: "Série B",
    artigo: "a",
    matchNames: ["Brasileirão Série B"],
    categorySlug: "brasileirao",
  },
  "copa-do-mundo": {
    slug: "copa-do-mundo",
    name: "Copa do Mundo 2026",
    shortName: "Copa do Mundo",
    artigo: "a",
    matchNames: ["Copa do Mundo 2026", "Copa do Mundo"],
    categorySlug: "selecao",
  },
  "copa-do-brasil": {
    slug: "copa-do-brasil",
    name: "Copa do Brasil",
    shortName: "Copa do Brasil",
    artigo: "a",
    matchNames: ["Copa do Brasil"],
    categorySlug: "brasileirao",
  },
  libertadores: {
    slug: "libertadores",
    name: "Libertadores",
    shortName: "Libertadores",
    artigo: "a",
    matchNames: ["Libertadores"],
    categorySlug: "libertadores",
  },
  "sul-americana": {
    slug: "sul-americana",
    name: "Sul-Americana",
    shortName: "Sul-Americana",
    artigo: "a",
    matchNames: ["Sul-Americana"],
    categorySlug: "libertadores",
  },
  "champions-league": {
    slug: "champions-league",
    name: "Champions League",
    shortName: "Champions",
    artigo: "a",
    matchNames: ["Champions League"],
    categorySlug: "champions",
  },
  "premier-league": {
    slug: "premier-league",
    name: "Premier League",
    shortName: "Premier League",
    artigo: "a",
    matchNames: ["Premier League"],
    categorySlug: "futebol-internacional",
  },
  "la-liga": {
    slug: "la-liga",
    name: "La Liga",
    shortName: "La Liga",
    artigo: "a",
    matchNames: ["La Liga"],
    categorySlug: "futebol-internacional",
  },
};

export function getCompetition(slug: string): Competition | undefined {
  return competitions[slug];
}

export function getAllCompetitions(): Competition[] {
  return Object.values(competitions);
}

/** Slug do hub a partir da string de competição do jogos.json (ou undefined). */
export function resolveCompetitionSlug(matchName: string): string | undefined {
  return getAllCompetitions().find((c) => c.matchNames.includes(matchName))?.slug;
}

/** "do Brasileirão" / "da Série B" — concordância pra títulos e FAQs (sempre nome curto). */
export function compDo(comp: Competition): string {
  return `${comp.artigo === "a" ? "da" : "do"} ${comp.shortName}`;
}

/** O jogo pertence a este hub de competição? */
export function competitionHasGame(comp: Competition, competitionName: string): boolean {
  return comp.matchNames.includes(competitionName);
}
