import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioFooter} from "./AudioFooter";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#020617",
  text: "#f8fafc",
  softText: "rgba(226,232,240,0.8)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  panel: "rgba(3, 7, 18, 0.5)",
  panelBorder: "rgba(255,255,255,0.1)",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const NewsShortBriefing = ({
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
  const cardIn = spring({
    frame,
    fps,
    config: {damping: 180, stiffness: 110},
  });
  const imageScale = interpolate(frame, [0, durationInFrames], [1.02, 1.1], {
    extrapolateRight: "clamp",
  });
  const imageY = interpolate(frame, [0, durationInFrames], [0, -50], {
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(cardIn, [0, 1], [80, 0]);
  const headlineOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanHeight = 140 + Math.abs(Math.sin(frame / 10)) * 180;

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

      <AbsoluteFill
        style={{
          transform: `translateY(${imageY}px) scale(${imageScale})`,
        }}
      >
        <Img
          src={staticFile(imageSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.12) 0%, rgba(2,6,23,0.2) 26%, rgba(2,6,23,0.54) 64%, rgba(2,6,23,0.94) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 32,
          borderRadius: 40,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 62,
          left: 62,
          right: 62,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 22px",
            borderRadius: 999,
            background: palette.panel,
            backdropFilter: "blur(16px)",
            border: `1px solid ${palette.panelBorder}`,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: "0 0 18px rgba(250,204,21,0.7)",
            }}
          />
          <span style={{fontSize: 21, letterSpacing: 1.1, textTransform: "uppercase", fontWeight: 800}}>
            Briefing
          </span>
          <span style={{fontSize: 19, letterSpacing: 1, textTransform: "uppercase", color: palette.softText}}>
            {siteName}
          </span>
        </div>

        <div
          style={{
            padding: "18px 22px",
            borderRadius: 999,
            background: "rgba(3,7,18,0.42)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${palette.panelBorder}`,
            fontSize: 19,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: palette.secondary,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 70,
          top: 180,
          width: 120,
          height: 520,
          borderRadius: 30,
          background: "rgba(3,7,18,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            top: 26,
            fontSize: 18,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: "rgba(248,250,252,0.52)",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          Photo First
        </div>
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 42,
            bottom: 42,
            width: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 48,
            top: 56 + interpolate(frame, [0, durationInFrames], [0, 280], {
              extrapolateRight: "clamp",
            }),
            width: 24,
            height: scanHeight,
            borderRadius: 999,
            background: "linear-gradient(180deg, rgba(125,211,252,0), rgba(125,211,252,0.88) 25%, rgba(250,204,21,0.86) 80%, rgba(250,204,21,0))",
            filter: "blur(2px)",
            opacity: 0.8,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          bottom: 62,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      >
        <div
          style={{
            width: 180,
            height: 5,
            borderRadius: 999,
            background: "linear-gradient(90deg, #facc15 0%, #7dd3fc 100%)",
            boxShadow: "0 0 22px rgba(125,211,252,0.28)",
          }}
        />

        <div
          style={{
            maxWidth: 860,
            fontSize: 96,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: -3.6,
            textShadow: "0 14px 34px rgba(0,0,0,0.34)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: palette.softText,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: palette.accent,
            }}
          />
          Resumo visual com chamada final
        </div>

        <AudioFooter
          callToAction={callToAction}
          siteUrl={siteUrl}
          compact
          style={{
            marginTop: 8,
            background: "rgba(3, 7, 18, 0.62)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
