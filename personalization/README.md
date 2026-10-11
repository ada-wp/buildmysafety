# Hosted memory and recommendation API

Built October 11, 2026 after Ada approved the memory-to-AI structure, then clarified that user memory must be hosted and suitable for an app used by people. Cloudflare D1 is now the selected account-data store. The API has been deployed to an isolated Pages preview and tested against real hosted storage with synthetic identities. It remains separate from the paused `app/` interface draft. Customer email sign-in and a public beta are not connected.

Each new recommendation request follows this path:

```text
Verified identity (temporary signed synthetic identities in staging)
  → read its latest profile + current task states from Cloudflare D1
  → apply today's topic and explicit limits
  → exclude previously shown/saved/completed outcomes
  → create a small relevant memory packet
  → use existing eligible pool tasks by default
       or, explicitly, request one supported AI adaptation
  → validate the result and check memory has not changed
  → pool: atomically record shown outcomes, then deliver
  → AI adaptation: return an explicitly marked review preview, without writes
```

The application owns memory. A like or save changes a compact D1 task record; it does not call AI. At the next request the module reads the latest snapshot. The model sees current context alongside fixed writing rules, without requiring a conversation history or model training. Profile edits, task saving/removal/completion, likes, feedback, preference reset and pool delivery now have authenticated server routes. The customer interface, completion awards and accepted AI-content storage remain later steps.

The next request can be a completely different question. Only relevant past context follows her; an old sick-day concern must not take over a new question about home. The same-question paid comparison below is a controlled test, not a required sequence in the app.

## Hosted environment and evidence

- Preview: [memory-staging.buildmysafety.pages.dev](https://memory-staging.buildmysafety.pages.dev). This is an API test environment, not the customer app.
- Binding: `MEMORY_DB` → isolated D1 database `buildmysafety-memory-staging`, ID `0c4fb649-fb6a-4a8e-9a02-9f9c76ece796`. Migration [0001](migrations/0001_user_memory.sql) creates `memory_profiles` and `memory_task_states`.
- Final tested deployment: `614f4047`, with **21 remote checks and zero AI calls**. It verifies persistence across requests, two-account isolation, invalid tokens, stale edits, competing updates, idempotent saves, outcome exclusions, changing topic, preference reset and exclusion of private repository documents from the public artifact. The earlier deployment `8897a3cb` passed 20 checks before the final refinement/retest. The automated suite passed **60 tests**. See [cloud test evidence](verification-cloud.json) and the [verification record](verification.json).
- The existing production website and pilot database were untouched. Only the allowlisted `personalization/dist` artifact is deployed; repository documents, research and test credentials are not public assets. The cloud build defaults to locked access, creates no signing key in that mode, and rejects unexpected artifact files; its output is limited to `_worker.js`, `index.html` and `_routes.json`.

The identity verifier checks short-lived RS256 tokens against explicitly configured public keys, issuer and audience. This is an engineering test identity mechanism, **not email sign-in**. After testing, deployment `8cb55c55` locked the staging alias: synthetic public keys are disabled and `SYNTHETIC_TEST_MODE=false`; the temporary private signing key was removed locally. Two live lock checks passed: health returned 200, and the previously valid signer was rejected with 503 `authentication_not_configured`. A separate remote SQL read confirmed five synthetic profiles and ten task states persisted after redeployment; there is no customer data. The counts include one profile created by an earlier interrupted test. Temporary access must be deliberately reconfigured for any further authorized test.

The production OpenAI secret was already present, but the Preview environment had no `OPENAI_API_KEY` at this checkpoint. Ada was asked to add the Preview secret. The live Worker → OpenAI → validated response test remains pending that connection; the two earlier paid Playground tests below are separate evidence. Do not report a mocked transport or Playground run as a hosted API-transport success.

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

`request` contains `topicId`, `concernIds`, and optionally a session-only `note`, `country`, `maxMinutes`, `noSpend` and `localSupport` (`available`, `unavailable`, `unknown`). Unknown stays unknown. Explicit country `null` means keep it general, overriding a stored country. A broad stored `cost` answer does not mean zero spending; `time` does not mean five minutes. No raw note is written by this module.

`catalog` is supplied by the server: topic scope/concerns/guidance, immutable action references/outcomes/tags, prerequisites, and resource records. Only `reviewState: 'approved'` is eligible outside test mode. The demo is not a starter production library. `prepare()` exposes the exact outgoing packet for synthetic inspection; do not log real packets in normal operation.

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
| `POST /api/memory/reset` | `expectedRevision` | Cleared preference signals; saved/completed/seen tasks remain |
| `POST /api/tasks/action` | `expectedStateVersion`, `actionKey`, `event` | Current task/state version; server stamps all dates |
| `POST /api/recommendations` | `request`, optional `route` (`pool` or `adapt`) | Delivered pool batch or clearly marked AI review preview |

Task events are `save`, `remove`, `complete`, `like`, `unlike`, or `feedback` with an allowed code/null. There is no completion-undo or award endpoint yet. Repeating an unchanged event with a current version is a no-op; stale retries must refresh first. Resource metadata, content references and timestamps are not accepted from the browser. Customer login, email delivery and UI controls remain separate integration work.

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

Broader onboarding preferences are transmitted with explicit meanings for AI adaptation; the current **pool ranking** only uses active like/save tags after hard filters. It does not yet implement all energy, strengths, interest and presentation preferences. Country/free-paid filters do not establish eligibility, prices, platform compatibility, current availability or human safety. Text guards are mechanical, not a clinical or semantic safety review; an allowed key could still receive bad or semantically duplicate prose. Every AI result is marked `reviewRequired` in this rehearsal.

Hosted account isolation, profile edits, preference reset, task state and atomic pool delivery are implemented and cloud-tested. AI results remain review previews; accepting one still needs immutable private content storage and a final compare-and-write transaction. Unique completion awards/growth, batch retry recovery, per-user/global generation budgets, retention jobs and account deletion/export are not implemented. Existing resource/outcome checks are not a professional review or proof that every suggestion is useful.

Next checkpoint: finish the bounded hosted API-call test when the Preview secret is available, then disable temporary test access. Connect a real email identity provider to this same D1 store in a separate step. Before inviting people, add generation budgets, accepted-task snapshots, one-time growth awards and deletion/export, then connect the approved interface and reviewed task collection. Continue reviewing stronger tasks for different questions with Ada; past choices should add relevant context without continuing the old problem automatically. Hosted storage is the selected foundation, not evidence of a completed customer app or unlimited capacity. Do not deploy this repository root.
