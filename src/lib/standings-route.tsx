import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandingsLanding } from "@/components/StandingsLanding";
import { siteConfig } from "@/lib/site";
import { getStandingsCopy } from "@/lib/standings-competitions";
import { getStandingsData, getStandingsTable } from "@/lib/standings";

/**
 * Monta uma landing de classificação a partir do slug da competição.
 *
 * Cada rota (src/app/tabela-do-<slug>/page.tsx) fica assim:
 *
 *   const route = standingsRoute("brasileirao");
 *   export const revalidate = 900;
 *   export const generateMetadata = route.generateMetadata;
 *   export default route.Page;
 *
 * Título, H1 e descrição levam o ano vindo do DADO (`table.season`), nunca
 * chumbado — a rota é perene e vira de temporada sozinha.
 */
export function standingsRoute(slug: string) {
  const copy = getStandingsCopy(slug);
  if (!copy) {
    throw new Error(
      `standingsRoute("${slug}"): sem copy em src/lib/standings-competitions.ts`,
    );
  }

  async function generateMetadata(): Promise<Metadata> {
    const table = await getStandingsTable(slug);
    const season = table?.season ?? String(new Date().getFullYear());
    const round = table ? ` — ${table.roundsPlayed}ª rodada` : "";
    const leader = table?.rows[0];

    const title = copy!.title(season, round);
    const description = leader
      ? `${copy!.h1(season)} atualizada: ${leader.displayName} lidera com ${leader.points} pontos. ${copy!.description(season)}`
      : copy!.description(season);

    return {
      title,
      description,
      keywords: copy!.keywords,
      alternates: { canonical: `${siteConfig.url}${copy!.path}` },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}${copy!.path}`,
        siteName: siteConfig.name,
        locale: "pt_BR",
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  async function Page() {
    const [table, data] = await Promise.all([
      getStandingsTable(slug),
      getStandingsData(),
    ]);
    if (!table) notFound();
    return (
      <StandingsLanding
        table={table}
        copy={copy!}
        generatedAt={data?.generatedAt}
      />
    );
  }

  return { generateMetadata, Page };
}
