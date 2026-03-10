import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette, speakerColors} from "./palette";

export const QuoteCallout = ({
  text,
  speaker,
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

  const color = speakerColors[speaker] || palette.accent;
  const isRight = side === "right";

  return (
    <div
      style={{
        position: "absolute",
        top: "42%",
        [isRight ? "right" : "left"]: 50,
        zIndex: 20,
        opacity: fadeOut,
        transform: `translateY(${interpolate(entrance, [0, 1], [30, 0])}px) scale(${interpolate(entrance, [0, 1], [0.96, 1])})`,
        maxWidth: 440,
      }}
    >
      <div
        style={{
          padding: "18px 24px",
          borderRadius: 14,
          background: "rgba(8, 22, 33, 0.9)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 10px 36px rgba(0,0,0,0.3)",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: 28,
            height: 3,
            borderRadius: 2,
            background: color,
            marginBottom: 10,
            boxShadow: `0 0 10px ${color}`,
          }}
        />

        {/* Quote text */}
        <span
          style={{
            color: palette.text,
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: -0.3,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
