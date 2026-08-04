import { bracketsRoute } from "@/lib/brackets-route";

// Copy e keywords: src/lib/brackets-route.tsx → bracketCopy["sul-americana"]
const route = bracketsRoute("sul-americana");

export const revalidate = 900; // 15 min
export const generateMetadata = route.generateMetadata;
export default route.Page;
