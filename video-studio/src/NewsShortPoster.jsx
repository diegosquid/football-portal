import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioFooter} from "./AudioFooter";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
  accent: "#facc15",
  secondary: "#7dd3fc",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const NewsShortPoster = ({
  title,
  category,
  siteName,
  siteUrl,
  followHandle,
  imageSrc,
  audioSrc,
  callToAction,
  followCallToAction,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
        background: "#030712",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgScale})`,
        }}
      >
        <Img src={staticFile(imageSrc)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(3,7,18,0.22) 0%, rgba(3,7,18,0.58) 44%, rgba(3,7,18,0.98) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 42,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 42,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 86,
          left: 82,
          right: 82,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{fontSize: 22, letterSpacing: 1.2, textTransform: "uppercase", color: palette.softText}}>
          {siteName}
        </span>
        <span
          style={{
            padding: "12px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            color: palette.secondary,
            fontSize: 20,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {formatCategory(category)}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 82,
          right: 82,
          top: 220,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: palette.accent,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: "0 0 18px rgba(250,204,21,0.65)",
            }}
          />
          Chamada de capa
        </div>

        <div style={{maxWidth: 900, fontSize: 94, lineHeight: 0.92, fontWeight: 900, letterSpacing: -3.4}}>
          {title}
        </div>
        <div
          style={{
            width: 260,
            height: 4,
            borderRadius: 999,
            background: "linear-gradient(90deg, #facc15 0%, rgba(250,204,21,0.05) 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 82,
          right: 82,
          bottom: 82,
        }}
      >
        <AudioFooter callToAction={callToAction} siteUrl={siteUrl} />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
