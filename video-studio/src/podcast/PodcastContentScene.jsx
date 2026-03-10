import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {palette} from "./palette";
import {SpeakerIndicator} from "./SpeakerIndicator";
import {TopicCard} from "./TopicCard";
import {QuoteCallout} from "./QuoteCallout";

export const PodcastContentScene = ({
  heading,
  imageSrc,
  startFrame,
  durationInFrames,
  kenBurns,
  turnTimings = [],
  quotes = [],
  speakerColors = {},
  sceneIndex = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  // Ken Burns
  const zoomFrom = kenBurns?.zoomIn ? 1.0 : 1.1;
  const zoomTo = kenBurns?.zoomIn ? 1.1 : 1.0;
  const scale = interpolate(localFrame, [0, durationInFrames], [zoomFrom, zoomTo], {extrapolateRight: "clamp"});
  const panX = interpolate(localFrame, [0, durationInFrames], kenBurns?.panX || [0, -15], {extrapolateRight: "clamp"});
  const panY = interpolate(localFrame, [0, durationInFrames], kenBurns?.panY || [0, -10], {extrapolateRight: "clamp"});

  // Fade in/out
  const fadeIn = interpolate(localFrame, [0, 30], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const fadeOut = interpolate(localFrame, [durationInFrames - 30, durationInFrames], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{opacity}}>
      {/* Background image with Ken Burns */}
      <AbsoluteFill>
        <Img
          src={staticFile(imageSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          }}
        />
      </AbsoluteFill>

      {/* Dark gradient */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(6,19,29,0.35) 0%, rgba(6,19,29,0.5) 50%, rgba(6,19,29,0.82) 100%)",
        }}
      />

      {/* Accent radial */}
      <AbsoluteFill
        style={{
          background:
            sceneIndex % 2 === 0
              ? "radial-gradient(circle at 85% 65%, rgba(250,204,21,0.06), transparent 28%)"
              : "radial-gradient(circle at 15% 35%, rgba(125,211,252,0.06), transparent 28%)",
        }}
      />

      {/* Topic card */}
      {heading && (
        <TopicCard
          heading={heading}
          appearAt={10}
          visibleDuration={Math.min(150, durationInFrames - 40)}
        />
      )}

      {/* Speaker indicator — uses global frame for turn matching */}
      <SpeakerIndicator
        turnTimings={turnTimings}
        speakerColors={speakerColors}
      />

      {/* Quote callouts */}
      {quotes.map((quote, index) => (
        <QuoteCallout
          key={index}
          text={quote.text}
          speaker={quote.speaker}
          appearAt={quote.appearAtFrame}
          visibleDuration={quote.durationFrames || 120}
          side={index % 2 === 0 ? "right" : "left"}
        />
      ))}
    </AbsoluteFill>
  );
};
