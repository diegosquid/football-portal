/**
 * Copy das landings de artilharia — uma entrada por competição.
 *
 * Mesma divisão de responsabilidade das tabelas: o DADO (league_id, conferência
 * de stage) vive em scripts/build-topscorers.js e chega pronto em
 * content/artilharia.json. Aqui fica só o texto.
 *
 * Pra publicar uma competição nova:
 *   1. adicione em COMPETITIONS no scripts/build-topscorers.js
 *   2. adicione a copy aqui com a MESMA chave de slug
 *   3. crie src/app/artilharia-*<slug>/page.tsx com 6 linhas
 *
 * O ano nunca entra no texto fixo — vem de `season` no JSON, pra rota continuar
 * a mesma quando virar a temporada.
 */
export interface TopScorersCompetitionCopy {
  slug: string;
  /** Caminho da landing — não é derivável do slug por causa da preposição. */
  path: string;
  eyebrow: string;
  h1: (season: string) => string;
  title: (season: string) => string;
  intro: string;
  tableHeading: string;
  /** "do Brasileirão" / "da Libertadores" — concordância nas FAQs. */
  possessive: string;
  categorySlug: string;
  keywords: string[];
  description: (season: string) => string;
  links: { href: string; label: string }[];
  /** Perguntas próprias da competição, além das que saem do dado. */
  faqExtra?: { question: string; answer: string }[];
}

export const topScorersCompetitions: Record<string, TopScorersCompetitionCopy> =
  {
    brasileirao: {
      slug: "brasileirao",
      path: "/artilharia-do-brasileirao",
      eyebrow: "Artilharia",
      h1: (season) => `Artilharia do Brasileirão ${season}`,
      title: (season) =>
        `Artilharia do Brasileirão ${season}: Artilheiros da Série A`,
      intro:
        "Quem são os artilheiros do Campeonato Brasileiro nesta temporada: gols de cada jogador, clube e a disputa pela Bola de Ouro da competição. A lista é conferida contra os gols que cada time realmente marcou.",
      tableHeading: "Artilheiros do Brasileirão Série A",
      possessive: "do Brasileirão",
      categorySlug: "brasileirao",
      keywords: [
        "artilharia do brasileirão",
        "artilheiro do brasileirão",
        "artilheiros do brasileirão série a",
        "quem é o artilheiro do brasileirão",
        "goleadores do campeonato brasileiro",
        "maiores artilheiros do brasileirão",
      ],
      description: (season) =>
        `Artilharia do Brasileirão Série A ${season}: ranking completo de artilheiros com gols, clube e o artilheiro de cada time, atualizado a cada rodada.`,
      links: [
        { href: "/tabela-do-brasileirao", label: "Tabela do Brasileirão" },
        {
          href: "/artilharia-do-brasileirao-serie-b",
          label: "Artilharia da Série B",
        },
        { href: "/jogos-futebol-hoje/brasileirao", label: "Jogos do Brasileirão" },
        { href: "/categoria/brasileirao", label: "Notícias do Brasileirão" },
      ],
      faqExtra: [
        {
          question: "O que ganha o artilheiro do Brasileirão?",
          answer:
            "O maior goleador da Série A leva a Chuteira de Ouro do Campeonato Brasileiro, entregue pela CBF ao fim da competição. Em caso de empate no número de gols, o troféu é dividido.",
        },
      ],
    },

    "brasileirao-serie-b": {
      slug: "brasileirao-serie-b",
      path: "/artilharia-do-brasileirao-serie-b",
      eyebrow: "Artilharia",
      h1: (season) => `Artilharia da Série B ${season}`,
      title: (season) =>
        `Artilharia da Série B ${season}: Artilheiros do Brasileirão B`,
      intro:
        "Os artilheiros da segunda divisão do Campeonato Brasileiro: gols por jogador, clube e o goleador de cada time na briga pelo acesso.",
      tableHeading: "Artilheiros do Brasileirão Série B",
      possessive: "da Série B",
      categorySlug: "brasileirao",
      keywords: [
        "artilharia da série b",
        "artilheiro da série b",
        "artilheiros do brasileirão série b",
        "quem é o artilheiro da série b",
        "goleadores da segunda divisão",
      ],
      description: (season) =>
        `Artilharia da Série B ${season}: ranking de artilheiros do Brasileirão Série B com gols, clube e o goleador de cada time, atualizado a cada rodada.`,
      links: [
        {
          href: "/tabela-do-brasileirao-serie-b",
          label: "Tabela da Série B",
        },
        { href: "/artilharia-do-brasileirao", label: "Artilharia da Série A" },
        { href: "/jogos-futebol-hoje/brasileirao-serie-b", label: "Jogos da Série B" },
        { href: "/categoria/brasileirao", label: "Notícias do Brasileirão" },
      ],
    },

    libertadores: {
      slug: "libertadores",
      path: "/artilharia-da-libertadores",
      eyebrow: "Artilharia",
      h1: (season) => `Artilharia da Libertadores ${season}`,
      title: (season) =>
        `Artilharia da Libertadores ${season}: Artilheiros da competição`,
      intro:
        "Os maiores goleadores da Copa Libertadores da América nesta edição, com gols por jogador e clube — brasileiros e estrangeiros na mesma lista.",
      tableHeading: "Artilheiros da Libertadores",
      possessive: "da Libertadores",
      categorySlug: "libertadores",
      keywords: [
        "artilharia da libertadores",
        "artilheiro da libertadores",
        "artilheiros da copa libertadores",
        "quem é o artilheiro da libertadores",
        "goleadores da libertadores",
      ],
      description: (season) =>
        `Artilharia da Libertadores ${season}: ranking de artilheiros da Copa Libertadores da América com gols e clube de cada jogador.`,
      links: [
        { href: "/jogos-futebol-hoje/libertadores", label: "Jogos da Libertadores" },
        { href: "/artilharia-do-brasileirao", label: "Artilharia do Brasileirão" },
        { href: "/categoria/libertadores", label: "Notícias da Libertadores" },
      ],
    },
  };

export function getTopScorersCopy(
  slug: string,
): TopScorersCompetitionCopy | undefined {
  return topScorersCompetitions[slug];
}

export function getAllTopScorersCopy(): TopScorersCompetitionCopy[] {
  return Object.values(topScorersCompetitions);
}
