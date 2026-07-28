import { standingsOgImage } from "@/lib/og-standings";

export const revalidate = 900;
export const alt = "Tabela do Brasileirão Série A — classificação atualizada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return standingsOgImage("brasileirao");
}
