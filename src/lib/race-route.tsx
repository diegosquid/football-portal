import type { Metadata } from "next";
import { RaceLanding } from "@/components/RaceLanding";
import { siteConfig } from "@/lib/site";
import { getRace, raceSummary, RACE_COPY, type RaceObjective } from "@/lib/race";

/**
 * Monta a landing de um objetivo da simulação (título ou rebaixamento).
 *
 *   const route = raceRoute("rebaixamento");
 *   export const revalidate = 900;
 *   export const generateMetadata = route.generateMetadata;
 *   export default route.Page;
 */
export function raceRoute(objective: RaceObjective) {
  const copy = RACE_COPY[objective];

  async function generateMetadata(): Promise<Metadata> {
    const { competitions, season } = await getRace(objective);
    const title = copy.title(season);
    // A resposta direta na description é o que ganha CTR nessa SERP.
    const main = competitions[0];
    const description = main
      ? `${raceSummary(main, objective)} ${copy.description(season)}`.slice(0, 300)
      : copy.description(season);

    return {
      title,
      description,
      keywords: copy.keywords,
      alternates: { canonical: `${siteConfig.url}${copy.path}` },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}${copy.path}`,
        siteName: siteConfig.name,
        locale: "pt_BR",
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  async function Page() {
    const { competitions, season, generatedAt } = await getRace(objective);
    return (
      <RaceLanding
        objective={objective}
        competitions={competitions}
        season={season}
        generatedAt={generatedAt}
      />
    );
  }

  return { generateMetadata, Page };
}
