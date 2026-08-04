import {
  daysUntil,
  getAllKnownMatches,
  getTodayBRT,
  type Match,
} from "@/lib/matches";

/**
 * Canais de transmissão — landings em /onde-assistir/<canal>.
 *
 * Por que precisa de normalização: o campo `channel` do jogos.json é texto
 * livre, escrito à mão a cada atualização de agenda. Na base de hoje convivem
 * "GE TV" e "GeTV", "X Sports" e "Xsports", "ESPN", "ESPN 3" e "ESPN 4",
 * "SportyNet" e "SportyNet+". Sem casar essas grafias, cada variante viraria
 * uma página com um terço dos jogos.
 *
 * Um jogo costuma ter vários canais ("Globo / SporTV / Premiere / Prime Video"),
 * então ele aparece na página de cada um — o que é correto: quem procura
 * "jogos no Premiere hoje" quer ver esse jogo mesmo que ele passe na Globo.
 */

export type ChannelKind = "tv-aberta" | "tv-fechada" | "streaming" | "youtube";

export interface Channel {
  slug: string;
  name: string;
  kind: ChannelKind;
  /** Grafias que aparecem em jogos.json. Comparadas normalizadas. */
  aliases: string[];
  /** É de graça pro torcedor? Muda a copy e a intenção de busca. */
  free: boolean;
  /** Uma frase sobre o que o canal transmite. */
  about: string;
  /** Resposta pra "como assistir" — a segunda pergunta de toda essa SERP. */
  howToWatch: string;
  keywords: string[];
}

export const channels: Record<string, Channel> = {
  premiere: {
    slug: "premiere",
    name: "Premiere",
    kind: "tv-fechada",
    aliases: ["Premiere", "Premiere FC", "PPV"],
    free: false,
    about:
      "Canal de pay-per-view do Grupo Globo, com o pacote mais completo de jogos do Brasileirão Série A e B.",
    howToWatch:
      "O Premiere é vendido como pacote adicional pelas operadoras de TV por assinatura e avulso pelo Globoplay, sem precisar de TV a cabo.",
    keywords: [
      "jogos do premiere hoje",
      "o que vai passar no premiere hoje",
      "premiere jogos de hoje",
      "programação do premiere",
    ],
  },
  "disney-plus": {
    slug: "disney-plus",
    name: "Disney+",
    kind: "streaming",
    aliases: ["Disney+", "Disney Plus", "Star+", "Star Plus"],
    free: false,
    about:
      "Streaming da Disney que concentra as transmissões da ESPN no Brasil, incluindo Libertadores, Sul-Americana e campeonatos europeus.",
    howToWatch:
      "É preciso assinatura do Disney+. Os jogos ficam no mesmo aplicativo dos canais ESPN, na aba de esportes ao vivo.",
    keywords: [
      "futebol no disney plus hoje",
      "jogos do disney+ hoje",
      "o que vai passar no disney plus",
      "disney plus futebol ao vivo",
    ],
  },
  sportv: {
    slug: "sportv",
    name: "SporTV",
    kind: "tv-fechada",
    aliases: ["SporTV", "Sportv", "SporTV 2", "SporTV 3", "Sportv2", "Sportv3"],
    free: false,
    about:
      "Canal esportivo do Grupo Globo na TV por assinatura, com jogos do Brasileirão, Copa do Brasil e competições internacionais.",
    howToWatch:
      "Disponível na TV por assinatura e no Globoplay com o pacote de canais ao vivo.",
    keywords: [
      "jogos do sportv hoje",
      "o que vai passar no sportv hoje",
      "programação do sportv",
      "sportv ao vivo futebol",
    ],
  },
  espn: {
    slug: "espn",
    name: "ESPN",
    kind: "tv-fechada",
    aliases: ["ESPN", "ESPN 2", "ESPN 3", "ESPN 4", "ESPN Extra", "ESPN Brasil"],
    free: false,
    about:
      "Rede de canais esportivos com Libertadores, Sul-Americana, Champions League e as principais ligas europeias.",
    howToWatch:
      "Na TV por assinatura ou pelo Disney+, que transmite o sinal dos canais ESPN no Brasil.",
    keywords: [
      "jogos da espn hoje",
      "o que vai passar na espn hoje",
      "programação da espn",
      "espn ao vivo futebol",
    ],
  },
  globo: {
    slug: "globo",
    name: "Globo",
    kind: "tv-aberta",
    aliases: ["Globo", "TV Globo", "Rede Globo"],
    free: true,
    about:
      "Principal emissora de TV aberta do país, com jogos do Brasileirão e da Copa do Brasil em transmissão regionalizada.",
    howToWatch:
      "De graça, na TV aberta, e ao vivo no Globoplay para quem faz login com uma conta gratuita — a grade varia por estado.",
    keywords: [
      "jogo na globo hoje",
      "o que vai passar na globo hoje futebol",
      "globo futebol ao vivo",
      "que jogo passa na globo hoje",
    ],
  },
  "prime-video": {
    slug: "prime-video",
    name: "Prime Video",
    kind: "streaming",
    aliases: ["Amazon Prime Video", "Prime Video", "Amazon Prime"],
    free: false,
    about:
      "Streaming da Amazon, que transmite jogos da Copa do Brasil com exclusividade em algumas rodadas.",
    howToWatch:
      "Incluso na assinatura Amazon Prime, no aplicativo Prime Video em TV, celular ou navegador.",
    keywords: [
      "jogos do prime video hoje",
      "futebol na amazon prime hoje",
      "copa do brasil no prime video",
    ],
  },
  sportynet: {
    slug: "sportynet",
    name: "SportyNet",
    kind: "tv-fechada",
    aliases: ["SportyNet", "SportyNet+", "Sporty Net", "SportyNet Plus"],
    free: false,
    about:
      "Canal esportivo com jogos da Série B, Série C e competições regionais.",
    howToWatch:
      "Disponível em operadoras de TV por assinatura e no serviço de streaming próprio do canal.",
    keywords: [
      "jogos da sportynet hoje",
      "o que vai passar na sportynet",
      "sportynet ao vivo",
    ],
  },
  cazetv: {
    slug: "cazetv",
    name: "CazéTV",
    kind: "youtube",
    aliases: ["CazéTV", "Caze TV", "CazeTV", "Canal do Casimiro"],
    free: true,
    about:
      "Canal do Casimiro no YouTube, com transmissões gratuitas de futebol brasileiro e internacional.",
    howToWatch:
      "De graça, no YouTube — basta abrir o canal da CazéTV no horário do jogo, sem assinatura nenhuma.",
    keywords: [
      "jogos da cazetv hoje",
      "futebol grátis no youtube hoje",
      "cazetv ao vivo",
      "o que vai passar na cazetv",
    ],
  },
  band: {
    slug: "band",
    name: "Band",
    kind: "tv-aberta",
    aliases: ["Band", "Bandeirantes", "TV Bandeirantes", "BandSports"],
    free: true,
    about:
      "Emissora de TV aberta com jogos de competições nacionais e internacionais.",
    howToWatch:
      "De graça na TV aberta e ao vivo no site e no YouTube da Band em parte das transmissões.",
    keywords: [
      "jogo na band hoje",
      "o que vai passar na band hoje futebol",
      "band ao vivo futebol",
    ],
  },
  "ge-tv": {
    slug: "ge-tv",
    name: "ge tv",
    kind: "streaming",
    aliases: ["GE TV", "GeTV", "ge tv", "GE", "ge"],
    free: false,
    about:
      "Serviço de transmissão do ge, com jogos do Brasileirão e da Copa do Brasil dentro do ecossistema Globo.",
    howToWatch:
      "Pelo site e app do ge, com login Globo e assinatura ativa do pacote correspondente.",
    keywords: ["jogos do ge tv hoje", "ge tv ao vivo", "assistir no ge tv"],
  },
  "uol-esporte": {
    slug: "uol-esporte",
    name: "UOL Esporte",
    kind: "streaming",
    aliases: ["UOL Esporte", "UOL", "UOL Play"],
    free: false,
    about:
      "Plataforma de transmissão esportiva do UOL, com jogos de competições nacionais.",
    howToWatch: "Pelo site do UOL Esporte, com assinatura UOL ativa.",
    keywords: ["jogos do uol esporte hoje", "uol play futebol"],
  },
  "canal-do-benja": {
    slug: "canal-do-benja",
    name: "Canal do Benja",
    kind: "youtube",
    aliases: ["Canal do Benja", "Benja", "Canal do Benjamin"],
    free: true,
    about:
      "Canal do Benjamin Back no YouTube, com transmissões gratuitas de jogos do futebol brasileiro.",
    howToWatch: "De graça, no YouTube, direto no canal, sem assinatura.",
    keywords: ["jogos do canal do benja hoje", "canal do benja ao vivo"],
  },
  xsports: {
    slug: "xsports",
    name: "XSports",
    kind: "tv-aberta",
    aliases: ["X Sports", "XSports", "Xsports", "X-Sports"],
    free: true,
    about:
      "Canal esportivo de TV aberta digital, com jogos de séries inferiores e competições regionais.",
    howToWatch:
      "De graça, em subcanais da TV digital aberta em algumas praças, e pelo streaming do canal.",
    keywords: ["jogos do xsports hoje", "xsports ao vivo"],
  },
  nsports: {
    slug: "nsports",
    name: "NSports",
    kind: "tv-fechada",
    aliases: ["N Sports", "NSports", "Nsports", "N-Sports"],
    free: false,
    about:
      "Canal dedicado a competições nacionais fora do eixo principal, como Série C, Série D e estaduais.",
    howToWatch:
      "Em operadoras de TV por assinatura e no streaming próprio do canal.",
    keywords: ["jogos da nsports hoje", "nsports ao vivo"],
  },
  "paramount-plus": {
    slug: "paramount-plus",
    name: "Paramount+",
    kind: "streaming",
    aliases: ["Paramount+", "Paramount Plus", "Paramount"],
    free: false,
    about:
      "Streaming da Paramount, com jogos da Libertadores, Sul-Americana e do futebol europeu.",
    howToWatch: "É preciso assinatura do Paramount+, no app ou no navegador.",
    keywords: [
      "jogos do paramount plus hoje",
      "libertadores no paramount+",
      "paramount plus futebol",
    ],
  },
};

/**
 * Mínimo de jogos conhecidos pra o canal virar página.
 *
 * Existe pra evitar página vazia: a CazéTV aparece 2 vezes na base atual e uma
 * landing dela hoje seria conteúdo fino. O corte é sobre o DADO, não sobre uma
 * lista fixa — quando o canal ganhar jogos na agenda, a página nasce sozinha.
 */
export const MIN_MATCHES_FOR_PAGE = 3;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]+/g, "");
}

/** Índice alias normalizado -> slug, montado uma vez. */
const ALIAS_INDEX: Map<string, string> = new Map(
  Object.values(channels).flatMap((channel) =>
    channel.aliases.map(
      (alias) => [normalize(alias), channel.slug] as [string, string],
    ),
  ),
);

export function getChannel(slug: string): Channel | undefined {
  return channels[slug];
}

export function getAllChannels(): Channel[] {
  return Object.values(channels);
}

/**
 * Slugs de canal de um jogo. "Globo / SporTV / Premiere" -> 3 slugs.
 * Emissora desconhecida é ignorada em vez de virar canal novo — a lista de
 * canais é curada, não deduzida do texto.
 */
export function resolveChannelSlugs(channelField: string): string[] {
  const found = new Set<string>();
  for (const part of channelField.split(/[/,]/)) {
    const slug = ALIAS_INDEX.get(normalize(part));
    if (slug) found.add(slug);
  }
  return [...found];
}

export interface ChannelSchedule {
  today: Match[];
  upcoming: Match[];
  past: Match[];
  total: number;
}

/** Jogos de um canal, separados por hoje / próximos / já realizados. */
export async function getChannelSchedule(
  slug: string,
): Promise<ChannelSchedule> {
  const today = getTodayBRT();
  const matches = (await getAllKnownMatches()).filter((match) =>
    resolveChannelSlugs(match.channel).includes(slug),
  );

  return {
    today: matches.filter((m) => m.date === today),
    upcoming: matches
      .filter((m) => daysUntil(m.date) > 0)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    past: matches
      .filter((m) => daysUntil(m.date) < 0)
      .sort((a, b) => b.date.localeCompare(a.date)),
    total: matches.length,
  };
}

/** Canais com jogos suficientes pra ter página — usado na rota e no sitemap. */
export async function getPublishableChannels(): Promise<Channel[]> {
  const matches = await getAllKnownMatches();
  const counts = new Map<string, number>();
  for (const match of matches) {
    for (const slug of resolveChannelSlugs(match.channel)) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return getAllChannels().filter(
    (channel) => (counts.get(channel.slug) ?? 0) >= MIN_MATCHES_FOR_PAGE,
  );
}

export function channelPath(slug: string): string {
  return `/onde-assistir/${slug}`;
}

const KIND_LABEL: Record<ChannelKind, string> = {
  "tv-aberta": "TV aberta",
  "tv-fechada": "TV por assinatura",
  streaming: "Streaming",
  youtube: "YouTube",
};

export function channelKindLabel(kind: ChannelKind): string {
  return KIND_LABEL[kind];
}
