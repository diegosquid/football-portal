import { getMatchBySlug } from "@/lib/matches";
import {
  OG_COLORS,
  OgBadge,
  OgChip,
  OgShell,
  ogDayShort,
  ogResponse,
} from "@/lib/og";

export const revalidate = 900;
export const alt = "Onde assistir — horário e canal do jogo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    return ogResponse(
      <OgShell label="ONDE ASSISTIR">
        <div
          style={{
            display: "flex",
            fontFamily: "display",
            fontSize: 76,
            color: OG_COLORS.cal,
          }}
        >
          Onde assistir futebol
        </div>
      </OgShell>,
    );
  }

  return ogResponse(
    <OgShell label="ONDE ASSISTIR">
      <div style={{ display: "flex", marginBottom: 34 }}>
        <OgBadge>
          {match.competition}
          {match.round ? ` — ${match.round}` : ""}
        </OgBadge>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.05,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "display",
            fontSize: 68,
            color: OG_COLORS.cal,
          }}
        >
          {match.home}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            margin: "6px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "mono",
              fontSize: 40,
              color: OG_COLORS.lima,
            }}
          >
            ×
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              height: 3,
              maxWidth: 220,
              backgroundColor: OG_COLORS.calLine,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "display",
            fontSize: 68,
            color: OG_COLORS.cal,
          }}
        >
          {match.away}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        <OgChip>{ogDayShort(match.date)}</OgChip>
        <OgChip>{match.time}</OgChip>
        {match.channel && <OgChip>{match.channel}</OgChip>}
      </div>
    </OgShell>,
  );
}
