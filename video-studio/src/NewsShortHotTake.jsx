import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#0a0204",
  card: "rgba(18, 4, 8, 0.85)",
  cardBorder: "rgba(239,68,68,0.28)",
  accent: "#ef4444",
  accentGlow: "#dc2626",
  secondary: "#fb923c",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const FireIcon = () => {
  const frame = useCurrentFrame();
  const flicker = 0.85 + Math.sin(frame / 2.5) * 0.15;
  return (
    <span
      style={{
        fontSize: 42,
        filter: `brightness(${flicker})`,
        textShadow: `0 0 24px ${palette.accent}, 0 0 48px ${palette.accentGlow}`,
      }}
    >
      🔥
    </span>
  );
};

const Waveform = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: "flex", gap: 8, alignItems: "flex-end", height: 54}}>
      {new Array(18).fill(true).map((_, index) => {
        const phase = frame / 2.5 + index * 1.1;
        const height = 16 + Math.abs(Math.sin(phase)) * 36;
        const active = index % 3 === 0;
        return (
          <div
            key={index}
            style={{
              width: 8,
              height,
              borderRadius: 999,
              background: active ? palette.accent : "rgba(255,255,255,0.38)",
              boxShadow: active ? `0 0 18px ${palette.accent}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

export const NewsShortHotTake = (props) => {
  const {
    title,
    siteName,
    siteUrl,
    followHandle,
    imageSrc,
    audioSrc,
    followCallToAction,
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const entrance = spring({frame, fps, config: {damping: 160, stiffness: 140}});
  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.12], {extrapolateRight: "clamp"});
  const cardScale = interpolate(entrance, [0, 1], [0.88, 1]);
  const cardY = interpolate(entrance, [0, 1], [100, 0]);
  const headerOpacity = clamp(interpolate(frame, [4, 18], [0, 1]), 0, 1);
  const titleOpacity = clamp(interpolate(frame, [10, 28], [0, 1]), 0, 1);
  const bottomOpacity = clamp(interpolate(frame, [22, 44], [0, 1]), 0, 1);

  // Pulsing red vignette
  const vignettePulse = 0.7 + Math.sin(frame / 8) * 0.1;

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

      {/* Background image - blurred, desaturated, reddish */}
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          filter: "blur(42px) saturate(0.6) brightness(0.7)",
          opacity: 0.55,
        }}
      >
        <Img
          src={staticFile(imageSrc)}
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>

      {/* Dark gradient overlay */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,2,4,0.35) 0%, rgba(10,2,4,0.75) 40%, rgba(10,2,4,0.97) 100%)",
        }}
      />

      {/* Red vignette pulse */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at top center, rgba(239,68,68,${vignettePulse * 0.2}), transparent 40%), radial-gradient(circle at bottom center, rgba(239,68,68,${vignettePulse * 0.14}), transparent 50%)`,
        }}
      />

      {/* Side accent lines */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: `linear-gradient(180deg, transparent 10%, ${palette.accent} 30%, ${palette.secondary} 70%, transparent 90%)`,
          opacity: 0.6 + Math.sin(frame / 4) * 0.2,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: `linear-gradient(180deg, transparent 10%, ${palette.secondary} 30%, ${palette.accent} 70%, transparent 90%)`,
          opacity: 0.6 + Math.sin(frame / 4 + 1) * 0.2,
        }}
      />

      {/* Top header - OPINIÃO QUENTE badge */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 76,
          right: 76,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: palette.softText,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: palette.accent,
              boxShadow: `0 0 18px ${palette.accent}, 0 0 36px ${palette.accentGlow}`,
            }}
          />
          <span>{siteName}</span>
        </div>
        <div
          style={{
            padding: "14px 26px",
            borderRadius: 999,
            border: `1.5px solid ${palette.cardBorder}`,
            background: "rgba(239,68,68,0.14)",
            fontSize: 24,
            color: palette.accent,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FireIcon />
          Opinião Quente
        </div>
      </div>

      {/* Main card with image + title */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 64,
          right: 64,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
        }}
      >
        <div
          style={{
            position: "relative",
            transform: `translateY(${cardY}px) scale(${cardScale})`,
          }}
        >
          {/* Red glow behind card */}
          <div
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: 52,
              background: `linear-gradient(135deg, rgba(239,68,68,${0.2 + Math.sin(frame / 6) * 0.08}), rgba(251,146,60,${0.15 + Math.sin(frame / 8) * 0.06}))`,
              filter: "blur(34px)",
            }}
          />
          <div
            style={{
              position: "relative",
              height: 780,
              borderRadius: 44,
              overflow: "hidden",
              border: `2px solid ${palette.cardBorder}`,
              background: palette.card,
              boxShadow: `0 28px 80px rgba(0,0,0,0.4), 0 0 60px rgba(239,68,68,0.12)`,
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${interpolate(frame, [0, durationInFrames], [1.04, 1.14])})`,
                filter: "saturate(0.85)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(10,2,4,0.08) 0%, rgba(10,2,4,0.25) 40%, rgba(10,2,4,0.85) 100%)",
              }}
            />
          </div>
        </div>

        {/* Title - bigger and bolder than clean */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              fontSize: 82,
              lineHeight: 0.98,
              fontWeight: 900,
              letterSpacing: -2.8,
              textShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 48px rgba(239,68,68,0.15)`,
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Bottom CTA - debate-oriented */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "28px 32px",
          borderRadius: 34,
          border: `1.5px solid ${palette.cardBorder}`,
          background: "rgba(18, 4, 8, 0.82)",
          backdropFilter: "blur(18px)",
          opacity: bottomOpacity,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          <span
            style={{
              color: palette.accent,
              fontSize: 24,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            E aí, concorda?
          </span>
          <span
            style={{
              fontSize: 34,
              lineHeight: 1.18,
              fontWeight: 700,
            }}
          >
            Comenta sua opinião!
          </span>
          <span style={{fontSize: 26, color: palette.softText}}>
            {siteUrl}
          </span>
        </div>
        <Waveform />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
