import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const TopicCard = ({heading, appearAt = 0, visibleDuration = 150}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - appearAt;

  if (!heading || localFrame < 0 || localFrame > visibleDuration + 20) {
    return null;
  }

  const entrance = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const fadeOut = interpolate(
    localFrame,
    [visibleDuration, visibleDuration + 20],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        right: 40,
        zIndex: 25,
        opacity: fadeOut,
        transform: `translateY(${interpolate(entrance, [0, 1], [-30, 0])}px)`,
        maxWidth: 520,
      }}
    >
      <div
        style={{
          padding: "14px 22px",
          borderRadius: 14,
          background: palette.panel,
          backdropFilter: "blur(16px)",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: `0 0 8px ${palette.accent}`,
            }}
          />
          <span
            style={{
              color: palette.accent,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Em pauta
          </span>
        </div>
        <span
          style={{
            color: palette.text,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -0.3,
          }}
        >
          {heading}
        </span>
      </div>
    </div>
  );
};
