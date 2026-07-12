import { getTeam, teamPlaysInGame } from "@/lib/teams";
import { compDo, competitionHasGame, getCompetition } from "@/lib/competitions";
import {
  getTodayMatches,
  getUpcomingMatches,
  type Match,
} from "@/lib/matches";
import {
  OG_COLORS,
  OgBadge,
  OgChip,
  OgShell,
  ogDayShort,
  ogResponse,
} from "@/lib/og";

export const revalidate = 900;
export const alt = "Joga hoje? Horário, canal e próximo jogo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ team: string }>;
}

/** Linha de destaque: jogo de hoje ou o próximo da janela. */
function highlight(todayGames: Match[], upcoming: Match[]) {
  if (todayGames.length > 0) {
    const g = todayGames[0];
    return {
      badge: "HOJE TEM JOGO",
      line: `${g.home} × ${g.away}`,
      chips: [g.time, g.channel].filter(Boolean),
    };
  }
  if (upcoming.length > 0) {
    const g = upcoming[0];
    return {
      badge: "PRÓXIMO JOGO",
      line: `${g.home} × ${g.away}`,
      chips: [`${ogDayShort(g.date)} ${g.time}`, g.channel].filter(Boolean),
    };
  }
  return null;
}

export default async function Image({ params }: Props) {
  const { team: slug } = await params;

  const comp = getCompetition(slug);
  const team = comp ? undefined : getTeam(slug);

  const todayGames = getTodayMatches().filter((g) =>
    comp
      ? competitionHasGame(comp, g.competition)
      : team
        ? teamPlaysInGame(team.slug, g.home, g.away)
        : false,
  );
  const upcoming = getUpcomingMatches().filter((g) =>
    comp
      ? competitionHasGame(comp, g.competition)
      : team
        ? teamPlaysInGame(team.slug, g.home, g.away)
        : false,
  );

  const title = comp
    ? `Jogos ${compDo(comp)} Hoje`
    : team
      ? `${team.name} Hoje`
      : "Jogos de Futebol Hoje";
  const hl = highlight(todayGames, upcoming);

  return ogResponse(
    <OgShell label={comp ? "JOGOS DE HOJE" : "JOGA HOJE?"}>
      {hl && (
        <div style={{ display: "flex", marginBottom: 28 }}>
          <OgBadge>{hl.badge}</OgBadge>
        </div>
      )}

      <div
        style={{
          display: "flex",
          fontFamily: "display",
          fontSize: title.length > 22 ? 72 : 88,
          lineHeight: 1,
          color: OG_COLORS.cal,
        }}
      >
        {title}
      </div>

      {hl ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            marginTop: 38,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "display",
              fontSize: 42,
              color: OG_COLORS.cal,
            }}
          >
            {hl.line}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {hl.chips.map((c) => (
              <OgChip key={c}>{c}</OgChip>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", marginTop: 38 }}>
          <OgChip>Horário, canal e onde assistir</OgChip>
        </div>
      )}
    </OgShell>,
  );
}
