import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { ArticleImage } from "./ArticleImage";
import { getFallbackImage } from "@/lib/images";
import { getAuthor } from "@/lib/authors";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  image?: string;
  readingTime: number;
  featured?: boolean;
}

export function timeAgo(dateString: string): string {
  // Sempre interpretar datas como BRT (UTC-3), independente do timezone do servidor
  const dateInput = dateString.includes('T') ? dateString : dateString + "T12:00:00-03:00";
  const articleDate = new Date(dateInput);

  if (isNaN(articleDate.getTime())) {
    return dateString;
  }

  // Obter hora atual em BRT (UTC-3)
  const now = new Date();
  const nowBRT = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

  const diffMs = Math.max(0, nowBRT.getTime() - articleDate.getTime());
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Agora pouco";
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return articleDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  date,
  author,
  category,
  image,
  readingTime,
  featured = false,
}: ArticleCardProps) {
  const authorData = getAuthor(author);

  if (featured) {
    return (
      <Link
        href={`/${slug}`}
        className="group relative block overflow-hidden bg-campo"
      >
        <ArticleImage
          src={image}
          alt={title}
          width={800}
          height={450}
          className="h-[400px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] lg:h-[520px]"
          fallbackSrc={getFallbackImage(category)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-campo-deep via-campo-deep/45 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <CategoryBadge category={category} />
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-[1.03] tracking-tight text-cal lg:text-5xl">
            <span className="title-underline">{title}</span>
          </h2>
          <p className="mt-3 line-clamp-2 max-w-2xl font-serif text-base italic text-cal/75 lg:text-xl">
            {excerpt}
          </p>
          <div className="mt-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-cal/60">
            {authorData && <span>{authorData.name}</span>}
            <span className="h-1 w-1 rotate-45 bg-lima" />
            <span>{timeAgo(date)}</span>
            <span className="h-1 w-1 rotate-45 bg-lima" />
            <span>{readingTime} min de leitura</span>
          </div>
        </div>

        {/* Seta de canto */}
        <span className="absolute right-6 top-6 hidden h-12 w-12 items-center justify-center border border-cal/30 text-xl text-cal transition-all duration-300 group-hover:border-lima group-hover:bg-lima group-hover:text-ink lg:flex">
          ↗
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/${slug}`} className="group flex flex-col">
      <div className="relative overflow-hidden">
        <ArticleImage
          src={image}
          alt={title}
          width={400}
          height={225}
          className="aspect-video w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          fallbackSrc={getFallbackImage(category)}
        />
        <div className="absolute inset-0 bg-campo/0 transition-colors duration-300 group-hover:bg-campo/15" />
        <div className="absolute left-0 top-3">
          <CategoryBadge category={category} size="sm" />
        </div>
      </div>

      {/* Régua de coluna, jeito de jornal */}
      <div className="mt-3 flex flex-1 flex-col border-t-[3px] border-ink pt-3">
        <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-ink">
          <span className="title-underline">{title}</span>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
          {excerpt}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
          {authorData && <span>{authorData.name}</span>}
          <span className="h-1 w-1 rotate-45 bg-gray-400" />
          <span>{timeAgo(date)}</span>
          <span className="h-1 w-1 rotate-45 bg-gray-400" />
          <span>{readingTime} min</span>
        </div>
      </div>
    </Link>
  );
}
