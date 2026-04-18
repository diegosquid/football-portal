import Link from "next/link";
import { buildMatchSlug } from "@/lib/matches";

type Game = {
  time: string;
  home: string;
  away: string;
  competition: string;
  round: string;
  channel: string;
  stadium: string;
};

type GameScheduleProps = {
  games: Game[];
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
  // Group games by competition
  const grouped = games.reduce<Record<string, Game[]>>((acc, game) => {
    const key = game.competition;
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
    return acc;
  }, {});

  // Prioridade: competições brasileiras e sul-americanas primeiro
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
    // Known competitions sorted by priority, unknown ones go to the end
    const pa = ia >= 0 ? ia : competitionPriority.length;
    const pb = ib >= 0 ? ib : competitionPriority.length;
    return pa - pb;
  });

  return (
    <div>
      {/* Date header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold capitalize text-secondary sm:text-2xl">
          {formatDateBR(date)}
        </h2>
        <span className="text-xs text-gray-500">
          Atualizado em {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      {games.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-lg text-gray-500">
            Nenhum jogo programado para hoje.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Volte mais tarde — a programação é atualizada diariamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {competitions.map((competition) => (
            <div key={competition}>
              {/* Competition header */}
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${getCompetitionColor(competition)}`}
                >
                  {competition}
                </span>
                {grouped[competition][0].round && (
                  <span className="text-xs text-gray-500">
                    {grouped[competition][0].round}
                  </span>
                )}
              </div>

              {/* Games list */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {grouped[competition].map((game, idx) => {
                  const matchSlug = buildMatchSlug(game.home, game.away);
                  return (
                    <Link
                      key={`${game.home}-${game.away}-${idx}`}
                      href={`/onde-assistir/${matchSlug}`}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:gap-4 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      {/* Time */}
                      <div className="w-14 shrink-0 text-center">
                        <span className="text-lg font-black text-primary">
                          {game.time}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-secondary sm:text-base">
                            {game.home}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            x
                          </span>
                          <span className="truncate text-sm font-semibold text-secondary sm:text-base">
                            {game.away}
                          </span>
                        </div>
                        {game.stadium && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {game.stadium}
                          </p>
                        )}
                      </div>

                      {/* Channel */}
                      <div className="shrink-0 text-right">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {game.channel}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
