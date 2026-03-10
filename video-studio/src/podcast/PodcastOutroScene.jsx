import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette, speakerColors} from "./palette";

export const PodcastOutroScene = ({
  siteName,
  siteUrl,
  followHandle,
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const overlayOpacity = interpolate(localFrame, [0, 20], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

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
          background: "radial-gradient(circle at 40% 35%, rgba(250,204,21,0.1), transparent 26%), radial-gradient(circle at 60% 70%, rgba(125,211,252,0.08), transparent 24%)",
          opacity: overlayOpacity * 0.5,
        }}
      />

      {/* Card */}
      <div
        style={{
          width: 720,
          borderRadius: 32,
          border: `1px solid ${palette.border}`,
          background: palette.panel,
          backdropFilter: "blur(18px)",
          boxShadow: "0 24px 72px rgba(0,0,0,0.35)",
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: interpolate(cardIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(cardIn, [0, 1], [30, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.97, 1])})`,
        }}
      >
        {/* Podcast badge */}
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: `${palette.accent}33`,
            border: `1px solid ${palette.accent}55`,
            color: palette.accent,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 1.8,
            textTransform: "uppercase",
          }}
        >
          Podcast Beira do Campo
        </span>

        {/* CTA */}
        <div
          style={{
            textAlign: "center",
            color: palette.text,
            fontSize: 34,
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: -1.2,
          }}
        >
          Materia completa em {siteUrl}
        </div>

        {/* Follow handle */}
        <div
          style={{
            padding: "14px 24px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(125,211,252,0.12))",
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 0.5,
            opacity: interpolate(handleIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(handleIn, [0, 1], [15, 0])}px)`,
          }}
        >
          {followHandle}
        </div>

        {/* Waveform */}
        <div
          style={{
            display: "flex",
            gap: 5,
            alignItems: "flex-end",
            height: 32,
            marginTop: 4,
            opacity: interpolate(localFrame, [40, 55], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
          }}
        >
          {new Array(14).fill(true).map((_, index) => {
            const height = 8 + Math.abs(Math.sin(localFrame / 3 + index * 0.85)) * 20;
            const isFernanda = index % 2 === 0;
            return (
              <div
                key={index}
                style={{
                  width: 5,
                  height,
                  borderRadius: 999,
                  background: isFernanda ? speakerColors.Fernanda : speakerColors.Ricardo,
                  opacity: 0.7,
                }}
              />
            );
          })}
        </div>

        <span style={{color: palette.softText, fontSize: 16, letterSpacing: 0.4}}>
          Inscreva-se para mais conteudo de futebol
        </span>
      </div>
    </AbsoluteFill>
  );
};
