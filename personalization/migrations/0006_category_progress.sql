-- One compact record per person and available category. Counts remain derived
-- from real task state and one-time awards; this is not a second reward ledger.
CREATE TABLE IF NOT EXISTS memory_category_progress (
  user_id TEXT NOT NULL REFERENCES memory_profiles(user_id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK(revision >= 1),
  seen_milestones_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(seen_milestones_json)),
  check_in_json TEXT CHECK(check_in_json IS NULL OR json_valid(check_in_json)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, topic_id)
);
