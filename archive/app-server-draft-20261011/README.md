# Retired early app draft

Reference only, archived October 11 during Step 1. This was an uncommitted implementation draft, not a deployed customer app. It used a second backend, local sample sessions, incompatible task IDs and cookie-based client routes. The selected backend is now exclusively `personalization/`, backed by hosted Cloudflare D1.

The old server, SQLite scripts, journey test, configuration example and coupled React source are preserved here to recover useful implementation ideas. They are outside the active app's TypeScript inputs, test command, browser imports and public build. This folder is not a runnable or supported package: `package.reference.json` records the previous dependencies for historical context only. Do not copy its mock sign-in or data APIs back into the product.

The approved interaction designs remain under `design/app/`. Active onboarding copy, styling and the original elephant remain under `app/src/` and `app/public/`. The authored tasks in `src/catalog.ts` contain editorial drafts and are not an approved production collection.

No user records were moved. Never deploy this archive or the repository root.
