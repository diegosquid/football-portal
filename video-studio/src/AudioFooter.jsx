import React from "react";
import {useCurrentFrame} from "remotion";

const palette = {
  accent: "#facc15",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.76)",
};

export const AudioFooter = ({
  callToAction,
  siteUrl,
  compact = false,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const bars = compact ? 14 : 18;
  const gap = compact ? 7 : 8;
  const width = compact ? 7 : 8;
  const maxHeight = compact ? 42 : 54;
  const minHeight = compact ? 12 : 14;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: compact ? 20 : 24,
        padding: compact ? "24px 26px" : "30px 32px",
        borderRadius: compact ? 28 : 34,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(8, 22, 33, 0.76)",
        backdropFilter: "blur(18px)",
        ...style,
      }}
    >
      <div style={{display: "flex", flexDirection: "column", gap: compact ? 6 : 8}}>
        <span
          style={{
            color: palette.accent,
            fontSize: compact ? 20 : 24,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Chamada final
        </span>
        <span
          style={{
            fontSize: compact ? 30 : 34,
            lineHeight: 1.16,
            fontWeight: 700,
            color: palette.text,
          }}
        >
          {callToAction}
        </span>
        <span
          style={{
            fontSize: compact ? 23 : 26,
            color: palette.softText,
          }}
        >
          {siteUrl}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap,
          alignItems: "flex-end",
          height: maxHeight,
        }}
      >
        {new Array(bars).fill(true).map((_, index) => {
          const phase = frame / 3 + index * 0.9;
          const height = minHeight + Math.abs(Math.sin(phase)) * (maxHeight - minHeight);
          const active = index % 3 === 0;
          return (
            <div
              key={index}
              style={{
                width,
                height,
                borderRadius: 999,
                background: active ? palette.accent : "rgba(255,255,255,0.48)",
                boxShadow: active ? `0 0 18px ${palette.accent}` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
