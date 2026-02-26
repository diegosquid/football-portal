export const ARTICLES_PER_PAGE = 12;

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Pagina um array já ordenado.
 * Retorna null se a página solicitada está fora do range.
 */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number = ARTICLES_PER_PAGE,
): PaginationResult<T> | null {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  if (page < 1 || page > totalPages) return null;

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    items: items.slice(start, end),
    currentPage: page,
    totalPages,
    totalItems,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

/**
 * Gera array de números de página 2+ para generateStaticParams.
 * Página 1 é servida pela rota base (sem /pagina/1).
 */
export function getPageNumbers(
  totalItems: number,
  perPage: number = ARTICLES_PER_PAGE,
): number[] {
  const totalPages = Math.ceil(totalItems / perPage);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);
}

/**
 * Constrói URLs de paginação para um dado basePath.
 * Página 1 sempre mapeia para o basePath (sem /pagina/1).
 */
export function buildPaginationUrls(
  basePath: string,
  currentPage: number,
  totalPages: number,
) {
  const pageUrl = (page: number) =>
    page === 1 ? basePath : `${basePath}/pagina/${page}`;

  return {
    canonical: pageUrl(currentPage),
    prev: currentPage > 1 ? pageUrl(currentPage - 1) : null,
    next: currentPage < totalPages ? pageUrl(currentPage + 1) : null,
    first: pageUrl(1),
    last: pageUrl(totalPages),
    pageUrl,
  };
}
