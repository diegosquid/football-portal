import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#06131d",
  card: "rgba(8, 22, 33, 0.82)",
  cardBorder: "rgba(255,255,255,0.14)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const Waveform = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        height: 54,
      }}
    >
      {new Array(18).fill(true).map((_, index) => {
        const phase = frame / 3 + index * 0.9;
        const height = 14 + Math.abs(Math.sin(phase)) * 34;
        const active = index % 3 === 0;
        return (
          <div
            key={index}
            style={{
              width: 8,
              height,
              borderRadius: 999,
              background: active ? palette.accent : "rgba(255,255,255,0.48)",
              boxShadow: active ? `0 0 18px ${palette.accent}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

export const NewsShort = (props) => {
  const {
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
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 120,
    },
  });

  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(entrance, [0, 1], [0.92, 1]);
  const cardY = interpolate(entrance, [0, 1], [80, 0]);
  const titleOpacity = clamp(interpolate(frame, [6, 24], [0, 1]), 0, 1);
  const bottomOpacity = clamp(interpolate(frame, [18, 42], [0, 1]), 0, 1);

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

      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          filter: "blur(38px) saturate(1.2)",
          opacity: 0.65,
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
            "linear-gradient(180deg, rgba(2,6,23,0.25) 0%, rgba(2,6,23,0.68) 42%, rgba(2,6,23,0.96) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at top right, rgba(250,204,21,0.16), transparent 26%), radial-gradient(circle at left center, rgba(125,211,252,0.14), transparent 32%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 44,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 42,
          pointerEvents: "none",
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
              boxShadow: `0 0 18px ${palette.accent}`,
            }}
          />
          <span>{siteName}</span>
        </div>
        <div
          style={{
            padding: "14px 22px",
            borderRadius: 999,
            border: `1px solid ${palette.cardBorder}`,
            background: "rgba(255,255,255,0.06)",
            fontSize: 24,
            color: palette.secondary,
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
          top: 246,
          left: 80,
          right: 80,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 28,
        }}
      >
        <div
          style={{
            position: "relative",
            transform: `translateY(${cardY}px) scale(${cardScale})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: 52,
              background: "linear-gradient(135deg, rgba(125,211,252,0.18), rgba(250,204,21,0.18))",
              filter: "blur(30px)",
            }}
          />
          <div
            style={{
              position: "relative",
              height: 860,
              borderRadius: 44,
              overflow: "hidden",
              border: `1px solid ${palette.cardBorder}`,
              background: palette.card,
              boxShadow: "0 28px 80px rgba(0,0,0,0.32)",
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${interpolate(frame, [0, durationInFrames], [1.04, 1.1])})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(4,11,18,0.06) 0%, rgba(4,11,18,0.18) 42%, rgba(4,11,18,0.78) 100%)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: -2.2,
              textShadow: "0 10px 30px rgba(0,0,0,0.24)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              maxWidth: 860,
              fontSize: 35,
              lineHeight: 1.34,
              color: palette.softText,
            }}
          >
            {excerpt}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "30px 32px",
          borderRadius: 34,
          border: `1px solid ${palette.cardBorder}`,
          background: "rgba(8, 22, 33, 0.76)",
          backdropFilter: "blur(18px)",
          opacity: bottomOpacity,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          <span
            style={{
              color: palette.accent,
              fontSize: 24,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Chamada final
          </span>
          <span
            style={{
              fontSize: 34,
              lineHeight: 1.18,
              fontWeight: 700,
            }}
          >
            {callToAction}
          </span>
          <span
            style={{
              fontSize: 26,
              color: palette.softText,
            }}
          >
            {siteUrl}
          </span>
        </div>
        <Waveform />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
