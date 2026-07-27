import type { Metadata } from "next";
import {
  Archivo,
  Bricolage_Grotesque,
  Instrument_Serif,
  Spline_Sans_Mono,
} from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MatchTicker } from "@/components/MatchTicker";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-spline-mono",
});

const defaultSocialTitle = `${siteConfig.name} — Notícias, Análises e Tabelas do Futebol`;

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Notícias de Futebol`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${siteConfig.name} (RSS)` },
      ],
      "application/atom+xml": [
        { url: "/atom.xml", title: `${siteConfig.name} (Atom)` },
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: defaultSocialTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Notícias de Futebol`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSocialTitle,
    description: siteConfig.description,
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${bricolage.variable} ${instrument.variable} ${splineMono.variable}`}
    >
      <GoogleAnalytics />
      <MicrosoftClarity />
      <body className="flex min-h-screen flex-col antialiased">
        <WebSiteJsonLd />
        <OrganizationJsonLd />
        <div className="grain" aria-hidden="true" />
        <Header />
        <MatchTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
