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

// ---------------------------------------------------------------------------
// BgMedia — full-screen video or image, no blur
// ---------------------------------------------------------------------------
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
    return <Img src={staticFile(imageSrc)} style={style} />;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Waveform (compact, dark-friendly)
// ---------------------------------------------------------------------------
const Waveform = ({color = "#facc15"}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: "flex", gap: 6, alignItems: "flex-end", height: 36}}>
      {new Array(10).fill(true).map((_, i) => {
        const phase = frame / 3 + i * 0.9;
        const height = 8 + Math.abs(Math.sin(phase)) * 22;
        const active = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              width: 6,
              height,
              borderRadius: 999,
              background: active ? color : "rgba(0,0,0,0.18)",
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Format category helper
// ---------------------------------------------------------------------------
const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const CLAMP = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

// ---------------------------------------------------------------------------
// Main composition — "card" format
// ---------------------------------------------------------------------------
export const NewsShortCard = (props) => {
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

  // Card entrance spring
  const cardSpring = spring({
    frame,
    fps,
    config: {damping: 180, stiffness: 110},
  });
  const cardY = interpolate(cardSpring, [0, 1], [120, 0]);
  const cardOp = interpolate(cardSpring, [0, 1], [0, 1]);

  // Header entrance
  const headerSpring = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const headerY = interpolate(headerSpring, [0, 1], [-50, 0]);
  const headerOp = interpolate(headerSpring, [0, 1], [0, 1]);

  // CTA fade
  const ctaStart = durationInFrames * 0.72;
  const ctaOp = interpolate(frame, [ctaStart, ctaStart + 18], [0, 1], CLAMP);
  const ctaSpring = spring({
    frame: Math.max(0, frame - ctaStart),
    fps,
    config: {damping: 160, stiffness: 130},
  });
  const ctaY = interpolate(ctaSpring, [0, 1], [40, 0]);

  // Subtle bottom overlay gradient so card sits over video nicely
  // Image zoom for static backgrounds
  const imgZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.06], CLAMP);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      {/* ── Full-screen background (video crisp, image with gentle zoom) ── */}
      <AbsoluteFill
        style={{
          transform: videoSrc ? undefined : `scale(${imgZoom})`,
        }}
      >
        <BgMedia
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>

      {/* ── Gradient — only bottom half, gentle ── */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ── Header: site name + category badge ── */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
        }}
      >
        {/* Site name pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: "#facc15",
              boxShadow: "0 0 12px #facc15",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 22,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.88)",
              fontWeight: 600,
            }}
          >
            {siteName}
          </span>
        </div>

        {/* Category badge */}
        <div
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: 21,
            color: "#7dd3fc",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            fontWeight: 600,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      {/* ── White title card ── */}
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          bottom: callToAction ? 220 : 140,
          opacity: cardOp,
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: "36px 40px",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Category label inside card */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: "#facc15",
              marginBottom: 14,
              // Yellow on white is low contrast — use a deeper gold
              color: "#b45309",
            }}
          >
            {formatCategory(category)}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 50,
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: -1.2,
              color: "#0f172a",
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* ── CTA footer (slide up) ── */}
      {callToAction && (
        <div
          style={{
            position: "absolute",
            left: 52,
            right: 52,
            bottom: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "20px 28px",
            borderRadius: 20,
            background: "rgba(0,0,0,0.52)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.10)",
            opacity: ctaOp,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          <div style={{display: "flex", flexDirection: "column", gap: 4}}>
            <span
              style={{
                color: "#facc15",
                fontSize: 17,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Chamada final
            </span>
            <span
              style={{
                fontSize: 27,
                lineHeight: 1.2,
                fontWeight: 700,
                color: "#f8fafc",
              }}
            >
              {callToAction}
            </span>
          </div>
          <Waveform />
        </div>
      )}

      {/* ── Follow end card ── */}
      <FollowEndCard
        callToAction={followCallToAction}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
