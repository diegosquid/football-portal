import { raceRoute } from "@/lib/race-route";

// Copy e keywords: src/lib/race.ts → RACE_COPY.titulo
const route = raceRoute("titulo");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
