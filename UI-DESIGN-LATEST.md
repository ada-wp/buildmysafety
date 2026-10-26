# My Safety — latest approved UI implementation

**Updated:** October 26, 2026

**Design:** Option A — compact checkable rows

**Status:** Implemented in the web-app source. Not yet deployed to the hosted tester app or implemented in the separate Replit native app.

Keep this exact filename for future UI handoffs. Update it in place; do not create competing files named “latest,” “final,” or “v2.” Historical experiments under `design/` are references, not instructions to override this file. Product scope and release evidence remain in [current product](docs/current-product.md) and [technical status](docs/technical-status.md).

## Copy this to Replit

> Read `UI-DESIGN-LATEST.md` in the `ada-wp/buildmysafety` repository on branch `docs/safety-project-consolidation-20260929`. Apply the approved Option A refinement to our existing My Safety app. Use Inter throughout, smaller headings, compact checkable task steps, and expandable supporting details. Preserve the existing elephant artwork, ivory/lavender/earthy-green palette, navigation, three-suggestion batches, task content, and completion/milestone behavior. Adapt the web components to the native platform; do not duplicate the web app or replace our backend. Keep individual step checks separate from whole-task completion, and connect them to account-owned cloud storage. Review the backend migration/deployment status before relying on the new field. Do not introduce new categories, change recommendation rules, or rewrite the task collection as part of this UI work.

## Design rules

### Typeface throughout the app

Use **Inter**, including onboarding, task suggestions, task details, My list, Explore, My progress, Account, Privacy, sign-in, and milestone messages. This is the approved clean sans-serif direction; it is not Uber's proprietary font.

| Element | Size / treatment |
| --- | --- |
| Main headings, task titles on detail, onboarding questions | 24px, weight 600, approximately 1.22–1.3 line height |
| Welcome heading | 28px; 26px on narrow screens |
| Elephant message heading | 22px |
| Section headings | 20px |
| Category names | 18px |
| Task titles in a list/card | 15px, weight 500 |
| Main body, step copy | 14px, approximately 1.55–1.6 line height |
| Secondary labels, time, count | 12–13px |
| Editable fields | 16px to prevent mobile browser auto-zoom |
| Main buttons | At least 48px high; native touch targets remain at least 44px |

Inter weights 400/500/600 are bundled locally. Instrument Serif has been removed from the app dependencies/imports. The separate marketing website is outside this change.

### Palette and identity

- Ivory `#faf7f2`: main surface.
- Lavender `#eee8f5`: selected controls and gentle highlights.
- Earthy green `#3e5044`: headings and primary actions.
- Ink `#302d49`: primary copy. Secondary copy `#696571` where used in the task blocks.
- Dividers `#e5dfe7`; checklist surface `#fffdf9`.
- Reuse [the original elephant](app/public/elephant.svg) exactly. Do not generate/redraw a replacement or change its proportions. Existing hug/milestone animations remain.

### Task detail — Option A

1. Existing return navigation, category pill, and time.
2. Compact task heading and its existing short description.
3. “Your steps” with a checked count, e.g. `1 / 3`.
4. One rounded group of checkable rows, with dividers. Each row has a checkbox with a separate touch area.
5. Long instructions show a compact excerpt and chevron. Tap to read the full, unchanged instruction. The first long step is initially open. Short instructions are fully visible without a redundant expander. Excerpts are presentation only, not a replacement for the original text.
6. Helpful links and buying considerations stay collapsed until opened. Keep meaningful resource limits attached to their resources.
7. A small “Done when” block.
8. Existing Add / Mark as done / Undo action, depending on saved/completed state. “Make this fit me” remains where applicable. Optional feedback is behind “Was this useful?”
9. Existing My list / Explore / My progress navigation stays available.

Do not add introductory disclaimers to every block. Retain essential safety, privacy, AI-use disclosures, failure messages, and resource restrictions in their relevant locations. This pass shortens generic instructions and removes the repeated list-sync explanation; it does not rewrite task instructions or strip meaningful precautions.

## Behavior that must stay intact

- Normal suggestion batches contain three tasks; this UI change does not alter the recommendation engine or API generation prompt.
- Selecting a substep does **not** save or complete the whole task, advance category progress, or award elephant growth.
- Whole-task completion remains explicit via Mark as done or the My list checkbox. Existing awards are idempotent; undo/re-completion does not earn another award.
- Existing milestones stay **1, 3, 6, 9, 10**, with the original elephant and optional preparedness check-in. No safety score or streak penalty.
- Substep checks are per user and per pinned task content. Navigation/reload must not silently lose them. Refining an unsaved task resets checks for its new instructions.
- Existing profile editing, account export/deletion, three-tab navigation, resource links, feedback and error recovery remain.

## Where to find the implementation

| Responsibility | File |
| --- | --- |
| Global typography, layout, cards, onboarding | [`app/src/style.css`](app/src/style.css) |
| Bundled font imports | [`app/src/main.tsx`](app/src/main.tsx) |
| Checkable/expandable rows | [`app/src/components/TaskSteps.tsx`](app/src/components/TaskSteps.tsx) |
| Row and task-detail styling | [`app/src/components/task-steps.css`](app/src/components/task-steps.css) |
| Real task flow and state connection | [`app/src/components/TaskJourney.tsx`](app/src/components/TaskJourney.tsx) |
| Progress and milestone styling | [`app/src/components/category-progress.css`](app/src/components/category-progress.css) |
| Original animal | [`app/public/elephant.svg`](app/public/elephant.svg) |
| Client types / HTTP transport | [`app/src/api-contracts.ts`](app/src/api-contracts.ts), [`app/src/cloud-api.ts`](app/src/cloud-api.ts) |
| Cloud action validation and persistence | [`personalization/http.mjs`](personalization/http.mjs), [`personalization/d1-store.mjs`](personalization/d1-store.mjs) |
| New additive database migration | [`personalization/migrations/0007_task_step_checks.sql`](personalization/migrations/0007_task_step_checks.sql) |
| End-to-end contract tests | [`app/tests/task-journey.integration.test.ts`](app/tests/task-journey.integration.test.ts) |

### Backend contract for native reuse

`TaskState.stepChecks` is a compact 0–15 integer representing up to four checked substeps. Bit `1 << index` is the checked state for the zero-based index. Older responses may omit the field; the new web UI disables checking in that case rather than pretending it saved.

Send the existing authenticated action endpoint:

```json
{
  "expectedStateVersion": "CURRENT_SERVER_VERSION",
  "actionKey": "THE_EXISTING_TASK_KEY",
  "event": { "type": "check_step", "index": 0, "checked": true }
}
```

`POST /api/tasks/action` verifies the authenticated owner, the pinned task's actual step count, and the state version. Use the existing error/reload/conflict handling. Do not send a user ID from the UI. Do not call OpenAI to check a step or open details. The new field is included in account export and removed with the task/profile through existing deletion behavior.

## Release boundary

Apply migration 0007 to the intended D1 environment **before** deploying the new Worker/client. It defaults existing records to zero and does not change completed tasks or awards. Deploy only the allowlisted `app/dist/client` output, never the repository root. Keep `[CF-Pages-Skip]` on documentation-branch sync commits; GitHub upload is not a deployment.

Local integration tests execute the actual HTTP client, Worker, SQL queries and migrations against disposable SQLite. They verify persistence, owner isolation, stale-write rejection, retries, step bounds, refinement reset, and separate completion awards. They do not establish hosted D1 performance or replace a real-device review. The in-app browser blocked the fresh local preview, so final visual interaction verification remains a release check. See [technical status](docs/technical-status.md) for the final verification counts and outstanding product work.
