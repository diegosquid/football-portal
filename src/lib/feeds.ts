import { articles } from "#content";
import { absoluteUrl, siteConfig } from "./site";
import { getAuthor } from "./authors";

type Article = (typeof articles)[number];

interface FeedOptions {
  /** Título exibido na primeira tag <title> do feed. */
  title: string;
  /** Descrição/subtitle do feed. */
  description: string;
  /** URL pública do feed (self link). Absoluta. */
  feedUrl: string;
  /** URL pública da página HTML equivalente. Absoluta. */
  pageUrl: string;
  /** Artigos já filtrados, ordenados desc por data, limitados ao tamanho desejado. */
  articles: Article[];
}

/** Escape XML mínimo. Não usar em conteúdo já em CDATA. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Conteúdo dentro de CDATA precisa só fugir do terminador `]]>`. */
function cdata(str: string): string {
  return `<![CDATA[${str.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function articleUrl(slug: string): string {
  return absoluteUrl(`/${slug}`);
}

function articleImageUrl(article: Article): string {
  return article.image && /^https?:\/\//.test(article.image)
    ? article.image
    : absoluteUrl(siteConfig.ogImage);
}

function articleDate(article: Article): Date {
  const iso = article.date.includes("T")
    ? article.date
    : `${article.date}T12:00:00-03:00`;
  return new Date(iso);
}

function articleUpdated(article: Article): Date {
  if (article.updated) {
    const iso = article.updated.includes("T")
      ? article.updated
      : `${article.updated}T12:00:00-03:00`;
    return new Date(iso);
  }
  return articleDate(article);
}

/** RFC 822 date (RSS 2.0). */
function rfc822(d: Date): string {
  return d.toUTCString();
}

/** ISO 8601 (Atom). */
function iso8601(d: Date): string {
  return d.toISOString();
}

export function buildRss(opts: FeedOptions): string {
  const lastBuild = opts.articles[0]
    ? rfc822(articleUpdated(opts.articles[0]))
    : rfc822(new Date());

  const items = opts.articles
    .map((a) => {
      const author = getAuthor(a.author);
      const url = articleUrl(a.slug);
      const image = articleImageUrl(a);
      const pubDate = rfc822(articleDate(a));
      const authorTag = author
        ? `<dc:creator>${cdata(author.name)}</dc:creator>`
        : "";
      return `    <item>
      <title>${cdata(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${authorTag}
      <category>${cdata(a.category)}</category>
      <description>${cdata(a.excerpt)}</description>
      <enclosure url="${escapeXml(image)}" type="image/jpeg" />
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${cdata(opts.title)}</title>
    <link>${escapeXml(opts.pageUrl)}</link>
    <description>${cdata(opts.description)}</description>
    <language>${siteConfig.locale}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(opts.feedUrl)}" rel="self" type="application/rss+xml" />
    <generator>${cdata(siteConfig.name)} (Next.js)</generator>
${items}
  </channel>
</rss>
`;
}

export function buildAtom(opts: FeedOptions): string {
  const updated = opts.articles[0]
    ? iso8601(articleUpdated(opts.articles[0]))
    : iso8601(new Date());

  const entries = opts.articles
    .map((a) => {
      const author = getAuthor(a.author);
      const url = articleUrl(a.slug);
      const image = articleImageUrl(a);
      const pub = iso8601(articleDate(a));
      const upd = iso8601(articleUpdated(a));
      const authorTag = author
        ? `      <author><name>${cdata(author.name)}</name></author>`
        : `      <author><name>${cdata(siteConfig.name)}</name></author>`;
      return `  <entry>
    <title>${cdata(a.title)}</title>
    <link href="${escapeXml(url)}" />
    <id>${escapeXml(url)}</id>
    <published>${pub}</published>
    <updated>${upd}</updated>
${authorTag}
    <category term="${escapeXml(a.category)}" />
    <summary type="text">${cdata(a.excerpt)}</summary>
    <link rel="enclosure" type="image/jpeg" href="${escapeXml(image)}" />
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${siteConfig.locale}">
  <title>${cdata(opts.title)}</title>
  <subtitle>${cdata(opts.description)}</subtitle>
  <link href="${escapeXml(opts.pageUrl)}" rel="alternate" type="text/html" />
  <link href="${escapeXml(opts.feedUrl)}" rel="self" type="application/atom+xml" />
  <id>${escapeXml(opts.feedUrl)}</id>
  <updated>${updated}</updated>
  <generator uri="${escapeXml(siteConfig.url)}">${cdata(siteConfig.name)}</generator>
${entries}
</feed>
`;
}

/** Filtros padrão para alimentar feeds. */
export function getFeedArticles(
  filter?: (a: Article) => boolean,
  limit = 30,
): Article[] {
  return articles
    .filter((a) => !a.draft && (!filter || filter(a)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
