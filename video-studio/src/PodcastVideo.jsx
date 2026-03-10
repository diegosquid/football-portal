import React from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./podcast/palette";
import {PodcastIntroScene} from "./podcast/PodcastIntroScene";
import {PodcastContentScene} from "./podcast/PodcastContentScene";
import {PodcastOutroScene} from "./podcast/PodcastOutroScene";
import {ProgressBar} from "./longform/ProgressBar";

export const PodcastVideo = (props) => {
  const {
    title,
    excerpt,
    category,
    siteName,
    siteUrl,
    followHandle,
    audioSrc,
    speakerColors: propColors,
    scenes = [],
    allTurnTimings = [],
  } = props;

  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const speakerColors = propColors || {
    Ancora: "#facc15",
    Comentarista: "#7dd3fc",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      {/* Audio */}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* Scenes */}
      {scenes.map((scene, index) => {
        if (scene.type === "intro") {
          return (
            <PodcastIntroScene
              key={index}
              title={title}
              category={category}
              siteName={siteName}
              imageSrc={scene.imageSrc}
              startFrame={scene.startFrame}
              durationInFrames={scene.durationInFrames}
              kenBurns={scene.kenBurns}
            />
          );
        }

        if (scene.type === "outro") {
          return (
            <PodcastOutroScene
              key={index}
              siteName={siteName}
              siteUrl={siteUrl}
              followHandle={followHandle}
              startFrame={scene.startFrame}
              durationInFrames={scene.durationInFrames}
            />
          );
        }

        // Content scene
        return (
          <PodcastContentScene
            key={index}
            heading={scene.heading}
            imageSrc={scene.imageSrc}
            startFrame={scene.startFrame}
            durationInFrames={scene.durationInFrames}
            kenBurns={scene.kenBurns}
            turnTimings={allTurnTimings}
            quotes={scene.quotes || []}
            speakerColors={speakerColors}
            sceneIndex={index}
          />
        );
      })}

      {/* Progress bar */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
