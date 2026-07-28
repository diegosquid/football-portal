import {
  formatChance,
  type EnrichedStandingRow,
  type EnrichedStandingsTable,
} from "@/lib/standings";

interface Race {
  key: string;
  title: string;
  hint: string;
  /** Chance em % de cada time no recorte. */
  pick: (row: EnrichedStandingRow) => number;
  accent: string;
}

function RaceColumn({
  race,
  rows,
}: {
  race: Race;
  rows: EnrichedStandingRow[];
}) {
  const ranked = rows
    .map((row) => ({ row, value: race.pick(row) }))
    .filter((item) => item.value >= 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (ranked.length === 0) return null;

  return (
    <section className="border border-ink/15 bg-white p-4">
      <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
        {race.title}
      </h3>
      <p className="mt-1 text-xs text-gray-500">{race.hint}</p>
      <ul className="mt-4 space-y-2.5">
        {ranked.map(({ row, value }) => (
          <li key={row.teamId}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-semibold text-ink">
                {row.displayName}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-ink">
                {formatChance(value)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-gray-200">
              <div
                className={`h-full ${race.accent}`}
                style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * O diferencial da página: para onde a temporada aponta.
 * Visível em qualquer tela — na tabela, as colunas de chance só cabem no desktop.
 */
export function StandingsProjection({
  table,
  promotion,
}: {
  table: EnrichedStandingsTable;
  /** Nome, título e explicação da zona de cima, vindos da copy da competição. */
  promotion: { label: string; hint: string; raceTitle: string };
}) {
  if (!table.simulation) return null;

  const relegationSize = table.zones?.relegation ?? 0;
  const races: Race[] = [
    {
      key: "titulo",
      title: "Briga pelo título",
      hint: "Chance de terminar em primeiro",
      pick: (row) => row.chances?.titulo ?? 0,
      accent: "bg-primary",
    },
    {
      key: "promocao",
      title: promotion.raceTitle,
      hint: promotion.hint,
      pick: (row) => row.chances?.promocao ?? 0,
      accent: "bg-libertadores",
    },
  ];

  if (relegationSize > 0) {
    races.push({
      key: "rebaixamento",
      title: "Risco de rebaixamento",
      hint: `Chance de terminar entre os ${relegationSize} últimos`,
      pick: (row) => row.chances?.rebaixamento ?? 0,
      accent: "bg-transferencias",
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {races.map((race) => (
        <RaceColumn key={race.key} race={race} rows={table.rows} />
      ))}
    </div>
  );
}
