import React from "react";
import {
  AbsoluteFill,
  Audio,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

// ── Paleta cinematográfica por rank ──
const rankThemes = {
  5: {accent: "#7dd3fc", glow: "rgba(125,211,252,0.3)"},
  4: {accent: "#a78bfa", glow: "rgba(167,139,250,0.3)"},
  3: {accent: "#cd7f32", glow: "rgba(205,127,50,0.4)"},
  2: {accent: "#c0c0c0", glow: "rgba(192,192,192,0.35)"},
  1: {accent: "#facc15", glow: "rgba(250,204,21,0.5)"},
};
const fallbackTheme = {accent: "#7dd3fc", glow: "rgba(125,211,252,0.3)"};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ── Film grain ──
const FilmGrain = ({opacity = 0.06}) => {
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

// ── Progress bar ──
const ProgressBar = ({items, activeIndex, frame}) => (
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
          }}
        />
      );
    })}
  </div>
);

// ── Intro screen ──
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
        🎬 Compilação
      </div>

      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontSize: 84,
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

      <div
        style={{
          width: lineWidth,
          height: 4,
          borderRadius: 2,
          marginTop: 36,
          background: "linear-gradient(90deg, transparent, #facc15, transparent)",
        }}
      />

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

// ── Clip item — fullscreen video + kinetic text overlay ──
const ClipItem = ({clip, index, totalItems, isVisible, relFrame}) => {
  const {fps} = useVideoConfig();

  if (!isVisible) return null;

  const rank = clip.rank || totalItems - index;
  const theme = rankThemes[rank] || fallbackTheme;
  const isTop1 = rank === 1;
  const itemDur = clip.durationFrames || 150;

  // ── ENTRANCE ──
  const entranceSpring = spring({frame: relFrame, fps, config: {damping: isTop1 ? 100 : 160, stiffness: isTop1 ? 80 : 120}});
  const videoScale = interpolate(relFrame, [0, itemDur], [1.05, 1.15], {extrapolateRight: "clamp"});
  const videoInitialScale = interpolate(entranceSpring, [0, 1], [1.3, 1]);
  const contentOpacity = clamp(interpolate(relFrame, [0, 10], [0, 1]), 0, 1);

  // ── Staggered text ──
  const numberDelay = 4;
  const labelDelay = 14;

  const numSpring = spring({frame: Math.max(0, relFrame - numberDelay), fps, config: {damping: 100, stiffness: isTop1 ? 60 : 100}});
  const numScale = interpolate(numSpring, [0, 1], [isTop1 ? 4 : 2.5, 1]);
  const numOpacity = clamp(interpolate(relFrame, [numberDelay, numberDelay + 10], [0, 1]), 0, 1);

  const labelSpring = spring({frame: Math.max(0, relFrame - labelDelay), fps, config: {damping: 180, stiffness: 120}});
  const labelY = interpolate(labelSpring, [0, 1], [50, 0]);
  const labelOpacity = clamp(interpolate(relFrame, [labelDelay, labelDelay + 12], [0, 1]), 0, 1);

  // ── EXIT ──
  const exitOpacity = interpolate(relFrame, [itemDur - 8, itemDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── #1 flash ──
  const flashOpacity = isTop1
    ? interpolate(relFrame, [0, 4, 16], [0.7, 0.5, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 0;

  return (
    <AbsoluteFill style={{opacity: contentOpacity * exitOpacity}}>
      {/* ── FULLSCREEN VIDEO ── */}
      <AbsoluteFill
        style={{
          transform: `scale(${videoScale * videoInitialScale})`,
          filter: "saturate(1.15) contrast(1.08)",
        }}
      >
        {clip.videoSrc && (
          <Video
            src={staticFile(clip.videoSrc)}
            startFrom={0}
            muted
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        )}
      </AbsoluteFill>

      {/* ── Dark gradient overlay ── */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            rgba(2,6,23,0.4) 0%,
            rgba(2,6,23,0.1) 25%,
            rgba(2,6,23,0.15) 50%,
            rgba(2,6,23,0.8) 75%,
            rgba(2,6,23,0.97) 100%)`,
        }}
      />

      {/* ── Rank glow ── */}
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

      {/* ── RANK NUMBER ── */}
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

      {/* ── LABEL (lower third) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <div
          style={{
            fontSize: isTop1 ? 56 : 48,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -1.5,
            textShadow: "0 4px 20px rgba(0,0,0,0.7)",
          }}
        >
          {clip.label}
        </div>

        {clip.context && (
          <div
            style={{
              fontSize: 30,
              color: "rgba(248,250,252,0.65)",
              lineHeight: 1.2,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {clip.context}
          </div>
        )}

        {/* Accent bar */}
        <div style={{width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden"}}>
          <div
            style={{
              width: `${clamp(interpolate(relFrame, [labelDelay, labelDelay + 30], [0, 100]), 0, 100)}%`,
              height: "100%",
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}66)`,
              boxShadow: `0 0 12px ${theme.glow}`,
            }}
          />
        </div>
      </div>

      {/* ── Progress dots ── */}
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
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Main composition ──
export const CompilationShort = ({
  title,
  category,
  siteName = "Beira do Campo",
  siteUrl = "beiradocampo.com.br",
  followHandle = "@beiradocampotv",
  followCallToAction,
  audioSrc,
  clips = [],
  introEndFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const introFrames = introEndFrame || Math.round(fps * 2.5);

  // Sort clips by rank descending (5→4→3→2→1)
  const sortedClips = [...clips].sort((a, b) => (b.rank || 0) - (a.rank || 0));

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

      {/* ── CLIPS ── */}
      {sortedClips.map((clip, index) => {
        const clipStart = clip.startFrame != null ? clip.startFrame : introFrames + index * 150;
        const clipDur = clip.durationFrames || 150;
        const clipEnd = clipStart + clipDur;
        const relFrame = frame - clipStart;
        const isVisible = frame >= clipStart && frame < clipEnd;

        return (
          <ClipItem
            key={index}
            clip={clip}
            index={index}
            totalItems={sortedClips.length}
            isVisible={isVisible}
            relFrame={relFrame}
          />
        );
      })}

      {/* ── Progress bar ── */}
      {frame >= introFrames && frame < durationInFrames - 72 && (
        <div style={{position: "absolute", top: 72, left: 64, right: 64}}>
          <ProgressBar
            items={sortedClips}
            activeIndex={sortedClips.findIndex((clip) => {
              const start = clip.startFrame ?? 0;
              const dur = clip.durationFrames ?? 150;
              return frame >= start && frame < start + dur;
            })}
            frame={frame}
          />
        </div>
      )}

      <FilmGrain opacity={0.04} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      />

      <FollowEndCard
        callToAction={followCallToAction || "Para mais compilações de futebol, siga o canal"}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
