import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

export const ProgressBar = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: "rgba(255,255,255,0.08)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.secondary})`,
          boxShadow: `0 0 12px ${palette.accent}`,
        }}
      />
    </div>
  );
};
