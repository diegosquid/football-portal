import React from "react";
import {Composition} from "remotion";
import {NewsShort} from "./NewsShort";
import {NewsShortSplit} from "./NewsShortSplit";
import {NewsShortPulse} from "./NewsShortPulse";
import {NewsShortStacked} from "./NewsShortStacked";
import {NewsShortTicker} from "./NewsShortTicker";
import {NewsShortPoster} from "./NewsShortPoster";
import {NewsShortBriefing} from "./NewsShortBriefing";
import {NewsShortHotTake} from "./NewsShortHotTake";
import {NewsShortVersus} from "./NewsShortVersus";
import {NewsShortDynamic} from "./NewsShortDynamic";
// eslint-disable-next-line no-unused-vars
import {LongformVideo} from "./LongformVideo";
// eslint-disable-next-line no-unused-vars
import {PodcastVideo} from "./PodcastVideo";
// eslint-disable-next-line no-unused-vars
import {PodcastShort} from "./PodcastShort";
// eslint-disable-next-line no-unused-vars
import {CountdownShort} from "./CountdownShort";
// eslint-disable-next-line no-unused-vars
import {DailyRecapShort} from "./DailyRecapShort";

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
        id="NewsShortHotTake"
        component={NewsShortHotTake}
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
        id="NewsShortVersus"
        component={NewsShortVersus}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={{
          ...defaultProps,
          versusData: {
            sideA: {name: "Palmeiras", stats: ["Líder do Brasileirão", "12 gols marcados", "Melhor ataque"]},
            sideB: {name: "Novorizontino", stats: ["Vice-campeão paulista", "8 gols marcados", "Melhor defesa"]},
          },
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="NewsShortDynamic"
        component={NewsShortDynamic}
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
      <Composition
        id="PodcastShortClean"
        component={PodcastShort}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={{
          slug: "demo",
          title: "Demo Podcast Short",
          excerpt: "Podcast short com dois narradores",
          category: "noticias",
          siteName: "Beira do Campo",
          siteUrl: "beiradocampo.com.br",
          followHandle: "@beiradocampotv",
          imageSrc: "renders/demo/source.png",
          audioSrc: "renders/demo/narration.m4a",
          speakerColors: {Fernanda: "#facc15", Ricardo: "#7dd3fc"},
          allTurnTimings: [],
          quotes: [],
          durationInFrames: 900,
          fps: 30,
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 900,
        })}
      />
      <Composition
        id="CountdownShort"
        component={CountdownShort}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={1500}
        defaultProps={{
          slug: "demo-countdown",
          title: "Top 5 Demo",
          category: "curiosidades",
          siteName: "Beira do Campo",
          siteUrl: "beiradocampo.com.br",
          followHandle: "@beiradocampotv",
          audioSrc: "renders/demo/narration.m4a",
          items: [],
          timings: [],
          durationInFrames: 1500,
          fps: 30,
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 1500,
        })}
      />
      <Composition
        id="DailyRecapShort"
        component={DailyRecapShort}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={1500}
        defaultProps={{
          slug: "daily-recap",
          title: "Resumo do Dia",
          date: "19 de março de 2026",
          siteName: "Beira do Campo",
          siteUrl: "beiradocampo.com.br",
          followHandle: "@beiradocampotv",
          audioSrc: "renders/demo/narration.m4a",
          callToAction: "Para mais notícias de futebol, siga o canal",
          items: [],
          durationInFrames: 1500,
          fps: 30,
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames ?? 1500,
        })}
      />
    </>
  );
};
