import type { ReactNode } from "react";

interface ExplainerFrameProps {
  label?: string;
  eyebrow: string;
  title: string;
  caption: string;
  description: string;
  children: ReactNode;
}

export function ExplainerFrame({
  label = "Prancheta",
  eyebrow,
  title,
  caption,
  description,
  children,
}: ExplainerFrameProps) {
  return (
    <figure
      className="not-prose my-10 overflow-hidden border border-ink/15 bg-gray-50 shadow-[0_18px_45px_rgba(13,47,31,0.08)]"
      role="group"
      aria-label={description}
    >
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {label} · {eyebrow}
        </span>
        <h3 className="m-0 mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </h3>
      </header>

      <div className="p-3 sm:p-5">{children}</div>

      <figcaption className="border-l-2 border-lima px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-5">
        {caption}
      </figcaption>
    </figure>
  );
}
