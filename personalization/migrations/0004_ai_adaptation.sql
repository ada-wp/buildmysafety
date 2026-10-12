-- Private accepted adaptations never enter the shared editorial collection.
CREATE TABLE IF NOT EXISTS memory_private_task_content (
  user_id TEXT NOT NULL REFERENCES memory_profiles(user_id) ON DELETE CASCADE,
  content_ref TEXT NOT NULL,
  action_key TEXT NOT NULL,
  task_json TEXT NOT NULL CHECK(json_valid(task_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, content_ref)
);

-- Bounded operational records, without request text or generated content.
-- Attempts count before calling the provider, including failures/timeouts.
CREATE TABLE IF NOT EXISTS memory_ai_attempts (
  user_id TEXT NOT NULL REFERENCES memory_profiles(user_id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  day TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL,
  finished INTEGER NOT NULL DEFAULT 0 CHECK(finished IN (0, 1)),
  outcome TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  PRIMARY KEY(user_id, request_id)
);
CREATE INDEX IF NOT EXISTS memory_ai_attempts_day ON memory_ai_attempts(day, user_id);
CREATE INDEX IF NOT EXISTS memory_ai_attempts_active ON memory_ai_attempts(user_id, finished, lease_until);
