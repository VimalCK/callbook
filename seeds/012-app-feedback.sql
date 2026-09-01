CREATE TABLE IF NOT EXISTS app_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_type TEXT NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  contact TEXT,
  page_context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
