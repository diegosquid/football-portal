import { absoluteUrl } from "@/lib/site";
import { formatDateLongBR, type Match } from "@/lib/matches";

/** "pela Copa do Mundo 2026" / "pelo Brasileirão Série B" — concordância de gênero. */
export function pelaCompetition(name: string): string {
  const feminine =
    /^(copa|libertadores|sul-americana|champions|premier|la liga|liga|europa league|bundesliga|ligue|fa cup|supercopa|recopa|eliminatórias|série)/i;
  return `${feminine.test(name.trim()) ? "pela" : "pelo"} ${name}`;
}

/** SportsEvent enriquecido: sport, status, competitor e URL da página do jogo. */
export function sportsEventJsonLd(match: Match) {
  const home = { "@type": "SportsTeam", name: match.home };
  const away = { "@type": "SportsTeam", name: match.away };
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.home} x ${match.away}`,
    sport: "Futebol",
    startDate: match.startDateIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: match.stadium
      ? { "@type": "Place", name: match.stadium }
      : undefined,
    homeTeam: home,
    awayTeam: away,
    competitor: [home, away],
    description: `${match.competition}${match.round ? ` — ${match.round}` : ""} — ${match.channel}`,
    url: absoluteUrl(`/onde-assistir/${match.slug}`),
  };
}

/** ItemList apontando cada jogo pra sua página /onde-assistir — dá caminho de crawl. */
export function matchesItemListJsonLd(
  name: string,
  pageUrl: string,
  matches: Match[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(pageUrl),
    numberOfItems: matches.length,
    itemListElement: matches.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.home} x ${m.away}`,
      url: absoluteUrl(`/onde-assistir/${m.slug}`),
    })),
  };
}

function distinctChannels(matches: Match[]): string[] {
  const set = new Set<string>();
  for (const m of matches) {
    m.channel
      .split("/")
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => set.add(c));
  }
  return [...set];
}

/**
 * FAQ dinâmico pras landings de dia (hoje/amanhã) — alvo de featured snippet
 * e AI Overviews. Respostas geradas dos dados reais do dia.
 */
export function buildDayFaq(
  matches: Match[],
  dayWord: "hoje" | "amanhã",
  date: string,
): { question: string; answer: string }[] {
  const dayCapitalized = dayWord === "hoje" ? "Hoje" : "Amanhã";
  const dateLong = formatDateLongBR(date);
  const faq: { question: string; answer: string }[] = [];

  if (matches.length === 0) {
    faq.push({
      question: `Tem jogo de futebol ${dayWord}?`,
      answer: `Não há jogos programados para ${dayWord} (${dateLong}) na nossa agenda. Confira a programação da semana — ela é atualizada diariamente com horários e canais.`,
    });
    return faq;
  }

  const list = matches
    .slice(0, 8)
    .map((m) => `${m.home} x ${m.away} às ${m.time} (${m.channel})`)
    .join("; ");
  const suffix = matches.length > 8 ? " — entre outros" : "";
  faq.push({
    question: `Quais são os jogos de futebol ${dayWord} (${dateLong})?`,
    answer: `${dayCapitalized} tem ${matches.length} ${matches.length === 1 ? "jogo" : "jogos"}: ${list}${suffix}.`,
  });

  const channels = distinctChannels(matches);
  faq.push({
    question: `Onde assistir os jogos de ${dayWord} ao vivo?`,
    answer: `As transmissões de ${dayWord} passam em ${channels.join(", ")}. Confira o canal de cada partida na programação acima.`,
  });

  const first = matches.reduce((a, b) => (a.time <= b.time ? a : b));
  faq.push({
    question: `Que horas começa o futebol ${dayWord}?`,
    answer: `O primeiro jogo de ${dayWord} é ${first.home} x ${first.away}, às ${first.time} (horário de Brasília), ${pelaCompetition(first.competition)}.`,
  });

  const copa = matches.filter((m) => m.competition.startsWith("Copa do Mundo"));
  if (copa.length > 0) {
    const copaList = copa
      .map((m) => `${m.home} x ${m.away} às ${m.time} (${m.channel})`)
      .join("; ");
    faq.push({
      question: `Tem jogo da Copa do Mundo ${dayWord}?`,
      answer: `Sim! ${dayCapitalized} tem ${copa.length === 1 ? "jogo" : "jogos"} da Copa do Mundo 2026: ${copaList}.`,
    });
  }

  const brasileirao = matches.filter((m) =>
    m.competition.startsWith("Brasileirão"),
  );
  if (brasileirao.length > 0) {
    const brList = brasileirao
      .slice(0, 6)
      .map((m) => `${m.home} x ${m.away} às ${m.time}`)
      .join("; ");
    faq.push({
      question: `Tem jogo do Brasileirão ${dayWord}?`,
      answer: `Sim, ${dayWord} tem ${brasileirao.length} ${brasileirao.length === 1 ? "jogo" : "jogos"} de Brasileirão: ${brList}.`,
    });
  }

  return faq;
}
