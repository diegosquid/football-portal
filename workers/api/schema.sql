-- Beira do Campo — schema do D1
-- Aplicar:  wrangler d1 execute beiradocampo --remote --file=./schema.sql

-- Inscrições de notificação push (Web Push / VAPID).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint    TEXT NOT NULL UNIQUE,
  -- p256dh/auth só são necessários para payload criptografado. Guardamos
  -- para permitir migrar no futuro sem pedir a inscrição de novo.
  p256dh      TEXT,
  auth        TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  -- Desativada quando o push service responde 404/410 (inscrição morta).
  active      INTEGER NOT NULL DEFAULT 1,
  last_sent_at TEXT,
  fail_count  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_active ON push_subscriptions (active);

-- Newsletter (migrada do Supabase).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  -- Origem: "site" | "supabase-import"
  source      TEXT NOT NULL DEFAULT 'site',
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers (active);

-- Cliques rastreados (compartilhamento, afiliado, saída para bet, etc.).
-- Dado próprio, independente do GA — importante para atribuição de afiliado.
CREATE TABLE IF NOT EXISTS click_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event      TEXT NOT NULL,            -- "share_whatsapp" | "afiliado" | "push_optin" ...
  label      TEXT,                     -- slug do jogo, nome da casa, etc.
  url        TEXT,                     -- destino, quando houver
  path       TEXT,                     -- página de origem
  referrer   TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  day        TEXT NOT NULL DEFAULT (date('now'))
);

CREATE INDEX IF NOT EXISTS idx_click_day   ON click_events (day);
CREATE INDEX IF NOT EXISTS idx_click_event ON click_events (event);

-- Log de envios — permite ver no D1 quantos push saíram e com que resultado.
CREATE TABLE IF NOT EXISTS push_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sent_at     TEXT NOT NULL DEFAULT (datetime('now')),
  total       INTEGER NOT NULL,
  ok          INTEGER NOT NULL,
  failed      INTEGER NOT NULL,
  gone        INTEGER NOT NULL,
  note        TEXT
);
