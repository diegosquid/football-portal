import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./palette";

const MiniWaveform = ({color, frame}) => (
  <div style={{display: "flex", gap: 3, alignItems: "flex-end", height: 20}}>
    {new Array(5).fill(true).map((_, index) => {
      const height = 6 + Math.abs(Math.sin(frame / 3 + index * 1.1)) * 14;
      return (
        <div
          key={index}
          style={{
            width: 3,
            height,
            borderRadius: 999,
            background: color,
            opacity: 0.8,
          }}
        />
      );
    })}
  </div>
);

export const SpeakerIndicator = ({turnTimings = [], speakerColors = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Find active turn
  let activeTurn = null;
  for (const t of turnTimings) {
    if (frame >= t.startFrame && frame < t.startFrame + t.durationInFrames) {
      activeTurn = t;
      break;
    }
  }

  if (!activeTurn) return null;

  const localFrame = frame - activeTurn.startFrame;
  const color = speakerColors[activeTurn.speaker] || palette.accent;
  const displayName = activeTurn.speaker;

  const slideIn = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const fadeOut = interpolate(
    localFrame,
    [activeTurn.durationInFrames - 15, activeTurn.durationInFrames],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        zIndex: 30,
        opacity: fadeOut,
        transform: `translateX(${interpolate(slideIn, [0, 1], [-300, 0])}px)`,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 0}}>
        {/* Accent bar */}
        <div
          style={{
            width: 5,
            height: 52,
            background: color,
            borderRadius: "0 3px 3px 0",
            boxShadow: `0 0 16px ${color}`,
          }}
        />

        {/* Speaker panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 24px 12px 16px",
            background: palette.panel,
            backdropFilter: "blur(16px)",
            borderRadius: "0 14px 14px 0",
            border: `1px solid ${palette.border}`,
            borderLeft: "none",
          }}
        >
          {/* Speaker dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />

          {/* Speaker name */}
          <span
            style={{
              color: palette.text,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {displayName}
          </span>

          {/* Mini waveform */}
          <MiniWaveform color={color} frame={frame} />
        </div>
      </div>
    </div>
  );
};
