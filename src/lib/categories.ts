export interface Category {
  slug: string;
  label: string;
  description: string;
  color: string;
}

export const categories: Category[] = [
  {
    slug: "brasileirao",
    label: "Brasileirão",
    description: "Todas as notícias do Campeonato Brasileiro Série A e B",
    color: "#008000",
  },
  {
    slug: "libertadores",
    label: "Libertadores",
    description: "Copa Libertadores da América — jogos, análises e bastidores",
    color: "#0066cc",
  },
  {
    slug: "champions",
    label: "Champions League",
    description: "Liga dos Campeões da UEFA — o melhor do futebol europeu",
    color: "#6600cc",
  },
  {
    slug: "transferencias",
    label: "Transferências",
    description: "Mercado da bola: contratações, vendas e rumores",
    color: "#e94560",
  },
  {
    slug: "analises",
    label: "Análises",
    description: "Análises táticas, estatísticas e pré/pós-jogo",
    color: "#0f3460",
  },
  {
    slug: "selecao",
    label: "Seleção",
    description: "Seleção Brasileira — convocações, jogos e bastidores",
    color: "#f5c518",
  },
  {
    slug: "futebol-internacional",
    label: "Internacional",
    description: "Futebol internacional — ligas europeias, sul-americanas e mundiais",
    color: "#1a1a2e",
  },
  {
    slug: "opiniao",
    label: "Opinião",
    description: "Colunas, comentários e a voz da torcida",
    color: "#ff6b35",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getAllCategories(): Category[] {
  return categories;
}
