type ScenarioTone = "positive" | "neutral" | "warning" | "danger";

interface ScenarioItem {
  label: string;
  outcome: string;
  detail?: string;
  tone?: ScenarioTone;
}

interface ScenarioBoardProps {
  title?: string;
  context?: string;
  items: ScenarioItem[];
  note?: string;
}

const TONE_STYLES: Record<ScenarioTone, string> = {
  positive: "border-lima bg-lima/10",
  neutral: "border-ink/20 bg-cal",
  warning: "border-amber-500 bg-amber-50",
  danger: "border-red-500 bg-red-50",
};

export function ScenarioBoard({
  title = "A conta da classificação",
  context,
  items,
  note,
}: ScenarioBoardProps) {
  return (
    <section className="not-prose my-8 border border-ink/15 bg-gray-50" aria-label={title}>
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Cenários
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="m-0 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h3>
          {context && <span className="font-mono text-xs text-gray-500">{context}</span>}
        </div>
      </header>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5">
        {items.map((item, index) => {
          const tone = item.tone || "neutral";
          return (
            <article key={`${item.label}-${index}`} className={`border-l-4 p-4 ${TONE_STYLES[tone]}`}>
              <h4 className="m-0 font-display text-base font-bold text-ink">{item.label}</h4>
              <p className="m-0 mt-2 text-sm font-bold leading-snug text-ink">{item.outcome}</p>
              {item.detail && <p className="m-0 mt-1 text-xs leading-relaxed text-gray-600">{item.detail}</p>}
            </article>
          );
        })}
      </div>

      {note && (
        <footer className="border-t border-ink/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-6">
          {note}
        </footer>
      )}
    </section>
  );
}
