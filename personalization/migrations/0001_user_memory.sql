-- Cloudflare D1 only: apply explicitly to the intended cloud environment.
-- Identity/email live outside these tables. No raw notes or event history.
CREATE TABLE IF NOT EXISTS memory_profiles (
  user_id TEXT PRIMARY KEY NOT NULL CHECK(length(user_id) BETWEEN 1 AND 128),
  profile_json TEXT NOT NULL CHECK(json_valid(profile_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
  state_version INTEGER NOT NULL DEFAULT 1 CHECK(state_version >= 1),
  updated_at TEXT NOT NULL,
  signals_reset_at TEXT
);

CREATE TABLE IF NOT EXISTS memory_task_states (
  user_id TEXT NOT NULL REFERENCES memory_profiles(user_id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  content_ref TEXT NOT NULL,
  shown_at TEXT NOT NULL,
  saved_at TEXT,
  removed_at TEXT,
  completed_at TEXT,
  liked_at TEXT,
  feedback_code TEXT CHECK(feedback_code IS NULL OR feedback_code IN (
    'helpful', 'too_generic', 'too_much_effort', 'too_expensive', 'already_done', 'not_relevant_now'
  )),
  feedback_at TEXT,
  PRIMARY KEY(user_id, action_key),
  CHECK(saved_at IS NULL OR removed_at IS NULL),
  CHECK((feedback_code IS NULL) = (feedback_at IS NULL))
);
