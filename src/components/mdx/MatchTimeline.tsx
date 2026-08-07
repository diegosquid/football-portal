type MatchEventType = "goal" | "card" | "substitution" | "var" | "chance" | "note";

interface MatchEvent {
  minute: string;
  type: MatchEventType;
  description: string;
  team?: string;
  score?: string;
}

interface MatchTimelineProps {
  title?: string;
  home?: string;
  away?: string;
  finalScore?: string;
  events: MatchEvent[];
  note?: string;
}

const EVENT: Record<MatchEventType, { label: string; className: string }> = {
  goal: { label: "GOL", className: "border-lima bg-lima text-ink" },
  card: { label: "CA", className: "border-amber-400 bg-amber-400 text-ink" },
  substitution: { label: "SUB", className: "border-blue-300 bg-blue-50 text-blue-900" },
  var: { label: "VAR", className: "border-primary bg-primary text-cal" },
  chance: { label: "LANCE", className: "border-ink/20 bg-cal text-ink" },
  note: { label: "JOGO", className: "border-gray-300 bg-gray-100 text-gray-700" },
};

export function MatchTimeline({
  title = "Linha do tempo",
  home,
  away,
  finalScore,
  events,
  note,
}: MatchTimelineProps) {
  return (
    <section className="not-prose my-8 overflow-hidden border border-ink/15 bg-gray-50" aria-label={title}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-6">
        <div>
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Lances decisivos
          </p>
          <h3 className="m-0 mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h3>
        </div>
        {(home || away || finalScore) && (
          <p className="m-0 font-display text-base font-bold text-ink">
            {[home, finalScore, away].filter(Boolean).join(" ")}
          </p>
        )}
      </header>

      <ol className="m-0 list-none divide-y divide-ink/10 p-0">
        {events.map((event, index) => {
          const eventStyle = EVENT[event.type];
          return (
            <li key={`${event.minute}-${index}`} className="grid grid-cols-[52px_46px_1fr] items-start gap-3 bg-cal px-4 py-4 sm:grid-cols-[64px_52px_1fr] sm:px-6">
              <span className="font-mono text-sm font-black text-primary">{event.minute}</span>
              <span className={`border px-1 py-1 text-center font-mono text-[9px] font-black tracking-[0.08em] ${eventStyle.className}`}>
                {eventStyle.label}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="m-0 text-sm font-bold leading-snug text-ink">{event.description}</p>
                  {event.score && <span className="font-mono text-xs font-bold text-primary">{event.score}</span>}
                </div>
                {event.team && <p className="m-0 mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">{event.team}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {note && (
        <footer className="border-t border-ink/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-6">
          {note}
        </footer>
      )}
    </section>
  );
}
