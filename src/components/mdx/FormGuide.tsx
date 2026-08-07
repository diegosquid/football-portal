type FormResultType = "win" | "draw" | "loss";

interface FormResult {
  result: FormResultType;
  opponent?: string;
  score?: string;
  venue?: "home" | "away" | "neutral";
}

interface TeamForm {
  name: string;
  results: FormResult[];
  summary?: string;
}

interface FormGuideProps {
  title?: string;
  teams: TeamForm[];
  chronological?: "oldest-first" | "newest-first";
  note?: string;
}

const RESULT_STYLES: Record<FormResultType, { label: string; className: string }> = {
  win: { label: "V", className: "bg-emerald-700 text-white" },
  draw: { label: "E", className: "bg-gray-500 text-white" },
  loss: { label: "D", className: "bg-red-700 text-white" },
};

export function FormGuide({
  title = "Momento das equipes",
  teams,
  chronological = "oldest-first",
  note,
}: FormGuideProps) {
  return (
    <section className="not-prose my-8 border border-ink/15 bg-gray-50" aria-label={title}>
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Forma recente
        </p>
        <h3 className="m-0 mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h3>
      </header>

      <div className="grid gap-px bg-ink/10 lg:grid-cols-2">
        {teams.map((team) => (
          <article key={team.name} className="bg-cal p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="m-0 font-display text-base font-bold text-ink">{team.name}</h4>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {chronological === "oldest-first" ? "mais antigo → mais recente" : "mais recente → mais antigo"}
              </span>
            </div>
            <ol className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
              {team.results.map((match, index) => {
                const style = RESULT_STYLES[match.result];
                const detail = [match.score, match.opponent, match.venue === "home" ? "casa" : match.venue === "away" ? "fora" : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`${team.name}-${index}`} className="group relative">
                    <span
                      className={`flex h-9 w-9 items-center justify-center font-mono text-xs font-black ${style.className}`}
                      title={detail || style.label}
                      aria-label={`${style.label}${detail ? `: ${detail}` : ""}`}
                    >
                      {style.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            {team.summary && <p className="m-0 mt-3 text-sm leading-relaxed text-gray-600">{team.summary}</p>}
          </article>
        ))}
      </div>

      {note && (
        <footer className="border-t border-ink/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-6">
          {note}
        </footer>
      )}
    </section>
  );
}
