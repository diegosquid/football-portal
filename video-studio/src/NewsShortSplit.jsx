import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#07111a",
  panel: "rgba(5, 14, 22, 0.9)",
  panelSoft: "rgba(255,255,255,0.07)",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.76)",
  accent: "#facc15",
  secondary: "#7dd3fc",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const NewsShortSplit = ({
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
  const {fps, durationInFrames} = useVideoConfig();
  const panelIn = spring({
    frame,
    fps,
    config: {damping: 160, stiffness: 110},
  });

  const imageScale = interpolate(frame, [0, durationInFrames], [1.02, 1.1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #020617 0%, #07111a 100%)",
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
          background:
            "radial-gradient(circle at top right, rgba(125,211,252,0.14), transparent 28%), radial-gradient(circle at bottom left, rgba(250,204,21,0.12), transparent 32%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 64,
          left: 64,
          right: 64,
          bottom: 64,
          borderRadius: 46,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.32)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: `scale(${imageScale})`,
          }}
        >
          <Img
            src={staticFile(imageSrc)}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(2,6,23,0.12) 0%, rgba(2,6,23,0.2) 32%, rgba(2,6,23,0.92) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: "auto 32px 32px 32px",
            padding: "34px 34px 30px",
            borderRadius: 34,
            background: palette.panel,
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            transform: `translateY(${interpolate(panelIn, [0, 1], [80, 0])}px)`,
            opacity: clamp(panelIn, 0, 1),
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{fontSize: 24, color: palette.softText, letterSpacing: 1.1, textTransform: "uppercase"}}>
              {siteName}
            </div>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                color: palette.secondary,
                fontSize: 21,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {formatCategory(category)}
            </div>
          </div>

          <div style={{fontSize: 72, lineHeight: 0.98, fontWeight: 800, letterSpacing: -2, marginBottom: 22}}>
            {title}
          </div>
          <div style={{fontSize: 31, lineHeight: 1.32, color: palette.softText, marginBottom: 28}}>
            {excerpt}
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 12, marginBottom: 26}}>
            {highlights.slice(0, 3).map((highlight) => (
              <div
                key={highlight}
                style={{
                  padding: "16px 18px",
                  borderRadius: 20,
                  background: palette.panelSoft,
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 25,
                  fontWeight: 600,
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
              alignItems: "center",
              paddingTop: 22,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              gap: 20,
            }}
          >
            <div style={{display: "flex", flexDirection: "column", gap: 6}}>
              <span style={{fontSize: 22, color: palette.accent, letterSpacing: 1.2, textTransform: "uppercase"}}>
                Chamada final
              </span>
              <span style={{fontSize: 32, fontWeight: 700, lineHeight: 1.1}}>{callToAction}</span>
            </div>
            <span style={{fontSize: 26, color: palette.softText}}>{siteUrl}</span>
          </div>
        </div>
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
