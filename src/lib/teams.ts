export interface Team {
  slug: string;
  name: string;
  shortName: string;
  state: string;
  /** Nomes alternativos como aparecem em jogos.json (match exato, sem acento/caixa). */
  aliases?: string[];
}

export const teams: Record<string, Team> = {
  // Gigantes nacionais
  flamengo: { slug: "flamengo", name: "Flamengo", shortName: "FLA", state: "RJ" },
  palmeiras: { slug: "palmeiras", name: "Palmeiras", shortName: "PAL", state: "SP" },
  corinthians: { slug: "corinthians", name: "Corinthians", shortName: "COR", state: "SP" },
  "sao-paulo": { slug: "sao-paulo", name: "São Paulo", shortName: "SAO", state: "SP" },
  santos: { slug: "santos", name: "Santos", shortName: "SAN", state: "SP" },
  botafogo: { slug: "botafogo", name: "Botafogo", shortName: "BOT", state: "RJ" },
  fluminense: { slug: "fluminense", name: "Fluminense", shortName: "FLU", state: "RJ" },
  vasco: { slug: "vasco", name: "Vasco da Gama", shortName: "VAS", state: "RJ", aliases: ["Vasco"] },
  gremio: { slug: "gremio", name: "Grêmio", shortName: "GRE", state: "RS" },
  internacional: { slug: "internacional", name: "Internacional", shortName: "INT", state: "RS" },
  "atletico-mg": { slug: "atletico-mg", name: "Atlético-MG", shortName: "CAM", state: "MG" },
  cruzeiro: { slug: "cruzeiro", name: "Cruzeiro", shortName: "CRU", state: "MG" },
  "athletico-pr": { slug: "athletico-pr", name: "Athletico-PR", shortName: "CAP", state: "PR" },
  bahia: { slug: "bahia", name: "Bahia", shortName: "BAH", state: "BA" },
  fortaleza: { slug: "fortaleza", name: "Fortaleza", shortName: "FOR", state: "CE" },
  "red-bull-bragantino": { slug: "red-bull-bragantino", name: "Red Bull Bragantino", shortName: "RBB", state: "SP", aliases: ["Bragantino"] },
  cuiaba: { slug: "cuiaba", name: "Cuiabá", shortName: "CUI", state: "MT" },
  goias: { slug: "goias", name: "Goiás", shortName: "GOI", state: "GO" },

  // Série A / B — clubes com cobertura no portal
  vitoria: { slug: "vitoria", name: "Vitória", shortName: "VIT", state: "BA" },
  mirassol: { slug: "mirassol", name: "Mirassol", shortName: "MIR", state: "SP" },
  juventude: { slug: "juventude", name: "Juventude", shortName: "JUV", state: "RS" },
  sport: { slug: "sport", name: "Sport Recife", shortName: "SPT", state: "PE", aliases: ["Sport"] },
  ceara: { slug: "ceara", name: "Ceará", shortName: "CEA", state: "CE" },
  coritiba: { slug: "coritiba", name: "Coritiba", shortName: "CFC", state: "PR" },
  chapecoense: { slug: "chapecoense", name: "Chapecoense", shortName: "CHA", state: "SC" },
  remo: { slug: "remo", name: "Remo", shortName: "REM", state: "PA" },
  novorizontino: { slug: "novorizontino", name: "Novorizontino", shortName: "NOV", state: "SP" },
  "america-mg": { slug: "america-mg", name: "América-MG", shortName: "AME", state: "MG" },
  nautico: { slug: "nautico", name: "Náutico", shortName: "NAU", state: "PE" },
  avai: { slug: "avai", name: "Avaí", shortName: "AVA", state: "SC" },
  "atletico-go": { slug: "atletico-go", name: "Atlético-GO", shortName: "ACG", state: "GO" },
  crb: { slug: "crb", name: "CRB", shortName: "CRB", state: "AL" },
  "vila-nova": { slug: "vila-nova", name: "Vila Nova", shortName: "VIL", state: "GO" },
  "botafogo-sp": { slug: "botafogo-sp", name: "Botafogo-SP", shortName: "BSP", state: "SP" },
  "sao-bernardo": { slug: "sao-bernardo", name: "São Bernardo", shortName: "SBE", state: "SP" },
  "operario-pr": { slug: "operario-pr", name: "Operário-PR", shortName: "OPE", state: "PR", aliases: ["Operário"] },
  "athletic-mg": { slug: "athletic-mg", name: "Athletic-MG", shortName: "ATH", state: "MG", aliases: ["Athletic"] },
  londrina: { slug: "londrina", name: "Londrina", shortName: "LON", state: "PR" },

  // Seleção
  "selecao-brasileira": { slug: "selecao-brasileira", name: "Seleção Brasileira", shortName: "BRA", state: "BR", aliases: ["Brasil"] },

  // Europa
  "real-madrid": { slug: "real-madrid", name: "Real Madrid", shortName: "RMA", state: "ESP" },
  barcelona: { slug: "barcelona", name: "Barcelona", shortName: "BAR", state: "ESP" },
  "atletico-madrid": { slug: "atletico-madrid", name: "Atlético de Madrid", shortName: "ATM", state: "ESP", aliases: ["Atlético Madrid", "Atletico Madrid"] },
  psg: { slug: "psg", name: "PSG", shortName: "PSG", state: "FRA", aliases: ["Paris Saint-Germain"] },
  arsenal: { slug: "arsenal", name: "Arsenal", shortName: "ARS", state: "ING" },
  liverpool: { slug: "liverpool", name: "Liverpool", shortName: "LIV", state: "ING" },
  "manchester-city": { slug: "manchester-city", name: "Manchester City", shortName: "MCI", state: "ING", aliases: ["Man City"] },
  chelsea: { slug: "chelsea", name: "Chelsea", shortName: "CHE", state: "ING" },
  "bayern-munique": { slug: "bayern-munique", name: "Bayern de Munique", shortName: "BAY", state: "ALE", aliases: ["Bayern Munique", "Bayern München", "Bayern Munich", "Bayern"] },
};

export function getTeam(slug: string): Team | undefined {
  return teams[slug];
}

export function getAllTeams(): Team[] {
  return Object.values(teams);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Resolve o slug do time a partir do nome de exibição (ex.: "Flamengo", "São Paulo").
 * Estratégia em duas passadas:
 * 1. Match EXATO contra nome ou alias (cobre "Botafogo-SP" vs "Botafogo", "Sport" etc.)
 * 2. Containment com nomes mais longos primeiro e mínimo de 6 caracteres,
 *    pra evitar falsos positivos tipo "Sporting Cristal" → Sport.
 * Retorna undefined se não casar — útil pra times internacionais sem cadastro.
 */
export function resolveTeamSlug(displayName: string): string | undefined {
  const target = normalize(displayName);
  if (!target) return undefined;

  const entries = getAllTeams().map((team) => ({
    team,
    names: [team.name, ...(team.aliases ?? [])].map(normalize).filter(Boolean),
  }));

  for (const { team, names } of entries) {
    if (names.includes(target)) return team.slug;
  }

  const byLongest = entries
    .flatMap(({ team, names }) => names.map((n) => ({ team, n })))
    .sort((a, b) => b.n.length - a.n.length);

  for (const { team, n } of byLongest) {
    if (n.length >= 6 && (target.includes(n) || n.includes(target))) {
      return team.slug;
    }
  }
  return undefined;
}

/** Um jogo (home x away) envolve o time deste slug? */
export function teamPlaysInGame(teamSlug: string, home: string, away: string): boolean {
  return resolveTeamSlug(home) === teamSlug || resolveTeamSlug(away) === teamSlug;
}
