import { standingsRoute } from "@/lib/standings-route";

// Copy e keywords: src/lib/standings-competitions.ts → brasileirao-serie-b
const route = standingsRoute("brasileirao-serie-b");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
