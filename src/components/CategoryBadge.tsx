import Link from "next/link";
import { getCategory } from "@/lib/categories";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  linked?: boolean;
}

/**
 * Selo de categoria — flâmula inclinada (skew) com tipografia mono.
 * Cores em globals.css (.badge-<slug>); "selecao" usa texto tinta.
 */
export function CategoryBadge({
  category,
  size = "md",
  linked = false,
}: CategoryBadgeProps) {
  const cat = getCategory(category);
  if (!cat) return null;

  const classes = `badge-${category} inline-block -skew-x-6 font-mono font-bold uppercase tracking-[0.12em] text-white ${
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
  }`;

  if (linked) {
    return (
      <Link href={`/categoria/${category}`} className={classes}>
        <span className="inline-block skew-x-6">{cat.label}</span>
      </Link>
    );
  }

  return (
    <span className={classes}>
      <span className="inline-block skew-x-6">{cat.label}</span>
    </span>
  );
}
