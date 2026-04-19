CREATE TABLE IF NOT EXISTS scenarios (
  short_code TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
