import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const BgMedia = ({imageSrc, videoSrc, style}) => {
  if (videoSrc) {
    return (
      <OffthreadVideo
        src={staticFile(videoSrc)}
        style={style}
        muted
      />
    );
  }
  if (imageSrc) {
    return (
      <Img
        src={staticFile(imageSrc)}
        style={style}
      />
    );
  }
  return null;
};

const palette = {
  bg: "#06131d",
  card: "rgba(8, 22, 33, 0.82)",
  cardBorder: "rgba(255,255,255,0.14)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const CLAMP = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

// ---------------------------------------------------------------------------
// Waveform (compact version — 12 bars)
// ---------------------------------------------------------------------------
const Waveform = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: "flex", gap: 7, alignItems: "flex-end", height: 42}}>
      {new Array(12).fill(true).map((_, i) => {
        const phase = frame / 3 + i * 0.9;
        const height = 10 + Math.abs(Math.sin(phase)) * 28;
        const active = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              width: 7,
              height,
              borderRadius: 999,
              background: active ? palette.accent : "rgba(255,255,255,0.48)",
              boxShadow: active ? `0 0 14px ${palette.accent}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stagger title — each word enters with delay
// ---------------------------------------------------------------------------
const StaggerTitle = ({title, frame, startFrame, fps}) => {
  const words = String(title).split(/\s+/);
  const wordsPerRow = 4;
  const rows = [];
  for (let i = 0; i < words.length; i += wordsPerRow) {
    rows.push(words.slice(i, i + wordsPerRow).join(" "));
  }

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 8}}>
      {rows.map((row, i) => {
        const delay = i * 4;
        const rowSpring = spring({
          frame: Math.max(0, frame - startFrame - delay),
          fps,
          config: {damping: 140, stiffness: 180},
        });
        const y = interpolate(rowSpring, [0, 1], [50, 0]);
        const opacity = interpolate(rowSpring, [0, 1], [0, 1]);
        return (
          <div
            key={i}
            style={{
              fontSize: 78,
              lineHeight: 1.0,
              fontWeight: 800,
              letterSpacing: -2.5,
              textShadow: "0 8px 40px rgba(0,0,0,0.6)",
              transform: `translateY(${y}px)`,
              opacity,
            }}
          >
            {row}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const NewsShortDynamic = (props) => {
  const {
    title,
    category,
    siteName,
    followHandle,
    imageSrc,
    videoSrc,
    audioSrc,
    callToAction,
    followCallToAction,
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Phase boundaries — simples: título entra cedo e fica, CTA no final
  const phases = {
    title:   {start: 12,          end: durationInFrames - 90},
    cta:     {start: durationInFrames * 0.75, end: durationInFrames - 72},
  };

  // ── Image animation: aggressive Ken Burns + slow pan ──
  const imgZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.28], CLAMP);
  const imgPanY = interpolate(frame, [0, durationInFrames], [0, -70], CLAMP);
  const imgPanX = interpolate(frame, [0, durationInFrames], [0, 30], CLAMP);

  // Parallax offset for text (opposite direction of image)
  const parallaxX = interpolate(frame, [0, durationInFrames], [0, -16], CLAMP);

  // Title: fade in and stay, fade out near end
  const titleIn = interpolate(frame, [phases.title.start, phases.title.start + 24], [0, 1], CLAMP);
  const titleOut = interpolate(frame, [phases.title.end - 18, phases.title.end], [1, 0], CLAMP);
  const titleOp = Math.min(titleIn, titleOut);

  // CTA: fade in at the end
  const ctaOp = interpolate(frame, [phases.cta.start, phases.cta.start + 18], [0, 1], CLAMP);

  // Glow pulse (continuous)
  const glowIntensity = 0.12 + Math.abs(Math.sin(frame / 12)) * 0.1;

  // Header entrance
  const headerSpring = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 100},
  });
  const headerY = interpolate(headerSpring, [0, 1], [-40, 0]);
  const headerOp = interpolate(headerSpring, [0, 1], [0, 1]);

  // CTA slide up
  const ctaSpring = spring({
    frame: Math.max(0, frame - phases.cta.start),
    fps,
    config: {damping: 160, stiffness: 130},
  });
  const ctaY = interpolate(ctaSpring, [0, 1], [60, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      {/* ── Background: full image/video with aggressive Ken Burns ── */}
      <AbsoluteFill
        style={{
          transform: videoSrc ? undefined : `scale(${imgZoom}) translate(${imgPanX}px, ${imgPanY}px)`,
        }}
      >
        <BgMedia
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>

      {/* ── Gradient overlays ── */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.5) 50%, rgba(2,6,23,0.92) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at top right, rgba(250,204,21,${glowIntensity}), transparent 30%), radial-gradient(circle at bottom left, rgba(125,211,252,${glowIntensity}), transparent 35%)`,
        }}
      />

      {/* ── Border frame ── */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 38,
          pointerEvents: "none",
        }}
      />

      {/* ── Header: site name + category (always visible, compact) ── */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 68,
          right: 68,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: palette.softText,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: palette.accent,
              boxShadow: `0 0 16px ${palette.accent}`,
            }}
          />
          <span>{siteName}</span>
        </div>
        <div
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: `1px solid ${palette.cardBorder}`,
            background: "rgba(255,255,255,0.06)",
            fontSize: 22,
            color: palette.secondary,
            textTransform: "uppercase",
            letterSpacing: 1,
            opacity: 1,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      {/* ── Phase 2: Title (stagger animation + parallax) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 340,
          left: 68,
          right: 68,
          opacity: titleOp,
          transform: `translateX(${parallaxX}px)`,
        }}
      >
        <StaggerTitle
          title={title}
          frame={frame}
          startFrame={phases.title.start}
          fps={fps}
        />
      </div>

      {/* ── CTA footer (compact, slide up) ── */}
      <div
        style={{
          position: "absolute",
          left: 68,
          right: 68,
          bottom: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "22px 26px",
          borderRadius: 28,
          border: `1px solid ${palette.cardBorder}`,
          background: "rgba(8, 22, 33, 0.78)",
          backdropFilter: "blur(16px)",
          opacity: ctaOp,
          transform: `translateY(${ctaY}px)`,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span
            style={{
              color: palette.accent,
              fontSize: 20,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Chamada final
          </span>
          <span style={{fontSize: 30, lineHeight: 1.18, fontWeight: 700}}>
            {callToAction}
          </span>
        </div>
        <Waveform />
      </div>

      {/* ── End card overlay ── */}
      <FollowEndCard
        callToAction={followCallToAction}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
