export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  specialty: string;
  social?: {
    twitter?: string;
    instagram?: string;
  };
}

export const authors: Record<string, Author> = {
  "renato-caldeira": {
    slug: "renato-caldeira",
    name: "Renato Caldeira",
    role: "Editor-chefe",
    bio: "Jornalista esportivo com 15 anos de experiência cobrindo futebol brasileiro. Ex-repórter da Gazeta Esportiva e colaborador do Lance!. Especialista em mercado da bola e bastidores dos grandes clubes.",
    avatar: "/authors/renato-caldeira.jpg",
    specialty: "Transferências e Mercado da Bola",
    social: { twitter: "renatocaldeira", instagram: "renato.caldeira" },
  },
  "patricia-mendes": {
    slug: "patricia-mendes",
    name: "Patrícia Mendes",
    role: "Analista Tática",
    bio: "Formada em Educação Física e pós-graduada em Análise de Desempenho Esportivo. Certificada pela UEFA em análise tática. Cobre futebol feminino e masculino com profundidade técnica.",
    avatar: "/authors/patricia-mendes.jpg",
    specialty: "Análise Tática e Futebol Feminino",
    social: { twitter: "patmendes", instagram: "patricia.mendes.fut" },
  },
  "marcos-vinicius": {
    slug: "marcos-vinicius",
    name: "Marcos Vinícius Santos",
    role: "Correspondente Internacional",
    bio: "Morou 8 anos na Europa cobrindo as principais ligas. Fluente em inglês, espanhol e italiano. Acompanha de perto brasileiros no exterior e os bastidores do futebol europeu.",
    avatar: "/authors/marcos-vinicius.jpg",
    specialty: "Futebol Europeu e Brasileiros no Exterior",
    social: { twitter: "mvsfutebol", instagram: "marcos.vinicius.fut" },
  },
  "neide-ferreira": {
    slug: "neide-ferreira",
    name: "Neide Ferreira",
    role: "Colunista",
    bio: "Neide Ferreira, 58 anos de paixão pelo futebol. Colunista que não tem medo de falar o que pensa. Voz da torcida, defensora do futebol raiz e inimiga da hipocrisia no esporte.",
    avatar: "/authors/neide-ferreira.jpg",
    specialty: "Opinião e Cultura do Futebol",
    social: { instagram: "neide.ferreira.futebol" },
  },
  "thiago-borges": {
    slug: "thiago-borges",
    name: "Thiago Borges",
    role: "Analista de Dados",
    bio: "Cientista de dados e fanático por futebol. Usa estatísticas avançadas (xG, xA, PPDA) para desvendar o que os olhos não veem. Transforma números em histórias.",
    avatar: "/authors/thiago-borges.jpg",
    specialty: "Estatísticas e Dados",
    social: { twitter: "thiagoborgesdata", instagram: "thiago.borges.stats" },
  },
};

export function getAuthor(slug: string): Author | undefined {
  return authors[slug];
}

export function getAllAuthors(): Author[] {
  return Object.values(authors);
}
