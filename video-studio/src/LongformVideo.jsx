import React from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {palette} from "./longform/palette";
import {IntroScene} from "./longform/IntroScene";
import {ContentScene} from "./longform/ContentScene";
import {OutroScene} from "./longform/OutroScene";
import {ProgressBar} from "./longform/ProgressBar";

export const LongformVideo = (props) => {
  const {
    title,
    excerpt,
    category,
    siteName,
    siteUrl,
    followHandle,
    audioSrc,
    scenes = [],
  } = props;

  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

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
            <IntroScene
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
            <OutroScene
              key={index}
              siteName={siteName}
              siteUrl={siteUrl}
              followHandle={followHandle}
              startFrame={scene.startFrame}
              durationInFrames={scene.durationInFrames}
            />
          );
        }

        // content scene (default)
        return (
          <ContentScene
            key={index}
            heading={scene.heading}
            imageSrc={scene.imageSrc}
            startFrame={scene.startFrame}
            durationInFrames={scene.durationInFrames}
            kenBurns={scene.kenBurns}
            highlights={scene.highlights || []}
            stats={scene.stats || []}
            sceneIndex={index}
          />
        );
      })}

      {/* Progress bar */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
