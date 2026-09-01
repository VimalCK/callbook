CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL,
  estate_id INTEGER REFERENCES estates(id) ON DELETE CASCADE,
  provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
  event_count INTEGER NOT NULL DEFAULT 1,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_event_bucket
  ON analytics_events (event_type, estate_id, event_key);
