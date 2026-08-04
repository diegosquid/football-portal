import { raceRoute } from "@/lib/race-route";

// Copy e keywords: src/lib/race.ts → RACE_COPY.rebaixamento
const route = raceRoute("rebaixamento");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
