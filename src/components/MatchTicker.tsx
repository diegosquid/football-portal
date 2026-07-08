import Link from "next/link";
import { getAllMatches, getTodayBRT, type Match } from "@/lib/matches";

function dayLabel(date: string, today: string): string {
  if (date === today) return "HOJE";
  const d = new Date(`${date}T12:00:00-03:00`);
  return d
    .toLocaleDateString("pt-BR", {
      weekday: "short",
      timeZone: "America/Sao_Paulo",
    })
    .replace(".", "")
    .toUpperCase();
}

/**
 * Letreiro com os próximos jogos — rola contínuo sob a navegação.
 * Conteúdo duplicado para o loop do marquee (segunda cópia é decorativa).
 */
export function MatchTicker() {
  let matches: Match[];
  try {
    matches = getAllMatches().slice(0, 14);
  } catch {
    return null;
  }
  if (matches.length === 0) return null;

  const today = getTodayBRT();

  return (
    <div
      className="ticker overflow-hidden border-b border-ink/15 bg-lima text-ink"
      aria-label="Próximos jogos"
    >
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex items-center"
            aria-hidden={copy === 1}
          >
            {matches.map((m) => (
              <Link
                key={`${copy}-${m.slug}`}
                href={`/onde-assistir/${m.slug}`}
                tabIndex={copy === 1 ? -1 : undefined}
                className="group flex items-center whitespace-nowrap py-1.5 pl-5 text-xs"
              >
                <span className="font-mono font-bold">
                  {dayLabel(m.date, today)} {m.time}
                </span>
                <span className="ml-2 font-semibold group-hover:underline group-hover:decoration-2 group-hover:underline-offset-2">
                  {m.home} <span className="opacity-50">×</span> {m.away}
                </span>
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider opacity-60">
                  {m.competition}
                </span>
                <span className="ml-5 h-1.5 w-1.5 rotate-45 bg-ink/25" />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
