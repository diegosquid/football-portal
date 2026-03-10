import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const HighlightCard = ({
  text,
  appearAt = 0,
  visibleDuration = 120,
  side = "right",
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - appearAt;

  if (localFrame < 0 || localFrame > visibleDuration + 20) {
    return null;
  }

  const entrance = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const fadeOut = interpolate(
    localFrame,
    [visibleDuration, visibleDuration + 20],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );

  const isRight = side === "right";

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [isRight ? "right" : "left"]: 60,
        transform: `translateY(${interpolate(entrance, [0, 1], [40, -50])}%) scale(${interpolate(entrance, [0, 1], [0.95, 1])})`,
        opacity: fadeOut,
        zIndex: 15,
        maxWidth: 480,
      }}
    >
      <div
        style={{
          padding: "20px 28px",
          borderRadius: 16,
          background: "rgba(8, 22, 33, 0.88)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 3,
            background: palette.accent,
            borderRadius: 2,
            marginBottom: 12,
            boxShadow: `0 0 10px ${palette.accent}`,
          }}
        />
        <span
          style={{
            color: palette.text,
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: -0.4,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
