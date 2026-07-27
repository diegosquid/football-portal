"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSubscribed,
  pushSupported,
  subscribeToPush,
  type SubscribeResult,
} from "@/lib/push-client";
import { trackClick } from "@/lib/track";

const DISMISS_KEY = "bdc_push_prompt_dismissed_at";
/** Depois de recusar, só volta a perguntar daqui a 30 dias. */
const DISMISS_DAYS = 30;
/** Espera o usuário se engajar antes de convidar. */
const DELAY_MS = 12_000;

type View = "hidden" | "invite" | "asking" | "success" | "blocked";

function dismissedRecently(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    const days = (Date.now() - Number(at)) / 86_400_000;
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function PushPrompt() {
  const [view, setView] = useState<View>("hidden");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Só convida quem pode receber, ainda não recebe e não recusou faz pouco.
    // Três porteiros — o modal só aparece para quem PODE e AINDA NÃO decidiu.
    if (!pushSupported()) return;
    if (Notification.permission !== "default") return; // já aceitou ou bloqueou
    if (dismissedRecently()) return;

    let cancelled = false;
    void isSubscribed().then((already) => {
      if (already || cancelled) return;
      timer.current = setTimeout(() => setView("invite"), DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* modo privado — tudo bem, só volta a perguntar na próxima visita */
    }
    setView("hidden");
    trackClick({ event: "push_prompt_recusado", gaEvent: "push_prompt" });
  }, []);

  // Fecha com Escape enquanto o convite está aberto.
  useEffect(() => {
    if (view !== "invite") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, dismiss]);

  async function accept() {
    // Escurece a tela ANTES de pedir — o prompt nativo aparece por cima.
    // A chamada precisa ficar no mesmo gesto do clique, sem setTimeout.
    setView("asking");
    trackClick({ event: "push_prompt_aceito", gaEvent: "push_prompt" });

    const result: SubscribeResult = await subscribeToPush();

    if (result === "granted") {
      setView("success");
      trackClick({ event: "push_inscrito", gaEvent: "push_optin" });
      setTimeout(() => setView("hidden"), 3500);
      return;
    }
    if (result === "denied") {
      setView("blocked");
      setTimeout(() => setView("hidden"), 5000);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {}
      return;
    }
    // "dismissed" (fechou o prompt) ou erro: some sem insistir.
    setView("hidden");
  }

  if (view === "hidden") return null;

  /* --- Tela escurecida enquanto o prompt nativo está aberto --- */
  if (view === "asking") {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink/80 px-6 backdrop-blur-[2px] sm:justify-start sm:pt-28"
        role="status"
        aria-live="polite"
      >
        {/* Desktop: o prompt do Chrome nasce no topo, abaixo da barra. */}
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

        {/* Mobile: no Android o prompt sobe de baixo, como uma folha. */}
        <div className="mt-6 animate-bounce text-4xl leading-none text-lima sm:hidden">
          ↓
        </div>
      </div>
    );
  }

  if (view === "success") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:p-0">
        <div className="border-2 border-ink bg-lima p-4 text-center">
          <p className="font-display text-lg font-extrabold text-ink">
            Pronto! Palpites todo dia
          </p>
          <p className="mt-1 text-sm text-ink/70">
            O primeiro chega amanhã de manhã.
          </p>
        </div>
      </div>
    );
  }

  if (view === "blocked") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:p-0">
        <div className="border-2 border-ink bg-white p-4 text-center">
          <p className="font-display text-base font-extrabold text-ink">
            Notificações bloqueadas
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Dá para liberar depois nas configurações do site no navegador.
          </p>
        </div>
      </div>
    );
  }

  /* --- Convite (soft ask) --- */
  return (
    <>
      <div
        className="fixed inset-0 z-[99] bg-ink/40 backdrop-blur-[1px]"
        onClick={dismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-prompt-title"
        className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-0"
      >
        <div className="border-2 border-ink bg-cal p-5 shadow-[0_8px_0_0_rgba(20,30,20,0.25)] sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/50">
            Modelo estatístico
          </p>
          <h2
            id="push-prompt-title"
            className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl"
          >
            Receba os palpites dos jogos diariamente
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-700">
            Toda manhã, os jogos do dia com a chance de cada time segundo o
            nosso modelo. É grátis e você cancela quando quiser.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={accept}
              className="rounded-md border-2 border-ink bg-lima px-5 py-3 font-display text-base font-extrabold text-ink transition-transform hover:-translate-y-0.5 sm:flex-1"
            >
              Quero receber
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-ink"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
