# My Safety mobile-web app — connected sick-day journey

Step 1 consolidated the preserved welcome/onboarding/interests/recap screens, portable API client and profile controller. **Step 2 is complete for the development build:** Clerk supplies verified email sign-in, while the existing [`personalization/`](../personalization/README.md) backend and Cloudflare D1 continue to own app profiles. The old second server remains [archived](../archive/app-server-draft-20261011/README.md).

The current development preview is [app-auth-staging.buildmysafety.pages.dev](https://app-auth-staging.buildmysafety.pages.dev/?v=90c31b61#/app/concerns/sick_care), deployment `90c31b61` after the October 14 priority-first sick-day collection release. It uses a Clerk development instance and the isolated memory staging database. The five revised concerns, 27 mapped candidates, reviewed resource catalog and category-specific writer are connected. [Hosted evidence](verification-sick-care-release.json) covers pool/More ideas, save/complete/return and one actual OpenAI generation; 267 automated tests pass. This is a testing environment, not a customer launch or a replacement for the production website. Suggestion quality still needs founder review.

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
- `worker.mjs`: serves the built app, profile/onboarding/reset routes, shared catalog, owned tasks, latest batch and recommendations. Bounded adaptation and one-task new-need generation are available only on the named preview host and explicit server switches.
- `src/components/TaskFeedback.tsx`: compact like/reason/undo controls using the existing versioned task route. `profile-session.ts` also provides narrow personalization-setting and reset writes with guarded readback; the Account screen explains what reset preserves.
- `src/components/PrivacyScreen.tsx` and `../personalization/account.mjs`: account status, owner-scoped app-data export and retryable account deletion. The Worker exposes `GET /api/account`, `GET /api/account/export` and `POST /api/account/delete` with exact `{confirmation:"DELETE"}`. Migration 0005 stores a minimal deletion receipt and blocks stale root recreation; ordinary app routes deny pending/deleted accounts.
- `../personalization/onboarding.mjs`: signed-in draft checkpoints and atomic final profile/completion saves. Guest drafts remain page-memory-only.
- `../personalization/clerk-identity.mjs`: verifies Clerk session tokens with `jose` and the configured issuer's public JWKS. Only a verified subject becomes the D1 owner. The issuer, exact authorized origins, signature, session status and token times are checked; request bodies cannot select an account.

## Current behavior and verification status

The active app uses authenticated D1 storage for its first sick-day journey. Choose current concerns, receive up to three fitting tasks, inspect stable details, add with **+**, complete or undo, and return to the same list. Another batch excludes previously delivered outcomes. A stored latest batch recovers a lost response; one completion award per account/action survives undo and recompletion. Other topics have explicit coming-next exits.

Signed-in onboarding saves structured draft answers and a public checkpoint so it can resume. Final Continue atomically saves the canonical profile and completion marker, then opens Explore; returning completed accounts enter the app. Preferences remain editable from Account. The guided route, skip-to-topics shortcut and two authored elephant moments remain. Feelings and free-text notes stay temporary. Guests can carry their draft through sign-in; refreshing an unfinished guest draft clears it. There is no browser product database.

The first collection contains **nine authored tasks** in `personalization/catalog.mjs`, marked `editorial_review`. They are available only on the named founder preview host while Ada reviews content. This is connected functionality, not a synthetic task fixture; it is also not a publicly approved content release. Sources and limitations are in [catalog review](../personalization/catalog-review.md).

Current automated checkpoint: **115 app tests pass**; the unchanged backend's latest run passed **142 tests** at the privacy checkpoint. Remote D1 migrations 0001 through 0005 are applied. Earlier actual hosted calls cover [adaptation](verification-ai-adaptation.json) and [new needs after exhaustion](verification-new-needs.json). [Feedback verification](verification-feedback.json) covers real hosted persistence/reset and a local next-request assembly from fresh remote state. [Privacy verification](verification-account-privacy.json) covers actual export and deletion of one approved disposable Clerk account, stale-session denial and aggregate D1 erasure. [Reliability verification](verification-reliability.json) covers cloud draft recovery, task state/readback, stale writes, one-time awards and actual browser navigation/refresh checks. These foundation passes used zero model calls. No backend/schema/dependency changes were needed in the reliability pass. See [technical status](../docs/technical-status.md) for evidence boundaries and unfinished release checks.

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

The unconfigured foundation smoke check uses `node scripts/check-foundation.cjs` with a separately running development server on `http://127.0.0.1:4173` and Playwright available through the environment. Run it without a Clerk publishable key; it verifies the no-login/no-protected-request branch. Screenshots go in ignored `test-output/`. It is not a real-email test.

## Deployment boundary

`npm run build:pages` creates the frontend, bundles the Pages Worker and writes routing/security headers into **`dist/client/`**. Only that output directory may be deployed. `wrangler.jsonc` names the existing Pages project `buildmysafety` and binds `MEMORY_DB` to `buildmysafety-memory-staging`.

The authorized development target is the existing project's **`app-auth-staging` preview branch**. Using the configured Wrangler CLI from this directory, the target is:

```sh
wrangler pages deploy dist/client --project-name buildmysafety --branch app-auth-staging
```

Build and inspect the output before deployment. Do not deploy the repository root, archive or a production branch. Do not broaden CORS to bypass the server's origin checks. The staging alias, configured authorized origin and built public key must describe the same intended test environment.

Before inviting real customers, confirm an owned domain and DNS, create/configure the Clerk production instance, switch to its production public key/issuer, and provision separate production D1 storage. Development users and production users are separate identities; do not assume a development account or draft will migrate automatically. Clerk development mode is not the launch solution for either 100 or 1,000 users. Follow the official [production checklist](https://clerk.com/docs/guides/development/deployment/production), [environment guidance](https://clerk.com/docs/guides/development/managing-environments) and [current pricing](https://clerk.com/pricing).

Opening, saving and completing tasks never calls the model. A deliberate Find my next steps request uses the automatic route: the pool stays primary; up to one useful adaptation can replace one existing action within the batch. The exact preview host and `AI_ADAPTATION_ENABLED=true` gate paid calls, with `OPENAI_MODEL=gpt-6-luna` and the encrypted server secret. D1 limits attempts to 3 per account and 30 globally per UTC day; failures count and are not retried. A 30-second provider timeout, 2,200-output-token cap, request replay, one active attempt per account and private immutable snapshots protect the flow. Ordinary pool matching continues on provider failure or quota exhaustion with clear copy. See the [personalization plan](../docs/personalization-plan-v0.md).

For a future native client, reuse the contracts/client/session/backend. The React DOM screens and browser navigation may need adapting; this is not a claim of automatic native conversion.
