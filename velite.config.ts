import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    articles: {
      name: "Article",
      pattern: "articles/**/*.mdx",
      schema: s
        .object({
          title: s.string().max(120),
          slug: s.slug("articles"),
          excerpt: s.string().max(300),
          date: s.isodate(),
          updated: s.isodate().optional(),
          author: s.string(),
          category: s.string(),
          tags: s.array(s.string()).default([]),
          teams: s.array(s.string()).default([]),
          image: s.string().optional(),
          imageCaption: s.string().optional(),
          source: s
            .object({
              name: s.string(),
              url: s.string(),
            })
            .optional(),
          draft: s.boolean().default(false),
          featured: s.boolean().default(false),
          body: s.mdx(),
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/${data.slug}`,
          readingTime: Math.ceil((data.metadata?.wordCount ?? 0) / 200),
        })),
    },
  },
});
