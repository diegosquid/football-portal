type TransferStatus = "confirmed" | "likely" | "negotiating" | "rumor" | "off";

interface TransferItem {
  player: string;
  from?: string;
  to?: string;
  status: TransferStatus;
  fee?: string;
  contract?: string;
  deadline?: string;
  detail?: string;
}

interface TransferTrackerProps {
  title?: string;
  updatedAt?: string;
  items: TransferItem[];
  note?: string;
}

const STATUS: Record<TransferStatus, { label: string; className: string; dot: string }> = {
  confirmed: { label: "Confirmado", className: "border-emerald-700/25 bg-emerald-50 text-emerald-900", dot: "bg-emerald-600" },
  likely: { label: "Provável", className: "border-lima/60 bg-lima/15 text-ink", dot: "bg-primary" },
  negotiating: { label: "Negociando", className: "border-amber-500/30 bg-amber-50 text-amber-950", dot: "bg-amber-500" },
  rumor: { label: "Rumor", className: "border-gray-300 bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  off: { label: "Negócio encerrado", className: "border-red-500/25 bg-red-50 text-red-900", dot: "bg-red-600" },
};

export function TransferTracker({
  title = "Radar de negociações",
  updatedAt,
  items,
  note,
}: TransferTrackerProps) {
  return (
    <section className="not-prose my-8 overflow-hidden border border-ink/15 bg-gray-50" aria-label={title}>
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Mercado da bola{updatedAt ? ` · Atualizado ${updatedAt}` : ""}
        </p>
        <h3 className="m-0 mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h3>
      </header>

      <div className="divide-y divide-ink/10">
        {items.map((item, index) => {
          const status = STATUS[item.status];
          return (
            <article key={`${item.player}-${index}`} className="bg-cal px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="m-0 font-display text-lg font-bold text-ink">{item.player}</h4>
                  {(item.from || item.to) && (
                    <p className="m-0 mt-1 font-mono text-xs text-gray-600">
                      {item.from || "Livre"} <span className="px-1 text-primary">→</span> {item.to || "A definir"}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${status.className}`}>
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {(item.fee || item.contract || item.deadline) && (
                <dl className="m-0 mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  {item.fee && <div><dt className="font-mono uppercase text-gray-500">Valor</dt><dd className="m-0 mt-0.5 font-bold text-ink">{item.fee}</dd></div>}
                  {item.contract && <div><dt className="font-mono uppercase text-gray-500">Contrato</dt><dd className="m-0 mt-0.5 font-bold text-ink">{item.contract}</dd></div>}
                  {item.deadline && <div><dt className="font-mono uppercase text-gray-500">Prazo</dt><dd className="m-0 mt-0.5 font-bold text-ink">{item.deadline}</dd></div>}
                </dl>
              )}
              {item.detail && <p className="m-0 mt-3 text-sm leading-relaxed text-gray-600">{item.detail}</p>}
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
