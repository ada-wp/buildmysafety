-- Minimal deletion receipt: no email, answers, task copy or credentials.
-- Kept to block stale sessions and to retry an interrupted identity-provider deletion.
CREATE TABLE IF NOT EXISTS account_deletions (
  user_id TEXT PRIMARY KEY NOT NULL,
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'deleted'))
);

-- The receipt and app-data erasure commit atomically. These two roots prevent
-- a request already in flight from recreating the deleted account/draft.
-- Other user-owned records reference memory_profiles with cascading deletion.
CREATE TRIGGER IF NOT EXISTS deleted_profile_insert BEFORE INSERT ON memory_profiles
WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id = NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'account_deleted'); END;
CREATE TRIGGER IF NOT EXISTS deleted_profile_update BEFORE UPDATE ON memory_profiles
WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id = NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'account_deleted'); END;
CREATE TRIGGER IF NOT EXISTS deleted_onboarding_insert BEFORE INSERT ON onboarding_progress
WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id = NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'account_deleted'); END;
CREATE TRIGGER IF NOT EXISTS deleted_onboarding_update BEFORE UPDATE ON onboarding_progress
WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id = NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'account_deleted'); END;
