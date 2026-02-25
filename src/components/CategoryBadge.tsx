import Link from "next/link";
import { getCategory } from "@/lib/categories";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  linked?: boolean;
}

export function CategoryBadge({
  category,
  size = "md",
  linked = false,
}: CategoryBadgeProps) {
  const cat = getCategory(category);
  if (!cat) return null;

  const classes = `badge-${category} inline-block rounded-sm font-bold uppercase tracking-wider text-white ${
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
  }`;

  if (linked) {
    return (
      <Link href={`/categoria/${category}`} className={classes}>
        {cat.label}
      </Link>
    );
  }

  return <span className={classes}>{cat.label}</span>;
}
