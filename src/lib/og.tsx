import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";

/** Tamanho padrão OG (também exportado inline em cada opengraph-image.tsx). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Paleta "grama & giz" — espelha os tokens de globals.css. */
export const OG_COLORS = {
  campo: "#0d2f1f",
  campoDeep: "#081f14",
  lima: "#cdf463",
  cal: "#f3efe3",
  ink: "#17251c",
  calFaded: "rgba(243, 239, 227, 0.65)",
  calLine: "rgba(243, 239, 227, 0.14)",
};

/**
 * Busca TTF no Google Fonts (sem User-Agent moderno o css2 devolve truetype,
 * que é o formato que o satori aceita). Retorna null em falha — a imagem sai
 * com a fonte default do next/og em vez de quebrar.
 */
async function fetchGoogleFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(/src:\s*url\((https:[^)]+)\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800;
  style: "normal";
}

let fontsPromise: Promise<OgFont[]> | null = null;

/** Bricolage Grotesque (display) + Spline Sans Mono — cacheado por instância. */
function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchGoogleFont("Bricolage Grotesque", 800),
      fetchGoogleFont("Spline Sans Mono", 600),
    ]).then(([display, mono]) => {
      const fonts: OgFont[] = [];
      if (display)
        fonts.push({ name: "display", data: display, weight: 800, style: "normal" });
      if (mono)
        fonts.push({ name: "mono", data: mono, weight: 600, style: "normal" });
      return fonts;
    });
  }
  return fontsPromise;
}

/** Constrói a ImageResponse com as fontes da casa. */
export async function ogResponse(element: ReactElement) {
  const fonts = await loadOgFonts();
  return new ImageResponse(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
}

/** "dom., 12/07" — dia curto pra chips. */
export function ogDayShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/** Chip com borda de giz. */
export function OgChip({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `2px solid rgba(243, 239, 227, 0.3)`,
        color: OG_COLORS.cal,
        padding: "10px 22px",
        fontFamily: "mono",
        fontSize: 26,
      }}
    >
      {children}
    </div>
  );
}

/** Badge lima (competição / kicker forte). */
export function OgBadge({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: OG_COLORS.lima,
        color: OG_COLORS.ink,
        padding: "10px 24px",
        fontFamily: "mono",
        fontSize: 26,
        letterSpacing: 3,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Moldura padrão: gradiente campo, marcas de giz (círculo central + linha),
 * header com a marca e footer com o domínio.
 */
export function OgShell({
  label,
  children,
}: {
  /** Texto do canto inferior direito, ex.: "JOGOS DE HOJE" */
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(155deg, ${OG_COLORS.campo} 0%, ${OG_COLORS.campoDeep} 100%)`,
        color: OG_COLORS.cal,
        padding: "52px 64px",
        position: "relative",
      }}
    >
      {/* Círculo central de giz sangrando na direita */}
      <div
        style={{
          position: "absolute",
          right: -160,
          top: 115,
          width: 460,
          height: 460,
          border: `3px solid ${OG_COLORS.calLine}`,
          borderRadius: 9999,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 66,
          top: 337,
          width: 12,
          height: 12,
          backgroundColor: OG_COLORS.calLine,
          borderRadius: 9999,
          display: "flex",
        }}
      />
      {/* Linha do meio-campo no rodapé do círculo */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 3,
          height: "100%",
          backgroundColor: OG_COLORS.calLine,
          display: "flex",
        }}
      />

      {/* Header — marca */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            backgroundColor: OG_COLORS.lima,
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "mono",
            fontSize: 28,
            letterSpacing: 8,
            color: OG_COLORS.cal,
          }}
        >
          BEIRA DO CAMPO
        </div>
      </div>

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "mono",
          fontSize: 22,
          color: OG_COLORS.calFaded,
        }}
      >
        <div style={{ display: "flex" }}>beiradocampo.com.br</div>
        <div style={{ display: "flex", letterSpacing: 4 }}>{label}</div>
      </div>
    </div>
  );
}
