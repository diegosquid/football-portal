import Link from "next/link";

export interface SeoHubLink {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  value?: string;
}

export function SeoHubLinks({
  title,
  description,
  links,
}: {
  title: string;
  description?: string;
  links: SeoHubLink[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="mb-12" aria-label={title}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-h-36 flex-col justify-between border border-ink/15 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                {item.eyebrow}
              </span>
              <span className="mt-2 block font-display text-xl font-extrabold leading-tight tracking-tight text-ink transition-colors group-hover:text-primary">
                {item.title}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-gray-600">
                {item.description}
              </span>
            </span>
            <span className="mt-4 flex items-center justify-between gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              {item.value ? <span>{item.value}</span> : <span>Ver página</span>}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
