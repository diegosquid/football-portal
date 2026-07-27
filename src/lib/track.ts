/**
 * Rastreamento de cliques — dispara nos dois lugares:
 *
 * 1. GA4 (gtag)          — relatórios prontos, mas amostrado e sem acesso ao dado bruto
 * 2. Worker + D1         — dado próprio, consultável, base para atribuição de afiliado
 *
 * Usa sendBeacon: o navegador entrega mesmo se a página estiver sendo
 * descarregada (que é exatamente o caso ao clicar num link de saída).
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface TrackParams {
  /** "share_whatsapp" | "afiliado" | "push_optin" ... */
  event: string;
  /** Identificador do item: slug do jogo, nome da casa, data. */
  label?: string;
  /** Destino, quando for link de saída. */
  url?: string;
  /** Parâmetros extras só para o GA4. */
  gaParams?: Record<string, unknown>;
  /** Nome do evento no GA4, se diferente de `event`. */
  gaEvent?: string;
}

export function trackClick({
  event,
  label,
  url,
  gaParams,
  gaEvent,
}: TrackParams): void {
  if (typeof window === "undefined") return;

  // 1. GA4
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", gaEvent ?? event, {
      ...(label ? { item_id: label } : {}),
      ...(url ? { link_url: url } : {}),
      ...gaParams,
    });
  }

  // 2. D1 via Worker — silencioso, nunca bloqueia o clique
  if (!API) return;
  try {
    const payload = JSON.stringify({
      event,
      label,
      url,
      path: window.location.pathname,
    });
    const endpoint = `${API}/track`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
    } else {
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // tracking nunca pode quebrar a navegação
  }
}
