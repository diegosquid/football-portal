import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#020617",
  sideA: "#3b82f6",
  sideAGlow: "rgba(59,130,246,0.35)",
  sideB: "#ef4444",
  sideBGlow: "rgba(239,68,68,0.35)",
  vs: "#facc15",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.72)",
  cardBg: "rgba(8,20,36,0.88)",
  border: "rgba(255,255,255,0.1)",
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const VsBadge = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 4) * 0.06;
  const glow = 0.5 + Math.sin(frame / 3) * 0.3;
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${palette.sideA}, ${palette.vs}, ${palette.sideB})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pulse})`,
        boxShadow: `0 0 ${40 + glow * 20}px rgba(250,204,21,${0.3 + glow * 0.2})`,
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: "#020617",
          letterSpacing: -2,
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        VS
      </span>
    </div>
  );
};

const StatItem = ({text, color, delay, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = 30 + delay + index * 8;
  const entrance = spring({frame: Math.max(0, frame - startFrame), fps, config: {damping: 200, stiffness: 100}});
  const opacity = clamp(interpolate(frame, [startFrame, startFrame + 12], [0, 1]), 0, 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `translateX(${interpolate(entrance, [0, 1], [20, 0])}px)`,
      }}
    >
      <div style={{width: 8, height: 8, borderRadius: 999, backgroundColor: color, boxShadow: `0 0 10px ${color}`, flexShrink: 0}} />
      <span style={{fontSize: 28, lineHeight: 1.2, color: palette.text, fontWeight: 600}}>{text}</span>
    </div>
  );
};

const SidePanel = ({name, stats, color, glowColor, side, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: Math.max(0, frame - delay), fps, config: {damping: 180, stiffness: 120}});
  const slideX = interpolate(entrance, [0, 1], [side === "left" ? -60 : 60, 0]);
  const opacity = clamp(interpolate(frame, [delay, delay + 16], [0, 1]), 0, 1);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "32px 20px",
        opacity,
        transform: `translateX(${slideX}px)`,
      }}
    >
      {/* Name */}
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          color,
          textAlign: "center",
          letterSpacing: -1,
          textShadow: `0 0 24px ${glowColor}`,
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>

      {/* Divider */}
      <div style={{width: 60, height: 3, borderRadius: 2, background: color, opacity: 0.6}} />

      {/* Stats */}
      <div style={{display: "flex", flexDirection: "column", gap: 16, width: "100%"}}>
        {(stats || []).map((stat, i) => (
          <StatItem key={i} text={stat} color={color} delay={delay} index={i} />
        ))}
      </div>
    </div>
  );
};

export const NewsShortVersus = (props) => {
  const {
    title,
    siteName,
    siteUrl,
    followHandle,
    imageSrc,
    audioSrc,
    followCallToAction,
    versusData,
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.08], {extrapolateRight: "clamp"});
  const headerOpacity = clamp(interpolate(frame, [4, 16], [0, 1]), 0, 1);
  const titleOpacity = clamp(interpolate(frame, [8, 22], [0, 1]), 0, 1);
  const vsEntrance = spring({frame: Math.max(0, frame - 14), fps, config: {damping: 120, stiffness: 160}});
  const vsScale = interpolate(vsEntrance, [0, 1], [0, 1]);
  const bottomOpacity = clamp(interpolate(frame, [24, 44], [0, 1]), 0, 1);

  const sideA = versusData?.sideA || {name: "Time A", stats: ["Dado 1", "Dado 2", "Dado 3"]};
  const sideB = versusData?.sideB || {name: "Time B", stats: ["Dado 1", "Dado 2", "Dado 3"]};

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      {/* Background image blurred */}
      <AbsoluteFill style={{transform: `scale(${bgScale})`, filter: "blur(44px) saturate(0.8) brightness(0.5)", opacity: 0.45}}>
        <Img src={staticFile(imageSrc)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.85) 50%, rgba(2,6,23,0.97) 100%)"}} />

      {/* Split color accents - blue left, red right */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, ${palette.sideAGlow} 0%, transparent 30%, transparent 70%, ${palette.sideBGlow} 100%)`,
          opacity: 0.4 + Math.sin(frame / 6) * 0.1,
        }}
      />

      {/* Top header */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOpacity,
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 14, fontSize: 26, letterSpacing: 1.2, textTransform: "uppercase", color: palette.softText}}>
          <span style={{width: 12, height: 12, borderRadius: 999, backgroundColor: palette.vs, boxShadow: `0 0 18px ${palette.vs}`}} />
          <span>{siteName}</span>
        </div>
        <div
          style={{
            padding: "14px 26px",
            borderRadius: 999,
            border: `1px solid ${palette.border}`,
            background: "rgba(250,204,21,0.1)",
            fontSize: 24,
            color: palette.vs,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            fontWeight: 800,
          }}
        >
          Versus
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 64,
          right: 64,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 58,
            lineHeight: 1.0,
            fontWeight: 900,
            letterSpacing: -2,
            textAlign: "center",
            textShadow: "0 6px 24px rgba(0,0,0,0.4)",
          }}
        >
          {title}
        </div>
      </div>

      {/* VS Section - two panels with VS badge in middle */}
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 40,
          right: 40,
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
        }}
      >
        <SidePanel name={sideA.name} stats={sideA.stats} color={palette.sideA} glowColor={palette.sideAGlow} side="left" delay={12} />

        <div style={{display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40, transform: `scale(${vsScale})`}}>
          <VsBadge />
        </div>

        <SidePanel name={sideB.name} stats={sideB.stats} color={palette.sideB} glowColor={palette.sideBGlow} side="right" delay={18} />
      </div>

      {/* Center divider line */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: "50%",
          width: 2,
          height: 720,
          marginLeft: -1,
          background: `linear-gradient(180deg, transparent, rgba(250,204,21,0.3) 20%, rgba(250,204,21,0.3) 80%, transparent)`,
          opacity: clamp(interpolate(frame, [20, 36], [0, 0.6]), 0, 0.6),
        }}
      />

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "28px 32px",
          borderRadius: 34,
          border: `1px solid ${palette.border}`,
          background: "rgba(8, 20, 36, 0.82)",
          backdropFilter: "blur(18px)",
          opacity: bottomOpacity,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 6}}>
          <span style={{color: palette.vs, fontSize: 26, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 800}}>
            Quem leva essa?
          </span>
          <span style={{fontSize: 32, lineHeight: 1.18, fontWeight: 700}}>
            Comenta aí!
          </span>
          <span style={{fontSize: 24, color: palette.softText}}>{siteUrl}</span>
        </div>
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
