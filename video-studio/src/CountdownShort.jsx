import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {FollowEndCard} from "./FollowEndCard";

const palette = {
  bg: "#030712",
  card: "rgba(8, 22, 33, 0.88)",
  cardBorder: "rgba(255,255,255,0.12)",
  accent: "#facc15",
  secondary: "#7dd3fc",
  text: "#f8fafc",
  softText: "rgba(248,250,252,0.72)",
  gold: "#facc15",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
};

const rankColors = {
  1: palette.gold,
  2: palette.silver,
  3: palette.bronze,
};

/**
 * CountdownShort — Ranking animado (5→4→3→2→1) sincronizado com áudio
 *
 * Props:
 *   items: [{ rank, name, stat, imageSrc?, subtitle?, startFrame, durationFrames }]
 *   introEndFrame: frame em que o intro termina (sincronizado com áudio)
 *   title, category, audioSrc, siteName, siteUrl, followHandle, followCallToAction
 */
export const CountdownShort = ({
  title,
  category,
  siteName,
  siteUrl,
  followHandle,
  followCallToAction,
  audioSrc,
  items = [],
  introEndFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Intro usa timing real do áudio, ou fallback pra 2.5s
  const introFrames = introEndFrame || Math.round(fps * 2.5);

  // ── Intro ──
  const introOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introScale = interpolate(
    spring({frame, fps, config: {damping: 180, stiffness: 120}}),
    [0, 1],
    [0.85, 1]
  );
  const introExit = interpolate(frame, [introFrames - 12, introFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background pulse
  const bgPulse = 0.02 * Math.sin(frame / 40);

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
        background: palette.bg,
      }}
    >
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* Background gradient animado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% ${30 + bgPulse * 200}%, rgba(250,204,21,0.08) 0%, transparent 50%),
                       radial-gradient(ellipse at 20% 80%, rgba(125,211,252,0.06) 0%, transparent 40%)`,
        }}
      />

      {/* Border frame */}
      <div
        style={{
          position: "absolute",
          inset: 36,
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 36,
        }}
      />

      {/* ── INTRO SCREEN ── */}
      {frame < introFrames && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: introOpacity * introExit,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 180,
              padding: "14px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: palette.secondary,
              fontSize: 22,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {String(category || "curiosidades")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </div>

          <div
            style={{
              maxWidth: 860,
              textAlign: "center",
              fontSize: 82,
              lineHeight: 0.96,
              fontWeight: 900,
              letterSpacing: -3,
              transform: `scale(${introScale})`,
              padding: "0 60px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              width: 200,
              height: 4,
              borderRadius: 999,
              marginTop: 32,
              background: `linear-gradient(90deg, ${palette.accent}, rgba(250,204,21,0.1))`,
            }}
          />

          <div
            style={{
              marginTop: 28,
              fontSize: 24,
              color: palette.softText,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {siteName}
          </div>
        </AbsoluteFill>
      )}

      {/* ── COUNTDOWN ITEMS (sincronizados com áudio) ── */}
      {items.map((item, index) => {
        // Usa timings reais do áudio quando disponíveis
        const itemStart = item.startFrame != null ? item.startFrame : introFrames + index * 150;
        const itemDur = item.durationFrames || 150;
        const itemEnd = itemStart + itemDur;
        const relFrame = frame - itemStart;
        const isVisible = frame >= itemStart && frame < itemEnd;

        if (!isVisible) return null;

        const rank = item.rank || items.length - index;
        const rankColor = rankColors[rank] || palette.accent;
        const isTop1 = rank === 1;

        // Animações de entrada
        const cardSpring = spring({
          frame: relFrame,
          fps,
          config: {damping: isTop1 ? 140 : 180, stiffness: isTop1 ? 100 : 140},
        });
        const cardY = interpolate(cardSpring, [0, 1], [120, 0]);
        const cardOpacity = interpolate(relFrame, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Número grande — entra com zoom
        const numSpring = spring({
          frame: Math.max(0, relFrame - 4),
          fps,
          config: {damping: 120, stiffness: isTop1 ? 80 : 120},
        });
        const numScale = interpolate(numSpring, [0, 1], [isTop1 ? 3 : 2, 1]);
        const numOpacity = interpolate(relFrame, [2, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Stat bar grows (proporcional à duração do segmento)
        const barGrowEnd = Math.min(40, Math.floor(itemDur * 0.4));
        const barWidth = interpolate(relFrame, [14, 14 + barGrowEnd], [0, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Exit fade (últimos 10 frames do segmento)
        const exitOpacity = interpolate(relFrame, [itemDur - 10, itemDur], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Flash pra #1
        const flashOpacity = isTop1
          ? interpolate(relFrame, [0, 6, 14], [0.6, 0.6, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Shake pro #1
        const shakeX = isTop1 && relFrame < 10 ? Math.sin(relFrame * 4) * 4 : 0;
        const shakeY = isTop1 && relFrame < 10 ? Math.cos(relFrame * 5) * 3 : 0;

        return (
          <AbsoluteFill key={index} style={{opacity: cardOpacity * exitOpacity}}>
            {isTop1 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 50% 40%, ${palette.gold}, transparent 70%)`,
                  opacity: flashOpacity,
                }}
              />
            )}

            {/* Número gigante no fundo */}
            <div
              style={{
                position: "absolute",
                top: 160,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                opacity: numOpacity * 0.12,
                transform: `scale(${numScale * 1.8})`,
              }}
            >
              <span
                style={{
                  fontSize: 500,
                  fontWeight: 900,
                  color: rankColor,
                  lineHeight: 0.8,
                }}
              >
                {rank}
              </span>
            </div>

            {/* Card principal */}
            <div
              style={{
                position: "absolute",
                top: 280,
                left: 60,
                right: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                transform: `translateY(${cardY}px) translate(${shakeX}px, ${shakeY}px)`,
              }}
            >
              {/* Rank number */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: numOpacity,
                  transform: `scale(${numScale})`,
                }}
              >
                <span
                  style={{
                    fontSize: isTop1 ? 160 : 120,
                    fontWeight: 900,
                    color: rankColor,
                    lineHeight: 0.85,
                    textShadow: isTop1
                      ? `0 0 60px ${rankColor}, 0 0 120px rgba(250,204,21,0.3)`
                      : `0 0 30px rgba(250,204,21,0.15)`,
                  }}
                >
                  {rank}
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: palette.softText,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {rank === 1 ? "º lugar" : "º"}
                </span>
              </div>

              {/* Imagem do item */}
              {item.imageSrc && (
                <div
                  style={{
                    width: 280,
                    height: 280,
                    borderRadius: 24,
                    overflow: "hidden",
                    border: `3px solid ${rankColor}`,
                    boxShadow: `0 0 40px rgba(0,0,0,0.4), 0 0 20px ${rankColor}33`,
                  }}
                >
                  <Img
                    src={staticFile(item.imageSrc)}
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                </div>
              )}

              {/* Nome */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: isTop1 ? 72 : 62,
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: -2,
                  maxWidth: 800,
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {item.name}
              </div>

              {/* Subtitle */}
              {item.subtitle && (
                <div
                  style={{
                    fontSize: 28,
                    color: palette.softText,
                    textAlign: "center",
                    maxWidth: 700,
                  }}
                >
                  {item.subtitle}
                </div>
              )}

              {/* Stat com barra animada */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  maxWidth: 700,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: isTop1 ? 56 : 46,
                    fontWeight: 900,
                    color: rankColor,
                    letterSpacing: -1,
                    textShadow: isTop1 ? `0 0 30px ${rankColor}` : "none",
                  }}
                >
                  {item.stat}
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${rankColor}, ${rankColor}88)`,
                      boxShadow: `0 0 14px ${rankColor}66`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Dots de posição */}
            <div
              style={{
                position: "absolute",
                bottom: 200,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 14,
              }}
            >
              {items.map((_, dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    width: dotIdx === index ? 32 : 12,
                    height: 12,
                    borderRadius: 999,
                    background:
                      dotIdx === index ? palette.accent : "rgba(255,255,255,0.2)",
                    boxShadow:
                      dotIdx === index ? `0 0 12px ${palette.accent}` : "none",
                  }}
                />
              ))}
            </div>

            {/* Site branding */}
            <div
              style={{
                position: "absolute",
                bottom: 120,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: palette.softText,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {siteName || "Beira do Campo"}
              </span>
            </div>
          </AbsoluteFill>
        );
      })}

      <FollowEndCard
        callToAction={followCallToAction || "Para mais curiosidades de futebol, siga o canal"}
        followHandle={followHandle || "@beiradocampotv"}
      />
    </AbsoluteFill>
  );
};
