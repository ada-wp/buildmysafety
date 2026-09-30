# Technical status and next implementation boundary

Consolidated 29 September 2026 from local source and prior connection records. This is not a fresh end-to-end test of the production URL.

| Artifact | What is present | What is not established |
| --- | --- | --- |
| Root repository website | Older static homepage and scan files, retained unchanged | Current deployed Worker/API source is not on this root |
| [Archived pilot source](../archive/deployed-pilot/README.md) | Pages Worker, D1 schema, server-side OpenAI Responses request, structured seven-day output, cache, private result token hashing, daily counters | Task CRUD, accounts, reminders, email and the new three-suggestion flow |
| [React branding website](../design/website-preview/README.md) | Editable Vite/React/Radix/Tailwind components, About page, original illustrated scene and licenses | Connected forms or Safety API; not deployed by this task |
| [Figma](../design/app/README.md) | Seven editable onboarding frames and category/back navigation | Interactive concern toggles, real text submission and generation |
| [Sick-day preview](../design/app/sick-day-journey.html) | Three suggestions, short expansion, save, more ideas, My list, completion and growth; browser preview state | Live AI, secure account storage, native install or push delivery |

## Pilot details worth preserving

The saved `_worker.js` has `/api/scans` and `/api/generate`, `env.OPENAI_API_KEY`, request validation, structured output, `store: false`, a 45-second timeout, result caching and D1 `scans`/`daily_limits`. The current saved limits are 100 submissions and five total generations per day, not a production capacity promise. A failed generation cannot be retried through the ordinary flow; fix that before reuse. API billing/key setup was completed earlier according to the task, not re-verified here. Never copy secrets into client code or Git.

The last located connection note records the seven-day change on September 20. Preserve the source as a recovery reference; reconcile it with the actual live deployment before treating it as an exact production snapshot. No D1 data, account records or credentials are included in this repository collection.

## Deployment gate

The root README previously specified Cloudflare Pages output `/`. That is unsafe for a repository containing private research, design source and historical backend files. Before merging into a deploying branch, explicitly select a built public app directory, confirm which Worker/API version serves it, configure bindings/secrets separately, and test a preview using synthetic data. The current documentation branch commit starts with `[CF-Pages-Skip]`; do not remove that protection while this gate is unresolved.

## Meaningful checks before beta

- New batches preserve saved tasks and exclude already shown action keys; malformed/failed AI responses are recoverable without erasing state.
- The server accepts only resource IDs present in a reviewed, eligible catalog and returns validated URLs. Check dead links and region restrictions.
- Task reads and writes enforce ownership; two different accounts cannot access each other's tasks. Include deletion/export and minimal retention.
- Completion awards are idempotent. Undo and repeated requests cannot multiply growth; there is no penalty for absence.
- Test touch, keyboard, expansion versus completion, loading/error/empty/exhausted states and mobile widths.
- Cap per-user and global generation costs; record safe operational metrics without raw private inputs. Load test the expected pilot size, not hypothetical scale.
- Only describe reminders as working after permissions, scheduling, timezone, cancellation and deep links pass on supported devices.

The current preview checks passed all twelve interaction/layout assertions on September 29, including 320/393/736px widths and no JavaScript page errors. These checks validate the sample preview, not production AI, medical accuracy or account security. See [preview verification](../design/app/verification.json).
