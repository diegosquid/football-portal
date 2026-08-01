import { readFileSync } from "fs";
import { join } from "path";

/**
 * Carrega os JSONs de dados (jogos, classificação, probabilidades) em runtime,
 * a partir do R2, em vez de lê-los do bundle do deploy.
 *
 * O porquê: esses arquivos mudam várias vezes por dia. Lendo do disco, cada
 * atualização exigia um commit + build completo na Netlify — ~56 builds/mês só
 * de dado. Buscando do R2 com o Data Cache do Next, as páginas (que já são
 * `revalidate = 900`) pegam dado novo sozinhas, sem deploy nenhum.
 *
 * O arquivo local continua no repositório e serve de fallback: se o R2 falhar
 * ou o objeto ainda não existir, o site serve o dado do deploy em vez de quebrar.
 */

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ??
  "https://pub-b064ffca19cd4d36a0ab9ad642dfe6fd.r2.dev";

/** Prefixo dos dados no bucket. Ver scripts/publish-data.js. */
const R2_DATA_PREFIX = "data";

/**
 * Deliberadamente menor que o `revalidate = 900` das páginas.
 *
 * São dois caches encadeados: o da página e o deste fetch. Se ambos fossem
 * 900s, uma página que re-renderiza no segundo 900 poderia encontrar a entrada
 * do fetch ainda "fresca" (criada no segundo 100, logo com 800s de idade) e
 * servir dado velho até a próxima revalidação — até ~30 min de atraso.
 *
 * Com 300s, a entrada do fetch já venceu sempre que a página re-renderiza, e o
 * gargalo passa a ser só o ciclo de 15 min da página. Custo: alguns GETs a mais
 * no R2, e só quando uma página realmente re-renderiza.
 */
export const DATA_REVALIDATE = 300;

/** Tag de cache única por arquivo — permite revalidação on-demand por dado. */
export function dataTag(fileName: string): string {
  return `data:${fileName.replace(/\.json$/, "")}`;
}

function loadLocal<T>(fileName: string): T | null {
  try {
    const filePath = join(process.cwd(), "content", fileName);
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

/**
 * Busca `content/<fileName>` no R2 e cai no arquivo local se não conseguir.
 * Retorna null quando nenhuma das duas fontes tem o arquivo.
 */
export async function loadData<T>(fileName: string): Promise<T | null> {
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/${R2_DATA_PREFIX}/${fileName}`, {
      next: { revalidate: DATA_REVALIDATE, tags: [dataTag(fileName)] },
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    // rede/R2 fora do ar — segue pro fallback local
  }
  return loadLocal<T>(fileName);
}
