import Link from "next/link";
import type { EnrichedStandingRow, EnrichedStandingsTable } from "@/lib/standings";

type Split = "home" | "away";

function SplitTable({
  rows,
  split,
  title,
  hint,
}: {
  rows: EnrichedStandingRow[];
  split: Split;
  title: string;
  hint: string;
}) {
  // Ordena pelo recorte, não pela posição geral: é essa a informação nova.
  const ranked = [...rows].sort((a, b) => {
    const x = a[split];
    const y = b[split];
    return (
      y.points - x.points ||
      y.wins - x.wins ||
      y.goalDiff - x.goalDiff ||
      y.goalsFor - x.goalsFor
    );
  });

  return (
    <section>
      <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mb-3 mt-1 text-xs text-gray-500">{hint}</p>
      <div className="overflow-x-auto border border-ink/15 bg-white">
        <table className="w-full min-w-[320px] border-collapse">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="w-8 px-2 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                #
              </th>
              <th className="px-1.5 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Time
              </th>
              <th className="px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
                P
              </th>
              <th className="px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                J
              </th>
              <th className="px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                V
              </th>
              <th className="px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                E
              </th>
              <th className="px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                D
              </th>
              <th className="px-2 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                SG
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, i) => {
              const s = row[split];
              return (
                <tr
                  key={row.teamId}
                  className="border-b border-ink/10 last:border-b-0"
                >
                  <td className="px-2 py-1.5 text-left font-mono text-sm tabular-nums text-gray-600">
                    {i + 1}
                  </td>
                  <td className="max-w-[160px] truncate px-1.5 py-1.5 text-left text-sm font-semibold text-ink">
                    {row.teamSlug ? (
                      <Link
                        href={`/time/${row.teamSlug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {row.displayName}
                      </Link>
                    ) : (
                      row.displayName
                    )}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-mono text-sm font-bold tabular-nums text-ink">
                    {s.points}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-mono text-sm tabular-nums text-gray-600">
                    {s.played}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-mono text-sm tabular-nums text-gray-600">
                    {s.wins}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-mono text-sm tabular-nums text-gray-600">
                    {s.draws}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-mono text-sm tabular-nums text-gray-600">
                    {s.losses}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-sm tabular-nums text-gray-600">
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Tabela de mandantes e de visitantes — o recorte que a tabela geral esconde. */
export function StandingsSplits({ table }: { table: EnrichedStandingsTable }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <SplitTable
        rows={table.rows}
        split="home"
        title="Tabela como mandante"
        hint="Classificação considerando só os jogos em casa."
      />
      <SplitTable
        rows={table.rows}
        split="away"
        title="Tabela como visitante"
        hint="Classificação considerando só os jogos fora de casa."
      />
    </div>
  );
}
