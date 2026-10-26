-- Small, account-owned checklist state. Whole-task completion/awards stay separate.
ALTER TABLE memory_task_states ADD COLUMN step_checks INTEGER NOT NULL DEFAULT 0
  CHECK (step_checks BETWEEN 0 AND 15);
