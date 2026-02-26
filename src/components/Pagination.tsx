import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageUrl: (page: number) => string;
}

export function Pagination({ currentPage, totalPages, pageUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="flex h-10 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-secondary transition-colors hover:bg-primary hover:text-white hover:border-primary"
          rel="prev"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="flex h-10 items-center rounded-lg border border-gray-100 px-4 text-sm font-medium text-gray-300 cursor-not-allowed">
          ← Anterior
        </span>
      )}

      {/* Números de página — desktop */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white"
              aria-current="page"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={pageUrl(item)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-sm font-medium text-secondary transition-colors hover:bg-primary hover:text-white hover:border-primary"
            >
              {item}
            </Link>
          ),
        )}
      </div>

      {/* Mobile: "Página X de Y" */}
      <span className="sm:hidden text-sm text-gray-500">
        Página {currentPage} de {totalPages}
      </span>

      {/* Próxima */}
      {currentPage < totalPages ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="flex h-10 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-secondary transition-colors hover:bg-primary hover:text-white hover:border-primary"
          rel="next"
        >
          Próxima →
        </Link>
      ) : (
        <span className="flex h-10 items-center rounded-lg border border-gray-100 px-4 text-sm font-medium text-gray-300 cursor-not-allowed">
          Próxima →
        </span>
      )}
    </nav>
  );
}

/**
 * Gera range de páginas com reticências.
 * Ex: [1, 2, 3, "ellipsis", 8, 9, 10]
 */
function buildPageRange(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const windowSize = 1;

  pages.push(1);

  const rangeStart = Math.max(2, current - windowSize);
  const rangeEnd = Math.min(total - 1, current + windowSize);

  if (rangeStart > 2) pages.push("ellipsis");

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < total - 1) pages.push("ellipsis");

  pages.push(total);

  return pages;
}
