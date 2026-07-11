import Link from "next/link";
import type { Match } from "@/lib/matches";

type UpcomingMatchesProps = {
  matches: Match[];
};

function formatDayBR(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00-03:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/** Lista compacta de jogos futuros — cada linha linka pra página do jogo. */
export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
  if (matches.length === 0) return null;

  return (
    <div className="border border-ink/15 bg-white/40">
      {matches.map((match, idx) => (
        <Link
          key={match.slug}
          href={`/onde-assistir/${match.slug}`}
          className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-lima/20 sm:gap-4 ${
            idx > 0 ? "border-t border-ink/10" : ""
          }`}
        >
          <div className="w-24 shrink-0 border-r border-ink/10 pr-3">
            <span className="block font-mono text-[11px] font-medium capitalize text-gray-500">
              {formatDayBR(match.date)}
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              {match.time}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-sm font-bold text-ink">
                {match.home}
              </span>
              <span className="shrink-0 font-mono text-xs text-gray-400">×</span>
              <span className="truncate font-display text-sm font-bold text-ink">
                {match.away}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-gray-500">
              {match.competition}
              {match.round ? ` — ${match.round}` : ""}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="border border-ink/15 bg-cal px-2 py-1 font-mono text-[11px] font-medium text-gray-700 transition-colors group-hover:border-ink/30">
              {match.channel}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
