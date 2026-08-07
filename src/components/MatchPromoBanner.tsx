"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { trackClick } from "@/lib/track";
import { VupiAdBanner } from "@/components/VupiAdBanner";
import { ResponsibleGamblingNotice } from "@/components/ResponsibleGamblingNotice";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface GameBanner {
  matchSlug: string;
  campaignName: string;
  advertiser: string;
  targetUrl: string;
  altText: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
}

/**
 * Consulta a campanha no navegador para não ficar presa ao ISR da página.
 * Assim, ativar/trocar uma arte no painel aparece já na próxima visita, sem
 * build ou deploy. Na ausência de campanha, mantém a publicidade padrão.
 */
export function MatchPromoBanner({ matchSlug }: { matchSlug: string }) {
  const [banner, setBanner] = useState<GameBanner | null>(null);

  useEffect(() => {
    if (!API) return;

    const controller = new AbortController();
    void fetch(`${API}/game-banners/${encodeURIComponent(matchSlug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("falha ao carregar banner");
        return (await response.json()) as GameBanner;
      })
      .then((nextBanner) => setBanner(nextBanner))
      .catch(() => {
        // Publicidade nunca pode impedir a página de jogo de funcionar.
      });

    return () => controller.abort();
  }, [matchSlug]);

  if (!banner) {
    return <VupiAdBanner placement="onde_assistir_jogo" compact />;
  }

  return (
    <aside aria-label={`Publicidade de ${banner.advertiser}`} className="not-prose">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        <span>Publicidade</span>
        <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
        <span>{banner.advertiser}</span>
      </div>

      <div className="overflow-hidden rounded-xl bg-[#0b0e14] shadow-sm ring-1 ring-black/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-white/80">
        <a
          href={banner.targetUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          aria-label={`${banner.altText} (abre em uma nova aba)`}
          data-advertiser={banner.advertiser}
          data-ad-placement="onde_assistir_jogo_dinamico"
          onClick={() =>
            trackClick({
              event: "afiliado",
              label: `${banner.advertiser}:${banner.campaignName}:${matchSlug}`,
              url: banner.targetUrl,
              gaEvent: "select_promotion",
              gaParams: {
                promotion_name: banner.campaignName,
                creative_slot: "onde_assistir_jogo_dinamico",
              },
            })
          }
          className="relative block aspect-[10/9] overflow-hidden bg-[#09051f] focus-visible:z-30 focus-visible:outline-white sm:aspect-[4/1]"
        >
          <picture>
            {banner.mobileImageUrl && (
              <source
                media="(max-width: 639px)"
                srcSet={banner.mobileImageUrl}
              />
            )}
            <img
              src={banner.desktopImageUrl}
              alt={banner.altText}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        </a>

        {/vupi/i.test(banner.advertiser) ? (
          <div
            role="note"
            aria-label="Aviso de jogo responsável"
            className="flex items-center justify-center border-t border-white/10 bg-[#0b0e14] py-2 sm:h-20 sm:px-6 sm:py-0"
          >
            <Image
              src="/ads/vupi/selo-jogo-responsavel.png"
              alt="18+. Ministério da Fazenda adverte: Aposta não é investimento. Jogue com responsabilidade. Autorização SPA/MF nº 320/2025."
              width={2146}
              height={216}
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-[92%] sm:h-14 sm:w-auto sm:max-w-[90%]"
            />
          </div>
        ) : (
          <ResponsibleGamblingNotice />
        )}
      </div>
    </aside>
  );
}
