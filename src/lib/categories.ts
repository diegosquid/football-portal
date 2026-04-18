export interface Category {
  slug: string;
  label: string;
  description: string;
  longDescription: string;
  color: string;
}

export const categories: Category[] = [
  {
    slug: "brasileirao",
    label: "Brasileirão",
    description: "Todas as notícias do Campeonato Brasileiro Série A e B",
    longDescription:
      "Cobertura completa do Campeonato Brasileiro 2026: rodada a rodada, pré-jogo, pós-jogo, análises táticas e a tabela atualizada. Acompanhe Flamengo, Palmeiras, Corinthians, São Paulo, Atlético-MG, Grêmio, Internacional e os demais clubes das Séries A e B — com bastidores, escalações e a briga pelo G4 e contra o Z4.",
    color: "#008000",
  },
  {
    slug: "libertadores",
    label: "Libertadores",
    description: "Copa Libertadores da América — jogos, análises e bastidores",
    longDescription:
      "A maior competição sul-americana de clubes na Beira do Campo: fase de grupos, chaveamento, análises de jogo, classificação por grupo e caminho até a final. Flamengo, Palmeiras, São Paulo, Corinthians, Atlético-MG, River Plate, Boca Juniors e os protagonistas da Conmebol Libertadores 2026.",
    color: "#0066cc",
  },
  {
    slug: "champions",
    label: "Champions League",
    description: "Liga dos Campeões da UEFA — o melhor do futebol europeu",
    longDescription:
      "UEFA Champions League 2025/26 pela ótica brasileira: análises de jogo, destaque para os brasileiros em campo, pré-jogo, pós-jogo e a rota das oitavas à final. Cobertura de Real Madrid, Manchester City, Bayern de Munique, PSG, Barcelona, Liverpool, Inter de Milão e demais gigantes.",
    color: "#6600cc",
  },
  {
    slug: "transferencias",
    label: "Transferências",
    description: "Mercado da bola: contratações, vendas e rumores",
    longDescription:
      "Radar diário do mercado da bola: negociações, assinaturas, empréstimos e os rumores que movem o futebol mundial. Foco em clubes brasileiros e nos negócios envolvendo jogadores da Série A, Europa e Arábia Saudita — com fontes e leitura crítica de cada movimentação.",
    color: "#e94560",
  },
  {
    slug: "analises",
    label: "Análises",
    description: "Análises táticas, estatísticas e pré/pós-jogo",
    longDescription:
      "Leitura tática profunda: esquemas, heatmaps, xG, movimentações de jogador-chave e mudanças de sistema. Pré-jogo com escalações prováveis e pós-jogo com as decisões que ganharam ou perderam a partida — do Brasileirão às competições internacionais.",
    color: "#0f3460",
  },
  {
    slug: "selecao",
    label: "Seleção",
    description: "Seleção Brasileira — convocações, jogos e bastidores",
    longDescription:
      "Tudo sobre a Seleção Brasileira na estrada rumo à Copa do Mundo de 2026: convocações, amistosos, Eliminatórias, análises de desempenho, novidades do treinador e os duelos contra as principais seleções sul-americanas e europeias.",
    color: "#f5c518",
  },
  {
    slug: "futebol-internacional",
    label: "Internacional",
    description:
      "Futebol internacional — ligas europeias, sul-americanas e mundiais",
    longDescription:
      "Premier League, La Liga, Serie A, Bundesliga, Ligue 1 e as principais ligas sul-americanas no radar da Beira do Campo. Resultados, destaques da rodada, movimentos de técnico e as histórias que ditam o calendário do futebol mundial.",
    color: "#1a1a2e",
  },
  {
    slug: "opiniao",
    label: "Opinião",
    description: "Colunas, comentários e a voz da torcida",
    longDescription:
      "Colunas assinadas, crônica e comentário esportivo: o que os colunistas da Beira do Campo pensam sobre arbitragem, gestão de clubes, jogadores em alta e os grandes dilemas do futebol brasileiro e internacional.",
    color: "#ff6b35",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getAllCategories(): Category[] {
  return categories;
}
