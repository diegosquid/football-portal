import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";

export const TransitionOverlay = ({startFrame, durationFrames = 30}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > durationFrames) {
    return null;
  }

  const opacity = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `rgba(6, 19, 29, ${opacity})`,
        zIndex: 50,
      }}
    />
  );
};
