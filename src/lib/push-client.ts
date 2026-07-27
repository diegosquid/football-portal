/**
 * Lógica de inscrição em push, compartilhada entre o banner de conteúdo
 * (PushBanner) e o botão da página de palpites (PushOptIn).
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * O navegador consegue receber push?
 *
 * Detecção por capacidade, não por user-agent. Cobre Chrome, Edge, Firefox
 * e Android; exclui o Safari do iOS em aba normal, onde `PushManager` não
 * existe (lá só funciona com o site instalado na tela de início).
 */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined" &&
    Boolean(VAPID_PUBLIC_KEY) &&
    Boolean(API)
  );
}

/** Já existe inscrição ativa neste navegador? */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return Boolean(await reg?.pushManager.getSubscription());
  } catch {
    return false;
  }
}

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

export type SubscribeResult = "granted" | "denied" | "dismissed" | "error";

/**
 * Pede a permissão e registra a inscrição no Worker.
 *
 * IMPORTANTE: precisa ser chamada dentro do gesto do usuário (handler de
 * clique). Não envolva em setTimeout — o navegador ignora o pedido de
 * permissão fora do gesto.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!pushSupported()) return "error";

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") return "denied";
    if (permission !== "granted") return "dismissed"; // fechou sem escolher

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
    if (!res.ok) return "error";

    return "granted";
  } catch {
    return "error";
  }
}
