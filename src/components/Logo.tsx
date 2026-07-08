import React from "react";

/**
 * Marca "quina do campo": bandeirinha de escanteio, arco de córner
 * e bola — giz (tinta) sobre lima. Literalmente a beira do campo.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" fill="var(--color-lima)" />
      {/* Linhas do campo — a quina */}
      <line
        x1="15"
        y1="33"
        x2="48"
        y2="33"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
      <line
        x1="15"
        y1="33"
        x2="15"
        y2="48"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
      {/* Arco do córner */}
      <path
        d="M23 33 A8 8 0 0 1 15 41"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
      {/* Bandeirinha */}
      <line
        x1="15"
        y1="33"
        x2="15"
        y2="10"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M15 10 L31 14.5 L15 19 Z" fill="var(--color-ink)" />
      {/* Bola */}
      <circle cx="33.5" cy="41.5" r="2.6" fill="var(--color-ink)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      <LogoMark className="h-11 w-11 shrink-0" />

      {/* Wordmark: display em dois tons */}
      <div className="flex items-baseline gap-2 leading-none">
        <span className="font-display text-2xl font-extrabold uppercase tracking-tight text-cal">
          Beira
        </span>
        <span className="font-display text-2xl font-extrabold uppercase tracking-tight text-lima">
          do Campo
        </span>
      </div>
    </div>
  );
}
