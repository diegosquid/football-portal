"use client";

import { useEffect, useState } from "react";
import { isSubscribed, pushSupported, subscribeToPush } from "@/lib/push-client";
import { trackClick } from "@/lib/track";

type State = "checking" | "hidden" | "idle" | "asking" | "done" | "blocked";

/**
 * Convite de notificação embutido no conteúdo — sem overlay, sem timer e
 * sem gatilho de rolagem.
 *
 * É a forma mais segura para SEO: faz parte da página, não cobre nada.
 * O escurecimento só acontece DEPOIS do clique, e interstitial disparado
 * por ação do usuário é explicitamente permitido pelo Google.
 */
export function PushBanner({
  context = "jogo",
  /**
   * Versão enxuta, para quando o banner fica ACIMA do conteúdo principal:
   * mantém o destaque do bloco escuro sem empurrar a lista de jogos pra baixo.
   */
  compact = false,
}: {
  context?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next: State;
      if (!pushSupported()) next = "hidden";
      else if (Notification.permission === "denied") next = "hidden";
      else if (Notification.permission === "granted" && (await isSubscribed()))
        next = "hidden";
      else next = "idle";
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function accept() {
    setState("asking");
    trackClick({ event: "push_banner_clique", gaEvent: "push_optin", label: context });

    const result = await subscribeToPush();
    if (result === "granted") {
      setState("done");
      trackClick({ event: "push_inscrito", gaEvent: "push_optin", label: context });
      return;
    }
    if (result === "denied") {
      setState("blocked");
      return;
    }
    setState("idle"); // fechou o prompt sem escolher, ou erro
  }

  if (state === "checking" || state === "hidden") return null;

  if (state === "done") {
    return (
      <section className="mb-10 border-2 border-ink bg-lima p-5">
        <p className="font-display text-lg font-extrabold text-ink">
          Pronto! Você recebe os palpites todo dia
        </p>
        <p className="mt-1 text-sm text-ink/70">
          O primeiro chega amanhã de manhã.
        </p>
      </section>
    );
  }

  if (state === "blocked") {
    return (
      <section className="mb-10 border border-ink/15 bg-white p-5">
        <p className="text-sm text-gray-600">
          Notificações bloqueadas neste navegador. Dá para liberar nas
          configurações do site.
        </p>
      </section>
    );
  }

  return (
    <>
      {/* Escurecimento só após o clique — guia até o prompt do navegador. */}
      {state === "asking" && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink/80 px-6 backdrop-blur-[2px] sm:justify-start sm:pt-28"
          role="status"
          aria-live="polite"
        >
          <div className="mb-5 hidden animate-bounce text-4xl leading-none text-lima sm:block">
            ↑
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-cal sm:text-3xl">
              Aceite a notificação
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-cal/70">
              O navegador vai perguntar se você permite. Toque em{" "}
              <strong className="text-lima">Permitir</strong> para receber os
              palpites todo dia.
            </p>
          </div>
          <div className="mt-6 animate-bounce text-4xl leading-none text-lima sm:hidden">
            ↓
          </div>
        </div>
      )}

      {/*
        Bloco escuro de propósito: no fundo claro da página, um card claro
        se dissolve no conteúdo. Invertido, ele interrompe a leitura — mesmo
        tratamento do rodapé, então continua na linguagem do site.
      */}
      <section
        className={`overflow-hidden bg-campo-deep ${compact ? "mb-8" : "mb-10"}`}
      >
        <div
          className={`relative sm:flex sm:items-center sm:justify-between sm:gap-6 ${
            compact
              ? "flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4"
              : "p-6 sm:gap-8 sm:p-8"
          }`}
        >
          {/* Marca d'água tipográfica, como nas peças do rodapé */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -right-6 select-none font-display font-extrabold leading-none text-lima/[0.06] ${
              compact ? "-top-8 text-[6rem]" : "-top-6 text-[7rem] sm:text-[10rem]"
            }`}
          >
            ⚽
          </span>

          <div className="relative sm:flex-1">
            <p
              className={`flex items-center gap-2 whitespace-nowrap font-mono font-bold uppercase text-lima ${
                compact
                  ? "text-[9px] tracking-[0.14em] sm:text-[11px] sm:tracking-[0.25em]"
                  : "text-[11px] tracking-[0.25em]"
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lima opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lima" />
              </span>
              Notificação diária
            </p>
            <h2
              className={`font-display font-extrabold leading-[1.15] tracking-tight text-cal ${
                compact
                  ? "mt-1 text-base sm:mt-1.5 sm:text-xl"
                  : "mt-3 text-2xl sm:text-3xl"
              }`}
            >
              {/* No mobile compacto o texto precisa caber ao lado do botão. */}
              {compact ? (
                <>
                  <span className="sm:hidden">Palpites todo dia</span>
                  <span className="hidden sm:inline">
                    Receba os palpites dos jogos diariamente
                  </span>
                </>
              ) : (
                "Receba os palpites dos jogos diariamente"
              )}
            </h2>
            <p
              className={`max-w-md leading-relaxed text-cal/60 ${
                compact
                  ? "mt-1 hidden text-xs sm:block"
                  : "mt-2.5 text-sm"
              }`}
            >
              Toda manhã, os jogos do dia com a chance de cada time segundo o
              nosso modelo. É grátis e você cancela quando quiser.
            </p>
          </div>

          <div
            className={`relative shrink-0 ${compact ? "" : "mt-6 sm:mt-0"}`}
          >
            <button
              type="button"
              onClick={accept}
              disabled={state === "asking"}
              className={`rounded-md bg-lima font-display font-extrabold text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.35)] active:translate-y-0 active:shadow-[0_1px_0_0_rgba(0,0,0,0.35)] disabled:opacity-60 sm:w-auto ${
                compact
                  ? "px-4 py-2.5 text-sm sm:px-6 sm:py-3"
                  : "w-full px-7 py-4 text-base"
              }`}
            >
              {state === "asking" ? "Aguardando…" : "Quero receber"}
            </button>
            {!compact && (
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-cal/40 sm:text-right">
                Sem spam · 1 por dia
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
