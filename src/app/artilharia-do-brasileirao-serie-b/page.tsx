import { topScorersRoute } from "@/lib/topscorers-route";

// Copy e keywords: src/lib/topscorers-competitions.ts → brasileirao-serie-b
const route = topScorersRoute("brasileirao-serie-b");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
