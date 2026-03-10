import React from "react";
import {Composition} from "remotion";
import {NewsShort} from "./NewsShort";
import {NewsShortSplit} from "./NewsShortSplit";
import {NewsShortPulse} from "./NewsShortPulse";
import {NewsShortStacked} from "./NewsShortStacked";
import {NewsShortTicker} from "./NewsShortTicker";
import {NewsShortPoster} from "./NewsShortPoster";
import {NewsShortBriefing} from "./NewsShortBriefing";
// eslint-disable-next-line no-unused-vars
import {LongformVideo} from "./LongformVideo";
// eslint-disable-next-line no-unused-vars
import {PodcastVideo} from "./PodcastVideo";

const defaultProps = {
  slug: "demo-short",
  title: "Palmeiras e Novorizontino decidem o Paulistão 2026",
  excerpt: "Um short editorial com headline forte, lower-third e CTA final para a matéria completa.",
  category: "analises",
  authorName: "Thiago Borges",
  micHandle: "@thiagoborges",
  siteName: "Beira do Campo",
  siteUrl: "beiradocampo.com.br",
  imageSrc: "renders/demo/source.png",
  audioSrc: "renders/demo/narration.m4a",
  callToAction: "Leia a matéria completa no site",
  followCallToAction: "Para mais notícias de futebol, siga o canal",
  followHandle: "@beiradocampotv",
  highlights: [
    "O retrospecto que pesa",
    "Ataque contra defesa",
    "O cenário matemático",
  ],
  durationInFrames: 900,
  fps: 30,
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NewsShortClean"
        component={NewsShort}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortSplit"
        component={NewsShortSplit}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortPulse"
        component={NewsShortPulse}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortStacked"
        component={NewsShortStacked}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortTicker"
        component={NewsShortTicker}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortPoster"
        component={NewsShortPoster}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortBriefing"
        component={NewsShortBriefing}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="LongformVideo"
        component={LongformVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={9000}
        defaultProps={{
          slug: "demo",
          title: "Demo Longform",
          siteName: "Beira do Campo",
          siteUrl: "beiradocampo.com.br",
          followHandle: "@beiradocampotv",
          audioSrc: "renders/demo/narration.m4a",
          durationInFrames: 9000,
          fps: 30,
          scenes: [],
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 9000,
        })}
      />
      <Composition
        id="PodcastVideo"
        component={PodcastVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={9000}
        defaultProps={{
          slug: "demo",
          title: "Demo Podcast",
          category: "noticias",
          siteName: "Beira do Campo",
          siteUrl: "beiradocampo.com.br",
          followHandle: "@beiradocampotv",
          audioSrc: "renders/demo/narration.m4a",
          durationInFrames: 9000,
          fps: 30,
          speakerColors: {Fernanda: "#facc15", Ricardo: "#7dd3fc"},
          scenes: [],
          allTurnTimings: [],
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 9000,
        })}
      />
    </>
  );
};
