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

const palette = {
  bg: "#020617",
  card: "rgba(4, 10, 18, 0.92)",
  cardBorder: "rgba(250,204,21,0.35)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
};

const CLAMP = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};
const HALF = 960; // 50% of 1920

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Waveform (compact — 10 bars)
// ---------------------------------------------------------------------------
const Waveform = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: "flex", gap: 6, alignItems: "flex-end", height: 36}}>
      {new Array(10).fill(true).map((_, i) => {
        const phase = frame / 3 + i * 0.9;
        const height = 8 + Math.abs(Math.sin(phase)) * 24;
        const active = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              width: 6,
              height,
              borderRadius: 999,
              background: active ? palette.accent : "rgba(255,255,255,0.48)",
              boxShadow: active ? `0 0 12px ${palette.accent}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ShowcaseShort = (props) => {
  const {
    title,
    category,
    siteName,
    siteUrl,
    followHandle,
    videoSrc,
    imageSrc,
    bottomImageSrc,
    centerText,
    cardPosition,
    audioSrc,
    callToAction,
    followCallToAction,
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // -- Bottom image Ken Burns --
  const imgZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.12], CLAMP);
  const imgPanY = interpolate(frame, [0, durationInFrames], [0, -20], CLAMP);

  // -- Header entrance --
  const headerSpring = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 100},
  });
  const headerY = interpolate(headerSpring, [0, 1], [-40, 0]);
  const headerOp = interpolate(headerSpring, [0, 1], [0, 1]);

  // -- Center text entrance --
  const textSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: {damping: 140, stiffness: 120},
  });
  const textY = interpolate(textSpring, [0, 1], [60, 0]);
  const textOp = interpolate(textSpring, [0, 1], [0, 1]);

  // -- Glow pulse --
  const glowIntensity = 0.1 + Math.abs(Math.sin(frame / 14)) * 0.08;

  // -- CTA footer --
  const ctaStart = durationInFrames * 0.72;
  const ctaSpring = spring({
    frame: Math.max(0, frame - ctaStart),
    fps,
    config: {damping: 160, stiffness: 130},
  });
  const ctaOp = interpolate(frame, [ctaStart, ctaStart + 18], [0, 1], CLAMP);
  const ctaY = interpolate(ctaSpring, [0, 1], [50, 0]);

  // Resolve bottom image — use imageSrc as fallback
  const bottomSrc = bottomImageSrc || imageSrc;

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

      {/* ── Top half: Video ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: HALF,
          overflow: "hidden",
        }}
      >
        {videoSrc ? (
          <OffthreadVideo
            src={staticFile(videoSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
            muted
          />
        ) : (
          <Img
            src={staticFile(imageSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        )}
        {/* Vignette on bottom edge of video */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            background: "linear-gradient(180deg, transparent, rgba(2,6,23,0.7))",
          }}
        />
      </div>

      {/* ── Bottom half: Image ── */}
      <div
        style={{
          position: "absolute",
          top: HALF,
          left: 0,
          width: 1080,
          height: HALF,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${imgZoom}) translateY(${imgPanY}px)`,
          }}
        >
          <Img
            src={staticFile(bottomSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        </div>
        {/* Vignette on top edge of image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: "linear-gradient(0deg, transparent, rgba(2,6,23,0.7))",
          }}
        />
      </div>

      {/* ── Ambient glow ── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(250,204,21,${glowIntensity}), transparent 40%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Divider line (subtle) ── */}
      <div
        style={{
          position: "absolute",
          top: HALF - 1,
          left: 60,
          right: 60,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${palette.accent}44, transparent)`,
        }}
      />

      {/* ── Text box (center or bottom) ── */}
      <div
        style={{
          position: "absolute",
          ...(cardPosition === "bottom"
            ? { bottom: 160, left: 56, right: 56 }
            : { top: HALF - 90, left: 56, right: 56 }),
          display: "flex",
          justifyContent: "center",
          opacity: textOp,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            padding: "28px 44px",
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 48,
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: "#0f172a",
            }}
          >
            {centerText || title}
          </div>
        </div>
      </div>

      {/* ── Header: site name + category ── */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 56,
          right: 56,
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
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            fontSize: 22,
            color: palette.secondary,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      {/* ── Waveform indicator (bottom area, above CTA) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 68,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Waveform />
        <span
          style={{
            fontSize: 20,
            color: palette.softText,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {siteUrl}
        </span>
      </div>

      {/* ── CTA footer ── */}
      {callToAction && (
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 30px",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(4, 10, 18, 0.85)",
            backdropFilter: "blur(16px)",
            opacity: ctaOp,
            transform: `translateY(${ctaY}px)`,
            gap: 16,
          }}
        >
          <span
            style={{
              color: palette.accent,
              fontSize: 22,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Siga o canal
          </span>
          <span style={{fontSize: 28, fontWeight: 700}}>{callToAction}</span>
        </div>
      )}

      {/* ── End card overlay ── */}
      <FollowEndCard
        callToAction={followCallToAction}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
