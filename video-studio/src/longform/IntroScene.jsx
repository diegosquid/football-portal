import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const IntroScene = ({
  title,
  category,
  siteName,
  imageSrc,
  startFrame,
  durationInFrames,
  kenBurns,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) {
    return null;
  }

  const progress = localFrame / durationInFrames;

  // Ken Burns
  const zoomFrom = kenBurns?.zoomIn ? 1.0 : 1.12;
  const zoomTo = kenBurns?.zoomIn ? 1.12 : 1.0;
  const scale = interpolate(localFrame, [0, durationInFrames], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
  });
  const panX = interpolate(
    localFrame,
    [0, durationInFrames],
    kenBurns?.panX || [0, -20],
    {extrapolateRight: "clamp"}
  );
  const panY = interpolate(
    localFrame,
    [0, durationInFrames],
    kenBurns?.panY || [0, -15],
    {extrapolateRight: "clamp"}
  );

  // Animations
  const overlayIn = interpolate(localFrame, [0, 30], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoIn = spring({
    frame: Math.max(0, localFrame - 10),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const badgeIn = spring({
    frame: Math.max(0, localFrame - 30),
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const titleIn = spring({
    frame: Math.max(0, localFrame - 50),
    fps,
    config: {damping: 200, stiffness: 80},
  });

  // Fade out at the end
  const fadeOut = interpolate(localFrame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      {/* Background image with Ken Burns */}
      <AbsoluteFill>
        <Img
          src={staticFile(imageSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          }}
        />
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(6,19,29,${overlayIn * 0.4}) 0%, rgba(6,19,29,${overlayIn * 0.6}) 40%, rgba(6,19,29,${overlayIn * 0.95}) 100%)`,
        }}
      />

      {/* Radial accents */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(250,204,21,0.12), transparent 30%), radial-gradient(circle at 20% 80%, rgba(125,211,252,0.1), transparent 30%)",
          opacity: overlayIn,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Site name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: interpolate(logoIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(logoIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: `0 0 16px ${palette.accent}`,
            }}
          />
          <span
            style={{
              color: palette.softText,
              fontSize: 22,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {siteName}
          </span>
        </div>

        {/* Category badge */}
        <div
          style={{
            opacity: interpolate(badgeIn, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(badgeIn, [0, 1], [-30, 0])}px)`,
          }}
        >
          <span
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              background: `${palette.accent}22`,
              border: `1px solid ${palette.accent}44`,
              color: palette.accent,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {formatCategory(category)}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            maxWidth: 1400,
            fontSize: 64,
            lineHeight: 1.08,
            fontWeight: 900,
            letterSpacing: -2,
            color: palette.text,
            textShadow: "0 4px 30px rgba(0,0,0,0.4)",
            opacity: interpolate(titleIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
