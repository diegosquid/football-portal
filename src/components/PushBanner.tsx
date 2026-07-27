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
export function PushBanner({ context = "jogo" }: { context?: string }) {
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

      <section className="mb-10 border-2 border-ink bg-cal p-5 sm:p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/50">
          Modelo estatístico
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
          Receba os palpites dos jogos diariamente
        </h2>
        <p className="mb-4 mt-1.5 text-sm leading-relaxed text-gray-700">
          Toda manhã, os jogos do dia com a chance de cada time segundo o nosso
          modelo. É grátis e você cancela quando quiser.
        </p>
        <button
          type="button"
          onClick={accept}
          disabled={state === "asking"}
          className="w-full rounded-md border-2 border-ink bg-lima px-6 py-3.5 font-display text-base font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
        >
          {state === "asking" ? "Aguardando…" : "Quero receber"}
        </button>
      </section>
    </>
  );
}
