interface MatchSnapshotProps {
  title?: string;
  home?: string;
  away?: string;
  competition: string;
  stage?: string;
  date?: string;
  kickoff?: string;
  venue?: string;
  broadcast?: string | string[];
  aggregate?: string;
  status?: string;
  note?: string;
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="border-t border-ink/10 px-4 py-3 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd className="m-0 mt-1 font-display text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}

export function MatchSnapshot({
  title,
  home,
  away,
  competition,
  stage,
  date,
  kickoff,
  venue,
  broadcast,
  aggregate,
  status,
  note,
}: MatchSnapshotProps) {
  const matchTitle = title || (home && away ? `${home} x ${away}` : competition);
  const channels = Array.isArray(broadcast) ? broadcast.join(" · ") : broadcast;

  return (
    <section
      className="not-prose my-8 overflow-hidden border border-ink/15 bg-gray-50 shadow-[0_14px_34px_rgba(13,47,31,0.07)]"
      aria-label={`Ficha do jogo ${matchTitle}`}
    >
      <header className="bg-ink px-4 py-4 text-cal sm:px-6">
        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-lima">
          Ficha do jogo · {competition}{stage ? ` · ${stage}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h3 className="m-0 font-display text-2xl font-bold tracking-tight text-cal">{matchTitle}</h3>
          {status && (
            <span className="border border-cal/25 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cal">
              {status}
            </span>
          )}
        </div>
      </header>

      <dl className="m-0 grid sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Data" value={date} />
        <InfoItem label="Horário" value={kickoff} />
        <InfoItem label="Local" value={venue} />
        <InfoItem label="Onde assistir" value={channels} />
      </dl>

      {(aggregate || note) && (
        <footer className="border-t border-ink/10 bg-cal px-4 py-3 sm:px-6">
          {aggregate && (
            <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary">
              Agregado · {aggregate}
            </p>
          )}
          {note && <p className="m-0 mt-1 text-sm leading-relaxed text-gray-600">{note}</p>}
        </footer>
      )}
    </section>
  );
}
