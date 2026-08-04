import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopScorersLanding } from "@/components/TopScorersLanding";
import { siteConfig } from "@/lib/site";
import { getTopScorersCopy } from "@/lib/topscorers-competitions";
import { getTopScorers, getTopScorersData, goalsLabel } from "@/lib/topscorers";

/**
 * Monta uma landing de artilharia a partir do slug da competição.
 *
 * Cada rota (src/app/artilharia-*<slug>/page.tsx) fica assim:
 *
 *   const route = topScorersRoute("brasileirao");
 *   export const revalidate = 900;
 *   export const generateMetadata = route.generateMetadata;
 *   export default route.Page;
 *
 * Igual ao standingsRoute: o ano vem do DADO (`ranking.season`), nunca chumbado.
 */
export function topScorersRoute(slug: string) {
  const copy = getTopScorersCopy(slug);
  if (!copy) {
    throw new Error(
      `topScorersRoute("${slug}"): sem copy em src/lib/topscorers-competitions.ts`,
    );
  }

  async function generateMetadata(): Promise<Metadata> {
    const ranking = await getTopScorers(slug);
    const season = ranking?.season ?? String(new Date().getFullYear());
    const title = copy!.title(season);

    const leader = ranking?.scorers[0];
    const description = leader
      ? `${leader.displayName} (${leader.teamName}) lidera com ${goalsLabel(leader.goals)}. ${copy!.description(season)}`
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
    const [ranking, data] = await Promise.all([
      getTopScorers(slug),
      getTopScorersData(),
    ]);
    // Sem ranking aprovado na conferência, a página não existe — melhor 404 do
    // que publicar artilharia que não fecha com o placar dos jogos.
    if (!ranking || ranking.scorers.length === 0) notFound();
    return (
      <TopScorersLanding
        ranking={ranking}
        copy={copy!}
        generatedAt={data?.generatedAt}
      />
    );
  }

  return { generateMetadata, Page };
}
