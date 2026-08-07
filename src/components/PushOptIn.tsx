"use client";

import { useEffect, useState } from "react";
import { isSubscribed, pushSupported, subscribeToPush } from "@/lib/push-client";
import { trackClick } from "@/lib/track";

type Status =
  | "checking"
  | "unsupported"
  | "idle"
  | "loading"
  | "subscribed"
  | "denied"
  | "error";

export function PushOptIn() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    // Tudo dentro da continuação assíncrona: nada de setState síncrono aqui.
    void (async () => {
      let next: Status;
      if (!pushSupported()) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else next = (await isSubscribed()) ? "subscribed" : "idle";
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    setStatus("loading");
    const result = await subscribeToPush();
    if (result === "granted") {
      setStatus("subscribed");
      trackClick({ event: "push_inscrito", gaEvent: "push_optin" });
      return;
    }
    if (result === "denied") {
      setStatus("denied");
      return;
    }
    setStatus(result === "dismissed" ? "idle" : "error");
  }

  if (status === "checking" || status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        ✓ Você recebe os palpites todo dia
      </p>
    );
  }

  // Não transforme uma permissão já negada em ruído para quem veio pela mídia.
  if (status === "denied") return null;

  return (
    <div>
      <button
        type="button"
        onClick={subscribe}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-lima px-5 py-3 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {status === "loading" ? "Ativando…" : "Receber novas probabilidades"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">
          Não deu para ativar agora. Tente de novo.
        </p>
      )}
    </div>
  );
}
