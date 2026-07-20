import Link from "next/link";
import { getTeam, teamPlaysInGame } from "@/lib/teams";
import {
  formatDateShortBR,
  getTodayMatches,
  getUpcomingMatches,
  type Match,
} from "@/lib/matches";

interface Props {
  /** Slugs dos times do artigo (frontmatter `teams`). */
  teamSlugs: string[];
}

/**
 * Box "Próximo jogo do {time}" pra artigos — linka o /onde-assistir/ do jogo
 * e o hub /jogos-futebol-hoje/{time}, distribuindo autoridade pros hubs.
 * Não renderiza nada se nenhum time do artigo tem jogo na janela da agenda.
 */
export function TeamNextMatch({ teamSlugs }: Props) {
  const agenda = [...getTodayMatches(), ...getUpcomingMatches()];

  const seen = new Set<string>();
  const entries: { teamSlug: string; teamName: string; next: Match }[] = [];
  for (const slug of teamSlugs) {
    const team = getTeam(slug);
    if (!team) continue;
    const next = agenda.find((m) => teamPlaysInGame(slug, m.home, m.away));
    // dedup: se os dois times do artigo se enfrentam, mostra o jogo uma vez só
    if (!next || seen.has(next.slug)) continue;
    seen.add(next.slug);
    entries.push({ teamSlug: slug, teamName: team.name, next });
  }

  if (entries.length === 0) return null;

  return (
    <aside className="mt-10 border-2 border-ink bg-surface/60 px-5 py-4">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Agenda
      </p>
      <ul className="mt-3 space-y-2.5">
        {entries.map(({ teamSlug, teamName, next }) => (
          <li key={next.slug} className="text-sm leading-relaxed">
            <span className="font-display font-bold text-ink">
              Próximo jogo do {teamName}:
            </span>{" "}
            <Link
              href={`/onde-assistir/${next.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {next.home} x {next.away}
            </Link>{" "}
            <span className="text-gray-600">
              — {formatDateShortBR(next.date)} às {next.time}
              {next.channel ? ` · ${next.channel}` : ""}
            </span>{" "}
            <Link
              href={`/jogos-futebol-hoje/${teamSlug}`}
              className="whitespace-nowrap font-medium text-secondary underline decoration-lima decoration-2 underline-offset-2 transition-colors hover:text-primary"
            >
              jogos do {teamName} hoje
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
