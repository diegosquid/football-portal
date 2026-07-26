import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const palette = {
  ink: "#09010f",
  night: "#160020",
  plum: "#31063d",
  purple: "#930089",
  magenta: "#d84bea",
  violet: "#7f2dff",
  gold: "#ffd84d",
  mint: "#7fffd4",
  text: "#fff9ff",
  muted: "rgba(255,249,255,0.7)",
  faint: "rgba(255,249,255,0.46)",
  glass: "rgba(255,255,255,0.085)",
  glassStrong: "rgba(255,255,255,0.13)",
  border: "rgba(255,255,255,0.2)",
  ballText: "#760071",
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const BackgroundSystem = () => {
  const frame = useCurrentFrame();
  const scanY = interpolate(frame % 180, [0, 180], [-220, 1920], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(155deg, ${palette.ink} 0%, ${palette.plum} 38%, ${palette.night} 72%, #050008 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.22,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 108px), repeating-linear-gradient(0deg, rgba(255,255,255,0.11) 0 1px, transparent 1px 108px)",
          transform: `translateY(${interpolate(frame, [0, 300], [0, -42], {extrapolateRight: "clamp"})}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(118deg, rgba(216,75,234,0.44) 0%, transparent 26%), linear-gradient(22deg, transparent 54%, rgba(127,255,212,0.18) 72%, transparent 88%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.28) 74%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -120,
          top: 286,
          width: 1360,
          height: 150,
          background: "linear-gradient(90deg, transparent, rgba(255,216,77,0.13), transparent)",
          transform: "rotate(-10deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -170,
          top: 1010,
          width: 980,
          height: 260,
          background: "linear-gradient(90deg, transparent, rgba(216,75,234,0.2), transparent)",
          transform: "rotate(-18deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanY,
          height: 110,
          background: "linear-gradient(180deg, transparent, rgba(127,255,212,0.08), transparent)",
        }}
      />
    </AbsoluteFill>
  );
};

const BrandMark = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 28,
      fontWeight: 900,
      color: palette.text,
      textTransform: "uppercase",
      letterSpacing: 0,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${palette.gold}, ${palette.magenta})`,
        boxShadow: "0 0 34px rgba(255,216,77,0.45)",
      }}
    />
    DEZENEIRO
  </div>
);

const InfoPill = ({label, tone = "light"}) => (
  <div
    style={{
      padding: "13px 18px",
      borderRadius: 999,
      background: tone === "gold" ? "rgba(255,216,77,0.16)" : "rgba(255,255,255,0.08)",
      border: `1px solid ${tone === "gold" ? "rgba(255,216,77,0.42)" : palette.border}`,
      color: tone === "gold" ? palette.gold : palette.muted,
      fontSize: 25,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 0,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

const Ball = ({n, delay, featured}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: {damping: 17, stiffness: 150, mass: 0.72},
  });
  const scale = interpolate(enter, [0, 1], [0.52, 1]);
  const lift = interpolate(enter, [0, 1], [42, 0]);
  const opacity = clamp(enter * 1.6, 0, 1);
  const sheen = interpolate((frame - delay) % 90, [0, 90], [-120, 165], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: featured ? 158 : 148,
        height: featured ? 158 : 148,
        borderRadius: "50%",
        background: "radial-gradient(circle at 32% 24%, #ffffff 0%, #fff9ff 28%, #ead7ef 72%, #d0a7dc 100%)",
        boxShadow: featured
          ? "0 26px 52px rgba(0,0,0,0.42), 0 0 0 6px rgba(255,216,77,0.18), inset 0 -16px 28px rgba(118,0,113,0.18)"
          : "0 20px 42px rgba(0,0,0,0.36), inset 0 -15px 26px rgba(118,0,113,0.17)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${lift}px) scale(${scale})`,
        opacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: sheen,
          top: -30,
          width: 34,
          height: 220,
          background: "rgba(255,255,255,0.5)",
          filter: "blur(10px)",
          transform: "rotate(24deg)",
          opacity: 0.45,
        }}
      />
      <span
        style={{
          fontSize: featured ? 80 : 74,
          fontWeight: 900,
          color: palette.ballText,
          letterSpacing: 0,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {n}
      </span>
    </div>
  );
};

const StatLine = ({label, value, accent}) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 22,
      padding: "20px 0",
      borderTop: "1px solid rgba(255,255,255,0.13)",
    }}
  >
    <span
      style={{
        fontSize: 30,
        color: palette.muted,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: accent ? 44 : 34,
        color: accent ? palette.gold : palette.text,
        fontWeight: 900,
        textAlign: "right",
        lineHeight: 1.05,
      }}
    >
      {value}
    </span>
  </div>
);

export const LotofacilResultado = (props) => {
  const {
    concurso,
    dataExtenso,
    dezenas = [],
    acumulou,
    ganhadores15 = 0,
    premio15Label = "",
    ganhadores14 = 0,
    premio14Label = "",
    proximoConcurso,
    proximoEstimadoLabel = "",
    audioSrc,
    siteUrl = "dezeneiro.com.br",
  } = props;

  const frame = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();

  const introEnd = Math.round(D * 0.13);
  const dezenasEnd = Math.round(D * 0.6);
  const premiacaoStart = Math.round(D * 0.62);
  const proximoStart = Math.round(D * 0.82);
  const ctaStart = Math.round(D * 0.92);

  const headerOp = clamp(interpolate(frame, [0, 16], [0, 1]), 0, 1);
  const headerY = interpolate(clamp(frame / 18, 0, 1), [0, 1], [-36, 0]);
  const titleOp = clamp(interpolate(frame, [8, 28], [0, 1]), 0, 1);
  const titleY = interpolate(titleOp, [0, 1], [50, 0]);

  const ballStep = (dezenasEnd - introEnd) / Math.max(dezenas.length, 1);

  const premiacaoOp = clamp(interpolate(frame, [premiacaoStart, premiacaoStart + 18], [0, 1]), 0, 1);
  const premiacaoY = interpolate(premiacaoOp, [0, 1], [60, 0]);
  const proximoOp = clamp(interpolate(frame, [proximoStart, proximoStart + 16], [0, 1]), 0, 1);
  const ctaOp = clamp(interpolate(frame, [ctaStart, ctaStart + 14], [0, 1]), 0, 1);
  const ctaPulse = 1 + Math.sin(frame / 7) * 0.02;
  const numbersPanelOpacity = clamp(interpolate(frame, [introEnd - 20, introEnd + 10], [0, 1]), 0, 1);
  const topNumbers = dezenas.slice(0, 5);
  const middleNumbers = dezenas.slice(5, 10);
  const bottomNumbers = dezenas.slice(10, 15);
  const hasWinner = !acumulou && ganhadores15 > 0;

  return (
    <AbsoluteFill
      style={{
        background: palette.ink,
        fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      <BackgroundSystem />

      <div
        style={{
          position: "absolute",
          top: 58,
          left: 58,
          right: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <BrandMark />
        <div style={{display: "flex", gap: 12}}>
          <InfoPill label={`Concurso ${concurso}`} tone="gold" />
          <InfoPill label={dataExtenso} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 142,
          left: 58,
          right: 58,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: palette.mint,
            fontSize: 28,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          Resultado oficial
          <div style={{height: 2, flex: 1, background: "linear-gradient(90deg, rgba(127,255,212,0.7), transparent)"}} />
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: 0,
            textTransform: "uppercase",
            textShadow: "0 18px 52px rgba(0,0,0,0.38)",
          }}
        >
          Lotofácil
        </div>
        <div
          style={{
            marginTop: 14,
            width: 640,
            maxWidth: "100%",
            fontSize: 34,
            lineHeight: 1.14,
            color: palette.muted,
            fontWeight: 700,
          }}
        >
          As 15 dezenas sorteadas, prêmio principal e estimativa do próximo concurso.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 402,
          left: 46,
          right: 46,
          height: 680,
          opacity: numbersPanelOpacity,
          borderRadius: 34,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.055))",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 28px 80px rgba(0,0,0,0.36)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.28,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 34px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 30,
            right: 30,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: palette.faint,
              fontSize: 24,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 0,
            }}
          >
            Dezenas sorteadas
          </div>
          <div
            style={{
              color: palette.gold,
              fontSize: 24,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 0,
            }}
          >
            15 números
          </div>
        </div>
        {[topNumbers, middleNumbers, bottomNumbers].map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              position: "absolute",
              top: 94 + rowIndex * 192,
              left: rowIndex === 1 ? 34 : 68,
              right: rowIndex === 1 ? 34 : 68,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {row.map((n, i) => {
              const absoluteIndex = rowIndex * 5 + i;
              return (
                <Ball
                  key={`${n}-${absoluteIndex}`}
                  n={n}
                  delay={Math.round(introEnd + absoluteIndex * ballStep)}
                  featured={rowIndex === 1 && i === 2}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          top: 1122,
          opacity: premiacaoOp,
          transform: `translateY(${premiacaoY}px)`,
          padding: "34px 38px 24px",
          borderRadius: 34,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.065))",
          border: `1px solid ${palette.border}`,
          boxShadow: "0 28px 80px rgba(0,0,0,0.34)",
        }}
      >
        <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24}}>
          <div>
            <div
              style={{
                fontSize: 28,
                color: palette.mint,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 0,
              }}
            >
              Faixa principal
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 64,
                fontWeight: 900,
                color: hasWinner ? palette.gold : palette.text,
                lineHeight: 1.02,
              }}
            >
              {hasWinner ? "15 acertos" : "Acumulou"}
            </div>
          </div>
          <div
            style={{
              minWidth: 214,
              padding: "18px 20px",
              borderRadius: 24,
              background: "rgba(255,216,77,0.13)",
              border: "1px solid rgba(255,216,77,0.34)",
              color: palette.gold,
              textAlign: "center",
              fontWeight: 900,
            }}
          >
            <div style={{fontSize: 54, lineHeight: 1, fontVariantNumeric: "tabular-nums"}}>
              {hasWinner ? ganhadores15 : 0}
            </div>
            <div style={{marginTop: 5, fontSize: 22, textTransform: "uppercase", letterSpacing: 0}}>
              {hasWinner ? (ganhadores15 === 1 ? "aposta" : "apostas") : "ganhadores"}
            </div>
          </div>
        </div>
        {hasWinner ? (
          <StatLine
            label={ganhadores15 === 1 ? "prêmio da aposta" : "prêmio por aposta"}
            value={premio15Label}
            accent
          />
        ) : (
          <StatLine label="resultado" value="ninguém acertou as 15 dezenas" accent />
        )}
        {ganhadores14 > 0 ? <StatLine label="14 acertos" value={`${ganhadores14} apostas · ${premio14Label}`} /> : null}
      </div>

      {proximoConcurso ? (
        <div
          style={{
            position: "absolute",
            left: 58,
            right: 58,
            top: 1488,
            opacity: proximoOp,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "28px 32px",
            borderRadius: 28,
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.13)",
          }}
        >
          <div>
            <div style={{fontSize: 25, color: palette.faint, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0}}>
              Próximo concurso
            </div>
            <div style={{fontSize: 52, fontWeight: 900, marginTop: 2}}>
              {proximoConcurso}
            </div>
          </div>
          <div style={{textAlign: "right"}}>
            <div style={{fontSize: 25, color: palette.faint, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0}}>
              Estimativa
            </div>
            <div style={{fontSize: 48, fontWeight: 900, color: palette.text, marginTop: 2}}>
              {proximoEstimadoLabel}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          bottom: 74,
          opacity: ctaOp,
          transform: `scale(${ctaPulse})`,
          padding: "26px 30px",
          borderRadius: 28,
          background: `linear-gradient(120deg, ${palette.gold}, #fff2a6 52%, ${palette.mint})`,
          color: "#19001f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 28,
          boxShadow: "0 22px 60px rgba(255,216,77,0.28)",
        }}
      >
        <div style={{fontSize: 38, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0}}>
          Confira seu jogo
        </div>
        <div style={{fontSize: 34, fontWeight: 900, opacity: 0.82}}>{siteUrl}</div>
      </div>
    </AbsoluteFill>
  );
};
