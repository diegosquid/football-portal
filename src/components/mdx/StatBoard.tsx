type StatBoardVariant = "default" | "comparison" | "money";
type StatTrend = "up" | "down" | "neutral";

interface StatItem {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
  trend?: StatTrend;
  bar?: number;
}

interface StatBoardProps {
  title: string;
  eyebrow?: string;
  variant?: StatBoardVariant;
  items: StatItem[];
  source?: string;
  note?: string;
}

const TREND_LABELS: Record<StatTrend, string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

export function StatBoard({
  title,
  eyebrow = "Os números",
  variant = "default",
  items,
  source,
  note,
}: StatBoardProps) {
  return (
    <section className="not-prose my-8 overflow-hidden border border-ink/15 bg-gray-50" aria-label={title}>
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}{variant === "money" ? " · Financeiro" : ""}
        </p>
        <h3 className="m-0 mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h3>
      </header>

      <div className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const boundedBar = typeof item.bar === "number" ? Math.max(0, Math.min(100, item.bar)) : null;
          return (
            <article
              key={`${item.label}-${index}`}
              className={`relative bg-cal p-4 sm:p-5 ${item.highlight ? "shadow-[inset_0_3px_0_#cdf463]" : ""}`}
            >
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                {item.label}
              </p>
              <p className="m-0 mt-2 font-display text-3xl font-black tracking-tight text-ink">
                {item.trend && <span className="mr-1 text-base text-primary">{TREND_LABELS[item.trend]}</span>}
                {item.value}
              </p>
              {item.detail && <p className="m-0 mt-1 text-xs leading-relaxed text-gray-600">{item.detail}</p>}
              {boundedBar !== null && (
                <div className="mt-3 h-1.5 overflow-hidden bg-ink/10" aria-label={`${boundedBar}%`}>
                  <div className="h-full bg-primary" style={{ width: `${boundedBar}%` }} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {(source || note) && (
        <footer className="border-t border-ink/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-6">
          {note}{note && source ? " · " : ""}{source ? `Fonte: ${source}` : ""}
        </footer>
      )}
    </section>
  );
}
