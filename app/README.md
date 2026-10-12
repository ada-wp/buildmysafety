# My Safety mobile-web app — email sign-in connection

Step 1 consolidated the preserved welcome/onboarding/interests/recap screens, portable API client and profile controller. **Step 2 is complete for the development build:** Clerk supplies verified email sign-in, while the existing [`personalization/`](../personalization/README.md) backend and Cloudflare D1 continue to own app profiles. The old second server remains [archived](../archive/app-server-draft-20261011/README.md).

The current development preview is [app-auth-staging.buildmysafety.pages.dev](https://app-auth-staging.buildmysafety.pages.dev/), deployment `5288f337` at the October 11 verification checkpoint. It uses a Clerk development instance and the isolated memory staging database. This is a testing environment, not a customer launch or a replacement for the production website.

## Boundaries

- `src/api-contracts.ts`: the current HTTP wire shapes. Do not import server prompts or storage code into the browser.
- `src/cloud-api.ts`: HTTPS fetch transport, access-token injection, safe errors, versioned writes, cancellation and no automatic mutation replay.
- `src/identity.ts`: the portable provider interface. With no Clerk publishable key, the app stays explicitly **unconfigured** and makes no protected API calls. There is no fake login.
- `src/clerk-identity.ts` and `src/ClerkApp.tsx`: the `@clerk/react` 6.17.8 adapter and themed email sign-in UI. Clerk owns authentication, token refresh and its session storage. A token refresh does not count as an account switch.
- `src/sign-in-handoff.ts`: a cloned onboarding draft held only in this page's memory for up to 15 minutes, scoped to the next expected identity transition. It is cleared on cancellation, expiry or a later account transition; it is never a second user database.
- `src/profile-session.ts`: cloud load/save lifecycle, conflict handling and cancellation of old-account results. No local database/cache.
- `src/profile-draft.ts`: editable answers only. Identity, revision and dates are assigned by the server. Feelings/reflection are separate temporary screen state and never enter this profile request.
- `src/components/` and `src/App.tsx`: React presentation using the approved copy, palette and elephant. A fresh identity epoch remounts the private screen state; unchanged identity preserves edits after a failed save. Editing is disabled while a write is pending.
- `src/runtime.ts` and `src/main.tsx`: compose the client, provider and controller at the same browser origin. The client/controller do not depend on React or DOM APIs.
- `worker.mjs`: serves the built app plus the profile-only API. It exposes `GET /health` and `GET`, `POST`, `PATCH /api/memory`; task, recommendation, reset and AI routes are unavailable in this deployment.
- `../personalization/clerk-identity.mjs`: verifies Clerk session tokens with `jose` and the configured issuer's public JWKS. Only a verified subject becomes the D1 owner. The issuer, exact authorized origins, signature, session status and token times are checked; request bodies cannot select an account.

## Current behavior and verification status

Visitors can walk through onboarding, review their choices and intentionally continue with email. During sign-in, the guest screen remains mounted; only the structured profile choices enter the handoff. After authentication, the user reviews those choices before explicitly saving. Existing saved answers are not automatically replaced. Account changes and sign-out clear private screen state. Feelings/reflection remain temporary and do not enter profile storage.

An unfinished guest draft disappears on page reload. There is no local-storage fallback for product data. This is separate from Clerk's managed session persistence, which allows returning users to authenticate again without rebuilding a custom login system.

At the October 11 Step 2 checkpoint, **59 app tests and 75 backend tests passed**, and the app build passed. These cover simulated SDK transitions, guest handoff, profile ownership, JWT validation, interrupted writes, API rejection recovery and the profile-only Worker boundary.

The hosted preview was also exercised with two Clerk development test identities using Clerk's development test-code flow:

- Account A signed in, saved **Sick-day care**, reloaded and recovered that saved choice, then signed out.
- Account B chose **Pet-care plans** as a guest, signed in, retained that draft through the handoff, explicitly saved it and signed out.
- Account A signed in again and recovered only **Sick-day care**, confirming the two profiles remained separate. Sign-out cleared private screen state.

The fictional-account checks exercised the deployed app, Clerk and cloud D1; their reserved codes do not test mailbox delivery. **Ada subsequently entered a real emailed code**, and the hosted Account screen confirmed her authorized address as signed in with cloud profile status resolved. No personal onboarding answers were filled or saved on her behalf. **Step 2 is complete for development.** Step 3 reviews the full onboarding save/edit/return experience and another browser. Detailed evidence is in [technical status](../docs/technical-status.md) and the [verification record](verification-auth.json).

The verified build includes fixes for sign-in modal/hash routing conflicts, Clerk's `oiat` JWT header, Workers-compatible JWKS redirect handling that rejects redirects, and recovery when the API rejects a token while the Clerk session remains active. In that last case, the app keeps explicit sign-out available and does not automatically reopen sign-in.

Task suggestions, stable task details, My list and elephant awards will be connected in their own roadmap steps. The active build deliberately has no dead-end links into the old unsupported routes, no unrelated fallback task and no client-side synthetic rewards. Existing clickable design previews remain available in `design/app/`.

## Clerk configuration

The browser build accepts only `VITE_CLERK_PUBLISHABLE_KEY`, Clerk's intentionally public application key. Configure email address, email-code verification at sign-up and email-code sign-in in the Clerk Dashboard; disable password requirements for this flow. See the official [React quickstart](https://clerk.com/docs/react/getting-started/quickstart) and [email OTP configuration](https://clerk.com/docs/guides/development/custom-flows/authentication/email-sms-otp).

The server configuration uses `CLERK_ISSUER` and a JSON list in `CLERK_AUTHORIZED_PARTIES`. The current list allows exactly `https://app-auth-staging.buildmysafety.pages.dev`. The browser and API must use this same origin for the deployed test. Arbitrary preview URLs and localhost are not automatically trusted. The backend reads public signing keys from the configured issuer, never from an untrusted token URL. **No Clerk secret key is required for these profile routes.** Do not put Clerk secret keys, OpenAI keys or session tokens into Vite variables, fixtures or Git.

Session JWT verification does not provide instantaneous revocation of an already issued token; short token expiry bounds that window. The current web verifier requires an authorized-party claim. A future native client needs its own reviewed origin/token policy. See [Clerk session tokens](https://clerk.com/docs/guides/sessions/session-tokens) and [verification guidance](https://clerk.com/docs/guides/sessions/manual-jwt-verification).

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

`npm run build:pages` creates the frontend, bundles the profile-only Pages Worker and writes routing/security headers into **`dist/client/`**. Only that output directory may be deployed. `wrangler.jsonc` names the existing Pages project `buildmysafety` and binds `MEMORY_DB` to `buildmysafety-memory-staging`.

The authorized development target is the existing project's **`app-auth-staging` preview branch**. Using the configured Wrangler CLI from this directory, the target is:

```sh
wrangler pages deploy dist/client --project-name buildmysafety --branch app-auth-staging
```

Build and inspect the output before deployment. Do not deploy the repository root, archive or a production branch. Do not broaden CORS to bypass the server's origin checks. The staging alias, configured authorized origin and built public key must describe the same intended test environment.

Before inviting real customers, confirm an owned domain and DNS, create/configure the Clerk production instance, switch to its production public key/issuer, and provision separate production D1 storage. Development users and production users are separate identities; do not assume a development account or draft will migrate automatically. Clerk development mode is not the launch solution for either 100 or 1,000 users. Follow the official [production checklist](https://clerk.com/docs/guides/development/deployment/production), [environment guidance](https://clerk.com/docs/guides/development/managing-environments) and [current pricing](https://clerk.com/pricing).

Opening this app cannot trigger a paid AI request. The Worker exposes no AI route and passes no OpenAI credential into the profile handler. Saved profile operations never need a model call.

For a future native client, reuse the contracts/client/session/backend. The React DOM screens and browser navigation may need adapting; this is not a claim of automatic native conversion.
