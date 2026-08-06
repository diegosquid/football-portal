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
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
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

async function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!env.ADMIN_TOKEN || !token) return false;

  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(token)),
    crypto.subtle.digest("SHA-256", encoder.encode(env.ADMIN_TOKEN)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

async function handleAdminStats(request, env, origin) {
  if (!(await isAuthorized(request, env))) {
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
  if (!(await isAuthorized(request, env))) {
    return json({ error: "não autorizado" }, 401, origin);
  }
  const { results } = await env.DB.prepare(
    `SELECT event, label, url, path, created_at
     FROM click_events ORDER BY id DESC LIMIT 100`,
  ).all();
  return json({ clicks: results ?? [] }, 200, origin);
}

/* ------------------------------------------------------------------ *
 * Banners dinâmicos por jogo
 * ------------------------------------------------------------------ */

const BANNER_ASSET_PREFIX = "game-banners/";
const BANNER_ASSET_ROUTE = "/game-banners/assets/";
const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const MAX_BANNER_REQUEST_BYTES = MAX_BANNER_BYTES * 2 + 512 * 1024;
const BANNER_IMAGE_TYPES = new Map([
  ["image/avif", "avif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function isMatchSlug(value) {
  return (
    typeof value === "string" &&
    value.length <= 180 &&
    /^[a-z0-9][a-z0-9-]*-x-[a-z0-9][a-z0-9-]*-\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  );
}

function requiredFormText(form, key, maxLength) {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function optionalEpoch(value) {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return undefined;
  return Math.floor(milliseconds / 1000);
}

function validateBannerFile(value) {
  if (!(value instanceof File) || value.size === 0) return null;
  const extension = BANNER_IMAGE_TYPES.get(value.type);
  if (!extension) {
    return { error: "Use uma imagem AVIF, JPEG, PNG ou WebP." };
  }
  if (value.size > MAX_BANNER_BYTES) {
    return { error: "Cada imagem pode ter no máximo 5 MB." };
  }
  return { file: value, extension };
}

function bannerAssetUrl(request, key) {
  return `${new URL(request.url).origin}${BANNER_ASSET_ROUTE}${key}`;
}

function serializeGameBanner(row, request) {
  return {
    matchSlug: row.match_slug,
    campaignName: row.campaign_name,
    advertiser: row.advertiser,
    targetUrl: row.target_url,
    altText: row.alt_text,
    desktopImageUrl: bannerAssetUrl(request, row.desktop_key),
    mobileImageUrl: row.mobile_key
      ? bannerAssetUrl(request, row.mobile_key)
      : null,
    startsAt:
      row.starts_at === null
        ? null
        : new Date(Number(row.starts_at) * 1000).toISOString(),
    endsAt:
      row.ends_at === null
        ? null
        : new Date(Number(row.ends_at) * 1000).toISOString(),
    enabled: Boolean(row.enabled),
    activeNow: Boolean(row.active_now ?? row.enabled),
    updatedAt: row.updated_at,
  };
}

async function uploadBannerFile(env, matchSlug, validatedFile, kind) {
  const key = `${BANNER_ASSET_PREFIX}${matchSlug}/${kind}-${crypto.randomUUID()}.${validatedFile.extension}`;
  await env.ASSETS.put(key, validatedFile.file, {
    httpMetadata: {
      contentType: validatedFile.file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      matchSlug,
      uploadedAt: new Date().toISOString(),
    },
  });
  return key;
}

async function handlePublicGameBanner(request, env, origin, matchSlug) {
  if (!isMatchSlug(matchSlug)) {
    return json({ error: "slug inválido" }, 400, origin);
  }

  const row = await env.DB.prepare(
    `SELECT match_slug, campaign_name, advertiser, target_url, alt_text,
            desktop_key, mobile_key, starts_at, ends_at, enabled, updated_at
     FROM game_banners
     WHERE match_slug = ?
       AND enabled = 1
       AND (starts_at IS NULL OR starts_at <= unixepoch())
       AND (ends_at IS NULL OR ends_at > unixepoch())
     LIMIT 1`,
  )
    .bind(matchSlug)
    .first();

  if (!row) {
    const response = json({ error: "nenhum banner ativo" }, 404, origin);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = json(serializeGameBanner(row, request), 200, origin);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function handleBannerAsset(request, env, origin) {
  let key;
  try {
    key = decodeURIComponent(
      new URL(request.url).pathname.slice(BANNER_ASSET_ROUTE.length),
    );
  } catch {
    return json({ error: "asset inválido" }, 400, origin);
  }

  if (
    !key.startsWith(BANNER_ASSET_PREFIX) ||
    key.includes("..") ||
    !/^game-banners\/[a-z0-9-]+\/(?:desktop|mobile)-[a-f0-9-]+\.(?:avif|jpg|png|webp)$/.test(
      key,
    )
  ) {
    return json({ error: "asset inválido" }, 400, origin);
  }

  const object = await env.ASSETS.get(key);
  if (!object) return json({ error: "asset não encontrado" }, 404, origin);

  const headers = new Headers(corsHeaders(origin));
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}

async function handleAdminGameBanners(request, env, origin) {
  if (!(await isAuthorized(request, env))) {
    return json({ error: "não autorizado" }, 401, origin);
  }

  const { results } = await env.DB.prepare(
    `SELECT match_slug, campaign_name, advertiser, target_url, alt_text,
            desktop_key, mobile_key, starts_at, ends_at, enabled, updated_at,
            CASE WHEN enabled = 1
                   AND (starts_at IS NULL OR starts_at <= unixepoch())
                   AND (ends_at IS NULL OR ends_at > unixepoch())
                 THEN 1 ELSE 0 END AS active_now
     FROM game_banners
     ORDER BY updated_at DESC
     LIMIT 100`,
  ).all();

  return json(
    { banners: (results ?? []).map((row) => serializeGameBanner(row, request)) },
    200,
    origin,
  );
}

async function handleAdminGameBannerUpsert(request, env, origin) {
  if (!(await isAuthorized(request, env))) {
    return json({ error: "não autorizado" }, 401, origin);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BANNER_REQUEST_BYTES) {
    return json({ error: "O upload completo pode ter no máximo 10,5 MB." }, 413, origin);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "formulário inválido" }, 400, origin);

  const matchSlug = requiredFormText(form, "matchSlug", 180);
  const campaignName = requiredFormText(form, "campaignName", 100);
  const advertiser = requiredFormText(form, "advertiser", 80);
  const targetUrl = requiredFormText(form, "targetUrl", 500);
  const altText = requiredFormText(form, "altText", 240);
  const startsAt = optionalEpoch(requiredFormText(form, "startsAt", 40));
  const endsAt = optionalEpoch(requiredFormText(form, "endsAt", 40));
  const enabled = requiredFormText(form, "enabled", 10) !== "false" ? 1 : 0;
  const complianceConfirmed =
    requiredFormText(form, "complianceConfirmed", 10) === "true";

  if (!isMatchSlug(matchSlug)) {
    return json({ error: "Informe um slug válido de página de jogo." }, 400, origin);
  }
  if (!campaignName || !advertiser || !targetUrl || !altText) {
    return json({ error: "Preencha campanha, anunciante, link e texto alternativo." }, 400, origin);
  }
  if (!complianceConfirmed) {
    return json(
      { error: "Confirme a revisão de publicidade responsável." },
      400,
      origin,
    );
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return json({ error: "O link de destino é inválido." }, 400, origin);
  }
  if (parsedTarget.protocol !== "https:") {
    return json({ error: "O link de destino precisa usar HTTPS." }, 400, origin);
  }
  if (startsAt === undefined || endsAt === undefined) {
    return json({ error: "Data de início ou fim inválida." }, 400, origin);
  }
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
    return json({ error: "O fim precisa ser posterior ao início." }, 400, origin);
  }

  const desktopFile = validateBannerFile(form.get("desktopImage"));
  const mobileFile = validateBannerFile(form.get("mobileImage"));
  if (desktopFile?.error) return json({ error: desktopFile.error }, 400, origin);
  if (mobileFile?.error) return json({ error: mobileFile.error }, 400, origin);

  const current = await env.DB.prepare(
    `SELECT desktop_key, mobile_key FROM game_banners WHERE match_slug = ?`,
  )
    .bind(matchSlug)
    .first();

  if (!current && !desktopFile?.file) {
    return json({ error: "A arte desktop é obrigatória no primeiro cadastro." }, 400, origin);
  }

  const desktopKey = desktopFile?.file
    ? await uploadBannerFile(env, matchSlug, desktopFile, "desktop")
    : current.desktop_key;
  const mobileKey = mobileFile?.file
    ? await uploadBannerFile(env, matchSlug, mobileFile, "mobile")
    : (current?.mobile_key ?? null);

  await env.DB.prepare(
    `INSERT INTO game_banners (
       match_slug, campaign_name, advertiser, target_url, alt_text,
       desktop_key, mobile_key, starts_at, ends_at, enabled
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(match_slug) DO UPDATE SET
       campaign_name = excluded.campaign_name,
       advertiser = excluded.advertiser,
       target_url = excluded.target_url,
       alt_text = excluded.alt_text,
       desktop_key = excluded.desktop_key,
       mobile_key = excluded.mobile_key,
       starts_at = excluded.starts_at,
       ends_at = excluded.ends_at,
       enabled = excluded.enabled,
       updated_at = datetime('now')`,
  )
    .bind(
      matchSlug,
      campaignName,
      advertiser,
      parsedTarget.toString(),
      altText,
      desktopKey,
      mobileKey,
      startsAt,
      endsAt,
      enabled,
    )
    .run();

  const saved = await env.DB.prepare(
    `SELECT match_slug, campaign_name, advertiser, target_url, alt_text,
            desktop_key, mobile_key, starts_at, ends_at, enabled, updated_at,
            CASE WHEN enabled = 1
                   AND (starts_at IS NULL OR starts_at <= unixepoch())
                   AND (ends_at IS NULL OR ends_at > unixepoch())
                 THEN 1 ELSE 0 END AS active_now
     FROM game_banners WHERE match_slug = ?`,
  )
    .bind(matchSlug)
    .first();

  return json({ banner: serializeGameBanner(saved, request) }, 200, origin);
}

async function handleAdminGameBannerToggle(
  request,
  env,
  origin,
  matchSlug,
) {
  if (!(await isAuthorized(request, env))) {
    return json({ error: "não autorizado" }, 401, origin);
  }
  if (!isMatchSlug(matchSlug)) {
    return json({ error: "slug inválido" }, 400, origin);
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return json({ error: "enabled precisa ser booleano" }, 400, origin);
  }

  const result = await env.DB.prepare(
    `UPDATE game_banners
     SET enabled = ?, updated_at = datetime('now')
     WHERE match_slug = ?`,
  )
    .bind(body.enabled ? 1 : 0, matchSlug)
    .run();

  if (!result.meta.changes) {
    return json({ error: "banner não encontrado" }, 404, origin);
  }
  return json({ ok: true, enabled: body.enabled }, 200, origin);
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
      if (
        url.pathname.startsWith(BANNER_ASSET_ROUTE) &&
        request.method === "GET"
      ) {
        return handleBannerAsset(request, env, origin);
      }
      if (
        url.pathname.startsWith("/game-banners/") &&
        request.method === "GET"
      ) {
        const matchSlug = decodeURIComponent(
          url.pathname.slice("/game-banners/".length),
        );
        return handlePublicGameBanner(request, env, origin, matchSlug);
      }
      if (url.pathname === "/admin/stats" && request.method === "GET") {
        return handleAdminStats(request, env, origin);
      }
      if (url.pathname === "/admin/clicks" && request.method === "GET") {
        return handleAdminClicks(request, env, origin);
      }
      if (
        url.pathname === "/admin/game-banners" &&
        request.method === "GET"
      ) {
        return handleAdminGameBanners(request, env, origin);
      }
      if (
        url.pathname === "/admin/game-banners" &&
        request.method === "POST"
      ) {
        return handleAdminGameBannerUpsert(request, env, origin);
      }
      if (
        url.pathname.startsWith("/admin/game-banners/") &&
        url.pathname.endsWith("/toggle") &&
        request.method === "POST"
      ) {
        const matchSlug = decodeURIComponent(
          url.pathname.slice(
            "/admin/game-banners/".length,
            -"/toggle".length,
          ),
        );
        return handleAdminGameBannerToggle(
          request,
          env,
          origin,
          matchSlug,
        );
      }
      return json({ error: "not found" }, 404, origin);
    } catch (e) {
      console.error(
        JSON.stringify({
          message: "request failed",
          error: e instanceof Error ? e.message : String(e),
          path: url.pathname,
        }),
      );
      return json({ error: "erro interno" }, 500, origin);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyPush(env));
  },
};
