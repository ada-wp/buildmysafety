# Hosted memory and recommendation API

Built October 11 and connected to the active mobile-web app October 12, 2026. Cloudflare D1 is the account-data store; Clerk supplies verified email identity. The app now connects signed-in onboarding checkpoints and the first sick-day pool → detail → list → completion journey. Public beta and paid AI remain disabled. Historical synthetic rehearsals below are retained as evidence, not the current authentication mechanism.

Each new recommendation request follows this path:

```text
Verified Clerk identity in the current app preview
  → read its latest profile + current task states from Cloudflare D1
  → apply today's topic and explicit limits
  → exclude previously shown/saved/completed outcomes
  → create a small relevant memory packet
  → use existing eligible pool tasks by default
       next step: automatically adapt at most one when useful, within three total
  → validate the result and check memory has not changed
  → pool: atomically pin content, record shown outcomes and latest-batch recovery
  → save/complete/undo against owned state; award each action only once
```

The application owns memory. Saving changes a compact D1 task record without calling AI; the next request reads the latest snapshot. The shared backend also supports likes, feedback and preference reset, although those controls are not yet exposed in the app. Completion awards and stable shared content are implemented. Accepted private AI-content storage remains a next step.

Ada's latest AI decision is **automatic adaptation of at most one task within the total three when it adds useful personal fit**. It does not wait for pool exhaustion; use three eligible pool tasks when no meaningful adaptation is justified. The current app still uses the pool only. Before activation, add per-user/global quotas, immutable private accepted snapshots and validation of the full mixed batch. A model call must not invent advice or add a fourth task.

The next request can be a completely different question. Only relevant past context follows her; an old sick-day concern must not take over a new question about home. The same-question paid comparison below is a controlled test, not a required sequence in the app.

## Hosted environment and evidence

- Current app: [app-auth-staging.buildmysafety.pages.dev](https://app-auth-staging.buildmysafety.pages.dev/), deployment `4235e3b5`. Migrations [0002](migrations/0002_task_journey.sql) and [0003](migrations/0003_onboarding.sql) are remotely applied after 0001. The current automated checkpoint is 104 backend and 90 app tests; [technical status](../docs/technical-status.md) records hosted browser checks separately.
- [catalog.mjs](catalog.mjs) contains nine real authored tasks marked `editorial_review`, not synthetic fixtures or founder-approved content. Only the exact founder preview hostname opts into these records. [Catalog review](catalog-review.md) records checked sources and limitations. Other hosts exclude them; no OpenAI secret is forwarded by the app Worker.

The following bullets record the earlier October 11 isolated memory-API rehearsal:

- Preview: [memory-staging.buildmysafety.pages.dev](https://memory-staging.buildmysafety.pages.dev). This is an API test environment, not the customer app.
- Binding: `MEMORY_DB` → isolated D1 database `buildmysafety-memory-staging`, ID `0c4fb649-fb6a-4a8e-9a02-9f9c76ece796`. Migration [0001](migrations/0001_user_memory.sql) creates `memory_profiles` and `memory_task_states`.
- Final tested deployment: `614f4047`, with **21 remote checks and zero AI calls**. It verifies persistence across requests, two-account isolation, invalid tokens, stale edits, competing updates, idempotent saves, outcome exclusions, changing topic, preference reset and exclusion of private repository documents from the public artifact. The earlier deployment `8897a3cb` passed 20 checks before the final refinement/retest. The automated suite passed **60 tests**. See [cloud test evidence](verification-cloud.json) and the [verification record](verification.json).
- The existing production website and pilot database were untouched. Only the allowlisted `personalization/dist` artifact is deployed; repository documents, research and test credentials are not public assets. The cloud build defaults to locked access, creates no signing key in that mode, and rejects unexpected artifact files; its output is limited to `_worker.js`, `index.html` and `_routes.json`.

The identity verifier checks short-lived RS256 tokens against explicitly configured public keys, issuer and audience. This is an engineering test identity mechanism, **not email sign-in**. After testing, deployment `8cb55c55` locked the staging alias: synthetic public keys are disabled and `SYNTHETIC_TEST_MODE=false`; the temporary private signing key was removed locally. Two live lock checks passed: health returned 200, and the previously valid signer was rejected with 503 `authentication_not_configured`. A separate remote SQL read confirmed five synthetic profiles and ten task states persisted after redeployment; there is no customer data. The counts include one profile created by an earlier interrupted test. Temporary access must be deliberately reconfigured for any further authorized test.

The production OpenAI secret was already present, but the Preview environment had no `OPENAI_API_KEY` at this checkpoint. Ada was asked to add the Preview secret. A later names-only check on October 12 confirmed encrypted OPENAI_API_KEY entries in both Preview and Production. The live Worker → OpenAI → validated response test remains pending bounded app integration; the two earlier paid Playground tests below are separate evidence. Do not report a mocked transport or Playground run as a hosted API-transport success.

## Run engineering checks without an API key

From this directory, with Node 22 or later:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund --cache ../.npm-cache
npm.cmd run build
npm.cmd test
npm.cmd run demo
```

These commands make **zero real API calls**. Transport tests replace `fetch` with an in-process fake. D1 adapter/HTTP tests use SQLite only as a disposable in-memory test double; the deployed product has no local-storage database fallback. All profiles, task copy and sources in `test/fixtures.mjs` are synthetic engineering fixtures, not approved content. The HTTP rehearsal requires both `SYNTHETIC_TEST_MODE=true` and a verified owner whose ID starts `synthetic-` to use them.

`build.mjs` reads the canonical profile/output schemas and sole candidate prompt block, normalizes LF line endings, and precompiles all four validators. Commit `generated/` after a source change. `npm test` first checks those artifacts are current. The Worker imports static code and data; it does not read repository files or compile schemas with runtime `eval`.

The demo starts with the existing fictional profile. It then records a saved/completed meal task and a liked/saved outside-help task, followed by a current request for five-minute, no-spend actions. It verifies that:

- The fixed developer instructions stay the same and the model input changes.
- Saved/completed outcomes disappear from eligible new actions.
- Remaining related options move earlier, while the current five-minute/no-spend limits still apply.
- A pool response uses no model call.

This proves context assembly and application rules, not the quality of an AI's writing or the novelty of the authored fixture outcomes.

## Small integration contract

`store.readSnapshot(owner)` must return one consistent snapshot:

```javascript
{
  profile,      // docs/contracts/user-profile-v0.schema.json
  taskStates,   // current rows from the canonical personalization plan
  stateVersion  // opaque version changed by any relevant profile/task mutation
}
```

`owner` comes only from verified server-side identity. It is never accepted from the recommendation request body, a query parameter or `x-user-id`. The module validates all returned row owners. `d1-store.mjs` scopes every query and mutation to that account. Reads are consistent D1 batches; profile/task changes use version checks, and pool delivery records all shown outcomes in one compare-and-write transaction. A stale response cannot overwrite a newer choice. Profile revision and the broader state version have different purposes: task changes update the latter without pretending the person's onboarding answers changed.

`request` contains `topicId`, `concernIds`, and optionally a session-only `note`, `country`, `maxMinutes`, `noSpend` and `localSupport` (`available`, `unavailable`, `unknown`). Unknown stays unknown; explicit country `null` overrides stored country. In the connected app, profile cost/time/energy/support answers initialize adjustable limits. Explicit current values, including `maxMinutes: null` or `noSpend: false`, override those defaults. Historical rehearsal calls retain their earlier soft-preference behavior unless `useProfileDefaults` is enabled. No raw note is written.

`catalog` is supplied by the server: topic scope/concerns/guidance, immutable action references/outcomes/tags, prerequisites and resource records. Public eligibility requires `reviewState: 'approved'`; the named founder preview explicitly permits `editorial_review`. Tests have a separate fixture gate, never enabled by the app Worker. `prepare()` exposes the outgoing packet for synthetic inspection; do not log real packets in normal operation. Prior/new Reddit research informs candidate needs; resource facts require separate source checks.

## API connection

`buildRequest(prepared, model)` creates an OpenAI Responses request from the build-generated [candidate V1.1](../docs/prompts/task-writer-v1.1-draft.md) instructions. It keeps memory in a user-data message, uses the [canonical output schema](../docs/contracts/task-batch-v1.1.schema.json), sets `store: false`, and includes the prompt hash in safe operational trace data. The approved V1 and original evaluation records remain unchanged. `store: false` is not a claim of zero provider retention.

The transport in `openai.mjs` sends at most one request, with a 45-second default timeout, no tools and no automatic retries. The model must be selected explicitly; staging config selects `gpt-6-luna`. The core call has this shape:

```javascript
const client = createOpenAIClient({ apiKey: serverSecret });
const result = await recommend({
  owner: verifiedOwner,
  store: createD1Store(env.MEMORY_DB),
  catalog: approvedCatalog,
  request: validatedCurrentRequest,
  route: 'adapt',
  model: configuredModel,
  client
});
```

`http.mjs` connects this core to verified identity and D1. Default `route: 'pool'` never calls AI. A manual note on that route returns `adaptation_needed` rather than silently ignoring the request. Exhausted candidates do not trigger generation. The adaptation route can only rewrite eligible existing outcome keys, with their required resource IDs intact. It cannot manufacture new advice when reviewed coverage is missing. Paid adaptation is currently permitted only for the enabled synthetic rehearsal; a future identity-provider connection cannot silently open it to real users. AI results return `delivery: 'review_preview'` and `reviewRequired: true`, with no shown markers or accepted content written.

The request format follows [OpenAI's Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), checked October 11. Server validation remains necessary for product rules and relevance even when JSON conforms to the schema.

## HTTP surface

All API responses use `Cache-Control: no-store`. Requests require a valid bearer token, reject cross-origin browser requests, accept only defined JSON fields and cap bodies at 16 KB. The owner always comes from the verified token. `GET /health` is the sole unauthenticated health route and returns only `{ "ok": true }`.

| Method and route | Accepted body | Result |
| --- | --- | --- |
| `GET /api/memory` | None | Owned profile, task states and state version |
| `POST /api/memory` | Optional `answers`, `interests`, `personalizationEnabled`, `elephantName` | Created profile |
| `PATCH /api/memory` | `expectedRevision`, `changes` limited to those profile fields | Updated profile or stale-edit conflict |
| `GET /api/onboarding` | None | Owned draft/checkpoint or completion status |
| `POST /api/onboarding` | Draft, checkpoint, expected draft/profile revisions | Signed-in checkpoint save |
| `POST /api/onboarding/complete` | Same, with `checkpoint: 'complete'` | Atomic profile promotion and completion; draft payload removed |
| `GET /api/catalog` | None | Eligible shared topic/concern/resource metadata |
| `GET /api/tasks` | None | Owned shown/saved task states plus pinned content, version and earned count |
| `POST /api/tasks/action` | `expectedStateVersion`, `actionKey`, `event` | Current task/version, earned count and whether a new award was earned |
| `POST /api/recommendations` | `request`, `requestId`, `expectedStateVersion`; optional `route: 'pool'` | Atomically delivered/replayed pool batch |
| `GET /api/recommendations/latest` | None | Latest committed result/request and current state version |
| `POST /api/memory/reset` | `expectedRevision` | Shared backend only; not exposed by the app Worker yet |

Task events are `save`, `remove`, `complete`, `undo_complete`, `like`, `unlike`, or `feedback` with an allowed code/null. First completion requires a saved task. Repeated current-version events are no-ops; stale writes must refresh first. Undo changes completion state without removing the unique award. Resource metadata, content references and timestamps are server-owned. The current app exposes save/remove/complete/undo, not all optional feedback controls.

Durable delivery requires a request ID and expected state version. The latest identical ID replays the same batch; reusing it for different inputs conflicts. Older attempts cannot consume another batch after a newer state. `memory_latest_batch` holds one compact recovery row per account; `memory_task_content` holds immutable shared instructions once per version. Lost responses require a read before another action, not an automatic POST retry. The shared historical rehearsal accepts its earlier input contract, but the app Worker enforces durable delivery fields.

## What is enforced here

- Fresh owned snapshots; profile/request/state shape checks; recognized country codes.
- Current topic, explicit time/no-spend constraints, and known nearby-support prerequisites.
- Separate likes and saves, one signal per action, reset/unlike/removal handling, and personalization opt-out. Completion alone is not a positive preference signal.
- At most eight relevant signals, thirty model-visible prior actions and twelve candidate actions, with a 24 KB context limit. The full server-side exclusion set remains in force even when the model packet is bounded.
- Country and simple free/paid resource filtering; ID-only model resources; at most one linked task per batch; no added or silently removed candidate resources.
- Distinct allowlisted outcome keys and narrowly reviewed `outcomeGroup` values, selected concern IDs, task counts/statuses, copy length, and unexpected inline links/HTML. Equivalent alternatives share a group in the catalog; no extra user-profile field is stored. Groups are not whole topics or automated semantic judgments.
- Refusal, rate limits, incomplete results, timeouts, invalid responses and stale profile/task snapshots return failure instead of replacing valid existing results. No automatic retry loop.

## Paid test result

Two independent GPT-6 Luna Playground generations used the same current request and candidate prompt, with different task memory. [Original inputs, outputs and review](../docs/prompts/evaluations/2026-10-11-personalization-pair.json) are preserved. Neither output is approved for the production pool.

| Before task-memory update | After recording seen/completed tasks |
| --- | --- |
| Move one chore to later | Save a familiar meal shortcut |
| Pick two easy meals | Keep delivery details handy |
| Gather resting-day essentials | Returned two ideas instead of padding a third |

Both passed the initial structural checks, but human review found the new meal task too similar to the completed meal task. The remaining delivery task also adds little for someone already using that service. This shows why correct JSON and changed context are insufficient evidence of useful personalization.

The local fix groups overlapping meal alternatives under `easy_food_ready`. A regression test now rejects the unchanged problematic output. No third paid call was made, and the revised prompt/group rule has not been re-tested with the model. A separate automated test confirms that a new home question leaves irrelevant sick-day context behind. The paid pair does not isolate a benefit from likes/saves because candidate availability changed too. Exact billed cost was not available; the record preserves visible token/time labels without converting them into a price.

## Deliberate limits and next checkpoint

Pool matching applies current topic/concerns, adjustable profile-derived limits, resource eligibility and nonrepetition, then uses relevant active save/like tags and selected-concern coverage. It does not interpret every strength or hope as a task rule. Country/free-paid filters do not establish availability or human safety. Mechanical validation does not replace content review; an allowed key could still receive weak or unsafe adapted prose. Historical AI rehearsal results remain review-only.

Owned onboarding, pool delivery, shared content snapshots, current task state, batch recovery and unique completion awards are built and deployed. AI acceptance still needs private immutable content storage and a final compare-and-write transaction. Generation budgets, retention jobs and account deletion/export remain unbuilt. Existing resource/outcome checks are not professional review or proof of usefulness.

Next checkpoint: finish hosted journey verification and Ada's review of the small collection, then build/test automatic one-task adaptation within three with quotas, stable private snapshots and reviewed fallback behavior. Customer launch also requires production identity/storage, deletion/export and release testing. Past choices should add relevant context without continuing an old problem automatically. Hosted storage does not establish unlimited capacity. Deploy only the app's allowlisted output, never this repository root.
