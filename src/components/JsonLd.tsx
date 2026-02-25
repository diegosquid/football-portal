import { siteConfig } from "@/lib/site";
import { getAuthor } from "@/lib/authors";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: excerpt,
    image: image ? [image] : [`${siteConfig.url}/og-default.jpg`],
    datePublished: date,
    dateModified: updated ?? date,
    author: {
      "@type": "Person",
      name: author?.name ?? authorSlug,
      url: `${siteConfig.url}/autor/${authorSlug}`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd() {
  const jsonLd = {
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
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
