import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

// ── Paleta cinematográfica por rank ──
const rankThemes = {
  3: {accent: "#cd7f32", glow: "rgba(205,127,50,0.4)", label: "BRONZE", emoji: "🥉"},
  2: {accent: "#c0c0c0", glow: "rgba(192,192,192,0.35)", label: "PRATA", emoji: "🥈"},
  1: {accent: "#facc15", glow: "rgba(250,204,21,0.5)", label: "OURO", emoji: "🏆"},
};

const fallbackTheme = {accent: "#7dd3fc", glow: "rgba(125,211,252,0.3)", label: "", emoji: ""};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ── Grain overlay for cinematic feel ──
const FilmGrain = ({opacity = 0.06}) => {
  const frame = useCurrentFrame();
  // Pseudo-random grain via frame-based offset
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

// ── Progress bar no topo ──
const ProgressBar = ({items, activeIndex, frame}) => {
  return (
    <div style={{display: "flex", gap: 8, width: "100%"}}>
      {items.map((_, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: isPast
                ? "rgba(250,204,21,0.8)"
                : isActive
                  ? `linear-gradient(90deg, rgba(250,204,21,0.9) ${clamp(((frame % 150) / 150) * 100, 0, 100)}%, rgba(255,255,255,0.15) ${clamp(((frame % 150) / 150) * 100, 0, 100)}%)`
                  : "rgba(255,255,255,0.12)",
              transition: "background 0.3s",
            }}
          />
        );
      })}
    </div>
  );
};

// ── Intro screen com título grande ──
const IntroScreen = ({title, category, siteName, introEndFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleSpring = spring({frame: Math.max(0, frame - 6), fps, config: {damping: 140, stiffness: 80}});
  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = clamp(interpolate(frame, [6, 24], [0, 1]), 0, 1);

  const categoryOpacity = clamp(interpolate(frame, [0, 14], [0, 1]), 0, 1);
  const lineWidth = interpolate(frame, [14, 40], [0, 240], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const exitOpacity = interpolate(frame, [introEndFrame - 14, introEndFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame >= introEndFrame) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        background: "radial-gradient(ellipse at 50% 40%, rgba(250,204,21,0.06) 0%, transparent 60%)",
      }}
    >
      {/* Category badge */}
      <div
        style={{
          position: "absolute",
          top: 320,
          opacity: categoryOpacity,
          padding: "14px 32px",
          borderRadius: 999,
          background: "rgba(250,204,21,0.1)",
          border: "1px solid rgba(250,204,21,0.2)",
          color: "#facc15",
          fontSize: 24,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        🏆 Ranking
      </div>

      {/* Title */}
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontSize: 88,
          lineHeight: 0.94,
          fontWeight: 900,
          letterSpacing: -3.5,
          padding: "0 60px",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {title}
      </div>

      {/* Animated line */}
      <div
        style={{
          width: lineWidth,
          height: 4,
          borderRadius: 2,
          marginTop: 36,
          background: "linear-gradient(90deg, transparent, #facc15, transparent)",
        }}
      />

      {/* Site name */}
      <div
        style={{
          marginTop: 24,
          fontSize: 22,
          color: "rgba(248,250,252,0.5)",
          letterSpacing: 1.4,
          textTransform: "uppercase",
          opacity: categoryOpacity,
        }}
      >
        {siteName}
      </div>
    </AbsoluteFill>
  );
};

// ── Item card — fullscreen image hero + kinetic text ──
const RankingItem = ({item, index, totalItems, isVisible, relFrame, exitFrame}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  if (!isVisible) return null;

  const rank = item.rank || totalItems - index;
  const theme = rankThemes[rank] || fallbackTheme;
  const isTop1 = rank === 1;
  const itemDur = item.durationFrames || 150;

  // ── ENTRANCE: Smash cut zoom ──
  const entranceSpring = spring({frame: relFrame, fps, config: {damping: isTop1 ? 100 : 160, stiffness: isTop1 ? 80 : 120}});
  const imageScale = interpolate(relFrame, [0, itemDur], [1.15, 1.25], {extrapolateRight: "clamp"});
  const imageInitialScale = interpolate(entranceSpring, [0, 1], [1.4, 1]);
  const contentOpacity = clamp(interpolate(relFrame, [0, 10], [0, 1]), 0, 1);

  // ── Staggered text reveals ──
  const numberDelay = 4;
  const nameDelay = 14;
  const statDelay = 22;

  const numSpring = spring({frame: Math.max(0, relFrame - numberDelay), fps, config: {damping: 100, stiffness: isTop1 ? 60 : 100}});
  const numScale = interpolate(numSpring, [0, 1], [isTop1 ? 4 : 2.5, 1]);
  const numOpacity = clamp(interpolate(relFrame, [numberDelay, numberDelay + 10], [0, 1]), 0, 1);

  const nameSpring = spring({frame: Math.max(0, relFrame - nameDelay), fps, config: {damping: 180, stiffness: 120}});
  const nameY = interpolate(nameSpring, [0, 1], [50, 0]);
  const nameOpacity = clamp(interpolate(relFrame, [nameDelay, nameDelay + 12], [0, 1]), 0, 1);

  const statSpring = spring({frame: Math.max(0, relFrame - statDelay), fps, config: {damping: 200, stiffness: 100}});
  const statY = interpolate(statSpring, [0, 1], [30, 0]);
  const statOpacity = clamp(interpolate(relFrame, [statDelay, statDelay + 12], [0, 1]), 0, 1);

  // ── EXIT: fade + scale up ──
  const exitOpacity = interpolate(relFrame, [itemDur - 8, itemDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── #1 flash ──
  const flashOpacity = isTop1
    ? interpolate(relFrame, [0, 4, 16], [0.7, 0.5, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 0;

  // ── Parallax: image moves up slowly, text stays ──
  const imageParallaxY = interpolate(relFrame, [0, itemDur], [0, -40], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{opacity: contentOpacity * exitOpacity}}>
      {/* ── FULLSCREEN IMAGE (hero) ── */}
      <AbsoluteFill
        style={{
          transform: `scale(${imageScale * imageInitialScale}) translateY(${imageParallaxY}px)`,
          filter: `saturate(1.1) contrast(1.05)`,
        }}
      >
        {item.imageSrc && (
          <Img
            src={staticFile(item.imageSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        )}
      </AbsoluteFill>

      {/* ── Cinematic gradient overlay ── */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            rgba(2,6,23,0.3) 0%,
            rgba(2,6,23,0.1) 20%,
            rgba(2,6,23,0.15) 45%,
            rgba(2,6,23,0.75) 70%,
            rgba(2,6,23,0.97) 100%)`,
        }}
      />

      {/* ── Rank-colored vignette ── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 85%, ${theme.glow}, transparent 60%)`,
          opacity: 0.6,
        }}
      />

      {/* ── #1 golden flash ── */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.glow}, transparent 60%)`,
            opacity: flashOpacity,
          }}
        />
      )}

      {/* ── RANK NUMBER (massive, top-left) ── */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 64,
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          opacity: numOpacity,
          transform: `scale(${numScale})`,
          transformOrigin: "top left",
        }}
      >
        <span
          style={{
            fontSize: isTop1 ? 220 : 180,
            fontWeight: 900,
            color: theme.accent,
            lineHeight: 0.8,
            textShadow: `0 0 60px ${theme.glow}, 0 8px 30px rgba(0,0,0,0.5)`,
            letterSpacing: -8,
          }}
        >
          {rank}
        </span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "rgba(248,250,252,0.5)",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {rank === 1 ? "º lugar" : "º"}
        </span>
      </div>

      {/* ── CONTENT BLOCK (bottom, over dark gradient) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Name with slide-up reveal */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
          }}
        >
          <div
            style={{
              fontSize: isTop1 ? 78 : 68,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: -2.5,
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {item.name}
          </div>
        </div>

        {/* Subtitle */}
        {item.subtitle && (
          <div
            style={{
              opacity: nameOpacity,
              transform: `translateY(${nameY}px)`,
              fontSize: 30,
              color: "rgba(248,250,252,0.65)",
              lineHeight: 1.2,
            }}
          >
            {item.subtitle}
          </div>
        )}

        {/* Stat with accent color + animated bar */}
        <div
          style={{
            opacity: statOpacity,
            transform: `translateY(${statY}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 6,
                height: 44,
                borderRadius: 3,
                background: theme.accent,
                boxShadow: `0 0 16px ${theme.glow}`,
              }}
            />
            <span
              style={{
                fontSize: isTop1 ? 52 : 44,
                fontWeight: 900,
                color: theme.accent,
                letterSpacing: -1,
                textShadow: isTop1 ? `0 0 30px ${theme.glow}` : "none",
              }}
            >
              {item.stat}
            </span>
          </div>

          {/* Animated accent bar */}
          <div style={{width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden"}}>
            <div
              style={{
                width: `${clamp(interpolate(relFrame, [statDelay, statDelay + 30], [0, 100]), 0, 100)}%`,
                height: "100%",
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}66)`,
                boxShadow: `0 0 12px ${theme.glow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Progress dots (minimal, bottom-right) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          right: 64,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {Array.from({length: totalItems}).map((_, i) => {
          const isCurrent = i === index;
          return (
            <div
              key={i}
              style={{
                width: isCurrent ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: isCurrent ? theme.accent : "rgba(255,255,255,0.25)",
                boxShadow: isCurrent ? `0 0 10px ${theme.glow}` : "none",
                transition: "width 0.3s, background 0.3s",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Main composition ──
export const CountdownShort = ({
  title,
  category,
  siteName,
  siteUrl,
  followHandle,
  followCallToAction,
  audioSrc,
  items = [],
  introEndFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const introFrames = introEndFrame || Math.round(fps * 2.5);

  // Sort items by rank descending (3→2→1) for countdown order
  const sortedItems = [...items].sort((a, b) => (b.rank || 0) - (a.rank || 0));

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: "#f8fafc",
        overflow: "hidden",
        background: "#020617",
      }}
    >
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* ── INTRO ── */}
      <IntroScreen
        title={title}
        category={category}
        siteName={siteName}
        introEndFrame={introFrames}
      />

      {/* ── RANKING ITEMS ── */}
      {sortedItems.map((item, index) => {
        const itemStart = item.startFrame != null ? item.startFrame : introFrames + index * 150;
        const itemDur = item.durationFrames || 150;
        const itemEnd = itemStart + itemDur;
        const relFrame = frame - itemStart;
        const isVisible = frame >= itemStart && frame < itemEnd;

        return (
          <RankingItem
            key={index}
            item={item}
            index={index}
            totalItems={sortedItems.length}
            isVisible={isVisible}
            relFrame={relFrame}
            exitFrame={itemEnd}
          />
        );
      })}

      {/* ── Progress bar (topo, sempre visível após intro) ── */}
      {frame >= introFrames && frame < durationInFrames - 72 && (
        <div style={{position: "absolute", top: 72, left: 64, right: 64}}>
          <ProgressBar
            items={sortedItems}
            activeIndex={sortedItems.findIndex((item) => {
              const start = item.startFrame ?? 0;
              const dur = item.durationFrames ?? 150;
              return frame >= start && frame < start + dur;
            })}
            frame={frame}
          />
        </div>
      )}

      {/* ── Film grain for premium feel ── */}
      <FilmGrain opacity={0.04} />

      {/* ── Vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      />

      <FollowEndCard
        callToAction={followCallToAction || "Para mais curiosidades de futebol, siga o canal"}
        followHandle={followHandle || "@beiradocampotv"}
      />
    </AbsoluteFill>
  );
};
