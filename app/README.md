# My Safety mobile-web app — foundation

Step 1 connects the preserved welcome/onboarding/interests/recap screens to a portable cloud profile client and session controller. The one backend is [`personalization/`](../personalization/README.md); product data belongs in Cloudflare D1. The old second server is [archived](../archive/app-server-draft-20261011/README.md).

## Boundaries

- `src/api-contracts.ts`: the current HTTP wire shapes. Do not import server prompts or storage code into the browser.
- `src/cloud-api.ts`: HTTPS fetch transport, access-token injection, safe errors, versioned writes, cancellation and no automatic mutation replay.
- `src/identity.ts`: a provider interface; the default is explicitly **unconfigured**. No fake account or login is available in this build.
- `src/profile-session.ts`: cloud load/save lifecycle, conflict handling and cancellation of old-account results. No local database/cache.
- `src/profile-draft.ts`: editable answers only. Identity, revision and dates are assigned by the server. Feelings/reflection are separate temporary screen state and never enter this profile request.
- `src/components/` and `src/App.tsx`: React presentation using the approved copy, palette and elephant. A fresh identity epoch remounts the private screen state; unchanged identity preserves edits after a failed save. Editing is disabled while a write is pending.
- `src/runtime.ts` and `src/main.tsx`: compose the client, provider and controller at the same browser origin. This is the only browser-specific setup; the client/controller do not depend on React or DOM APIs.

## Current behavior and next step

Visitors can walk through onboarding and review/edit their choices. The unconfigured state clearly explains that email sign-in and cloud saving are not yet available. Temporary answers disappear when the page reloads. There are no protected API calls while identity is unconfigured, and no local-storage persistence fallback. This does not replace the existing hosted website.

Authenticated profile create/read/edit and session races are covered by isolated tests. This is not evidence of real customer email delivery or a deployed app connection. Step 2 must select a provider, implement/verify the identity adapter and server verifier, and resolve the first-save/guest handoff before enabling login. Preserve pending onboarding input through an intentional sign-in, while clearing it on account switch/sign-out. That handoff is not implemented by the current default adapter.

Task suggestions, stable task details, My list and elephant awards will be connected in their own roadmap steps. The active build deliberately has no dead-end links into the old unsupported routes, no unrelated fallback task and no client-side synthetic rewards. Existing clickable design previews remain available in `design/app/`.

## Develop and verify

Use Node 24 (the tests use built-in TypeScript stripping). Install this package and `personalization/` dependencies with `npm ci` in each directory. Then from this directory:

```sh
npm run build
npm test
npm run dev
```

`dev` is a frontend development server, not a local product database or authentication server. Integration tests use disposable in-memory SQLite only to exercise the real D1 adapter and HTTP handler. They never contain customer accounts and make no network/model calls. Unit tests cover the profile lifecycle, ownership boundaries and interrupted writes.

Browser smoke verification uses `node scripts/check-foundation.cjs` with a separately running development server on `http://127.0.0.1:4173` and Playwright available through the environment. Screenshots go in ignored `test-output/`.

## Deployment boundary

The build emits only `dist/client/`. There is no deploy command in this package yet. Do not deploy the repository root or the archive. The eventual Cloudflare entry must serve the app's static assets and canonical API on the same origin, with its D1 binding, server secrets and a real identity verifier. Pointing a localhost browser at the preview API does not bypass its intentionally restricted origin policy. Do not enable broad CORS as a workaround.

Opening this app cannot trigger a paid AI request. Saved profile operations never need one. Do not add tokens or API keys to Vite variables, browser storage, fixtures, source or Git.

For a future native client, reuse the contracts/client/session/backend. The React DOM screens and browser navigation may need adapting; this is not a claim of automatic native conversion.
