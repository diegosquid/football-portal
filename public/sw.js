/**
 * Service worker do Beira do Campo — notificações push.
 *
 * O Worker envia o push SEM payload. Aqui buscamos o conteúdo em
 * /api/palpites-do-dia na hora de exibir, o que garante texto sempre fresco
 * e evita criptografia de payload no servidor.
 */

const FALLBACK = {
  title: "Beira do Campo",
  body: "Os palpites de hoje já estão no ar.",
  url: "/probabilidades",
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let data = FALLBACK;
      try {
        const res = await fetch("/api/palpites-do-dia", { cache: "no-store" });
        if (res.ok) {
          const payload = await res.json();
          data = {
            title: payload.title || FALLBACK.title,
            body: payload.body || FALLBACK.body,
            url: payload.url || FALLBACK.url,
          };
        }
      } catch {
        // offline ou endpoint fora — mostra o texto padrão
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        // Substitui a notificação anterior em vez de empilhar.
        tag: "palpites-do-dia",
        renotify: true,
        data: { url: data.url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || FALLBACK.url;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Se o site já está aberto, foca a aba em vez de abrir outra.
      for (const client of all) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
