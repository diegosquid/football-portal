import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FollowEndCard} from "./FollowEndCard";
import {SpeakerIndicator} from "./podcast/SpeakerIndicator";
import {QuoteCallout} from "./podcast/QuoteCallout";

const palette = {
  bg: "#06131d",
  card: "rgba(8, 22, 33, 0.82)",
  cardBorder: "rgba(255,255,255,0.14)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.78)",
  panel: "rgba(8, 22, 33, 0.92)",
  border: "rgba(255,255,255,0.12)",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

/* ── Dual-speaker waveform ──────────────────────────────────────────── */
const DualWaveform = ({speakerColors}) => {
  const frame = useCurrentFrame();
  const fernandaColor = speakerColors?.Fernanda || palette.accent;
  const ricardoColor = speakerColors?.Ricardo || palette.secondary;

  return (
    <div style={{display: "flex", gap: 7, alignItems: "flex-end", height: 48}}>
      {new Array(16).fill(true).map((_, index) => {
        const phase = frame / 3 + index * 0.85;
        const height = 12 + Math.abs(Math.sin(phase)) * 32;
        const color = index % 2 === 0 ? fernandaColor : ricardoColor;
        return (
          <div
            key={index}
            style={{
              width: 7,
              height,
              borderRadius: 999,
              background: color,
              opacity: 0.85,
              boxShadow: index % 4 === 0 ? `0 0 14px ${color}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

/* ── Active speaker text overlay ────────────────────────────────────── */
const ActiveSpeakerText = ({turnTimings = [], speakerColors = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

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

  const slideIn = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: {damping: 200, stiffness: 100},
  });

  const fadeOut = interpolate(
    localFrame,
    [activeTurn.durationInFrames - 12, activeTurn.durationInFrames],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );

  // Show snippet of what's being said
  const text = activeTurn.text || "";
  const displayText = text.length > 100 ? text.slice(0, 97) + "…" : text;

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 310,
        zIndex: 25,
        opacity: fadeOut,
        transform: `translateY(${interpolate(slideIn, [0, 1], [20, 0])}px)`,
      }}
    >
      <div
        style={{
          padding: "20px 26px",
          borderRadius: 20,
          background: "rgba(6, 19, 29, 0.88)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Speaker name bar */}
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
          <span
            style={{
              color,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {activeTurn.speaker}
          </span>
        </div>

        {/* Quote text */}
        <span
          style={{
            color: palette.text,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.28,
            letterSpacing: -0.4,
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
};

/* ── Main composition ───────────────────────────────────────────────── */
export const PodcastShort = (props) => {
  const {
    title,
    excerpt,
    category,
    siteName,
    siteUrl,
    followHandle,
    imageSrc,
    audioSrc,
    speakerColors: propColors,
    allTurnTimings = [],
    quotes = [],
    followCallToAction,
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const speakerColors = propColors || {Fernanda: palette.accent, Ricardo: palette.secondary};

  const entrance = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 120},
  });

  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.08], {extrapolateRight: "clamp"});
  const titleOpacity = interpolate(frame, [6, 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const bottomOpacity = interpolate(frame, [18, 42], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cardY = interpolate(entrance, [0, 1], [60, 0]);
  const cardScale = interpolate(entrance, [0, 1], [0.94, 1]);

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
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          filter: "blur(32px) saturate(1.2)",
          opacity: 0.55,
        }}
      >
        <Img
          src={staticFile(imageSrc)}
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>

      {/* Dark gradient */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.6) 35%, rgba(2,6,23,0.95) 100%)",
        }}
      />

      {/* Accent radials */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at top right, rgba(250,204,21,0.14), transparent 24%), radial-gradient(circle at left center, rgba(125,211,252,0.12), transparent 30%)",
        }}
      />

      {/* Thin border frame */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 38,
          pointerEvents: "none",
        }}
      />

      {/* ── Top: site name + category + PODCAST badge ─────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 68,
          right: 68,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: palette.softText,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: palette.accent,
              boxShadow: `0 0 16px ${palette.accent}`,
            }}
          />
          <span>{siteName}</span>
        </div>
        <div style={{display: "flex", gap: 10}}>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(250,204,21,0.15)",
              border: "1px solid rgba(250,204,21,0.3)",
              fontSize: 20,
              fontWeight: 800,
              color: palette.accent,
              textTransform: "uppercase",
              letterSpacing: 1.4,
            }}
          >
            Podcast
          </div>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${palette.cardBorder}`,
              background: "rgba(255,255,255,0.06)",
              fontSize: 20,
              color: palette.secondary,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {formatCategory(category)}
          </div>
        </div>
      </div>

      {/* ── Center: image card + title ────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 68,
          right: 68,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
        }}
      >
        {/* Image card */}
        <div style={{position: "relative"}}>
          <div
            style={{
              position: "absolute",
              inset: -16,
              borderRadius: 48,
              background: "linear-gradient(135deg, rgba(125,211,252,0.16), rgba(250,204,21,0.16))",
              filter: "blur(24px)",
            }}
          />
          <div
            style={{
              position: "relative",
              height: 580,
              borderRadius: 36,
              overflow: "hidden",
              border: `1px solid ${palette.cardBorder}`,
              background: palette.card,
              boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${interpolate(frame, [0, durationInFrames], [1.04, 1.12])})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(4,11,18,0.04) 0%, rgba(4,11,18,0.14) 50%, rgba(4,11,18,0.7) 100%)",
              }}
            />

            {/* Speaker names over image bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 24,
                display: "flex",
                gap: 14,
                opacity: 0.9,
              }}
            >
              {Object.entries(speakerColors).map(([name, color]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(6,19,29,0.8)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                  <span style={{fontSize: 20, fontWeight: 700, color: palette.text}}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Title + excerpt */}
        <div style={{display: "flex", flexDirection: "column", gap: 16, opacity: titleOpacity}}>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: -2,
              textShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              maxWidth: 860,
              fontSize: 30,
              lineHeight: 1.3,
              color: palette.softText,
            }}
          >
            {excerpt}
          </div>
        </div>
      </div>

      {/* ── Speaker indicator badge (bottom-left) ─────────────────────── */}
      <SpeakerIndicator turnTimings={allTurnTimings} speakerColors={speakerColors} />

      {/* ── Quote callouts ────────────────────────────────────────────── */}
      {quotes.map((quote, index) => (
        <QuoteCallout
          key={index}
          text={quote.text}
          speaker={quote.speaker}
          appearAt={quote.appearAtFrame}
          visibleDuration={quote.durationFrames || 100}
          side={index % 2 === 0 ? "right" : "left"}
        />
      ))}

      {/* ── Bottom CTA bar ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 68,
          right: 68,
          bottom: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "24px 28px",
          borderRadius: 28,
          border: `1px solid ${palette.cardBorder}`,
          background: "rgba(8, 22, 33, 0.8)",
          backdropFilter: "blur(18px)",
          opacity: bottomOpacity,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span
            style={{
              color: palette.accent,
              fontSize: 20,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            Matéria completa
          </span>
          <span style={{fontSize: 28, fontWeight: 700, lineHeight: 1.14}}>
            Leia no site
          </span>
          <span style={{fontSize: 22, color: palette.softText}}>{siteUrl}</span>
        </div>
        <DualWaveform speakerColors={speakerColors} />
      </div>

      {/* ── Follow end card (last ~2.4s) ──────────────────────────────── */}
      <FollowEndCard
        callToAction={followCallToAction || "Para mais notícias de futebol, siga o canal"}
        followHandle={followHandle}
      />
    </AbsoluteFill>
  );
};
