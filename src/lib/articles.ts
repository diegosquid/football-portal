import { articles as bundledArticles } from "#content";

/**
 * Acesso aos artigos em runtime, a partir do R2, em vez do bundle do build.
 *
 * O porquê: publicar matéria exigia commit + push + build completo (Velite
 * recompila os 975 MDX, Next regenera as páginas) — 190 builds/mês só de
 * artigo, contra os 300 min/mês do plano da Netlify.
 *
 * O que destrava isso: `MDXContent` renderiza com `new Function(code)` sobre
 * uma string de MDX **já compilado**. O Velite roda na máquina que publica e
 * grava essa string no R2 — nenhum compilador de MDX no runtime, e o
 * componente de render fica inalterado.
 *
 * Dois objetos no R2:
 *   articles/index.json    — todos os artigos SEM o body (~770 KB), para as
 *                            listagens (home, categoria, autor, time, feeds)
 *   articles/<slug>.json   — o artigo completo, com body compilado (~7 KB)
 *
 * O bundle do Velite (`#content`) continua importado como fallback: se o R2
 * falhar, o site serve o conteúdo do último deploy em vez de quebrar.
 */

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ??
  "https://pub-b064ffca19cd4d36a0ab9ad642dfe6fd.r2.dev";

/** Igual ao content-data.ts: menor que o revalidate das páginas, de propósito. */
const ARTICLES_REVALIDATE = 300;

/** Uma tag só para tudo que depende da lista — um revalidateTag atualiza todos. */
export const ARTICLES_TAG = "articles";

type BundledArticle = (typeof bundledArticles)[number];

/** Artigo completo, com o MDX compilado. */
export type Article = BundledArticle;

/**
 * Campos que vão para o índice — lista explícita, não `Omit<Article, "body">`.
 *
 * Tirar só o body deixaria `faq`, `metadata`, `source` e afins no índice e o
 * dobraria (1629 KB contra 770 KB). Esses campos só interessam à página do
 * artigo, que busca o objeto completo em articles/<slug>.json.
 *
 * Precisa bater com INDEX_FIELDS em scripts/publish-articles.js. Se divergir, o
 * TypeScript acusa em quem consome — é de propósito que seja um Pick.
 */
export const INDEX_FIELDS = [
  "slug",
  "title",
  "excerpt",
  "date",
  "updated",
  "author",
  "category",
  "tags",
  "teams",
  "image",
  "featured",
  "draft",
  "readingTime",
  "permalink",
] as const;

/** Artigo sem o body — o que as listagens precisam. */
export type ArticleSummary = Pick<
  BundledArticle,
  (typeof INDEX_FIELDS)[number]
>;

function toSummary(article: Article): ArticleSummary {
  const summary = {} as Record<string, unknown>;
  for (const field of INDEX_FIELDS) summary[field] = article[field];
  return summary as ArticleSummary;
}

/**
 * Índice de todos os artigos (sem body), ordenado do mais recente para o mais
 * antigo. Inclui rascunhos — quem consome filtra por `draft`, como antes.
 */
export async function getArticleIndex(): Promise<ArticleSummary[]> {
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/articles/index.json`, {
      next: { revalidate: ARTICLES_REVALIDATE, tags: [ARTICLES_TAG] },
    });
    if (res.ok) {
      const index = (await res.json()) as ArticleSummary[];
      // Índice vazio quase certamente é publicação quebrada, não "sem artigos".
      // Melhor servir o bundle velho do que uma home em branco.
      if (Array.isArray(index) && index.length > 0) return index;
    }
  } catch {
    // rede/R2 fora do ar — segue pro fallback do bundle
  }
  return bundledArticles.map(toSummary).sort(byDateDesc);
}

/** Artigo completo pelo slug. Retorna null se não existir em nenhuma fonte. */
export async function getArticle(slug: string): Promise<Article | null> {
  // Slug entra pela URL: barra a travessia de caminho antes de virar URL do R2.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;

  // O índice é a fonte da verdade sobre o que existe. Sem esta checagem, um
  // artigo removido do repositório continuaria no ar enquanto o objeto
  // articles/<slug>.json sobrevivesse no R2 — "apagar matéria" deixaria de
  // funcionar em silêncio. O índice já é buscado nesta mesma página (os
  // relacionados usam), então a checagem sai do cache e não custa requisição.
  const index = await getArticleIndex();
  if (!index.some((a) => a.slug === slug)) return null;

  try {
    const res = await fetch(`${R2_PUBLIC_URL}/articles/${slug}.json`, {
      next: {
        revalidate: ARTICLES_REVALIDATE,
        tags: [ARTICLES_TAG, `article:${slug}`],
      },
    });
    if (res.ok) {
      const article = (await res.json()) as Article;
      if (article?.slug && article?.body) return article;
    }
  } catch {
    // segue pro fallback do bundle
  }
  return bundledArticles.find((a) => a.slug === slug) ?? null;
}

export function byDateDesc(
  a: { date: string },
  b: { date: string },
): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/** Publicados, do mais recente ao mais antigo — o filtro repetido nas listagens. */
export async function getPublishedArticles(): Promise<ArticleSummary[]> {
  return (await getArticleIndex()).filter((a) => !a.draft).sort(byDateDesc);
}
