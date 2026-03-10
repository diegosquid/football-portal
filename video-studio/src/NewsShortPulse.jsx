import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#020617",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
  accent: "#facc15",
  secondary: "#7dd3fc",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const Wave = ({frame}) => {
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: 10, height: 64}}>
      {new Array(22).fill(true).map((_, index) => {
        const height = 14 + Math.abs(Math.sin(frame / 2.8 + index * 0.7)) * 42;
        return (
          <div
            key={index}
            style={{
              width: 10,
              height,
              borderRadius: 999,
              background: index % 4 === 0 ? palette.accent : "rgba(248,250,252,0.72)",
              boxShadow: index % 4 === 0 ? `0 0 16px ${palette.accent}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

export const NewsShortPulse = ({
  title,
  excerpt,
  category,
  siteName,
  siteUrl,
  followHandle,
  imageSrc,
  audioSrc,
  callToAction,
  followCallToAction,
  highlights = [],
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const imageY = interpolate(frame, [0, durationInFrames], [0, -90], {
    extrapolateRight: "clamp",
  });
  const imageScale = interpolate(frame, [0, durationInFrames], [1.08, 1.16], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [0, 24], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        color: palette.text,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${imageY}px) scale(${imageScale})`,
        }}
      >
        <Img src={staticFile(imageSrc)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.58) 46%, rgba(2,6,23,0.96) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 44,
          borderRadius: 40,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 76,
          right: 76,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div style={{fontSize: 24, color: palette.softText, textTransform: "uppercase", letterSpacing: 1.1}}>
          {siteName}
        </div>
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            color: palette.secondary,
            fontSize: 20,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 76,
          right: 76,
          bottom: 86,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <div style={{fontSize: 82, lineHeight: 0.95, fontWeight: 900, letterSpacing: -2.4}}>{title}</div>
          <div style={{fontSize: 31, lineHeight: 1.3, color: palette.softText}}>{excerpt}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {highlights.slice(0, 4).map((highlight, index) => (
            <div
              key={highlight}
              style={{
                padding: "16px 18px",
                borderRadius: 22,
                background: index === 0 ? "rgba(250,204,21,0.16)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 23,
                lineHeight: 1.15,
                fontWeight: 700,
              }}
            >
              {highlight}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 26,
            padding: "26px 28px",
            borderRadius: 30,
            background: "rgba(6,17,26,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{display: "flex", flexDirection: "column", gap: 8}}>
            <span style={{fontSize: 22, color: palette.accent, textTransform: "uppercase", letterSpacing: 1.1}}>
              Chamada final
            </span>
            <span style={{fontSize: 34, lineHeight: 1.12, fontWeight: 800}}>{callToAction}</span>
            <span style={{fontSize: 25, color: palette.softText}}>{siteUrl}</span>
          </div>
          <Wave frame={frame} />
        </div>
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
