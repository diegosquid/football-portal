import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioFooter} from "./AudioFooter";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#020611",
  text: "#f8fafc",
  softText: "rgba(226,232,240,0.8)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  border: "rgba(255,255,255,0.1)",
  panel: "rgba(6, 14, 24, 0.82)",
  panelSoft: "rgba(255,255,255,0.06)",
};

const formatCategory = (category) =>
  String(category || "noticias")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const PRIME_PHASES = ["Gancho", "Contexto", "Pressão"];

const getKicker = (category) => {
  const formatted = formatCategory(category);
  const first = formatted.split(" ")[0] || "News";
  return first.toUpperCase();
};

const buildPrimePhases = (highlights) => {
  const count = Math.max(3, Array.isArray(highlights) ? Math.min(3, highlights.length || 0) : 0);
  return PRIME_PHASES.slice(0, count);
};

const Tracker = ({phases, activeIndex}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      {phases.map((phase, index) => {
        const active = index === activeIndex;
        return (
          <div
            key={`${phase}-${index}`}
            style={{
              minWidth: active ? 140 : 42,
              height: 42,
              padding: active ? "0 18px" : "0 14px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${active ? "rgba(250,204,21,0.5)" : palette.border}`,
              color: active ? palette.text : palette.softText,
              boxShadow: active ? "0 0 24px rgba(250,204,21,0.18)" : "none",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                whiteSpace: "nowrap",
                fontSize: active ? 18 : 15,
                fontWeight: 800,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              {active ? phase : index + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const NewsShortPrime = ({
  title,
  excerpt,
  category,
  siteName,
  siteUrl,
  followHandle,
  imageSrc,
  audioSrc,
  callToAction,
  followCallToAction,
  highlights = [],
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {damping: 180, stiffness: 110},
  });
  const imageScale = interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
    extrapolateRight: "clamp",
  });
  const imageY = interpolate(frame, [0, durationInFrames], [0, -60], {
    extrapolateRight: "clamp",
  });
  const contentY = interpolate(entrance, [0, 1], [80, 0]);
  const contentOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelScale = interpolate(entrance, [0, 1], [0.96, 1]);
  const scanY = interpolate(frame, [0, durationInFrames], [0, 280], {
    extrapolateRight: "clamp",
  });

  const phases = buildPrimePhases(highlights);
  const beatCount = Math.max(1, phases.length);
  const safeDuration = Math.max(1, durationInFrames - 96);
  const activeBeat = phases.length
    ? Math.min(phases.length - 1, Math.floor((frame / safeDuration) * beatCount))
    : 0;
  const progressWidth = `${((activeBeat + 1) / beatCount) * 100}%`;
  const kicker = getKicker(category);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        color: palette.text,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <AbsoluteFill
        style={{
          transform: `translateY(${imageY}px) scale(${imageScale})`,
        }}
      >
        <Img src={staticFile(imageSrc)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,17,0.2) 0%, rgba(2,6,17,0.34) 20%, rgba(2,6,17,0.72) 60%, rgba(2,6,17,0.98) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)",
          opacity: 0.22,
          mixBlendMode: "screen",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 14%, rgba(125,211,252,0.18), transparent 28%), radial-gradient(circle at 82% 70%, rgba(250,204,21,0.18), transparent 26%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 46,
          right: 46,
          top: 54 + Math.sin(frame / 16) * 16,
          height: 2,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(125,211,252,0), rgba(125,211,252,0.88), rgba(250,204,21,0.34), rgba(250,204,21,0))",
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 42,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 62,
          left: 62,
          right: 62,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: contentOpacity,
          transform: `translateY(${contentY * 0.35}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderRadius: 999,
            background: "rgba(6,14,24,0.62)",
            border: `1px solid ${palette.border}`,
            backdropFilter: "blur(14px)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: palette.accent,
              boxShadow: "0 0 18px rgba(250,204,21,0.7)",
            }}
          />
          <span
            style={{
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 800,
            }}
          >
            {siteName}
          </span>
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderRadius: 999,
            background: "rgba(6,14,24,0.62)",
            border: `1px solid ${palette.border}`,
            backdropFilter: "blur(14px)",
            fontSize: 19,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: palette.secondary,
            fontWeight: 800,
          }}
        >
          {formatCategory(category)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 196,
          opacity: contentOpacity * 0.18,
          transform: `translateY(${contentY * 0.2}px) scale(${interpolate(entrance, [0, 1], [1.2, 1])})`,
          transformOrigin: "left top",
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 900,
            letterSpacing: -12,
            lineHeight: 0.84,
            color: palette.accent,
            textShadow: "0 0 32px rgba(250,204,21,0.18)",
          }}
        >
          {kicker}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 62,
          top: 184,
          width: 276,
          height: 388,
          borderRadius: 34,
          overflow: "hidden",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 28px 50px rgba(0,0,0,0.32)",
          transform: `translateY(${contentY * 0.35}px) rotate(${interpolate(entrance, [0, 1], [7, 0])}deg) scale(${panelScale})`,
          opacity: contentOpacity,
        }}
      >
        <Img
          src={staticFile(imageSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${interpolate(frame, [0, durationInFrames], [1.08, 1.18], {
              extrapolateRight: "clamp",
            })})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(2,6,17,0.06) 0%, rgba(2,6,17,0.18) 36%, rgba(2,6,17,0.84) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 18,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 15,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: palette.softText,
              fontWeight: 800,
            }}
          >
            Resumo visual
          </span>
          <span
            style={{
              fontSize: 36,
              lineHeight: 0.95,
              fontWeight: 900,
              color: palette.accent,
            }}
          >
            {phases[activeBeat] || kicker}
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 360,
          top: 210,
          width: 120,
          height: 420,
          borderRadius: 30,
          background: "rgba(6,14,24,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
          opacity: contentOpacity,
          transform: `translateY(${contentY * 0.28}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 24,
            fontSize: 17,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: "rgba(248,250,252,0.5)",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          News Prime
        </div>
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 34,
            bottom: 34,
            width: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 47,
            top: 54 + scanY,
            width: 26,
            height: 122,
            borderRadius: 999,
            background:
              "linear-gradient(180deg, rgba(125,211,252,0), rgba(125,211,252,0.92) 25%, rgba(250,204,21,0.84) 85%, rgba(250,204,21,0))",
            opacity: 0.82,
            filter: "blur(2px)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          bottom: 62,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        <div
          style={{
            width: 220,
            height: 5,
            borderRadius: 999,
            background: "linear-gradient(90deg, #facc15 0%, #7dd3fc 100%)",
            boxShadow: "0 0 22px rgba(125,211,252,0.28)",
          }}
        />

        <div
          style={{
            maxWidth: 760,
            fontSize: 92,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: -3.6,
            textShadow: "0 14px 34px rgba(0,0,0,0.34)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            maxWidth: 700,
            fontSize: 31,
            lineHeight: 1.24,
            color: palette.softText,
          }}
        >
          {excerpt}
        </div>

        {phases.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginTop: 8,
            }}
          >
            <Tracker phases={phases} activeIndex={activeBeat} />
            <div
              style={{
                width: "100%",
                maxWidth: 560,
                height: 6,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: progressWidth,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #facc15 0%, #7dd3fc 100%)",
                  boxShadow: "0 0 18px rgba(250,204,21,0.24)",
                }}
              />
            </div>
          </div>
        )}

        <AudioFooter
          callToAction={callToAction}
          siteUrl={siteUrl}
          compact
          style={{
            marginTop: 6,
            background: "rgba(6,14,24,0.74)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      </div>

      <FollowEndCard callToAction={followCallToAction} followHandle={followHandle} />
    </AbsoluteFill>
  );
};
