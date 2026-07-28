/**
 * Copy das landings de classificação — uma entrada por competição.
 *
 * A parte de DADOS (league_id, zonas, formato) vive em scripts/build-standings.js
 * e chega pronta no content/classificacao.json. Aqui fica só o texto.
 *
 * Pra publicar uma competição nova:
 *   1. adicione a competição em SERIES no scripts/build-standings.js
 *   2. adicione a copy aqui, com a MESMA chave de slug
 *   3. crie src/app/tabela-<preposição>-<slug>/page.tsx com 6 linhas
 *      (copie de src/app/tabela-do-brasileirao/page.tsx)
 *
 * O ano NUNCA entra no texto fixo: ele vem de `season` no JSON, pra rota
 * continuar a mesma quando virar a temporada.
 */
export interface StandingsCompetitionCopy {
  /** Chave em content/classificacao.json. */
  slug: string;
  /** Caminho da landing — não é derivável do slug por causa da preposição. */
  path: string;
  /** Rótulo pequeno acima do H1. */
  eyebrow: string;
  /** `${season}` é interpolado: "Tabela do Brasileirão Série A 2026". */
  h1: (season: string) => string;
  /** Título curto do card social (sem ano — o card já mostra a rodada). */
  ogTitle: string;
  /** Title da aba/SERP, sem o nome do site. */
  title: (season: string, round: string) => string;
  intro: string;
  tableHeading: string;
  projectionHeading: string;
  /** Como chamar a zona de cima na COLUNA da tabela ("G4", "Acesso"). */
  promotionLabel: string;
  promotionHint: string;
  /** Título do card de projeção — escrito por extenso, sem virar "Briga pelo Acesso". */
  promotionRaceTitle: string;
  /**
   * Rótulos de zona próprios da competição. Sem isso, a Série C herdaria
   * "Acesso à Série A" numa faixa que na verdade leva ao quadrangular.
   */
  zoneLabels?: Record<string, string>;
  /** Categoria do portal pros artigos relacionados. */
  categorySlug: string;
  keywords: string[];
  description: (season: string) => string;
  /** Chips de navegação. O hub /tabela é adicionado automaticamente. */
  links: { href: string; label: string }[];
  /**
   * Linguagem da FAQ. Os números vêm dos dados; aqui só as palavras, pra
   * competição nova não herdar texto de Brasileirão.
   */
  faq: {
    /** Completa "Quem é o líder ___?" — "do Brasileirão", "da Série B". */
    possessive: string;
    /** Como o torcedor CHAMA a zona de cima na busca — "G4" na Série A e na B. */
    zoneTerm: string;
    /** Frase que explica o que a zona de cima vale. */
    promotionZoneAnswer: string;
    /** Divisão de destino de quem cai — "Série B", "Série C". */
    relegationTarget: string;
    /**
     * Régua histórica de pontos pra escapar do rebaixamento ("cerca de 45
     * pontos"). Omita quando a competição não tem uma régua conhecida — os
     * 45 pontos são de campeonato de 38 rodadas, não valem pra todo mundo.
     */
    relegationPointsReference?: string;
    /** Perguntas específicas da competição. */
    extra?: { question: string; answer: string }[];
  };
}

export const standingsCompetitions: Record<string, StandingsCompetitionCopy> = {
  brasileirao: {
    slug: "brasileirao",
    path: "/tabela-do-brasileirao",
    eyebrow: "Classificação",
    h1: (season) => `Tabela do Brasileirão Série A ${season}`,
    ogTitle: "Tabela do Brasileirão",
    title: (season, round) =>
      `Tabela do Brasileirão ${season}: Classificação da Série A${round}`,
    intro:
      "A classificação completa do Campeonato Brasileiro, atualizada a cada rodada: pontos, vitórias, saldo de gols, aproveitamento e os últimos cinco jogos de cada time — mais a chance de título, de G4 e de rebaixamento calculada pelo nosso modelo estatístico.",
    tableHeading: "Classificação do Brasileirão Série A",
    projectionHeading: "Como o Brasileirão deve terminar",
    promotionLabel: "G4",
    promotionHint: "Chance de vaga direta na Libertadores",
    promotionRaceTitle: "Briga pelo G4",
    categorySlug: "brasileirao",
    keywords: [
      "tabela do brasileirão",
      "tabela brasileirão",
      "classificação brasileirão série a",
      "classificação do brasileirão",
      "tabela do campeonato brasileiro",
      "quem está no g4 do brasileirão",
      "quem está no z4 do brasileirão",
    ],
    description: (season) =>
      `Tabela do Brasileirão Série A ${season} com classificação completa, aproveitamento, forma recente e probabilidades de título, G4 e rebaixamento.`,
    links: [
      { href: "/tabela-do-brasileirao-serie-b", label: "Tabela da Série B" },
      { href: "/jogos-futebol-hoje/brasileirao", label: "Jogos do Brasileirão" },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/categoria/brasileirao", label: "Notícias do Brasileirão" },
    ],
    faq: {
      possessive: "do Brasileirão",
      zoneTerm: "G4",
      promotionZoneAnswer:
        "A faixa dá vaga direta na fase de grupos da Libertadores do ano seguinte.",
      relegationTarget: "Série B",
      relegationPointsReference: "cerca de 45 pontos",
      extra: [
        {
          question: "Quantos times do Brasileirão vão para a Libertadores?",
          answer:
            "Pela tabela, os quatro primeiros vão direto à fase de grupos e o 5º e o 6º entram pela fase prévia. " +
            "As vagas podem mudar conforme os campeões da Libertadores e da Copa do Brasil, que também garantem lugar na competição.",
        },
      ],
    },
  },

  "brasileirao-serie-b": {
    slug: "brasileirao-serie-b",
    path: "/tabela-do-brasileirao-serie-b",
    eyebrow: "Classificação · Série B",
    h1: (season) => `Tabela do Brasileirão Série B ${season}`,
    ogTitle: "Tabela da Série B",
    title: (season, round) =>
      `Tabela da Série B ${season}: Classificação do Brasileirão${round}`,
    intro:
      "A classificação da Série B rodada a rodada: pontos, saldo de gols, aproveitamento e a forma recente de cada clube na briga por uma das quatro vagas de acesso — com a chance de subir e o risco de cair calculados pelo nosso modelo estatístico.",
    tableHeading: "Classificação da Série B",
    projectionHeading: "Quem sobe e quem cai, segundo o modelo",
    promotionLabel: "Acesso",
    promotionHint: "Chance de subir para a Série A",
    promotionRaceTitle: "Briga pelo acesso",
    categorySlug: "brasileirao",
    keywords: [
      "tabela da série b",
      "tabela brasileirão série b",
      "classificação série b",
      "classificação brasileirão série b",
      "quem está no g4 da série b",
      "quem está no z4 da série b",
    ],
    description: (season) =>
      `Tabela do Brasileirão Série B ${season} com classificação completa, aproveitamento, forma recente e probabilidades de acesso e rebaixamento.`,
    links: [
      { href: "/tabela-do-brasileirao", label: "Tabela da Série A" },
      {
        href: "/jogos-futebol-hoje/brasileirao-serie-b",
        label: "Jogos da Série B",
      },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/categoria/brasileirao", label: "Notícias do Brasileirão" },
    ],
    faq: {
      possessive: "da Série B",
      zoneTerm: "G4",
      promotionZoneAnswer:
        "São as quatro vagas de acesso à Série A do ano seguinte.",
      relegationTarget: "Série C",
      relegationPointsReference: "cerca de 45 pontos",
    },
  },

  "brasileirao-serie-c": {
    slug: "brasileirao-serie-c",
    path: "/tabela-do-brasileirao-serie-c",
    eyebrow: "Classificação · Série C",
    h1: (season) => `Tabela do Brasileirão Série C ${season}`,
    ogTitle: "Tabela da Série C",
    title: (season, round) =>
      `Tabela da Série C ${season}: Classificação do Brasileirão${round}`,
    intro:
      "A classificação da primeira fase da Série C: pontos, saldo de gols, aproveitamento e forma recente na briga pelas oito vagas do quadrangular do acesso — com a chance de cada clube avançar e o risco de cair para a Série D.",
    tableHeading: "Classificação da Série C — primeira fase",
    projectionHeading: "Quem avança e quem cai, segundo o modelo",
    promotionLabel: "G8",
    promotionHint: "Chance de avançar ao quadrangular do acesso",
    promotionRaceTitle: "Briga pelo G8",
    // Na Série C a faixa de cima não é acesso à Série A: é passar de fase.
    zoneLabels: { acesso: "Classificação ao quadrangular" },
    categorySlug: "brasileirao",
    keywords: [
      "tabela da série c",
      "tabela brasileirão série c",
      "classificação série c",
      "classificação brasileirão série c",
      "quem está no g8 da série c",
    ],
    description: (season) =>
      `Tabela do Brasileirão Série C ${season} com classificação completa da primeira fase, aproveitamento, forma recente e probabilidades de classificação e rebaixamento.`,
    links: [
      { href: "/tabela-do-brasileirao", label: "Tabela da Série A" },
      { href: "/tabela-do-brasileirao-serie-b", label: "Tabela da Série B" },
      { href: "/probabilidades", label: "Palpites de hoje" },
      { href: "/categoria/brasileirao", label: "Notícias do Brasileirão" },
    ],
    faq: {
      possessive: "da Série C",
      zoneTerm: "G8",
      promotionZoneAnswer:
        "Os oito primeiros avançam ao quadrangular que define as duas vagas de acesso à Série B.",
      relegationTarget: "Série D",
    },
  },
};

export function getStandingsCopy(
  slug: string,
): StandingsCompetitionCopy | undefined {
  return standingsCompetitions[slug];
}

export function getAllStandingsCopy(): StandingsCompetitionCopy[] {
  return Object.values(standingsCompetitions);
}
