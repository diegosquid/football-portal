import type { FAQItem } from "@/components/JsonLd";
import type { StandingsCompetitionCopy } from "@/lib/standings-competitions";
import {
  formatChance,
  formatPercent,
  type EnrichedStandingRow,
  type EnrichedStandingsTable,
  type StandingZone,
} from "@/lib/standings";

/** Times de uma zona, na ordem da tabela. */
export function zoneRows(
  table: EnrichedStandingsTable,
  zone: StandingZone,
): EnrichedStandingRow[] {
  return table.rows.filter((row) => row.zone === zone);
}

/** Os N primeiros — a zona de cima, seja ela G4, acesso ou top 8. */
function promotionRows(table: EnrichedStandingsTable): EnrichedStandingRow[] {
  return table.rows.slice(0, table.zones?.promotion ?? 0);
}

/** Os N últimos — zona de rebaixamento, quando a competição tem uma. */
function relegationRows(table: EnrichedStandingsTable): EnrichedStandingRow[] {
  const size = table.zones?.relegation ?? 0;
  return size ? table.rows.slice(-size) : [];
}

/** "Palmeiras, Flamengo, Athletico-PR e Fluminense" */
function listNames(rows: EnrichedStandingRow[]): string {
  const names = rows.map((row) => row.displayName);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

/** "Vasco (21), Remo (21), Mirassol (20) e Chapecoense (10)" — com pontos. */
function listWithPoints(rows: EnrichedStandingRow[]): string {
  const parts = rows.map((row) => `${row.displayName} (${row.points})`);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

/**
 * FAQ dinâmica a partir da tabela — responde na página o que o usuário
 * pergunta no Google ("quem é o líder", "quem está no Z4", "quantos pontos
 * para não cair"). Os NÚMEROS saem sempre dos dados; a LINGUAGEM sai da copy
 * da competição, pra Champions ou estadual não herdarem texto de Brasileirão.
 */
export function buildStandingsFaq(
  table: EnrichedStandingsTable,
  copy: StandingsCompetitionCopy,
): FAQItem[] {
  const { faq: text } = copy;
  const leader = table.rows[0];
  const promotion = promotionRows(table);
  const relegation = relegationRows(table);
  const items: FAQItem[] = [];

  if (leader) {
    items.push({
      question: `Quem é o líder ${text.possessive}?`,
      answer:
        `${leader.displayName} lidera o ${table.competition} com ${leader.points} pontos em ${leader.played} jogos ` +
        `(${leader.wins} vitórias, ${leader.draws} empates e ${leader.losses} derrotas), ` +
        `saldo de ${leader.goalDiff > 0 ? "+" : ""}${leader.goalDiff} e ${formatPercent(leader.aproveitamento)} de aproveitamento ` +
        `após a ${table.roundsPlayed}ª rodada.`,
    });
  }

  if (promotion.length > 0) {
    items.push({
      question: `Quem está no ${text.zoneTerm} ${text.possessive}?`,
      answer: `${listWithPoints(promotion)} ocupam o ${text.zoneTerm} ${text.possessive}. ${text.promotionZoneAnswer}`,
    });
  }

  if (relegation.length > 0) {
    items.push({
      question: `Quem está no Z${relegation.length} ${text.possessive}?`,
      answer:
        `${listWithPoints(relegation)} fecham a tabela na zona de rebaixamento após a ${table.roundsPlayed}ª rodada. ` +
        `Os ${relegation.length} últimos caem para a ${text.relegationTarget}.`,
    });

    // Régua de pontos: referência histórica (quando a competição tem uma
    // conhecida) + o que o nosso modelo projeta hoje.
    const safeRow = table.rows[table.rows.length - relegation.length - 1];
    if (safeRow?.chances) {
      const reference = text.relegationPointsReference
        ? `A referência histórica é de ${text.relegationPointsReference} em ${table.totalRounds} rodadas. `
        : "";
      items.push({
        question: `Quantos pontos são necessários para não cair ${text.possessive.replace(/^d/, "n")}?`,
        answer:
          `${reference}Na simulação do nosso modelo, o primeiro time fora da zona (hoje ${safeRow.displayName}) ` +
          `termina a temporada com aproximadamente ${safeRow.chances.pontosProjetados} pontos.`,
      });
    }
  }

  items.push(...(text.extra ?? []));

  items.push({
    question: "Como funciona o desempate na tabela?",
    answer:
      "Os critérios, na ordem: mais vitórias, melhor saldo de gols, mais gols marcados, confronto direto, " +
      "menos cartões vermelhos, menos cartões amarelos e, por fim, sorteio.",
  });

  if (table.simulation) {
    items.push({
      question: `Como são calculadas as chances de título, ${text.zoneTerm} e rebaixamento?`,
      answer:
        `Simulamos ${table.simulation.runs.toLocaleString("pt-BR")} vezes os ${table.remainingMatches} jogos que faltam, ` +
        "usando um modelo de Poisson que mede a força de ataque e defesa de cada time, separando casa e fora. " +
        "A chance de cada time é a porcentagem de simulações em que ele termina naquela posição. São estimativas, não garantia de resultado.",
    });
  }

  items.push({
    question: "Com que frequência a tabela é atualizada?",
    answer:
      "A classificação é atualizada automaticamente ao longo do dia, acompanhando o encerramento dos jogos de cada rodada.",
  });

  return items;
}

/** Frase de abertura com o cenário atual — conteúdo único por rodada. */
export function buildStandingsSummary(
  table: EnrichedStandingsTable,
  copy: StandingsCompetitionCopy,
): string {
  const leader = table.rows[0];
  const runnerUp = table.rows[1];
  const relegation = relegationRows(table);
  if (!leader) return "";

  const gap = runnerUp ? leader.points - runnerUp.points : 0;
  // "do vice-líder" evita ter que concordar gênero com o nome do clube.
  const lead =
    gap === 0
      ? `${leader.displayName} e ${runnerUp?.displayName} estão empatados na liderança com ${leader.points} pontos`
      : `${leader.displayName} lidera com ${leader.points} pontos, ${gap} ponto${gap > 1 ? "s" : ""} à frente do vice-líder, ${runnerUp?.displayName}`;

  const titleChance = leader.chances
    ? ` — o modelo dá ${formatChance(leader.chances.titulo)} de chance de título ao líder`
    : "";

  const bottom =
    relegation.length > 0
      ? ` Na outra ponta, ${listNames(relegation)} abrem a ${copy.faq.relegationTarget} do ano que vem se a temporada acabasse hoje.`
      : "";

  return `Após a ${table.roundsPlayed}ª rodada, ${lead}${titleChance}.${bottom}`;
}
