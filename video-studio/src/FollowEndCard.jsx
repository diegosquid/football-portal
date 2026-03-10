import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

const palette = {
  bg: "#020617",
  panel: "rgba(4, 10, 18, 0.96)",
  border: "rgba(255,255,255,0.1)",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.76)",
  accent: "#facc15",
  secondary: "#7dd3fc",
};

export const FollowEndCard = ({callToAction, followHandle}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const startFrame = Math.max(0, durationInFrames - 72);
  const relativeFrame = Math.max(0, frame - startFrame);
  const overlayOpacity = interpolate(relativeFrame, [0, 16, 72], [0, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardIn = spring({
    frame: relativeFrame,
    fps,
    config: {damping: 200, stiffness: 140},
  });
  const cardOpacity = interpolate(relativeFrame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < startFrame) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `rgba(1, 3, 8, ${Math.min(1, overlayOpacity * 1.1)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(125,211,252,0.14), transparent 28%), radial-gradient(circle at 50% 72%, rgba(250,204,21,0.1), transparent 26%)",
          opacity: overlayOpacity * 0.4,
        }}
      />

      <div
        style={{
          width: 860,
          borderRadius: 42,
          border: `1px solid ${palette.border}`,
          background: palette.panel,
          backdropFilter: "blur(18px)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
          padding: "56px 52px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          opacity: cardOpacity,
          transform: `translateY(${interpolate(cardIn, [0, 1], [48, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.96, 1])})`,
        }}
      >
        <span
          style={{
            color: palette.accent,
            fontSize: 24,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          Siga o canal
        </span>

        <div
          style={{
            maxWidth: 680,
            textAlign: "center",
            color: palette.text,
            fontSize: 52,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: -1.8,
          }}
        >
          {callToAction}
        </div>

        <div
          style={{
            padding: "22px 34px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(250,204,21,0.18), rgba(125,211,252,0.14))",
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 0.6,
            boxShadow: "0 0 24px rgba(250,204,21,0.12)",
          }}
        >
          {followHandle}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            height: 46,
            marginTop: 4,
          }}
        >
          {new Array(14).fill(true).map((_, index) => {
            const height = 12 + Math.abs(Math.sin(relativeFrame / 3 + index * 0.8)) * 30;
            const active = index % 3 === 0;
            return (
              <div
                key={index}
                style={{
                  width: 8,
                  height,
                  borderRadius: 999,
                  background: active ? palette.accent : palette.secondary,
                  opacity: active ? 1 : 0.58,
                  boxShadow: active ? `0 0 18px ${palette.accent}` : "none",
                }}
              />
            );
          })}
        </div>

        <span
          style={{
            color: palette.softText,
            fontSize: 22,
            letterSpacing: 0.4,
          }}
        >
          Shorts diários e notícias rápidas de futebol
        </span>
      </div>
    </AbsoluteFill>
  );
};
