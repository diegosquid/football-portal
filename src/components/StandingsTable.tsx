import Link from "next/link";
import {
  formatChance,
  formatPercent,
  zoneMeta,
  type EnrichedStandingRow,
  type EnrichedStandingsTable,
  type FormEntry,
  type StandingZone,
} from "@/lib/standings";

/** Faixa colorida na lateral da linha — mesma linguagem visual da legenda. */
const ZONE_BAR: Record<string, string> = {
  libertadores: "bg-libertadores",
  "pre-libertadores": "bg-libertadores/45",
  "sul-americana": "bg-opiniao",
  acesso: "bg-primary",
  rebaixamento: "bg-transferencias",
};

/** Zona de competição ainda não mapeada não fica sem cor nem quebra o layout. */
function zoneBar(zone: StandingZone): string {
  return ZONE_BAR[zone] ?? "bg-ink/30";
}

const FORM_STYLE: Record<FormEntry["resultado"], string> = {
  V: "bg-primary text-white",
  E: "bg-gray-300 text-gray-800",
  D: "bg-transferencias text-white",
};

const FORM_LABEL: Record<FormEntry["resultado"], string> = {
  V: "Vitória",
  E: "Empate",
  D: "Derrota",
};

function FormDots({ form, team }: { form: FormEntry[]; team: string }) {
  if (form.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <span
      className="flex justify-center gap-0.5"
      role="img"
      aria-label={`Últimos jogos do ${team}: ${form
        .map((f) => FORM_LABEL[f.resultado])
        .join(", ")}`}
    >
      {form.map((f, i) => (
        <span
          key={`${f.data}-${i}`}
          title={`${FORM_LABEL[f.resultado]} ${f.mandante ? "em casa" : "fora"} — ${f.placar} vs ${f.adversario} (${f.data.split("-").reverse().slice(0, 2).join("/")})`}
          className={`flex h-4 w-4 items-center justify-center rounded-[2px] font-mono text-[10px] font-bold leading-none ${FORM_STYLE[f.resultado]}`}
          aria-hidden="true"
        >
          {f.resultado}
        </span>
      ))}
    </span>
  );
}

/** Percentual de chance: destaca o que é relevante e apaga o ruído. */
function Chance({ value }: { value: number | undefined }) {
  if (value === undefined || value < 0.1) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span
      className={
        value >= 50
          ? "font-bold text-ink"
          : value >= 10
            ? "text-ink"
            : "text-gray-500"
      }
    >
      {formatChance(value)}
    </span>
  );
}

function TeamCell({ row }: { row: EnrichedStandingRow }) {
  // Sigla em vez de escudo: a API só tem badge de metade dos times, e meia
  // tabela com escudo e meia sem fica pior do que nenhuma.
  const content = (
    <>
      <span
        className="w-8 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400"
        aria-hidden="true"
      >
        {row.shortName}
      </span>
      <span className="truncate">{row.displayName}</span>
    </>
  );

  if (!row.teamSlug) {
    return <span className="flex items-center gap-2">{content}</span>;
  }
  return (
    <Link
      href={`/time/${row.teamSlug}`}
      className="flex items-center gap-2 transition-colors hover:text-primary"
    >
      {content}
    </Link>
  );
}

const TH =
  "px-1.5 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500";
const TD = "px-1.5 py-2 text-center font-mono text-sm tabular-nums";

/**
 * Tabela de classificação. Server component — todo o conteúdo vai no HTML.
 * As colunas de chance só aparecem quando a simulação rodou.
 */
export function StandingsTable({
  table,
  promotion,
}: {
  table: EnrichedStandingsTable;
  /** Como a competição chama a zona de cima: "G4", "Acesso", "Top 8"… */
  promotion: { label: string; hint: string };
}) {
  const hasChances = table.rows.some((row) => row.chances);
  const hasRelegation = Boolean(table.zones?.relegation);

  return (
    <div className="overflow-x-auto border border-ink/15 bg-white">
      <table className="w-full min-w-[640px] border-collapse">
        <caption className="sr-only">
          Classificação {table.competition} — {table.roundsPlayed}ª rodada
        </caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className={`${TH} w-8 text-left`}>
              #
            </th>
            <th scope="col" className={`${TH} min-w-[150px] text-left`}>
              Time
            </th>
            <th scope="col" className={`${TH} text-ink`} title="Pontos">
              P
            </th>
            <th scope="col" className={TH} title="Jogos">
              J
            </th>
            <th scope="col" className={TH} title="Vitórias">
              V
            </th>
            <th scope="col" className={TH} title="Empates">
              E
            </th>
            <th scope="col" className={TH} title="Derrotas">
              D
            </th>
            <th scope="col" className={`${TH} hidden sm:table-cell`} title="Gols pró">
              GP
            </th>
            <th scope="col" className={`${TH} hidden sm:table-cell`} title="Gols contra">
              GC
            </th>
            <th scope="col" className={TH} title="Saldo de gols">
              SG
            </th>
            <th
              scope="col"
              className={`${TH} hidden md:table-cell`}
              title="Aproveitamento dos pontos disputados"
            >
              %
            </th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>
              Últimos 5
            </th>
            {hasChances && (
              <>
                <th
                  scope="col"
                  className={`${TH} hidden xl:table-cell border-l border-ink/10`}
                  title="Chance de terminar campeão"
                >
                  Título
                </th>
                <th
                  scope="col"
                  className={`${TH} hidden xl:table-cell`}
                  title={promotion.hint}
                >
                  {promotion.label}
                </th>
                {hasRelegation && (
                  <th
                    scope="col"
                    className={`${TH} hidden xl:table-cell`}
                    title="Chance de ser rebaixado"
                  >
                    Z4
                  </th>
                )}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr
              key={row.teamId}
              className="border-b border-ink/10 last:border-b-0 hover:bg-surface/60"
            >
              <td className="relative py-2 pl-3 pr-1 text-left font-mono text-sm tabular-nums text-gray-600">
                {row.zone && (
                  <span
                    className={`absolute left-0 top-0 h-full w-1 ${zoneBar(row.zone)}`}
                    aria-hidden="true"
                  />
                )}
                {row.position}
              </td>
              <th
                scope="row"
                className="max-w-[200px] px-1.5 py-2 text-left text-sm font-semibold text-ink"
              >
                <TeamCell row={row} />
              </th>
              <td className={`${TD} font-bold text-ink`}>{row.points}</td>
              <td className={`${TD} text-gray-600`}>{row.played}</td>
              <td className={`${TD} text-gray-600`}>{row.wins}</td>
              <td className={`${TD} text-gray-600`}>{row.draws}</td>
              <td className={`${TD} text-gray-600`}>{row.losses}</td>
              <td className={`${TD} hidden text-gray-600 sm:table-cell`}>
                {row.goalsFor}
              </td>
              <td className={`${TD} hidden text-gray-600 sm:table-cell`}>
                {row.goalsAgainst}
              </td>
              <td className={`${TD} text-gray-600`}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td className={`${TD} hidden text-gray-600 md:table-cell`}>
                {formatPercent(row.aproveitamento)}
              </td>
              <td className={`${TD} hidden lg:table-cell`}>
                <FormDots form={row.form} team={row.displayName} />
              </td>
              {hasChances && (
                <>
                  <td className={`${TD} hidden xl:table-cell border-l border-ink/10`}>
                    <Chance value={row.chances?.titulo} />
                  </td>
                  <td className={`${TD} hidden xl:table-cell`}>
                    <Chance value={row.chances?.promocao} />
                  </td>
                  {hasRelegation && (
                    <td className={`${TD} hidden xl:table-cell`}>
                      <Chance value={row.chances?.rebaixamento} />
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Legenda das zonas presentes na tabela. */
export function StandingsLegend({
  table,
  zoneLabels,
}: {
  table: EnrichedStandingsTable;
  /** Rótulos próprios da competição, quando o padrão não serve. */
  zoneLabels?: Record<string, string>;
}) {
  const zones = [
    ...new Set(table.rows.map((row) => row.zone).filter(Boolean)),
  ] as StandingZone[];

  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
      {zones.map((zone) => (
        <li key={zone} className="flex items-center gap-2">
          <span
            className={`h-3 w-1.5 shrink-0 ${zoneBar(zone)}`}
            aria-hidden="true"
          />
          {zoneMeta(zone, zoneLabels).label}
        </li>
      ))}
    </ul>
  );
}
