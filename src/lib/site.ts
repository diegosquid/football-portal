export const siteConfig = {
  name: "Beira do Campo",
  description:
    "Portal de futebol brasileiro com notícias diárias, análises táticas, mercado da bola e estatísticas. Cobertura completa do Brasileirão, Libertadores e futebol internacional.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://beiradocampo.com.br",
  locale: "pt-BR",
  language: "pt",
  authors: [{ name: "Beira do Campo", url: "https://beiradocampo.com.br" }],
  creator: "Beira do Campo",
  publisher: "Beira do Campo",
  ogImage: "/og-default.jpg",
  logo: "/static/logo-512.png",
  twitterHandle: "@beira_do_campo",
  links: {
    twitter: "https://x.com/beira_do_campo",
    youtube: "https://www.youtube.com/@beiradocampotv",
  },
};

export function absoluteUrl(path: string): string {
  if (!path) return siteConfig.url;
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function truncateForMeta(text: string, max = 160): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 80 ? lastSpace : slice.length).trim()}…`;
}
