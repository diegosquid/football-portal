import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const OutroScene = ({
  siteName,
  siteUrl,
  followHandle,
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) {
    return null;
  }

  const overlayOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardIn = spring({
    frame: Math.max(0, localFrame - 10),
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const handleIn = spring({
    frame: Math.max(0, localFrame - 30),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const waveOpacity = interpolate(localFrame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `rgba(6, 19, 29, ${Math.min(1, overlayOpacity)})`,
      }}
    >
      {/* Radial accents */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(125,211,252,0.12), transparent 28%), radial-gradient(circle at 50% 72%, rgba(250,204,21,0.08), transparent 26%)",
          opacity: overlayOpacity * 0.5,
        }}
      />

      {/* Card */}
      <div
        style={{
          width: 760,
          borderRadius: 36,
          border: `1px solid ${palette.border}`,
          background: palette.panel,
          backdropFilter: "blur(18px)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: interpolate(cardIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(cardIn, [0, 1], [40, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.96, 1])})`,
        }}
      >
        <span
          style={{
            color: palette.accent,
            fontSize: 20,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          Leia a materia completa
        </span>

        <div
          style={{
            textAlign: "center",
            color: palette.text,
            fontSize: 38,
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: -1.4,
          }}
        >
          {siteUrl}
        </div>

        <div
          style={{
            padding: "16px 28px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(250,204,21,0.18), rgba(125,211,252,0.14))",
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 0.6,
            boxShadow: "0 0 24px rgba(250,204,21,0.12)",
            opacity: interpolate(handleIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(handleIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {followHandle}
        </div>

        {/* Waveform */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
            height: 36,
            marginTop: 4,
            opacity: waveOpacity,
          }}
        >
          {new Array(16).fill(true).map((_, index) => {
            const height = 10 + Math.abs(Math.sin(localFrame / 3 + index * 0.8)) * 22;
            const active = index % 3 === 0;
            return (
              <div
                key={index}
                style={{
                  width: 6,
                  height,
                  borderRadius: 999,
                  background: active ? palette.accent : palette.secondary,
                  opacity: active ? 1 : 0.5,
                  boxShadow: active ? `0 0 14px ${palette.accent}` : "none",
                }}
              />
            );
          })}
        </div>

        <span
          style={{
            color: palette.softText,
            fontSize: 18,
            letterSpacing: 0.4,
          }}
        >
          Siga o canal para mais conteudo de futebol
        </span>
      </div>
    </AbsoluteFill>
  );
};
