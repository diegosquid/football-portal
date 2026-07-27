/**
 * Beira do Campo — API no Cloudflare Worker
 * ---------------------------------------------------------------------------
 * - POST /push/subscribe     registra inscrição de notificação
 * - POST /push/unsubscribe   remove inscrição
 * - POST /newsletter         inscreve e-mail (migrado do Supabase)
 * - GET  /health             status + contagens
 *
 * Cron Trigger: envia a notificação diária dos palpites.
 *
 * O push é enviado SEM payload ("tickle"): o service worker no navegador
 * busca o conteúdo em /api/palpites-do-dia na hora de exibir. Isso evita
 * implementar a criptografia aes128gcm aqui e mantém o texto sempre fresco.
 * ---------------------------------------------------------------------------
 */

const ALLOWED_ORIGINS = [
  "https://beiradocampo.com.br",
  "https://www.beiradocampo.com.br",
  "http://localhost:3000",
];

/* ------------------------------------------------------------------ *
 * Utilidades
 * ------------------------------------------------------------------ */

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

/** base64url (sem padding) a partir de ArrayBuffer/Uint8Array. */
function toBase64Url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/* ------------------------------------------------------------------ *
 * VAPID — assina o JWT que autentica o servidor no push service
 * ------------------------------------------------------------------ */

/**
 * Importa a chave privada VAPID (base64url do valor "d" da curva P-256)
 * como CryptoKey para ECDSA/P-256.
 */
async function importVapidKey(privateKeyB64, publicKeyB64) {
  const d = fromBase64Url(privateKeyB64);
  const pub = fromBase64Url(publicKeyB64); // 65 bytes: 0x04 || X || Y
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: toBase64Url(d),
      x: toBase64Url(x),
      y: toBase64Url(y),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/** Monta o header Authorization: vapid t=<jwt>, k=<publicKey>. */
async function vapidAuthHeader(endpoint, env) {
  const aud = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12h
    sub: env.VAPID_SUBJECT || "mailto:contato@beiradocampo.com.br",
  };

  const enc = new TextEncoder();
  const signingInput = `${toBase64Url(enc.encode(JSON.stringify(header)))}.${toBase64Url(
    enc.encode(JSON.stringify(payload)),
  )}`;

  const key = await importVapidKey(env.VAPID_PRIVATE_KEY, env.VAPID_PUBLIC_KEY);
  // ECDSA P-256 no Web Crypto já retorna r||s (64 bytes) — formato do JWT.
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput),
  );

  const jwt = `${signingInput}.${toBase64Url(sig)}`;
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`;
}

/* ------------------------------------------------------------------ *
 * Envio do push
 * ------------------------------------------------------------------ */

async function sendPush(subscription, env) {
  const authorization = await vapidAuthHeader(subscription.endpoint, env);
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      // Sem payload: Content-Length 0 e TTL obrigatório.
      TTL: "43200", // 12h — se o aparelho estiver offline, ainda entrega depois
      "Content-Length": "0",
      Urgency: "normal",
    },
  });
}

/* ------------------------------------------------------------------ *
 * Rotas HTTP
 * ------------------------------------------------------------------ */

async function handleSubscribe(request, env, origin) {
  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || typeof sub.endpoint !== "string") {
    return json({ error: "subscription.endpoint obrigatório" }, 400, origin);
  }
  // Só aceita endpoints dos push services conhecidos.
  if (!/^https:\/\//.test(sub.endpoint)) {
    return json({ error: "endpoint inválido" }, 400, origin);
  }

  await env.DB.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET active = 1, fail_count = 0`,
  )
    .bind(
      sub.endpoint,
      sub.keys?.p256dh ?? null,
      sub.keys?.auth ?? null,
      request.headers.get("user-agent")?.slice(0, 200) ?? null,
    )
    .run();

  return json({ ok: true }, 201, origin);
}

async function handleUnsubscribe(request, env, origin) {
  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) return json({ error: "endpoint obrigatório" }, 400, origin);

  await env.DB.prepare(
    `UPDATE push_subscriptions SET active = 0 WHERE endpoint = ?`,
  )
    .bind(endpoint)
    .run();

  return json({ ok: true }, 200, origin);
}

async function handleNewsletter(request, env, origin) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

  if (!email) return json({ error: "Email é obrigatório." }, 400, origin);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email inválido." }, 400, origin);
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM newsletter_subscribers WHERE email = ? AND active = 1`,
  )
    .bind(email)
    .first();

  if (existing) {
    return json({ error: "Este email já está cadastrado." }, 409, origin);
  }

  await env.DB.prepare(
    `INSERT INTO newsletter_subscribers (email, source) VALUES (?, 'site')
     ON CONFLICT(email) DO UPDATE SET active = 1`,
  )
    .bind(email)
    .run();

  return json({ message: "Inscrito com sucesso!" }, 201, origin);
}

/** Público e propositalmente sem números — só diz que o Worker está de pé. */
async function handleHealth(env, origin) {
  return json({ ok: true }, 200, origin);
}

/* ------------------------------------------------------------------ *
 * Tracking de cliques
 * ------------------------------------------------------------------ */

async function handleTrack(request, env, origin) {
  const body = await request.json().catch(() => null);
  const event = typeof body?.event === "string" ? body.event.slice(0, 60) : "";
  if (!event) return json({ error: "event obrigatório" }, 400, origin);

  await env.DB.prepare(
    `INSERT INTO click_events (event, label, url, path, referrer, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      event,
      body?.label?.toString().slice(0, 200) ?? null,
      body?.url?.toString().slice(0, 500) ?? null,
      body?.path?.toString().slice(0, 200) ?? null,
      request.headers.get("referer")?.slice(0, 200) ?? null,
      request.headers.get("user-agent")?.slice(0, 200) ?? null,
    )
    .run();

  // 204: o cliente usa sendBeacon e não lê a resposta.
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/* ------------------------------------------------------------------ *
 * Admin — protegido por token (wrangler secret ADMIN_TOKEN)
 * ------------------------------------------------------------------ */

function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

async function handleAdminStats(request, env, origin) {
  if (!isAuthorized(request, env)) {
    return json({ error: "não autorizado" }, 401, origin);
  }

  const [push, news, lastPush, cliquesHoje, porEvento, ultimosDias, novos7d] =
    await Promise.all([
      env.DB.prepare(
        `SELECT COUNT(*) AS n FROM push_subscriptions WHERE active = 1`,
      ).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE active = 1`,
      ).first(),
      env.DB.prepare(
        `SELECT sent_at, total, ok, failed, gone FROM push_log ORDER BY id DESC LIMIT 1`,
      ).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS n FROM click_events WHERE day = date('now')`,
      ).first(),
      env.DB.prepare(
        `SELECT event, COUNT(*) AS n FROM click_events
         WHERE day >= date('now','-30 day')
         GROUP BY event ORDER BY n DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT day, COUNT(*) AS n FROM click_events
         WHERE day >= date('now','-14 day')
         GROUP BY day ORDER BY day DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS n FROM push_subscriptions
         WHERE active = 1 AND created_at >= datetime('now','-7 day')`,
      ).first(),
    ]);

  return json(
    {
      pushSubscribers: push?.n ?? 0,
      pushNew7d: novos7d?.n ?? 0,
      newsletterSubscribers: news?.n ?? 0,
      lastPush: lastPush ?? null,
      clicksToday: cliquesHoje?.n ?? 0,
      clicksByEvent: porEvento?.results ?? [],
      clicksByDay: ultimosDias?.results ?? [],
    },
    200,
    origin,
  );
}

/** Lista os últimos cliques — útil pra depurar atribuição de afiliado. */
async function handleAdminClicks(request, env, origin) {
  if (!isAuthorized(request, env)) {
    return json({ error: "não autorizado" }, 401, origin);
  }
  const { results } = await env.DB.prepare(
    `SELECT event, label, url, path, created_at
     FROM click_events ORDER BY id DESC LIMIT 100`,
  ).all();
  return json({ clicks: results ?? [] }, 200, origin);
}

/* ------------------------------------------------------------------ *
 * Cron — notificação diária
 * ------------------------------------------------------------------ */

async function runDailyPush(env) {
  // 1. Só notifica se existe conteúdo do dia.
  const site = env.SITE_URL || "https://beiradocampo.com.br";
  let payload;
  try {
    const res = await fetch(`${site}/api/palpites-do-dia`, {
      headers: { "User-Agent": "BeiraDoCampo-Worker/1.0" },
    });
    payload = await res.json();
  } catch (e) {
    console.error("falha ao buscar palpites do dia:", e);
    return;
  }

  if (!payload?.hasContent) {
    console.log("sem jogos hoje — push não enviado");
    return;
  }

  // 2. Busca inscrições ativas.
  const { results } = await env.DB.prepare(
    `SELECT endpoint FROM push_subscriptions WHERE active = 1`,
  ).all();

  if (!results?.length) {
    console.log("nenhuma inscrição ativa");
    return;
  }

  // 3. Envia em lotes para não estourar o limite de subrequests.
  let ok = 0;
  let failed = 0;
  let gone = 0;
  const BATCH = 40;

  for (let i = 0; i < results.length; i += BATCH) {
    const batch = results.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map((row) => sendPush(row, env)),
    );

    for (let j = 0; j < settled.length; j++) {
      const endpoint = batch[j].endpoint;
      const r = settled[j];
      if (r.status !== "fulfilled") {
        failed++;
        continue;
      }
      const status = r.value.status;
      if (status === 404 || status === 410) {
        // Inscrição morta — desativa para não tentar de novo.
        gone++;
        await env.DB.prepare(
          `UPDATE push_subscriptions SET active = 0 WHERE endpoint = ?`,
        )
          .bind(endpoint)
          .run();
      } else if (status >= 200 && status < 300) {
        ok++;
        await env.DB.prepare(
          `UPDATE push_subscriptions SET last_sent_at = datetime('now'), fail_count = 0 WHERE endpoint = ?`,
        )
          .bind(endpoint)
          .run();
      } else {
        failed++;
        await env.DB.prepare(
          `UPDATE push_subscriptions SET fail_count = fail_count + 1 WHERE endpoint = ?`,
        )
          .bind(endpoint)
          .run();
      }
    }
  }

  await env.DB.prepare(
    `INSERT INTO push_log (total, ok, failed, gone, note) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(results.length, ok, failed, gone, payload.title ?? null)
    .run();

  console.log(`push: ${ok} ok, ${failed} falha, ${gone} removidas`);
}

/* ------------------------------------------------------------------ *
 * Entrypoints
 * ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return handleHealth(env, origin);
      }
      if (url.pathname === "/push/subscribe" && request.method === "POST") {
        return handleSubscribe(request, env, origin);
      }
      if (url.pathname === "/push/unsubscribe" && request.method === "POST") {
        return handleUnsubscribe(request, env, origin);
      }
      if (url.pathname === "/newsletter" && request.method === "POST") {
        return handleNewsletter(request, env, origin);
      }
      if (url.pathname === "/track" && request.method === "POST") {
        return handleTrack(request, env, origin);
      }
      if (url.pathname === "/admin/stats" && request.method === "GET") {
        return handleAdminStats(request, env, origin);
      }
      if (url.pathname === "/admin/clicks" && request.method === "GET") {
        return handleAdminClicks(request, env, origin);
      }
      return json({ error: "not found" }, 404, origin);
    } catch (e) {
      console.error(e);
      return json({ error: "erro interno" }, 500, origin);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyPush(env));
  },
};
