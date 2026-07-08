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
    <nav
      aria-label="Paginação"
      className="mt-14 flex items-center justify-center gap-2 font-mono text-sm"
    >
      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="flex h-11 items-center border border-ink/20 px-4 font-medium uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cal"
          rel="prev"
        >
          ← Ant
        </Link>
      ) : (
        <span className="flex h-11 cursor-not-allowed items-center border border-ink/10 px-4 font-medium uppercase tracking-wider text-gray-300">
          ← Ant
        </span>
      )}

      {/* Números de página — desktop */}
      <div className="hidden items-center gap-2 sm:flex">
        {pages.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400">
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              className="flex h-11 w-11 items-center justify-center bg-ink font-bold text-lima"
              aria-current="page"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={pageUrl(item)}
              className="flex h-11 w-11 items-center justify-center border border-ink/20 font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cal"
            >
              {item}
            </Link>
          ),
        )}
      </div>

      {/* Mobile: "Página X de Y" */}
      <span className="text-xs uppercase tracking-wider text-gray-500 sm:hidden">
        {currentPage} / {totalPages}
      </span>

      {/* Próxima */}
      {currentPage < totalPages ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="flex h-11 items-center border border-ink/20 px-4 font-medium uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cal"
          rel="next"
        >
          Próx →
        </Link>
      ) : (
        <span className="flex h-11 cursor-not-allowed items-center border border-ink/10 px-4 font-medium uppercase tracking-wider text-gray-300">
          Próx →
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
