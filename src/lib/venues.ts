import { loadData as loadContentData } from "@/lib/content-data";
import { getTeam, resolveTeamSlug } from "@/lib/teams";
import { API_NAME_FIXES } from "@/lib/standings-names";

/**
 * Estádios por competição — gerado por scripts/build-venues.js.
 * Conteúdo evergreen: capacidade quase não muda, e a busca é constante o ano
 * inteiro ("capacidade do Maracanã", "estádio do Palmeiras").
 */

export interface Venue {
  team: string;
  teamId: string;
  badge: string | null;
  founded: number | null;
  coach: string | null;
  squadSize: number | null;
  stadium: string | null;
  city: string | null;
  capacity: number | null;
  surface: string | null;
}

export interface VenuesCompetition {
  slug: string;
  competition: string;
  shortName: string;
  leagueId: number;
  teams: number;
  withCapacity: number;
  uniqueStadiums: number;
  totalCapacity: number;
  averageCapacity: number | null;
  venues: Venue[];
}

export interface VenuesData {
  generatedAt: string;
  source: string;
  disclaimer: string;
  competitions: Record<string, VenuesCompetition>;
}

export interface EnrichedVenue extends Venue {
  teamName: string;
  teamSlug?: string;
  /** Outros clubes da mesma competição que mandam no mesmo estádio. */
  sharedWith: string[];
}

export interface EnrichedVenuesCompetition extends VenuesCompetition {
  venues: EnrichedVenue[];
}

function loadData(): Promise<VenuesData | null> {
  return loadContentData<VenuesData>("estadios.json");
}

export function getVenuesData(): Promise<VenuesData | null> {
  return loadData();
}

export async function getVenues(
  slug: string,
): Promise<EnrichedVenuesCompetition | null> {
  const comp = (await loadData())?.competitions?.[slug];
  if (!comp) return null;

  const byStadium = new Map<string, string[]>();
  for (const v of comp.venues) {
    if (!v.stadium) continue;
    byStadium.set(v.stadium, [...(byStadium.get(v.stadium) ?? []), v.team]);
  }

  const venues = comp.venues.map((v): EnrichedVenue => {
    const teamSlug = resolveTeamSlug(v.team);
    const team = teamSlug ? getTeam(teamSlug) : undefined;
    const teamName = team?.name ?? API_NAME_FIXES[v.team] ?? v.team;
    const others = (v.stadium ? (byStadium.get(v.stadium) ?? []) : []).filter(
      (t) => t !== v.team,
    );
    return {
      ...v,
      teamName,
      teamSlug,
      sharedWith: others.map((t) => {
        const s = resolveTeamSlug(t);
        return (s ? getTeam(s)?.name : undefined) ?? API_NAME_FIXES[t] ?? t;
      }),
    };
  });

  return { ...comp, venues };
}

/**
 * Uma linha por PRAÇA, não por clube — Maracanã aparecia em 1º e 2º lugar num
 * ranking numerado de estádios, o que lia como bug. Os clubes que dividem a
 * casa entram juntos na mesma linha.
 */
export interface StadiumRow {
  stadium: string;
  city: string | null;
  capacity: number | null;
  surface: string | null;
  teams: { name: string; slug?: string }[];
}

export function uniqueStadiums(
  comp: EnrichedVenuesCompetition,
): StadiumRow[] {
  const rows = new Map<string, StadiumRow>();
  for (const venue of comp.venues) {
    if (!venue.stadium) continue;
    const row = rows.get(venue.stadium);
    const team = { name: venue.teamName, slug: venue.teamSlug };
    if (row) row.teams.push(team);
    else
      rows.set(venue.stadium, {
        stadium: venue.stadium,
        city: venue.city,
        capacity: venue.capacity,
        surface: venue.surface,
        teams: [team],
      });
  }
  return [...rows.values()].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
}

/** "78.838" — separador de milhar em pt-BR. */
export function formatCapacity(capacity: number | null): string {
  return capacity ? capacity.toLocaleString("pt-BR") : "—";
}

const SURFACE_LABEL: Record<string, string> = {
  grass: "Grama natural",
  "artificial turf": "Grama sintética",
  artificial: "Grama sintética",
};

export function surfaceLabel(surface: string | null): string | null {
  if (!surface) return null;
  return SURFACE_LABEL[surface.toLowerCase()] ?? surface;
}
