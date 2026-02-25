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

function timeAgo(dateString: string): string {
  // Garantir que a data tenha timezone BRT se for só data (YYYY-MM-DD)
  const dateInput = dateString.includes('T') ? dateString : dateString + "T12:00:00-03:00";
  const date = new Date(dateInput);
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) {
    return dateString; // Fallback: retorna a string original
  }
  
  // Data atual no timezone BRT
  const now = new Date();
  const nowBRT = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const dateBRT = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  
  const diffMs = nowBRT.getTime() - dateBRT.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return dateBRT.toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
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
        className="group relative block overflow-hidden rounded-xl bg-dark"
      >
        <ArticleImage
          src={image}
          alt={title}
          width={800}
          height={450}
          className="h-[400px] w-full object-cover transition-transform duration-300 group-hover:scale-105 lg:h-[500px]"
          fallbackSrc={getFallbackImage(category)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          <CategoryBadge category={category} />
          <h2 className="mt-3 text-2xl font-bold leading-tight text-white lg:text-4xl">
            {title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-gray-300 lg:text-base">
            {excerpt}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
            {authorData && <span>{authorData.name}</span>}
            <span>&middot;</span>
            <span>{timeAgo(date)}</span>
            <span>&middot;</span>
            <span>{readingTime} min de leitura</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/${slug}`} className="group flex flex-col">
      <div className="relative overflow-hidden rounded-lg">
        <ArticleImage
          src={image}
          alt={title}
          width={400}
          height={225}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallbackSrc={getFallbackImage(category)}
        />
        <div className="absolute left-3 top-3">
          <CategoryBadge category={category} size="sm" />
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="font-bold leading-snug text-secondary transition-colors group-hover:text-primary lg:text-lg">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{excerpt}</p>
        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-gray-400">
          {authorData && <span>{authorData.name}</span>}
          <span>&middot;</span>
          <span>{timeAgo(date)}</span>
          <span>&middot;</span>
          <span>{readingTime} min</span>
        </div>
      </div>
    </Link>
  );
}
