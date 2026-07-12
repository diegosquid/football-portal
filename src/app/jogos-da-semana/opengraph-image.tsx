import { getAllMatches } from "@/lib/matches";
import {
  OG_COLORS,
  OgBadge,
  OgChip,
  OgShell,
  ogDayShort,
  ogResponse,
} from "@/lib/og";

export const revalidate = 900;
export const alt = "Jogos da semana — agenda do futebol com horários e canais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const matches = getAllMatches();
  const shown = matches.slice(0, 3);
  const remaining = matches.length - shown.length;

  return ogResponse(
    <OgShell label="AGENDA DA SEMANA">
      <div style={{ display: "flex", marginBottom: 28 }}>
        <OgBadge>Agenda do futebol</OgBadge>
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: "display",
          fontSize: 92,
          lineHeight: 1,
          color: OG_COLORS.cal,
        }}
      >
        Jogos da Semana
      </div>

      {shown.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 38,
          }}
        >
          {shown.map((g) => (
            <div
              key={g.slug}
              style={{ display: "flex", alignItems: "center", gap: 24 }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "mono",
                  fontSize: 28,
                  color: OG_COLORS.lima,
                }}
              >
                {ogDayShort(g.date)} {g.time}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "display",
                  fontSize: 32,
                  color: OG_COLORS.cal,
                }}
              >
                {g.home} × {g.away}
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div
              style={{
                display: "flex",
                fontFamily: "mono",
                fontSize: 26,
                color: OG_COLORS.calFaded,
                marginTop: 6,
              }}
            >
              + {remaining} {remaining === 1 ? "outro jogo" : "outros jogos"} na
              agenda
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", marginTop: 38 }}>
          <OgChip>Datas, horários e canais</OgChip>
        </div>
      )}
    </OgShell>,
  );
}
