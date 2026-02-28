"use client";

import { useId } from "react";
import { formations } from "./formations";
import type { TacticalFormationProps, Player } from "./types";

/* ── Utilitários de cor ─────────────────────────────────────────────────────── */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

function lighten(hex: string, pct: number): string {
  const [r, g, b] = parseHex(hex);
  const f = pct / 100;
  return toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}

function darken(hex: string, pct: number): string {
  const [r, g, b] = parseHex(hex);
  const f = 1 - pct / 100;
  return toHex(r * f, g * f, b * f);
}

function truncateName(name: string, max = 14): string {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

/* ── Constantes do SVG (campo horizontal, ratio ~105:68) ────────────────────── */

const W = 640; // largura do viewBox
const H = 420; // altura do viewBox
const M = 22; // margem interna
const PW = W - 2 * M; // largura da área de jogo (596)
const PH = H - 2 * M; // altura da área de jogo (376)

/* ── Sub-componente: Campo SVG (horizontal) ─────────────────────────────────── */

function Field({ uid }: { uid: string }) {
  const cx = W / 2;
  const cy = H / 2;

  // Áreas de pênalti (proporcional ao campo real: ~16.5m de 105m ≈ 15.7%)
  const penW = Math.round(PW * 0.157); // ~94px
  const penH = Math.round(PH * 0.588); // ~221px (40.32m de 68m)
  const penTop = cy - penH / 2;

  // Pequena área (5.5m de 105m ≈ 5.2%, 18.32m de 68m ≈ 27%)
  const goalW = Math.round(PW * 0.052); // ~31px
  const goalH = Math.round(PH * 0.27); // ~101px
  const goalTop = cy - goalH / 2;

  // Pontos de pênalti (11m de 105m ≈ 10.5%)
  const penSpotX = Math.round(PW * 0.105);

  return (
    <>
      <defs>
        {/* Gradiente da grama (horizontal) */}
        <linearGradient id={`grass-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#186128" />
          <stop offset="50%" stopColor="#1e7a35" />
          <stop offset="100%" stopColor="#186128" />
        </linearGradient>

        {/* Listras de grama (verticais) */}
        <pattern
          id={`stripes-${uid}`}
          x="0"
          y="0"
          width="80"
          height={H}
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="40" height={H} fill="rgba(255,255,255,0.03)" />
          <rect x="40" y="0" width="40" height={H} fill="rgba(0,0,0,0.03)" />
        </pattern>

        {/* Vinheta nas bordas */}
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </radialGradient>
      </defs>

      {/* Base */}
      <rect width={W} height={H} fill={`url(#grass-${uid})`} rx="12" />
      {/* Listras */}
      <rect width={W} height={H} fill={`url(#stripes-${uid})`} rx="12" />
      {/* Vinheta */}
      <rect width={W} height={H} fill={`url(#vignette-${uid})`} rx="12" />

      {/* Marcações do campo */}
      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" fill="none">
        {/* Contorno */}
        <rect x={M} y={M} width={PW} height={PH} rx="2" />

        {/* Linha central (vertical) */}
        <line x1={cx} y1={M} x2={cx} y2={H - M} />
        {/* Círculo central */}
        <circle cx={cx} cy={cy} r="55" />
        {/* Ponto central */}
        <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.3)" />

        {/* Área de pênalti esquerda */}
        <rect x={M} y={penTop} width={penW} height={penH} />
        {/* Pequena área esquerda */}
        <rect x={M} y={goalTop} width={goalW} height={goalH} />
        {/* Ponto de pênalti esquerdo */}
        <circle cx={M + penSpotX} cy={cy} r="2" fill="rgba(255,255,255,0.3)" />
        {/* Arco de pênalti esquerdo */}
        <path
          d={`M ${M + penW} ${cy - 55} A 55 55 0 0 1 ${M + penW} ${cy + 55}`}
        />

        {/* Área de pênalti direita */}
        <rect x={W - M - penW} y={penTop} width={penW} height={penH} />
        {/* Pequena área direita */}
        <rect x={W - M - goalW} y={goalTop} width={goalW} height={goalH} />
        {/* Ponto de pênalti direito */}
        <circle
          cx={W - M - penSpotX}
          cy={cy}
          r="2"
          fill="rgba(255,255,255,0.3)"
        />
        {/* Arco de pênalti direito */}
        <path
          d={`M ${W - M - penW} ${cy - 55} A 55 55 0 0 0 ${W - M - penW} ${cy + 55}`}
        />

        {/* Cantos */}
        <path d={`M ${M} ${M + 8} A 8 8 0 0 0 ${M + 8} ${M}`} />
        <path d={`M ${W - M - 8} ${M} A 8 8 0 0 0 ${W - M} ${M + 8}`} />
        <path d={`M ${M} ${H - M - 8} A 8 8 0 0 1 ${M + 8} ${H - M}`} />
        <path d={`M ${W - M - 8} ${H - M} A 8 8 0 0 1 ${W - M} ${H - M - 8}`} />
      </g>
    </>
  );
}

/* ── Sub-componente: Marcador de jogador ────────────────────────────────────── */

function PlayerMarker({
  x,
  y,
  player,
  label,
  color,
  accent,
  showPosition,
  uid,
  idx,
}: {
  x: number;
  y: number;
  player: Player | null;
  label: string;
  color: string;
  accent: string;
  showPosition: boolean;
  uid: string;
  idx: number;
}) {
  const r = 16;
  const gradId = `pg-${uid}-${idx}`;
  const glowId = `glow-${uid}-${idx}`;
  const hasPlayer = player !== null;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={lighten(color, 15)} />
          <stop offset="100%" stopColor={darken(color, 15)} />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow */}
      <circle
        cx={x}
        cy={y}
        r={r + 6}
        fill={color}
        opacity="0.25"
        filter={`url(#${glowId})`}
      />

      {/* Círculo principal */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={`url(#${gradId})`}
        stroke={darken(color, 30)}
        strokeWidth="1.2"
      />

      {/* Highlight 3D */}
      <ellipse
        cx={x - 3}
        cy={y - 4}
        rx={r * 0.5}
        ry={r * 0.35}
        fill="white"
        opacity="0.18"
      />

      {/* Número */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill="white"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      >
        {hasPlayer ? player.number : ""}
      </text>

      {/* Nome */}
      {hasPlayer && (
        <text
          x={x}
          y={y + r + 13}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9.5"
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
          fill="white"
          opacity="0.92"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
        >
          {truncateName(player.name)}
        </text>
      )}

      {/* Posição */}
      {showPosition && (
        <text
          x={x}
          y={y + r + (hasPlayer ? 24 : 13)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7.5"
          fontWeight="500"
          fontFamily="Inter, system-ui, sans-serif"
          fill={accent}
          opacity="0.7"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ── Componente principal ───────────────────────────────────────────────────── */

export function TacticalFormation({
  formation,
  players = [],
  team,
  color = "#e94560",
  accentColor,
  title,
  showPositions = true,
}: TacticalFormationProps) {
  const uid = useId().replace(/:/g, "");
  const positions = formations[formation];

  if (!positions) return null;

  const accent = accentColor || lighten(color, 40);

  // Mapear coordenadas: formation.y → SVG X (esquerda=gol próprio, direita=ataque)
  //                      formation.x → SVG Y (topo→baixo = esquerda→direita do campo)
  const mapped = positions.map((pos, i) => ({
    svgX: M + (pos.y / 100) * PW,
    svgY: M + (pos.x / 100) * PH,
    label: pos.label,
    player: players[i] || null,
  }));

  return (
    <figure
      className="not-prose my-8 mx-auto w-full max-w-2xl"
      role="img"
      aria-label={`Formação tática ${formation}${team ? ` — ${team}` : ""}`}
    >
      {/* Header */}
      {(team || title) && (
        <div className="mb-3 text-center">
          {team && (
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {team}
            </span>
          )}
          {title && (
            <span className="block mt-0.5 text-sm font-bold text-secondary">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Campo */}
      <div className="relative">
        {/* Badge da formação */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-md"
            style={{ backgroundColor: `${color}dd` }}
          >
            {formation}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto rounded-xl shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Field uid={uid} />

          {mapped.map((pos, idx) => (
            <PlayerMarker
              key={idx}
              x={pos.svgX}
              y={pos.svgY}
              player={pos.player}
              label={pos.label}
              color={color}
              accent={accent}
              showPosition={showPositions}
              uid={uid}
              idx={idx}
            />
          ))}
        </svg>
      </div>

      {/* Legenda */}
      <figcaption className="mt-2 text-center text-xs text-gray-400">
        Formação {formation}
        {team && ` — ${team}`}
      </figcaption>
    </figure>
  );
}
