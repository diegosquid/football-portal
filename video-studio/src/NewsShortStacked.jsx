import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioFooter} from "./AudioFooter";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#08131d",
  panel: "#f8fafc",
  text: "#08131d",
  softText: "rgba(8,19,29,0.74)",
  accent: "#facc15",
  secondary: "#0ea5e9",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const NewsShortStacked = ({
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
  const {fps, durationInFrames} = useVideoConfig();
  const panelIn = spring({
    frame,
    fps,
    config: {damping: 180, stiffness: 120},
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #020617 0%, #08131d 100%)",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <div
        style={{
          position: "absolute",
          top: 58,
          left: 58,
          right: 58,
          bottom: 58,
          borderRadius: 40,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
          background: "#04101a",
        }}
      >
        <div style={{position: "absolute", inset: 0, height: "54%"}}>
          <Img
            src={staticFile(imageSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${interpolate(frame, [0, durationInFrames], [1.05, 1.12], {
                extrapolateRight: "clamp",
              })})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.18) 56%, rgba(2,6,23,0.68) 100%)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "52%",
            background: palette.panel,
            color: palette.text,
            padding: "46px 40px 34px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
            transform: `translateY(${interpolate(panelIn, [0, 1], [80, 0])}px)`,
          }}
        >
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <span style={{fontSize: 22, letterSpacing: 1.1, textTransform: "uppercase", color: palette.softText}}>
              {siteName}
            </span>
            <span
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(14,165,233,0.1)",
                color: palette.secondary,
                fontSize: 20,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {formatCategory(category)}
            </span>
          </div>

          <div style={{fontSize: 74, lineHeight: 0.96, fontWeight: 900, letterSpacing: -2.4}}>
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
                boxShadow: "0 0 18px rgba(250,204,21,0.6)",
              }}
            />
            Entrada direta para a matéria
          </div>

          <AudioFooter
            callToAction={callToAction}
            siteUrl={siteUrl}
            compact
            style={{background: "rgba(8,19,29,0.92)", marginTop: "auto"}}
          />
        </div>
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
