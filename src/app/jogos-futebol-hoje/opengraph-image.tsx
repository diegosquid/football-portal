import {
  formatDateLongBR,
  getTodayBRT,
  getTodayMatches,
} from "@/lib/matches";
import { OG_COLORS, OgBadge, OgChip, OgShell, ogResponse } from "@/lib/og";

export const revalidate = 900;
export const alt = "Jogos de futebol hoje — horários e onde assistir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const games = getTodayMatches();
  const today = getTodayBRT();
  const shown = games.slice(0, 3);
  const remaining = games.length - shown.length;

  return ogResponse(
    <OgShell label="JOGOS DE HOJE">
      <div style={{ display: "flex", marginBottom: 28 }}>
        <OgBadge>{formatDateLongBR(today)}</OgBadge>
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: "display",
          fontSize: 84,
          lineHeight: 1,
          color: OG_COLORS.cal,
        }}
      >
        Jogos de Futebol Hoje
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
                  fontSize: 30,
                  color: OG_COLORS.lima,
                }}
              >
                {g.time}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "display",
                  fontSize: 34,
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
              TV
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", marginTop: 38 }}>
          <OgChip>Horários, canais e onde assistir</OgChip>
        </div>
      )}
    </OgShell>,
  );
}
