import { topScorersRoute } from "@/lib/topscorers-route";

// Copy e keywords: src/lib/topscorers-competitions.ts → libertadores
const route = topScorersRoute("libertadores");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
