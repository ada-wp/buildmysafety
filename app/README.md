# My Safety mobile-web app — connected sick-day journey

Step 1 consolidated the preserved welcome/onboarding/interests/recap screens, portable API client and profile controller. **Step 2 is complete for the development build:** Clerk supplies verified email sign-in, while the existing [`personalization/`](../personalization/README.md) backend and Cloudflare D1 continue to own app profiles. The old second server remains [archived](../archive/app-server-draft-20261011/README.md).

The active pilot target is [app-auth-staging.buildmysafety.pages.dev](https://app-auth-staging.buildmysafety.pages.dev). It uses a Clerk development instance and the isolated memory staging database. The sick-day collection has five concerns and 28 active task records: 23 ordinary candidates and five requiring specific context. Twelve are dedicated learning tasks. The category writer and checked resource records support explicit requests. This is the invited-tester pilot, not a replacement for the production website. Deployment IDs, latest test counts and evidence boundaries live in [technical status](../docs/technical-status.md); avoid treating an older verification file as the current release.

## Boundaries

- `src/api-contracts.ts`: the current HTTP wire shapes. Do not import server prompts or storage code into the browser.
- `src/cloud-api.ts`: HTTPS fetch transport, access-token injection, safe errors, versioned writes, cancellation and no automatic mutation replay.
- `src/identity.ts`: the portable provider interface. With no Clerk publishable key, the app stays explicitly **unconfigured** and makes no protected API calls. There is no fake login.
- `src/clerk-identity.ts` and `src/ClerkApp.tsx`: the `@clerk/react` 6.17.8 adapter and themed email sign-in UI. Clerk owns authentication, token refresh and its session storage. A token refresh does not count as an account switch.
- `src/sign-in-handoff.ts`: a cloned onboarding draft held only in this page's memory for up to 15 minutes, scoped to the next expected identity transition. It is cleared on cancellation, expiry or a later account transition; it is never a second user database.
- `src/profile-session.ts`: cloud load/save lifecycle, conflict handling and cancellation of old-account results. No local database/cache.
- `src/navigation.ts`: public return-route policy for Account/Privacy and sign-in/cancellation. Browser history stores route/checkpoint IDs only, never answers. `src/components/ConnectionNotice.tsx` is an offline hint, not an offline write queue.
- `src/profile-draft.ts`: editable answers only. Identity, revision and dates are assigned by the server. Feelings/reflection are separate temporary screen state and never enter this profile request.
- `src/components/` and `src/App.tsx`: React presentation using the approved copy, palette and elephant. A fresh identity epoch remounts the private screen state; unchanged identity preserves edits after a failed save. Editing is disabled while a write is pending.
- `src/runtime.ts` and `src/main.tsx`: compose the client, provider and controller at the same browser origin. The client/controller do not depend on React or DOM APIs.
- `src/task-session.ts` and `src/components/TaskJourney.tsx`: cloud task recovery and the concern → suggestions → detail → My list → completion journey. Mutations use current versions; uncertain outcomes require an explicit reload, never automatic write replay.
- `src/progress-session.ts`, `src/use-category-progress.ts` and `src/components/CategoryProgress.tsx`: category progress, the unchanged elephant, milestones at 1/3/6/9/10 and optional check-ins. `../personalization/progress.mjs` derives counts from task state and awards. Migration 0006 stores only seen milestones and the latest check-in per owner/category, with deletion cascade and owner-scoped export.
- `worker.mjs`: serves the built app, profile/onboarding/reset routes, shared catalog, owned tasks, latest batch and recommendations. Bounded adaptation and one-task new-need generation are available only on the named preview host and explicit server switches.
- `src/components/TaskFeedback.tsx`: compact like/reason/undo controls using the existing versioned task route. `profile-session.ts` also provides narrow personalization-setting and reset writes with guarded readback; the Account screen explains what reset preserves.
- `src/components/PrivacyScreen.tsx` and `../personalization/account.mjs`: account status, owner-scoped app-data export and retryable account deletion. The Worker exposes `GET /api/account`, `GET /api/account/export` and `POST /api/account/delete` with exact `{confirmation:"DELETE"}`. Migration 0005 stores a minimal deletion receipt and blocks stale root recreation; ordinary app routes deny pending/deleted accounts.
- `../personalization/onboarding.mjs`: signed-in draft checkpoints and atomic final profile/completion saves. Guest drafts remain page-memory-only.
- `../personalization/clerk-identity.mjs`: verifies Clerk session tokens with `jose` and the configured issuer's public JWKS. Only a verified subject becomes the D1 owner. The issuer, exact authorized origins, signature, session status and token times are checked; request bodies cannot select an account.

## Current behavior and verification status

The active app uses authenticated D1 storage for its first sick-day journey. Choose current concerns, receive up to three fitting tasks, inspect stable details, add with **+**, complete or undo, and return to the same list. Another batch excludes previously delivered outcomes. A stored latest batch recovers a lost response; one completion award per account/action survives undo and recompletion. Other topics have explicit coming-next exits.

Signed-in onboarding saves structured draft answers and a public checkpoint so it can resume. Final Continue atomically saves the canonical profile and completion marker; returning completed accounts open My list. Preferences remain editable from Account. The guided route, skip-to-topics shortcut and two authored elephant moments remain. Onboarding feelings stay temporary; an optional milestone check-in is saved separately. Guests can carry their draft through sign-in; refreshing an unfinished guest draft clears it. There is no browser product database.

The original nine-task collection remains in `personalization/catalog.mjs` for stable historical content. `personalization/sick-care-catalog.mjs` maps 27 newer candidates; one original sitter task remains active. Retired records are excluded from new suggestions but remain readable in owned history. Active records remain `editorial_review` and are available only on the named pilot host. Sources and limitations are recorded separately from founder approval.

The current source includes migrations 0001 through 0006; apply new migrations to the intended staging database before deploying endpoints that depend on them. Earlier hosted evidence covers [adaptation](verification-ai-adaptation.json), [new needs](verification-new-needs.json), [feedback](verification-feedback.json), [privacy](verification-account-privacy.json) and [reliability](verification-reliability.json). These are dated checkpoints with different coverage, not proof that every subsequent change was tested. The latest release status and remaining checks are in [technical status](../docs/technical-status.md).

The earlier `b9ab91c6` navigation repair replaced a bubble dead end with a temporary sample journey. Its evidence remains in [the historical navigation record](verification-navigation.json). The sample component is no longer the active app journey. The unconfigured local state does not pretend to save tasks or provide fake login.

At the October 11 Step 2 checkpoint, **59 app tests and 75 backend tests passed**, and the app build passed. These cover simulated SDK transitions, guest handoff, profile ownership, JWT validation, interrupted writes, API rejection recovery and the profile-only Worker boundary.

The hosted preview was also exercised with two Clerk development test identities using Clerk's development test-code flow:

- Account A signed in, saved **Sick-day care**, reloaded and recovered that saved choice, then signed out.
- Account B chose **Pet-care plans** as a guest, signed in, retained that draft through the handoff, explicitly saved it and signed out.
- Account A signed in again and recovered only **Sick-day care**, confirming the two profiles remained separate. Sign-out cleared private screen state.

The fictional-account checks exercised the deployed app, Clerk and cloud D1; their reserved codes do not test mailbox delivery. **Ada subsequently entered a real emailed code**, and the hosted Account screen confirmed her authorized address as signed in with cloud profile status resolved. No personal onboarding answers were filled or saved on her behalf. **Step 2 is complete for development.** Step 3 reviews the full onboarding save/edit/return experience and another browser. Detailed evidence is in [technical status](../docs/technical-status.md) and the [verification record](verification-auth.json).

The verified build includes fixes for sign-in modal/hash routing conflicts, Clerk's `oiat` JWT header, Workers-compatible JWKS redirect handling that rejects redirects, and recovery when the API rejects a token while the Clerk session remains active. In that last case, the app keeps explicit sign-out available and does not automatically reopen sign-in.

Existing clickable design previews remain available in `design/app/` as references. The active journey preserves their task-detail and gentle completion patterns while D1 owns task state and awards.

## Clerk configuration

The browser build accepts only `VITE_CLERK_PUBLISHABLE_KEY`, Clerk's intentionally public application key. Configure email address, email-code verification at sign-up and email-code sign-in in the Clerk Dashboard; disable password requirements for this flow. See the official [React quickstart](https://clerk.com/docs/react/getting-started/quickstart) and [email OTP configuration](https://clerk.com/docs/guides/development/custom-flows/authentication/email-sms-otp).

The server configuration uses `CLERK_ISSUER` and a JSON list in `CLERK_AUTHORIZED_PARTIES`. The current list allows exactly `https://app-auth-staging.buildmysafety.pages.dev`. The browser and API must use this same origin for the deployed test. Arbitrary preview URLs and localhost are not automatically trusted. The backend reads public signing keys from the configured issuer, never from an untrusted token URL. **No Clerk secret key is required for these profile routes.** Do not put Clerk secret keys, OpenAI keys or session tokens into Vite variables, fixtures or Git.

Account deletion additionally requires the matching Clerk instance's `CLERK_SECRET_KEY` as a server-only encrypted secret in the deployment environment. The handler verifies the owner with Clerk before D1 erasure, then deletes that Clerk identity. The preview is configured; production needs its own production key. Do not put it in Vite variables. Session JWT verification alone does not provide instantaneous revocation; app-deletion receipts additionally deny stale tokens on app routes. External Clerk dashboard deletion is not yet connected by webhook. The current web verifier requires an authorized-party claim. A future native client needs its own reviewed origin/token policy. See [Clerk session tokens](https://clerk.com/docs/guides/sessions/session-tokens) and [verification guidance](https://clerk.com/docs/guides/sessions/manual-jwt-verification).

Deletion is a two-service operation. Provider failure returns pending rather than claiming completion. Pending/deleted API responses clear private screen state and open Privacy status/retry. Pending receipts need explicit retry or operator follow-up; background reconciliation/webhooks remain release gates. The app-data export excludes Clerk's separate records. Minimal deletion receipts are retained to block recreation; database backups and provider logs have separate retention. Follow the [pending-deletion operator runbook](../docs/technical-status.md#pending-deletion-operator-runbook).

From this directory, `node scripts/check-pending-deletions.mjs <installed-wrangler-bin/wrangler.js>` reads pending counts using existing Wrangler authentication, restricted to the configured staging database. Exit 0 means none pending; exit 2 requires runbook follow-up; an error means unknown. It is an on-demand check, not an installed monitor. The recorded staging check found zero pending.

`node scripts/check-reliability-cloud.mjs` uses the already approved fictional B account with an independent, short-lived Clerk session. It changes only that fixture's onboarding and task state, restores visible task membership/completion, and writes `verification-reliability.json`. Revisions, timestamps, latest batch and one-time awards may advance. It uses the pool route, never paid generation or account deletion. A discarded successful write response tests readback; it is not a physical network outage. Do not substitute a real user's account. Manual browser/build evidence added to the verification record should be refreshed separately after a rerun.

`node scripts/check-account-cloud.mjs` performs a read-only hosted export check on the approved fictional B account. With explicit authorization for a fresh disposable run, first create `safety-privacy+clerk_test@example.com` through Clerk's development test-user setup, then pass `--delete-approved` to seed and permanently delete only that account. The helper keeps tokens in memory and ends its independent session. Do not use real addresses or replace the hard-coded account with Ada or an existing A/B fixture. The October 12 disposable account is already deleted; do not rerun the destructive flag casually.

## Develop and verify

Use Node 24 (the tests use built-in TypeScript stripping). Install this package and `personalization/` dependencies with `npm ci` in each directory. Then from this directory:

```sh
npm run build
npm test
npm run dev
```

`dev` is a frontend development server, not a local product database or authentication server. Integration tests use disposable in-memory SQLite only to exercise the real D1 adapter and HTTP handler. The automated tests use synthetic accounts and mocked external services; they make no email or model calls.

`scripts/check-foundation.cjs` is a historical Step 1 prototype check. Its old copy, question count and navigation are not a release gate for the current app. `scripts/import-design.mjs` is also historical and will refuse to overwrite maintained onboarding/elephant files unless explicitly invoked with `--restore-historical-design`; it is not part of the build.

`node scripts/check-pilot-scale-local.mjs` exercises the real Worker with 200 separate synthetic owners and disposable SQLite, including task and progress writes. It makes no network or model calls. Its timings are local diagnostics, not hosted D1 latency, mobile rendering or a claim that 200 simultaneous AI requests are supported.

After deploying the progress API and migration, `node scripts/check-progress-cloud.mjs --run` uses independent sessions for the approved fictional A/B accounts. It verifies owned counts, milestone/check-in persistence, export and undo/recompletion, then restores task membership/completion. It makes no model calls and creates or deletes no accounts. It retains the synthetic check-in; a previously completed test task may receive a new completion timestamp. The report contains counts and verification flags, never exported private content or account IDs.

## Adding the next category

The backend storage, ownership, task actions, shared matching rules, progress and API transport are reusable. The current interface and writer activation still deliberately target sick-day care; adding a catalog file alone does not activate a new category.

1. Prepare one category package: stable topic/concern IDs, researched resources, useful task outcomes, priority bands, task kind and a category-specific writer. Apply the [shared ranking rules](../docs/personalization-plan-v0.md#shared-ranking-rules--all-categories). Learning balance applies to the collection, not every batch.
2. Register its topic, resources and immutable task versions in the shared catalog, with `selectionPolicy: 'priority_first'`. Preserve old IDs and retired records so saved tasks and progress keep working. Existing interest IDs can be reused; a new ID also needs the profile/request schemas and client topic type updated.
3. Make routing and selection carry the chosen topic through `TaskJourney`: concern choices, request body, suggestions, detail label, list/progress continuation and milestone/check-in target. Replace the relevant sick-care constants with that selected topic; do not copy the whole component into a second app flow.
4. Select the writer and supported safety boundaries by topic in `build.mjs`, `new-needs.mjs` and `adaptation.mjs`. A new category must not silently inherit sick-day instructions. Reuse the same quota, validation, private content, resource and duplicate controls.
5. Test its real catalog against checkbox-only and typed requests, explicit limits, unknown context, three-card composition, at most one AI task and one linked task, history and cross-category ownership/progress. Keep authored task details and the approved interface format unchanged.
6. Build only `app/dist/client`, verify the isolated pilot host, then walk one hosted account through selection, save, completion, progress and return. A new category normally needs content/configuration, not a new user database or authentication service.

## Deployment boundary

`npm run build:pages` creates the frontend, bundles the Pages Worker and writes routing/security headers into **`dist/client/`**. Only that output directory may be deployed. `wrangler.jsonc` names the existing Pages project `buildmysafety` and binds `MEMORY_DB` to `buildmysafety-memory-staging`.

The authorized development target is the existing project's **`app-auth-staging` preview branch**. Using the configured Wrangler CLI from this directory, the target is:

```sh
wrangler pages deploy dist/client --project-name buildmysafety --branch app-auth-staging
```

Build and inspect the output before deployment. Do not deploy the repository root, archive or a production branch. Do not broaden CORS to bypass the server's origin checks. The staging alias, configured authorized origin and built public key must describe the same intended test environment.

Before inviting real customers, confirm an owned domain and DNS, create/configure the Clerk production instance, switch to its production public key/issuer, and provision separate production D1 storage. Development users and production users are separate identities; do not assume a development account or draft will migrate automatically. Clerk development mode is not the launch solution for either 100 or 1,000 users. Follow the official [production checklist](https://clerk.com/docs/guides/development/deployment/production), [environment guidance](https://clerk.com/docs/guides/development/managing-environments) and [current pricing](https://clerk.com/pricing).

Opening, saving and completing tasks never calls the model. Checkbox-only selection uses reviewed pool tasks. A typed need can produce one AI task with two fitting unseen pool companions; an explicit revision changes one chosen unsaved task. A short eligible batch is explained rather than padded. The exact preview host and `AI_ADAPTATION_ENABLED=true` gate paid calls, with `OPENAI_MODEL=gpt-6-luna` and the encrypted server secret. The pilot permits 10 attempts per account and 600 shared per UTC day; other handlers retain the 3/30 defaults. Failures count. These are attempt allowances, not dollar limits or capacity guarantees. A 30-second provider timeout, 2,200-output-token cap, request replay, one active attempt per account and private immutable snapshots protect the flow. A failed typed request stays on the form with an explanation; prepared ideas remain an explicit fallback. See the [personalization plan](../docs/personalization-plan-v0.md).

For a future native client, reuse the contracts/client/session/backend. The React DOM screens and browser navigation may need adapting; this is not a claim of automatic native conversion.
