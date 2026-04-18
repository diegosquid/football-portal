import { absoluteUrl, siteConfig } from "@/lib/site";
import { getAuthor } from "@/lib/authors";

interface JsonLdProps {
  data: Record<string, unknown>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface NewsArticleJsonLdProps {
  title: string;
  excerpt: string;
  date: string;
  updated?: string;
  authorSlug: string;
  image?: string;
  slug: string;
}

export function NewsArticleJsonLd({
  title,
  excerpt,
  date,
  updated,
  authorSlug,
  image,
  slug,
}: NewsArticleJsonLdProps) {
  const author = getAuthor(authorSlug);
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: excerpt,
    image: image ? [image] : [absoluteUrl(siteConfig.ogImage)],
    datePublished: date,
    dateModified: updated ?? date,
    author: {
      "@type": "Person",
      name: author?.name ?? authorSlug,
      url: absoluteUrl(`/autor/${authorSlug}`),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.logo),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/${slug}`),
    },
  };
  return <JsonLd data={data} />;
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl(siteConfig.logo),
    },
  };
  return <JsonLd data={data} />;
}

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.logo),
    },
    description: siteConfig.description,
    sameAs: [siteConfig.links.twitter, siteConfig.links.youtube],
  };
  return <JsonLd data={data} />;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
  return <JsonLd data={data} />;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function FAQPageJsonLd({ items }: { items: FAQItem[] }) {
  if (!items.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return <JsonLd data={data} />;
}

interface CollectionPageJsonLdProps {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  items,
}: CollectionPageJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(url),
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    hasPart: {
      "@type": "ItemList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: absoluteUrl(item.url),
      })),
    },
  };
  return <JsonLd data={data} />;
}
