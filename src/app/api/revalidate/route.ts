import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ARTICLES_TAG } from "@/lib/articles";

/**
 * Revalidação on-demand — chamada por scripts/publish-articles.js e
 * scripts/publish-data.js depois de subir conteúdo pro R2.
 *
 * Sem isso o conteúdo novo ainda entra, mas só quando o ISR expirar (até 15
 * min). Com isso, entra na hora. É otimização de latência, não requisito: se
 * esta rota falhar, a publicação continua válida.
 */

export const dynamic = "force-dynamic";

interface Body {
  /** Slugs de artigos publicados — revalida cada página individual. */
  slugs?: string[];
  /** Tags avulsas (ex.: "data:jogos") para os JSONs de dados. */
  tags?: string[];
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  // Sem segredo configurado a rota fica fechada — não vale expor invalidação
  // de cache por descuido de configuração.
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET não configurado" },
      { status: 503 },
    );
  }
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json(
      { revalidated: false, error: "não autorizado" },
      { status: 401 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // corpo vazio é válido: revalida só a tag geral
  }

  const revalidated: string[] = [];

  // A tag geral cobre índice e tudo que lista artigos: home, categoria, autor,
  // time, feeds e sitemap. Um disparo atualiza todos.
  //
  // O perfil "max" é o do Next 16: a invalidação vale pelo maior período, então
  // nenhuma entrada com essa tag escapa por ter um cacheLife mais longo.
  revalidateTag(ARTICLES_TAG, "max");
  revalidated.push(`tag:${ARTICLES_TAG}`);

  for (const tag of body.tags ?? []) {
    revalidateTag(tag, "max");
    revalidated.push(`tag:${tag}`);
  }

  for (const slug of body.slugs ?? []) {
    // Mesma validação de src/lib/articles.ts — entrada externa não vira path.
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) continue;
    revalidatePath(`/${slug}`);
    revalidated.push(`/${slug}`);
  }

  return NextResponse.json({ revalidated: true, entries: revalidated });
}
