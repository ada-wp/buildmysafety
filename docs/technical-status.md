# Technical status and next implementation boundary

Consolidated 29 September 2026; hosted-memory status updated 11 October from code and an actual Cloudflare preview test. The existing production website has not been replaced or freshly end-to-end tested by this memory work.

| Artifact | What is present | What is not established |
| --- | --- | --- |
| Root repository website | Older static homepage and scan files, retained unchanged | Current deployed Worker/API source is not on this root |
| [Archived pilot source](../archive/deployed-pilot/README.md) | Pages Worker, D1 schema, server-side OpenAI Responses request, structured seven-day output, cache, private result token hashing, daily counters | Task CRUD, accounts, reminders, email and the new three-suggestion flow |
| [React branding website](../design/website-preview/README.md) | Editable Vite/React/Radix/Tailwind components, About page, original illustrated scene and licenses | Connected forms or Safety API; not deployed by this task |
| [Figma](../design/app/README.md) | Seven editable onboarding frames and category/back navigation | Interactive concern toggles, real text submission and generation |
| [Sick-day preview](../design/app/sick-day-journey.html) | Three suggestions, short expansion, save, more ideas, My list, completion and growth; browser preview state | Live AI, secure account storage, native install or push delivery |
| [Hosted memory API](../personalization/README.md) | Isolated Pages preview, real D1 storage, signed synthetic identities, profile/task reads and updates, atomic pool delivery, preference reset and bounded AI request flow | Customer email sign-in, approved production task pool, accepted AI-content storage, awards, budgets and public beta readiness |

## Current hosted-memory checkpoint

Ada authorized the isolated memory-to-AI flow, paid testing and then specifically required hosted storage suitable for a real app. **Cloudflare D1 is the selected user-data store; Supabase was not selected.** CLI authorization was restored and migration `0001_user_memory.sql` was applied to isolated database `buildmysafety-memory-staging` (`0c4fb649-fb6a-4a8e-9a02-9f9c76ece796`). Its `MEMORY_DB` binding is attached to the [memory-staging Pages preview](https://memory-staging.buildmysafety.pages.dev). The production website and older pilot database were untouched.

Initial deployment `8897a3cb` passed 20 actual cloud checks with zero model calls. The final tested deployment `614f4047`, including the reset-cutoff refinement, passed **21 remote checks**: durable profile/task state, two synthetic owners, rejected forged/expired identity tokens, stale profile writes, competing task changes, repeated-save no-ops, shown-outcome storage, new-topic priority, outcome exclusions, preference reset and exclusion of private repository documents from the public artifact. The automated suite passed **60 tests**. Read the [cloud report](../personalization/verification-cloud.json) and [verification record](../personalization/verification.json) for exact evidence.

The Worker uses precompiled schemas, a fixed candidate prompt and an owner-scoped D1 adapter. It does not depend on a local product database. Pool delivery atomically compares the state version and records shown outcomes before returning. All task dates are server-controlled; profile edits, save/remove/complete, like/unlike, explicit feedback and reset have authenticated routes. AI adaptations remain review previews with no accepted content or shown-state writes. Temporary RS256 synthetic identities are not customer email sign-in. Final deployment `8cb55c55` locked the staging alias by disabling synthetic keys/AI rehearsal; the private test signing key was removed locally. Both live lock checks passed: health 200 and the former test identity rejected with 503 `authentication_not_configured`. A separate remote SQL read confirmed five synthetic profiles and ten task states remain after redeployment, including one profile from an earlier interrupted test; no customer data is present. A future identity-provider connection must not automatically enable paid generation.

OpenAI transport code and mocked failure checks are implemented, but the Preview `OPENAI_API_KEY` was missing at this checkpoint. The production secret was already present; the user was asked to add the Preview secret without sharing it in chat. A live Worker → OpenAI test is still pending that connection. Two earlier authorized GPT-6 Luna Playground runs are separate paid evidence: changing task memory changed outputs, but human review found a near-duplicate meal outcome. The catalog's reviewed outcome grouping now rejects that original output in replay. V1.1 remains a candidate; these tests do not approve the pool or prove production content quality.

The earlier compact profile schema/example passed one fictional-record and seven invalid-record checks. That JSON artifact itself was not a database migration; the new D1 migration now implements its storage contract. A separate, uncommitted `app/` draft had been started with React screens and local server code before Ada requested stepwise work. That broad draft remains paused and is not the selected product persistence path. An earlier client build passed; later app edits remain unverified, and its `tsx` backend test runner stopped before executing tests with a Windows `uv_os_get_passwd`/`ENOMEM` error. The standalone personalization package uses Node's built-in runner and has passing unit/integration checks. No customer records were migrated and no real email provider or app UI was connected by this hosted-memory step.

## Pilot details worth preserving

September 30 design update: Ada confirmed email sign-in. The [connected flow preview](../design/app/v0-flow/README.md) now simulates email-code screens, task changes, empty/all-done lists, recoverable generation and growth. All authentication and generation in that preview are synthetic; no identity/email provider was configured and no real account was created.

The saved `_worker.js` has `/api/scans` and `/api/generate`, `env.OPENAI_API_KEY`, request validation, structured output, `store: false`, a 45-second timeout, result caching and D1 `scans`/`daily_limits`. The current saved limits are 100 submissions and five total generations per day, not a production capacity promise. A failed generation cannot be retried through the ordinary flow; fix that before reuse. API billing/key setup was completed earlier according to the task, not re-verified here. Never copy secrets into client code or Git.

The last located connection note records the seven-day change on September 20. Preserve the source as a recovery reference; reconcile it with the actual live deployment before treating it as an exact production snapshot. No D1 data, account records or credentials are included in this repository collection.

## Deployment gate

The root README previously specified Cloudflare Pages output `/`. That is unsafe for a repository containing private research, design source and historical backend files. The memory preview instead deploys only the allowlisted `personalization/dist` artifact with its own Worker entry; bindings and secrets remain separate. This resolves the preview's output boundary, not a future production merge. Before merging into a deploying branch, explicitly select the intended public app output, reconcile the live Worker/API and retest. Documentation-branch commits retain `[CF-Pages-Skip]`; do not remove that protection or deploy the repository root.

## Meaningful checks before beta

- New batches preserve saved tasks and exclude already shown action keys; malformed/failed AI responses are recoverable without erasing state.
- The server accepts only resource IDs present in a reviewed, eligible catalog and returns validated URLs. Check dead links and region restrictions.
- Task reads and writes enforce ownership; two different accounts cannot access each other's tasks. Include deletion/export and minimal retention.
- Completion awards are idempotent. Undo and repeated requests cannot multiply growth; there is no penalty for absence.
- Test touch, keyboard, expansion versus completion, loading/error/empty/exhausted states and mobile widths.
- Cap per-user and global generation costs; record safe operational metrics without raw private inputs. Load test the expected pilot size, not hypothetical scale.
- Only describe reminders as working after permissions, scheduling, timezone, cancellation and deep links pass on supported devices.

The current preview checks passed all twelve interaction/layout assertions on September 29, including 320/393/736px widths and no JavaScript page errors. These checks validate the sample preview, not production AI, medical accuracy or account security. See [preview verification](../design/app/verification.json).
