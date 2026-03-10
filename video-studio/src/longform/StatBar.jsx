import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const StatBar = ({
  label,
  value,
  maxValue,
  color = palette.accent,
  appearAt = 0,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = Math.max(0, frame - appearAt - delay);

  const fill = spring({
    frame: localFrame,
    fps,
    config: {damping: 200, stiffness: 60},
  });

  const percentage = (value / maxValue) * 100;
  const currentWidth = interpolate(fill, [0, 1], [0, percentage]);
  const currentValue = Math.round(interpolate(fill, [0, 1], [0, value]));

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{opacity, marginBottom: 16}}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: palette.softText,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: palette.text,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {currentValue}
        </span>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${currentWidth}%`,
            borderRadius: 6,
            background: color,
            boxShadow: `0 0 16px ${color}`,
          }}
        />
      </div>
    </div>
  );
};
