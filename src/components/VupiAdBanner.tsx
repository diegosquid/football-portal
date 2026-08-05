"use client";

import Image from "next/image";
import { trackClick } from "@/lib/track";

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
    headline: "Palpite na mão. Agora é jogo.",
    description: "Compare sua leitura com as apostas esportivas da Vupi.",
    cta: "Ver jogos na Vupi",
  },
  palpites_entre_jogos: {
    headline: "Bateu o palpite?",
    description: "Confira os jogos e mercados esportivos disponíveis na Vupi.",
    cta: "Ir para a Vupi",
  },
  probabilidades_time: {
    headline: "Os números estão na mesa.",
    description: "E aí, qual é o seu palpite? Confira na Vupi.",
    cta: "Ver na Vupi",
  },
  jogos_hoje_topo: {
    headline: "Hoje tem jogo. E tem palpite.",
    description: "Escolha a partida e confira as apostas esportivas na Vupi.",
    cta: "Ver jogos de hoje",
  },
  onde_assistir_jogo: {
    headline: "Leu o jogo. Fez seu palpite?",
    description: "Agora confira as apostas esportivas disponíveis na Vupi.",
    cta: "Conferir na Vupi",
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

  return (
    <aside aria-label="Publicidade da Vupi" className="not-prose">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        <span>Publicidade</span>
        <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
        <span>Parceria comercial</span>
      </div>

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
              promotion_name: "Vupi — palpites",
              creative_slot: placement,
            },
          })
        }
        className={`group relative block overflow-hidden rounded-xl bg-[#09051f] shadow-sm ring-1 ring-black/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-white ${
          compact
            ? "aspect-[10/11] sm:aspect-[4/1]"
            : "aspect-[10/11] sm:aspect-[5/2]"
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

      <div
        role="note"
        aria-label="Aviso de jogo responsável"
        className="mt-2 overflow-hidden rounded-lg bg-[#0b0e14]"
      >
        <Image
          src="/ads/vupi/selo-jogo-responsavel.png"
          alt="18+. Ministério da Fazenda adverte: Aposta não é investimento. Jogue com responsabilidade. Autorização SPA/MF nº 320/2025."
          width={2146}
          height={216}
          sizes="(max-width: 896px) 100vw, 896px"
          className="h-auto w-full"
        />
      </div>
    </aside>
  );
}
