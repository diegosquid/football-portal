import { OG_COLORS, OgBadge, OgShell, ogResponse } from "@/lib/og";
import { getStandingsCopy } from "@/lib/standings-competitions";
import { getStandingsTable } from "@/lib/standings";

/** Uma linha do mini-ranking do card social. */
function OgRow({
  position,
  name,
  points,
  highlight,
}: {
  position: number;
  name: string;
  points: number;
  highlight: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: 40,
          fontFamily: "mono",
          fontSize: 26,
          color: highlight ? OG_COLORS.lima : OG_COLORS.calFaded,
        }}
      >
        {position}
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          fontFamily: "display",
          fontSize: 33,
          color: OG_COLORS.cal,
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "mono",
          fontSize: 30,
          color: highlight ? OG_COLORS.lima : OG_COLORS.cal,
        }}
      >
        {points}
      </div>
    </div>
  );
}

/**
 * Card social das landings de classificação: os cinco primeiros com os pontos.
 * Recebe só o slug — título e rótulo saem da copy da competição, então uma
 * competição nova ganha o card certo sem editar texto aqui.
 */
export async function standingsOgImage(slug: string) {
  const table = await getStandingsTable(slug);
  const copy = getStandingsCopy(slug);
  const title = copy?.ogTitle ?? "Classificação";
  const label = copy?.eyebrow.toUpperCase() ?? "CLASSIFICAÇÃO";
  const top = table?.rows.slice(0, 5) ?? [];

  return ogResponse(
    <OgShell label={label}>
      <div style={{ display: "flex", marginBottom: 24 }}>
        <OgBadge>
          {table ? `${table.roundsPlayed}ª rodada` : "Classificação"}
        </OgBadge>
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: "display",
          fontSize: 72,
          lineHeight: 1,
          color: OG_COLORS.cal,
        }}
      >
        {title}
      </div>

      {top.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 26,
            width: 640,
          }}
        >
          {top.map((row) => (
            <OgRow
              key={row.teamId}
              position={row.position}
              name={row.displayName}
              points={row.points}
              highlight={row.position === 1}
            />
          ))}
        </div>
      )}
    </OgShell>,
  );
}
