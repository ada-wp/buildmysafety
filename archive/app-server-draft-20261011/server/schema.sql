PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL CHECK(json_valid(profile_json))
);
CREATE TABLE IF NOT EXISTS user_tasks (
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  content_id TEXT NOT NULL,
  shown_at TEXT NOT NULL,
  saved_at TEXT,
  removed_at TEXT,
  completed_at TEXT,
  liked_at TEXT,
  feedback_code TEXT CHECK(feedback_code IS NULL OR feedback_code IN ('helpful','too_generic','too_much_effort','too_expensive','already_done','not_relevant_now')),
  feedback_at TEXT,
  PRIMARY KEY(user_id, action_key)
);
CREATE TABLE IF NOT EXISTS completion_awards (
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY(user_id, action_key)
);
CREATE TABLE IF NOT EXISTS recommendation_batches (
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  profile_revision INTEGER NOT NULL,
  request_signature TEXT NOT NULL,
  action_keys TEXT NOT NULL CHECK(json_valid(action_keys)),
  expires_at TEXT NOT NULL,
  PRIMARY KEY(user_id, request_id)
);
