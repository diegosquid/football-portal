import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BracketLanding } from "@/components/BracketLanding";
import { siteConfig, truncateForMeta } from "@/lib/site";
import {
  currentRound,
  describeTie,
  getBracket,
  getBracketsData,
} from "@/lib/brackets";

/** Copy das landings de chaveamento — uma entrada por competição. */
export const bracketCopy = {
  "copa-do-brasil": {
    path: "/chaveamento-da-copa-do-brasil",
    h1: (season: string) => `Chaveamento da Copa do Brasil ${season}`,
    title: (season: string) =>
      `Chaveamento da Copa do Brasil ${season}: confrontos e classificados`,
    intro:
      "Todos os confrontos do mata-mata da Copa do Brasil: jogos de ida e volta, placar agregado, disputas de pênaltis e quem avançou em cada chave.",
    possessive: "da Copa do Brasil",
    categorySlug: "brasileirao",
    keywords: [
      "chaveamento copa do brasil",
      "confrontos da copa do brasil",
      "tabela da copa do brasil",
      "quartas da copa do brasil",
      "oitavas da copa do brasil",
      "quem se classificou na copa do brasil",
    ],
    links: [
      { href: "/jogos-futebol-hoje/copa-do-brasil", label: "Jogos da Copa do Brasil" },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/tabela-do-brasileirao", label: "Tabela do Brasileirão" },
      { href: "/categoria/brasileirao", label: "Notícias" },
    ],
  },
  libertadores: {
    path: "/chaveamento-da-libertadores",
    h1: (season: string) => `Chaveamento da Libertadores ${season}`,
    title: (season: string) =>
      `Chaveamento da Libertadores ${season}: confrontos do mata-mata`,
    intro:
      "Os confrontos eliminatórios da Copa Libertadores: ida e volta, placar agregado, pênaltis e quem avançou em cada chave.",
    possessive: "da Libertadores",
    categorySlug: "libertadores",
    keywords: [
      "chaveamento da libertadores",
      "confrontos da libertadores",
      "oitavas da libertadores",
      "mata-mata da libertadores",
      "quem se classificou na libertadores",
    ],
    links: [
      { href: "/jogos-futebol-hoje/libertadores", label: "Jogos da Libertadores" },
      { href: "/artilharia-da-libertadores", label: "Artilharia" },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/categoria/libertadores", label: "Notícias" },
    ],
  },
  "sul-americana": {
    path: "/chaveamento-da-sul-americana",
    h1: (season: string) => `Chaveamento da Sul-Americana ${season}`,
    title: (season: string) =>
      `Chaveamento da Sul-Americana ${season}: confrontos do mata-mata`,
    intro:
      "Os confrontos eliminatórios da Copa Sul-Americana: ida e volta, placar agregado, pênaltis e quem avançou em cada chave.",
    possessive: "da Sul-Americana",
    categorySlug: "libertadores",
    keywords: [
      "chaveamento da sul-americana",
      "confrontos da sul-americana",
      "oitavas da sul-americana",
      "mata-mata da sudamericana",
    ],
    links: [
      { href: "/jogos-futebol-hoje/sul-americana", label: "Jogos da Sul-Americana" },
      { href: "/chaveamento-da-libertadores", label: "Chaveamento da Libertadores" },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/categoria/libertadores", label: "Notícias" },
    ],
  },
} as const;

export type BracketSlug = keyof typeof bracketCopy;

export function getAllBracketCopy() {
  return Object.entries(bracketCopy).map(([slug, copy]) => ({
    slug: slug as BracketSlug,
    ...copy,
  }));
}

export function bracketsRoute(slug: BracketSlug) {
  const copy = bracketCopy[slug];

  async function generateMetadata(): Promise<Metadata> {
    const competition = await getBracket(slug);
    const season = competition?.season ?? String(new Date().getFullYear());
    const title = copy.title(season);
    const now = competition ? currentRound(competition) : undefined;
    const description = truncateForMeta(
      now
        ? `${now.name}: ${now.decided} de ${now.ties.length} confrontos definidos. ${now.ties.map(describeTie)[0] ?? ""} ${copy.intro}`
        : copy.intro,
      165,
    );

    return {
      title,
      description,
      keywords: [...copy.keywords],
      alternates: { canonical: `${siteConfig.url}${copy.path}` },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}${copy.path}`,
        siteName: siteConfig.name,
        locale: "pt_BR",
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  async function Page() {
    const [competition, data] = await Promise.all([
      getBracket(slug),
      getBracketsData(),
    ]);
    // Sem fase aprovada na conferência estrutural, não há chaveamento a mostrar.
    if (!competition || competition.rounds.length === 0) notFound();
    return (
      <BracketLanding
        competition={competition}
        copy={{ ...copy, links: [...copy.links] }}
        generatedAt={data?.generatedAt}
      />
    );
  }

  return { generateMetadata, Page };
}
