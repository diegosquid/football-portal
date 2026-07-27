"use client";

import { useEffect, useState } from "react";

type Status =
  | "checking"
  | "unsupported"
  | "idle"
  | "loading"
  | "subscribed"
  | "denied"
  | "error";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * base64url -> Uint8Array (formato exigido pelo applicationServerKey).
 * Constrói sobre um ArrayBuffer explícito para satisfazer BufferSource.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function trackPush(action: string) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "push_optin", { action });
  }
}

export function PushOptIn() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_PUBLIC_KEY ||
      !API
    ) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Já inscrito? Não mostra o convite de novo.
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "idle"))
      .catch(() => setStatus("idle"));
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "idle");
        trackPush("recusado");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch(`${API}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!res.ok) throw new Error("falha ao registrar");

      setStatus("subscribed");
      trackPush("aceito");
    } catch {
      setStatus("error");
    }
  }

  if (status === "checking" || status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <p className="font-mono text-xs uppercase tracking-wide text-primary">
        ✓ Você recebe os palpites todo dia
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-xs text-gray-500">
        Notificações bloqueadas no navegador. Libere nas configurações do site
        para receber os palpites.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={subscribe}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-lima px-5 py-3 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {status === "loading" ? "Ativando…" : "Receber os palpites todo dia"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">
          Não deu para ativar agora. Tente de novo.
        </p>
      )}
    </div>
  );
}
