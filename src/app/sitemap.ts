import type { MetadataRoute } from "next";
import { articles } from "#content";
import { getAllCategories } from "@/lib/categories";
import { getAllAuthors } from "@/lib/authors";
import { getAllTeams } from "@/lib/teams";
import { siteConfig } from "@/lib/site";
import { ARTICLES_PER_PAGE } from "@/lib/pagination";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Categorias — página 1
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Categorias — páginas 2+
  const categoryPaginatedPages: MetadataRoute.Sitemap = getAllCategories().flatMap((cat) => {
    const count = articles.filter((a) => a.category === cat.slug && !a.draft).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/categoria/${cat.slug}/pagina/${i + 2}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  });

  // Autores — página 1
  const authorPages: MetadataRoute.Sitemap = getAllAuthors().map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Autores — páginas 2+
  const authorPaginatedPages: MetadataRoute.Sitemap = getAllAuthors().flatMap((author) => {
    const count = articles.filter((a) => a.author === author.slug && !a.draft).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/autor/${author.slug}/pagina/${i + 2}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  });

  // Times — página 1
  const teamPages: MetadataRoute.Sitemap = getAllTeams().map((team) => ({
    url: `${baseUrl}/time/${team.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Times — páginas 2+
  const teamPaginatedPages: MetadataRoute.Sitemap = getAllTeams().flatMap((team) => {
    const count = articles.filter((a) => a.teams.includes(team.slug) && !a.draft).length;
    const totalPages = Math.ceil(count / ARTICLES_PER_PAGE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      url: `${baseUrl}/time/${team.slug}/pagina/${i + 2}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  });

  // Artigos
  const articlePages: MetadataRoute.Sitemap = articles
    .filter((a) => !a.draft)
    .map((article) => ({
      url: `${baseUrl}/${article.slug}`,
      lastModified: new Date(article.updated ?? article.date),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [
    ...staticPages,
    ...categoryPages,
    ...categoryPaginatedPages,
    ...authorPages,
    ...authorPaginatedPages,
    ...teamPages,
    ...teamPaginatedPages,
    ...articlePages,
  ];
}
