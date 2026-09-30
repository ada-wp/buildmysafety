CREATE TABLE IF NOT EXISTS scans (token_hash TEXT PRIMARY KEY, created_at TEXT NOT NULL, email TEXT NOT NULL, answers TEXT NOT NULL, result TEXT, state TEXT NOT NULL DEFAULT 'saved', model TEXT, usage TEXT);
CREATE INDEX IF NOT EXISTS scans_created ON scans(created_at);
CREATE TABLE IF NOT EXISTS daily_limits (day TEXT PRIMARY KEY, submissions INTEGER NOT NULL DEFAULT 0, generations INTEGER NOT NULL DEFAULT 0);
