CREATE TABLE IF NOT EXISTS game_banners (
  match_slug     TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  advertiser    TEXT NOT NULL,
  target_url     TEXT NOT NULL,
  alt_text       TEXT NOT NULL,
  desktop_key   TEXT NOT NULL,
  mobile_key    TEXT,
  starts_at     INTEGER,
  ends_at       INTEGER,
  enabled       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_banners_active
  ON game_banners (enabled, starts_at, ends_at);
