import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

// ── Paleta ──
const palette = {
  bg: "#020617",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.72)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  card: "rgba(8, 22, 33, 0.82)",
  border: "rgba(255,255,255,0.1)",
};

// ── Categorias → cor + label ──
const categoryMap = {
  noticias: {color: "#7dd3fc", label: "NOTÍCIAS"},
  opiniao: {color: "#f87171", label: "OPINIÃO"},
  analises: {color: "#a78bfa", label: "ANÁLISE"},
  "pre-jogo": {color: "#34d399", label: "PRÉ-JOGO"},
  "pos-jogo": {color: "#fb923c", label: "PÓS-JOGO"},
  curiosidades: {color: "#facc15", label: "CURIOSIDADES"},
  transferencias: {color: "#38bdf8", label: "MERCADO"},
  "radar-transferencias": {color: "#38bdf8", label: "RADAR"},
  default: {color: "#94a3b8", label: "FUTEBOL"},
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ══════════════════════════════════════════════════════════
// Film Grain — textura cinematográfica
// ══════════════════════════════════════════════════════════
const FilmGrain = ({opacity = 0.05}) => {
  const frame = useCurrentFrame();
  const seed = (frame * 7 + 13) % 100;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${seed}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ══════════════════════════════════════════════════════════
// Story Progress Bars — estilo Instagram Stories
// ══════════════════════════════════════════════════════════
const StoryProgressBars = ({items, globalFrame}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 48,
        right: 48,
        display: "flex",
        gap: 8,
        zIndex: 100,
      }}
    >
      {items.map((item, i) => {
        const itemStart = item.startFrame;
        const itemEnd = itemStart + item.durationFrames;
        const isPast = globalFrame >= itemEnd;
        const isActive = globalFrame >= itemStart && globalFrame < itemEnd;
        const progress = isActive
          ? clamp((globalFrame - itemStart) / item.durationFrames, 0, 1)
          : isPast
            ? 1
            : 0;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              background: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                borderRadius: 3,
                background: isPast
                  ? "rgba(250,204,21,0.85)"
                  : `linear-gradient(90deg, ${palette.accent}, ${palette.secondary})`,
                boxShadow: isActive ? `0 0 12px ${palette.accent}` : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// Animated Waveform — rodapé durante reprodução
// ══════════════════════════════════════════════════════════
const Waveform = ({frame, color = palette.accent, bars = 20, height = 36}) => (
  <div style={{display: "flex", gap: 5, alignItems: "flex-end", height}}>
    {new Array(bars).fill(true).map((_, i) => {
      const h = 6 + Math.abs(Math.sin(frame / 3 + i * 0.7)) * (height - 6);
      const isAccent = i % 3 === 0;
      return (
        <div
          key={i}
          style={{
            width: 5,
            height: h,
            borderRadius: 999,
            background: isAccent ? color : palette.secondary,
            opacity: isAccent ? 1 : 0.5,
            boxShadow: isAccent ? `0 0 12px ${color}` : "none",
          }}
        />
      );
    })}
  </div>
);

// ══════════════════════════════════════════════════════════
// Intro Screen — "RESUMO DO DIA" + data
// ══════════════════════════════════════════════════════════
const RecapIntro = ({date, siteName, itemCount, introEndFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Badge "RESUMO DO DIA"
  const badgeSpring = spring({frame: Math.max(0, frame - 4), fps, config: {damping: 120, stiffness: 90}});
  const badgeY = interpolate(badgeSpring, [0, 1], [40, 0]);
  const badgeOpacity = clamp(interpolate(frame, [4, 18], [0, 1]), 0, 1);

  // Título data
  const dateSpring = spring({frame: Math.max(0, frame - 14), fps, config: {damping: 160, stiffness: 80}});
  const dateY = interpolate(dateSpring, [0, 1], [60, 0]);
  const dateOpacity = clamp(interpolate(frame, [14, 28], [0, 1]), 0, 1);

  // Linha animada
  const lineWidth = interpolate(frame, [20, 50], [0, 320], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // Contagem de matérias
  const countSpring = spring({frame: Math.max(0, frame - 30), fps, config: {damping: 100, stiffness: 70}});
  const countScale = interpolate(countSpring, [0, 1], [2.5, 1]);
  const countOpacity = clamp(interpolate(frame, [30, 44], [0, 1]), 0, 1);

  // Saída
  const exitOpacity = interpolate(frame, [introEndFrame - 12, introEndFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame >= introEndFrame) return null;

  // Glow pulsante
  const glowPulse = 0.04 + Math.sin(frame / 10) * 0.02;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        background: `radial-gradient(ellipse at 50% 45%, rgba(250,204,21,${glowPulse}) 0%, transparent 55%)`,
      }}
    >
      {/* Badge */}
      <div
        style={{
          position: "absolute",
          top: 380,
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          padding: "16px 40px",
          borderRadius: 999,
          background: "rgba(250,204,21,0.08)",
          border: "1px solid rgba(250,204,21,0.2)",
          color: palette.accent,
          fontSize: 26,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        📰 Resumo do Dia
      </div>

      {/* Data grande */}
      <div
        style={{
          opacity: dateOpacity,
          transform: `translateY(${dateY}px)`,
          fontSize: 82,
          fontWeight: 900,
          letterSpacing: -3,
          lineHeight: 1,
          textAlign: "center",
          maxWidth: 900,
          padding: "0 60px",
        }}
      >
        {date}
      </div>

      {/* Linha animada */}
      <div
        style={{
          width: lineWidth,
          height: 4,
          borderRadius: 2,
          marginTop: 32,
          background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
        }}
      />

      {/* Contador de matérias */}
      <div
        style={{
          marginTop: 28,
          opacity: countOpacity,
          transform: `scale(${countScale})`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{fontSize: 56, fontWeight: 900, color: palette.accent}}>
          {itemCount}
        </span>
        <span style={{fontSize: 28, color: palette.softText, letterSpacing: 1}}>
          matérias hoje
        </span>
      </div>

      {/* Site name */}
      <div
        style={{
          position: "absolute",
          bottom: 340,
          fontSize: 22,
          color: "rgba(248,250,252,0.4)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {siteName}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// Recap Item — Card individual de matéria (fullscreen hero)
// ══════════════════════════════════════════════════════════
const RecapItem = ({item, index, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const relFrame = Math.max(0, frame - item.startFrame);
  const isVisible = frame >= item.startFrame && frame < item.startFrame + item.durationFrames;
  if (!isVisible) return null;

  const dur = item.durationFrames;
  const cat = categoryMap[item.category] || categoryMap.default;

  // ── ENTRANCE ──
  const entranceSpring = spring({frame: relFrame, fps, config: {damping: 140, stiffness: 100}});
  const imageScale = interpolate(relFrame, [0, dur], [1.08, 1.18], {extrapolateRight: "clamp"});
  const imageInitialScale = interpolate(entranceSpring, [0, 1], [1.3, 1]);
  const contentOpacity = clamp(interpolate(relFrame, [0, 12], [0, 1]), 0, 1);

  // ── Parallax ──
  const imageParallaxY = interpolate(relFrame, [0, dur], [0, -35], {extrapolateRight: "clamp"});

  // ── Número da matéria: scale pop ──
  const numDelay = 6;
  const numSpring = spring({frame: Math.max(0, relFrame - numDelay), fps, config: {damping: 100, stiffness: 70}});
  const numScale = interpolate(numSpring, [0, 1], [3, 1]);
  const numOpacity = clamp(interpolate(relFrame, [numDelay, numDelay + 10], [0, 1]), 0, 1);

  // ── Badge de categoria: slide-in da esquerda ──
  const badgeDelay = 10;
  const badgeSpring = spring({frame: Math.max(0, relFrame - badgeDelay), fps, config: {damping: 180, stiffness: 120}});
  const badgeX = interpolate(badgeSpring, [0, 1], [-80, 0]);
  const badgeOpacity = clamp(interpolate(relFrame, [badgeDelay, badgeDelay + 10], [0, 1]), 0, 1);

  // ── Título: staggered word reveal ──
  const titleDelay = 16;
  const titleSpring = spring({frame: Math.max(0, relFrame - titleDelay), fps, config: {damping: 160, stiffness: 90}});
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = clamp(interpolate(relFrame, [titleDelay, titleDelay + 14], [0, 1]), 0, 1);

  // ── EXIT: fade + zoom ──
  const exitStart = dur - 10;
  const exitOpacity = interpolate(relFrame, [exitStart, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(relFrame, [exitStart, dur], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Glow pulsante na base ──
  const glowIntensity = 0.35 + Math.sin(relFrame / 8) * 0.1;

  return (
    <AbsoluteFill style={{opacity: contentOpacity * exitOpacity, transform: `scale(${exitScale})`}}>
      {/* ── FULLSCREEN IMAGE ── */}
      <AbsoluteFill
        style={{
          transform: `scale(${imageScale * imageInitialScale}) translateY(${imageParallaxY}px)`,
          filter: "saturate(1.1) contrast(1.05)",
        }}
      >
        {item.imageSrc && (
          <Img
            src={staticFile(item.imageSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        )}
      </AbsoluteFill>

      {/* ── Gradient overlay cinematográfico ── */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            rgba(2,6,23,0.4) 0%,
            rgba(2,6,23,0.05) 25%,
            rgba(2,6,23,0.1) 45%,
            rgba(2,6,23,0.7) 65%,
            rgba(2,6,23,0.97) 100%)`,
        }}
      />

      {/* ── Glow pulsante na base ── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 95%, ${cat.color}40, transparent 50%)`,
          opacity: glowIntensity,
        }}
      />

      {/* ── Accent line lateral esquerda ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "15%",
          bottom: "15%",
          width: 5,
          borderRadius: "0 3px 3px 0",
          background: `linear-gradient(180deg, transparent, ${cat.color}, transparent)`,
          opacity: 0.6 + Math.sin(relFrame / 6) * 0.15,
        }}
      />

      {/* ── Número da matéria (top-right) ── */}
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 52,
          opacity: numOpacity,
          transform: `scale(${numScale})`,
          transformOrigin: "top right",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: palette.accent,
            textShadow: `0 0 30px rgba(250,204,21,0.4)`,
          }}
        >
          {index + 1}
        </span>
        <span style={{fontSize: 28, fontWeight: 600, color: palette.softText}}>
          /{total}
        </span>
      </div>

      {/* ── Badge de categoria ── */}
      <div
        style={{
          position: "absolute",
          bottom: 530,
          left: 52,
          opacity: badgeOpacity,
          transform: `translateX(${badgeX}px)`,
          padding: "10px 24px",
          borderRadius: 999,
          background: `${cat.color}18`,
          border: `1px solid ${cat.color}35`,
          color: cat.color,
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        {cat.label}
      </div>

      {/* ── Título da matéria ── */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: 52,
          right: 52,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: -2,
            textShadow: "0 4px 30px rgba(0,0,0,0.6)",
          }}
        >
          {item.title}
        </div>
      </div>

      {/* ── Waveform no rodapé ── */}
      <div
        style={{
          position: "absolute",
          bottom: 210,
          left: 52,
          opacity: 0.7,
        }}
      >
        <Waveform frame={relFrame} color={cat.color} bars={16} height={28} />
      </div>

      {/* ── Site URL ── */}
      <div
        style={{
          position: "absolute",
          bottom: 170,
          left: 52,
          fontSize: 20,
          color: palette.softText,
          letterSpacing: 1,
        }}
      >
        beiradocampo.com.br
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// DailyRecapShort — Composição principal
// ══════════════════════════════════════════════════════════
export const DailyRecapShort = ({
  title = "Resumo do Dia",
  date = "19 de março de 2026",
  siteName = "Beira do Campo",
  siteUrl = "beiradocampo.com.br",
  followHandle = "@beiradocampotv",
  audioSrc,
  items = [],
  callToAction = "Para mais notícias de futebol, siga o canal",
  followCallToAction = "Siga o canal",
  durationInFrames: totalDuration = 900,
  fps = 30,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const introEndFrame = 90; // 3s

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        color: palette.text,
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      {/* ── Audio sync ── */}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* ── Background base escuro ── */}
      <AbsoluteFill style={{background: palette.bg}} />

      {/* ── Ambient accent lights (sutis) ── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(125,211,252,0.04), transparent 35%), " +
            "radial-gradient(circle at 80% 85%, rgba(250,204,21,0.03), transparent 35%)",
          opacity: 0.8,
        }}
      />

      {/* ── INTRO ── */}
      <RecapIntro
        date={date}
        siteName={siteName}
        itemCount={items.length}
        introEndFrame={introEndFrame}
      />

      {/* ── ITEMS (matérias) ── */}
      {items.map((item, i) => (
        <RecapItem key={i} item={item} index={i} total={items.length} />
      ))}

      {/* ── Story Progress Bars ── */}
      {frame >= introEndFrame && items.length > 0 && (
        <StoryProgressBars items={items} globalFrame={frame} />
      )}

      {/* ── Film Grain ── */}
      <FilmGrain opacity={0.05} />

      {/* ── Follow End Card ── */}
      <FollowEndCard
        callToAction={callToAction}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
