export interface Team {
  slug: string;
  name: string;
  shortName: string;
  state: string;
}

export const teams: Record<string, Team> = {
  flamengo: { slug: "flamengo", name: "Flamengo", shortName: "FLA", state: "RJ" },
  palmeiras: { slug: "palmeiras", name: "Palmeiras", shortName: "PAL", state: "SP" },
  corinthians: { slug: "corinthians", name: "Corinthians", shortName: "COR", state: "SP" },
  "sao-paulo": { slug: "sao-paulo", name: "São Paulo", shortName: "SAO", state: "SP" },
  santos: { slug: "santos", name: "Santos", shortName: "SAN", state: "SP" },
  botafogo: { slug: "botafogo", name: "Botafogo", shortName: "BOT", state: "RJ" },
  fluminense: { slug: "fluminense", name: "Fluminense", shortName: "FLU", state: "RJ" },
  vasco: { slug: "vasco", name: "Vasco da Gama", shortName: "VAS", state: "RJ" },
  gremio: { slug: "gremio", name: "Grêmio", shortName: "GRE", state: "RS" },
  internacional: { slug: "internacional", name: "Internacional", shortName: "INT", state: "RS" },
  "atletico-mg": { slug: "atletico-mg", name: "Atlético-MG", shortName: "CAM", state: "MG" },
  cruzeiro: { slug: "cruzeiro", name: "Cruzeiro", shortName: "CRU", state: "MG" },
  "athletico-pr": { slug: "athletico-pr", name: "Athletico-PR", shortName: "CAP", state: "PR" },
  bahia: { slug: "bahia", name: "Bahia", shortName: "BAH", state: "BA" },
  fortaleza: { slug: "fortaleza", name: "Fortaleza", shortName: "FOR", state: "CE" },
  "red-bull-bragantino": { slug: "red-bull-bragantino", name: "Red Bull Bragantino", shortName: "RBB", state: "SP" },
  cuiaba: { slug: "cuiaba", name: "Cuiabá", shortName: "CUI", state: "MT" },
  goias: { slug: "goias", name: "Goiás", shortName: "GOI", state: "GO" },
  "real-madrid": { slug: "real-madrid", name: "Real Madrid", shortName: "RMA", state: "ESP" },
  barcelona: { slug: "barcelona", name: "Barcelona", shortName: "BAR", state: "ESP" },
};

export function getTeam(slug: string): Team | undefined {
  return teams[slug];
}

export function getAllTeams(): Team[] {
  return Object.values(teams);
}
