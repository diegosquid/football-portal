import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const LowerThird = ({heading, appearAt = 0, visibleDuration = 90}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - appearAt;

  if (localFrame < 0 || localFrame > visibleDuration + 30) {
    return null;
  }

  const barIn = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const textOpacity = interpolate(localFrame, [8, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    localFrame,
    [visibleDuration, visibleDuration + 30],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 0,
        opacity: fadeOut,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          transform: `translateX(${interpolate(barIn, [0, 1], [-400, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 6,
            height: 56,
            background: palette.accent,
            borderRadius: "0 3px 3px 0",
            boxShadow: `0 0 20px ${palette.accent}`,
          }}
        />
        <div
          style={{
            padding: "14px 32px 14px 20px",
            background: palette.panel,
            backdropFilter: "blur(16px)",
            borderRadius: "0 12px 12px 0",
            border: `1px solid ${palette.border}`,
            borderLeft: "none",
            opacity: textOpacity,
          }}
        >
          <span
            style={{
              color: palette.text,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            {heading}
          </span>
        </div>
      </div>
    </div>
  );
};
