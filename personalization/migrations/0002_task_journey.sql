-- Shared immutable content is stored once per version, never once per user.
-- Apply only to the chosen staging D1 before deploying task routes.
CREATE TABLE IF NOT EXISTS memory_task_content (
  content_ref TEXT PRIMARY KEY NOT NULL,
  action_key TEXT NOT NULL,
  task_json TEXT NOT NULL CHECK(json_valid(task_json)),
  created_at TEXT NOT NULL
);

-- One recovery record per person. A client version protects against an old
-- request retry after this row has been replaced by a newer batch.
CREATE TABLE IF NOT EXISTS memory_latest_batch (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES memory_profiles(user_id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  commit_token TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_completion_awards (
  user_id TEXT NOT NULL,
  action_key TEXT NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY(user_id, action_key),
  FOREIGN KEY(user_id, action_key) REFERENCES memory_task_states(user_id, action_key) ON DELETE CASCADE
);

INSERT OR IGNORE INTO memory_completion_awards (user_id, action_key, awarded_at)
SELECT user_id, action_key, completed_at FROM memory_task_states WHERE completed_at IS NOT NULL;
