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
  links: {
    twitter: "https://x.com/beira_do_campo",
    instagram: "https://instagram.com/beiradocampo",
  },
};
