-- One current signed-in draft per account; no feelings, free text or answer history.
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id TEXT PRIMARY KEY NOT NULL CHECK(length(user_id) BETWEEN 1 AND 128),
  revision INTEGER NOT NULL CHECK(revision >= 1),
  draft_json TEXT CHECK(draft_json IS NULL OR json_valid(draft_json)),
  checkpoint TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);
