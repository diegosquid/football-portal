import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {palette} from "./palette";
import {LowerThird} from "./LowerThird";
import {HighlightCard} from "./HighlightCard";
import {StatBar} from "./StatBar";

export const ContentScene = ({
  heading,
  imageSrc,
  startFrame,
  durationInFrames,
  kenBurns,
  highlights = [],
  stats = [],
  sceneIndex = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) {
    return null;
  }

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

  // Fade in/out
  const fadeIn = interpolate(localFrame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(localFrame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const hasStats = stats.length > 0;

  return (
    <AbsoluteFill style={{opacity}}>
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

      {/* Dark gradient overlay */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,19,29,0.3) 0%, rgba(6,19,29,0.5) 50%, rgba(6,19,29,0.85) 100%)",
        }}
      />

      {/* Accent radials */}
      <AbsoluteFill
        style={{
          background:
            sceneIndex % 2 === 0
              ? "radial-gradient(circle at 90% 70%, rgba(250,204,21,0.08), transparent 30%)"
              : "radial-gradient(circle at 10% 30%, rgba(125,211,252,0.08), transparent 30%)",
        }}
      />

      {/* Lower third — section heading */}
      {heading && (
        <LowerThird
          heading={heading}
          appearAt={15}
          visibleDuration={Math.min(90, durationInFrames - 60)}
        />
      )}

      {/* Highlight cards */}
      {highlights.map((highlight, index) => (
        <HighlightCard
          key={index}
          text={highlight.text}
          appearAt={highlight.appearAtFrame || 60 + index * 120}
          visibleDuration={highlight.durationFrames || 120}
          side={index % 2 === 0 ? "right" : "left"}
        />
      ))}

      {/* Stat bars — for analysis articles */}
      {hasStats && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: 80,
            right: 80,
            padding: "28px 36px",
            borderRadius: 20,
            background: "rgba(8, 22, 33, 0.9)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${palette.border}`,
            zIndex: 10,
          }}
        >
          {stats.map((stat, index) => (
            <StatBar
              key={index}
              label={stat.label}
              value={stat.value}
              maxValue={stat.maxValue}
              color={stat.color || palette.accent}
              appearAt={30}
              delay={index * 10}
            />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
