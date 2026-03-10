import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {palette, speakerColors} from "./palette";

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const PodcastIntroScene = ({
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

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  // Ken Burns
  const zoomFrom = kenBurns?.zoomIn ? 1.0 : 1.12;
  const zoomTo = kenBurns?.zoomIn ? 1.12 : 1.0;
  const scale = interpolate(localFrame, [0, durationInFrames], [zoomFrom, zoomTo], {extrapolateRight: "clamp"});
  const panX = interpolate(localFrame, [0, durationInFrames], kenBurns?.panX || [0, -15], {extrapolateRight: "clamp"});
  const panY = interpolate(localFrame, [0, durationInFrames], kenBurns?.panY || [0, -10], {extrapolateRight: "clamp"});

  // Animations
  const overlayIn = interpolate(localFrame, [0, 25], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const badgeIn = spring({
    frame: Math.max(0, localFrame - 15),
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const titleIn = spring({
    frame: Math.max(0, localFrame - 35),
    fps,
    config: {damping: 200, stiffness: 80},
  });

  const speakersIn = spring({
    frame: Math.max(0, localFrame - 60),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const fadeOut = interpolate(localFrame, [durationInFrames - 30, durationInFrames], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      {/* Background image */}
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
          background: `linear-gradient(180deg, rgba(6,19,29,${overlayIn * 0.5}) 0%, rgba(6,19,29,${overlayIn * 0.7}) 40%, rgba(6,19,29,${overlayIn * 0.96}) 100%)`,
        }}
      />

      {/* Radial accents */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 75% 25%, rgba(250,204,21,0.1), transparent 28%), radial-gradient(circle at 25% 75%, rgba(125,211,252,0.08), transparent 28%)",
          opacity: overlayIn,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Badge: PODCAST + Category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: interpolate(badgeIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(badgeIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              background: `${palette.accent}33`,
              border: `1px solid ${palette.accent}55`,
              color: palette.accent,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}
          >
            Podcast
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${palette.border}`,
              color: palette.softText,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {formatCategory(category)}
          </span>
          <span
            style={{
              color: palette.softText,
              fontSize: 16,
              letterSpacing: 0.8,
            }}
          >
            {siteName}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            maxWidth: 1400,
            fontSize: 56,
            lineHeight: 1.08,
            fontWeight: 900,
            letterSpacing: -2,
            color: palette.text,
            textShadow: "0 4px 24px rgba(0,0,0,0.4)",
            opacity: interpolate(titleIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
          }}
        >
          {title}
        </div>

        {/* Speakers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 8,
            opacity: interpolate(speakersIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(speakersIn, [0, 1], [15, 0])}px)`,
          }}
        >
          {/* Fernanda */}
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: speakerColors.Fernanda,
                boxShadow: `0 0 10px ${speakerColors.Fernanda}`,
              }}
            />
            <span style={{color: speakerColors.Fernanda, fontSize: 18, fontWeight: 700}}>
              Fernanda
            </span>
          </div>

          <span style={{color: palette.softText, fontSize: 16}}>+</span>

          {/* Ricardo */}
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: speakerColors.Ricardo,
                boxShadow: `0 0 10px ${speakerColors.Ricardo}`,
              }}
            />
            <span style={{color: speakerColors.Ricardo, fontSize: 18, fontWeight: 700}}>
              Ricardo
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
