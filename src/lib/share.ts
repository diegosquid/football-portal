import type { Match } from "@/lib/matches";
import { absoluteUrl } from "@/lib/site";

/**
 * Máximo de jogos na mensagem. Limite duplo:
 * - técnico: o texto vai URL-encoded no wa.me e acento/emoji ~triplica o tamanho
 * - UX: mensagem de grupo tem que ser escaneável, não um paredão
 */
const MAX_GAMES = 8;

/** Competições que entram primeiro quando a lista precisa ser cortada. */
const PRIORITY = [
  "Brasileirão Série A",
  "Brasileirão Série B",
  "Copa do Brasil",
  "Libertadores",
  "Sul-Americana",
  "Champions League",
];

function channelIsDefined(channel: string): boolean {
  const n = channel.trim().toLowerCase();
  return n !== "" && n !== "a definir" && n !== "tbd" && n !== "a confirmar";
}

/** Ordena por relevância de competição, mantendo o horário como desempate. */
function byRelevance(a: Match, b: Match): number {
  const ia = PRIORITY.indexOf(a.competition);
  const ib = PRIORITY.indexOf(b.competition);
  const pa = ia < 0 ? PRIORITY.length : ia;
  const pb = ib < 0 ? PRIORITY.length : ib;
  return pa === pb ? a.time.localeCompare(b.time) : pa - pb;
}

export interface ShareTextOptions {
  /** "hoje" | "amanhã" — usado no título da mensagem. */
  label: string;
  /** DD/MM. */
  dateShort: string;
  /** Caminho da página, ex.: "/jogos-futebol-hoje". */
  path: string;
}

/**
 * Monta a mensagem pronta pra colar no WhatsApp: lista curta de jogos com
 * horário e canal + link com UTM para o tráfego de volta ser atribuído.
 * Texto puro (sem markdown do WhatsApp) — asteriscos poluem quando o
 * cliente não renderiza.
 */
export function buildShareText(
  games: Match[],
  { label, dateShort, path }: ShareTextOptions,
): string {
  const url = `${absoluteUrl(path)}?utm_source=whatsapp&utm_medium=share&utm_campaign=jogos_do_dia`;

  if (games.length === 0) {
    return `Agenda de jogos ${label} no Beira do Campo:\n${url}`;
  }

  const ordered = [...games].sort(byRelevance);
  const shown = ordered.slice(0, MAX_GAMES);
  // Reordena os escolhidos por horário — a mensagem lê melhor cronológica.
  shown.sort((a, b) => a.time.localeCompare(b.time));

  const lines = shown.map((g) => {
    const canal = channelIsDefined(g.channel) ? ` (${g.channel})` : "";
    return `${g.time} ${g.home} x ${g.away}${canal}`;
  });

  const rest = games.length - shown.length;
  const restLine =
    rest > 0
      ? `\n+${rest} ${rest === 1 ? "jogo" : "jogos"} e onde assistir:\n`
      : "\nAgenda completa:\n";

  return `JOGOS DE ${label.toUpperCase()} - ${dateShort}\n\n${lines.join("\n")}\n${restLine}${url}`;
}

/**
 * Mensagem de um jogo específico — o formato mais compartilhado em grupo
 * ("que horas é o jogo e onde passa"). Inclui o palpite quando existe,
 * que é o que gera resposta na conversa.
 */
export function buildMatchShareText(
  match: Match,
  opts: {
    /** "Hoje" | "Amanhã" | "domingo, 26 de julho" */
    whenLabel: string;
    /** Probabilidades já em % inteiro, se houver. */
    odds?: { casa: number; empate: number; fora: number };
  },
): string {
  const url = `${absoluteUrl(`/onde-assistir/${match.slug}`)}?utm_source=whatsapp&utm_medium=share&utm_campaign=jogo`;

  const linhas = [
    `${match.home} x ${match.away}`,
    `${opts.whenLabel}, ${match.time} (Brasília)`,
    match.round ? `${match.competition} - ${match.round}` : match.competition,
  ];

  if (channelIsDefined(match.channel)) {
    linhas.push(`Onde assistir: ${match.channel}`);
  }

  if (opts.odds) {
    linhas.push(
      "",
      `Palpite do Beira do Campo: ${opts.odds.casa}% ${match.home}, ${opts.odds.empate}% empate, ${opts.odds.fora}% ${match.away}`,
    );
  }

  return `${linhas.join("\n")}\n\n${url}`;
}
