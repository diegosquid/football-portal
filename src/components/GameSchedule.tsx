import Link from "next/link";
import type { Match } from "@/lib/matches";

type GameScheduleProps = {
  games: Match[];
  date: string;
  updatedAt: string;
};

const competitionColors: Record<string, string> = {
  "Brasileirão Série A": "bg-green-600",
  "Brasileirão Série B": "bg-green-700",
  "Brasileirão Série C": "bg-green-800",
  "Copa do Brasil": "bg-yellow-600",
  "Libertadores": "bg-blue-600",
  "Sul-Americana": "bg-red-600",
  "Premier League": "bg-purple-700",
  "La Liga": "bg-orange-600",
  "La Liga 2": "bg-orange-700",
  "Campeonato Italiano": "bg-blue-800",
  "Bundesliga": "bg-red-700",
  "Ligue 1": "bg-blue-500",
  "Champions League": "bg-indigo-700",
  "Europa League": "bg-orange-500",
  "Copa dos Campeões da Ásia Elite": "bg-yellow-700",
  "Campeonato Argentino": "bg-sky-600",
  "Campeonato Uruguaio": "bg-sky-700",
  "Campeonato Ucraniano": "bg-amber-600",
};

function getCompetitionColor(competition: string): string {
  return competitionColors[competition] ?? "bg-gray-600";
}

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00-03:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatUpdatedAt(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function GameSchedule({ games, date, updatedAt }: GameScheduleProps) {
  const grouped = games.reduce<Record<string, Match[]>>((acc, game) => {
    const key = game.competition;
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
    return acc;
  }, {});

  const competitionPriority: string[] = [
    "Brasileirão Série A",
    "Brasileirão Série B",
    "Brasileirão Série C",
    "Copa do Brasil",
    "Libertadores",
    "Sul-Americana",
    "Champions League",
    "Europa League",
    "Premier League",
    "La Liga",
    "Campeonato Italiano",
    "Bundesliga",
    "Ligue 1",
  ];

  const competitions = Object.keys(grouped).sort((a, b) => {
    const ia = competitionPriority.indexOf(a);
    const ib = competitionPriority.indexOf(b);
    const pa = ia >= 0 ? ia : competitionPriority.length;
    const pb = ib >= 0 ? ib : competitionPriority.length;
    return pa - pb;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b-2 border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-xl font-extrabold capitalize tracking-tight text-ink sm:text-2xl">
          {formatDateBR(date)}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
          Atualizado em {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      {games.length === 0 ? (
        <div className="border border-ink/15 bg-gray-50/60 p-10 text-center">
          <p className="font-display text-xl font-bold text-ink">
            Nenhum jogo programado para hoje.
          </p>
          <p className="mt-2 font-serif italic text-gray-500">
            Volte mais tarde — a programação é atualizada diariamente.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {competitions.map((competition) => (
            <div key={competition}>
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 shrink-0 ${getCompetitionColor(competition)}`}
                />
                <span className="font-display text-sm font-extrabold uppercase tracking-wide text-ink">
                  {competition}
                </span>
                {grouped[competition][0].round && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
                    {grouped[competition][0].round}
                  </span>
                )}
                <div className="h-px flex-1 bg-ink/15" />
              </div>

              <div className="border border-ink/15 bg-white/40">
                {grouped[competition].map((game, idx) => (
                  <Link
                    key={game.slug}
                    href={`/onde-assistir/${game.slug}`}
                    className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-lima/20 sm:gap-4 ${
                      idx > 0 ? "border-t border-ink/10" : ""
                    }`}
                  >
                    <div className="w-16 shrink-0 border-r border-ink/10 pr-3 text-center">
                      <span className="font-mono text-base font-bold text-primary">
                        {game.time}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-sm font-bold text-ink sm:text-base">
                          {game.home}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-gray-400">
                          ×
                        </span>
                        <span className="truncate font-display text-sm font-bold text-ink sm:text-base">
                          {game.away}
                        </span>
                      </div>
                      {game.stadium && (
                        <p className="mt-0.5 font-mono text-[11px] text-gray-500">
                          {game.stadium}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="border border-ink/15 bg-cal px-2 py-1 font-mono text-[11px] font-medium text-gray-700 transition-colors group-hover:border-ink/30">
                        {game.channel}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
