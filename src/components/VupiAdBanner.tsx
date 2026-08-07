"use client";

import { useEffect, useRef } from "react";
import { trackClick } from "@/lib/track";
import { ResponsibleGamblingNotice } from "@/components/ResponsibleGamblingNotice";

const VUPI_URL = "https://go.aff.estrelabetpartners.com/q4ghwn8l";

type VupiPlacement =
  | "palpites_topo"
  | "palpites_entre_jogos"
  | "probabilidades_time"
  | "jogos_hoje_topo"
  | "onde_assistir_jogo";

const COPY_BY_PLACEMENT: Record<
  VupiPlacement,
  { headline: string; description: string; cta: string }
> = {
  palpites_topo: {
    headline: "Apostas esportivas na Vupi",
    description:
      "Consulte jogos e mercados disponíveis na plataforma autorizada.",
    cta: "Conhecer a Vupi",
  },
  palpites_entre_jogos: {
    headline: "Jogos e mercados esportivos",
    description: "Veja as opções disponíveis na Vupi para maiores de 18 anos.",
    cta: "Ver mercados",
  },
  probabilidades_time: {
    headline: "Mercados esportivos na Vupi",
    description: "Consulte as modalidades disponíveis na plataforma autorizada.",
    cta: "Conhecer a Vupi",
  },
  jogos_hoje_topo: {
    headline: "Apostas esportivas na Vupi",
    description: "Consulte os jogos e mercados disponíveis para maiores de 18 anos.",
    cta: "Ver mercados",
  },
  onde_assistir_jogo: {
    headline: "Mercados esportivos na Vupi",
    description: "Consulte as opções disponíveis na plataforma autorizada.",
    cta: "Conhecer a Vupi",
  },
};

export function VupiAdBanner({
  placement,
  priority = false,
  compact = false,
}: {
  placement: VupiPlacement;
  priority?: boolean;
  compact?: boolean;
}) {
  const copy = COPY_BY_PLACEMENT[placement];
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = bannerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    let tracked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (tracked || !entry?.isIntersecting) return;
        tracked = true;
        trackClick({
          event: "afiliado_impressao",
          label: `vupi:${placement}`,
          gaEvent: "view_promotion",
          gaParams: {
            promotion_name: "Vupi — publicidade",
            creative_slot: placement,
          },
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [placement]);

  return (
    <aside
      ref={bannerRef}
      aria-label="Publicidade da Vupi"
      className="not-prose"
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        <span>Publicidade</span>
        <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
        <span>Link de afiliado · 18+</span>
      </div>

      <div className="group overflow-hidden rounded-xl bg-[#0b0e14] shadow-sm ring-1 ring-black/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-white/80">
        <a
          href={VUPI_URL}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          aria-label="Publicidade: conheça as apostas esportivas da Vupi (abre em uma nova aba)"
          data-advertiser="vupi"
          data-ad-placement={placement}
          onClick={() =>
            trackClick({
              event: "afiliado",
              label: `vupi:${placement}`,
              url: VUPI_URL,
              gaEvent: "select_promotion",
              gaParams: {
                promotion_name: "Vupi — publicidade",
                creative_slot: placement,
              },
            })
          }
          className={`relative block overflow-hidden bg-[#09051f] focus-visible:z-30 focus-visible:outline-white ${
            compact
              ? "aspect-[10/9] sm:aspect-[4/1]"
              : "aspect-[10/9] sm:aspect-[5/2]"
          }`}
        >
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="/ads/vupi/palpites-mobile.webp"
            />
            {/* A tag img dentro de picture evita baixar as duas artes responsivas. */}
            <img
              src="/ads/vupi/palpites-horizontal.webp"
              alt=""
              width={1983}
              height={793}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              className="vupi-ad-image absolute inset-x-0 top-0 h-auto w-full object-cover sm:inset-0 sm:h-full"
            />
          </picture>

          <span
            aria-hidden="true"
            className="absolute inset-0 sm:hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(7, 4, 24, 0.98) 0%, rgba(7, 4, 24, 0.92) 45%, rgba(7, 4, 24, 0) 58%)",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden sm:block"
            style={{
              background:
                "linear-gradient(to left, rgba(7, 4, 24, 0.96) 0%, rgba(7, 4, 24, 0.9) 52%, rgba(7, 4, 24, 0) 72%)",
            }}
          />

          <span aria-hidden="true" className="vupi-ad-spotlight" />
          <span aria-hidden="true" className="vupi-ad-sheen" />

          <span className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start p-5 text-white sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[57%] sm:justify-center sm:p-7 lg:p-9">
            <span className="font-display text-2xl font-extrabold leading-none tracking-tight sm:text-3xl lg:text-4xl">
              {copy.headline}
            </span>
            <span className="mt-2 max-w-md text-sm leading-snug text-white/80 sm:text-base">
              {copy.description}
            </span>
            <span className="vupi-ad-cta mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-extrabold text-[#35106b] transition group-hover:bg-[#efe7ff]">
              {copy.cta} <span aria-hidden="true">↗</span>
            </span>
          </span>
        </a>

        <ResponsibleGamblingNotice showVupiAuthorization />
      </div>
    </aside>
  );
}
