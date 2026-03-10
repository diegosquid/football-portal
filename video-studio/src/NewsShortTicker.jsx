import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioFooter} from "./AudioFooter";
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

export const NewsShortTicker = ({
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
  const bgScale = interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgScale})`,
          filter: "saturate(1.1)",
        }}
      >
        <Img src={staticFile(imageSrc)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.5) 34%, rgba(2,6,23,0.96) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 38,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 74,
          left: 74,
          right: 74,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{fontSize: 22, letterSpacing: 1.1, textTransform: "uppercase", color: palette.softText}}>
          {siteName}
        </span>
        <span
          style={{
            padding: "11px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            color: palette.secondary,
            fontSize: 19,
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
          left: 74,
          right: 74,
          top: 200,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{maxWidth: 860, fontSize: 88, lineHeight: 0.93, fontWeight: 900, letterSpacing: -3}}>
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: palette.softText,
            fontSize: 24,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: "0 0 18px rgba(250,204,21,0.65)",
            }}
          />
          Leitura rápida em vídeo
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 350,
          padding: "20px 0",
          background: "rgba(2,6,23,0.84)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 22,
          whiteSpace: "nowrap",
          transform: `translateX(${interpolate(frame, [0, durationInFrames], [0, -420], {
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        {new Array(10).fill(true).map((_, loopIndex) =>
          ["Plantao", formatCategory(category), siteName].map((label, highlightIndex) => (
            <div
              key={`${loopIndex}-${highlightIndex}-${label}`}
              style={{
                fontSize: 28,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <span style={{color: palette.accent}}>AO VIVO</span>
              <span>{label}</span>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 74,
        }}
      >
        <AudioFooter callToAction={callToAction} siteUrl={siteUrl} />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
