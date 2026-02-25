import type { MetadataRoute } from "next";
import { articles } from "#content";
import { getAllCategories } from "@/lib/categories";
import { getAllAuthors } from "@/lib/authors";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const authorPages: MetadataRoute.Sitemap = getAllAuthors().map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = articles
    .filter((a) => !a.draft)
    .map((article) => ({
      url: `${baseUrl}/${article.slug}`,
      lastModified: new Date(article.updated ?? article.date),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [...staticPages, ...categoryPages, ...authorPages, ...articlePages];
}
