# My Safety V0: adopt a task app or build a focused product?

Assessment completed 29 September 2026. This is an implementation recommendation, not a deployment or a promise of delivery dates.

## Decision

Build a small custom Safety web app on our existing React and Cloudflare foundations, using established UI components and managed services. Keep maciekt07/TodoApp as a reference; do not adopt its whole application as the production base.

This updates the earlier conditional recommendation to try adapting TodoApp. Its live demo proved that basic list functions work. Deeper inspection shows that the work it saves is concentrated in basic list functions, while our distinctive experience and hosted user data would still be new work. Its tightly connected styling, local user storage and extra features also create removal and replacement work.

This is a fit decision. The repository builds and its tests pass. A different visual style alone would not disqualify it.

## What we are building

The founder's documented direction is a peaceful place to embrace solo living and enjoy it fully. Practical preparation should leave someone thinking “I can handle it.” The experience must respect different budgets, energy, health and support networks.

The first loop is:

Meet the elephant → choose one category → choose concerns or write your own → see three suggestions → expand a suggestion → save with + → complete an action in My list → see the elephant grow.

- Categories: Sick days; Daily life; My home; People I can turn to; Peace of mind. Money is excluded.
- Each category has five concern choices and optional free text; no additional questionnaire before generation.
- Expanded suggestions contain a short description, estimated time and a useful resource when relevant.
- “Show me 3 more” preserves saved tasks and avoids repeating prior suggestions.
- Elephant growth celebrates completed actions. Generating or saving tasks does not earn growth; no punishment for absence, loss of progress, fear messaging or implied guarantee of protection.
- Warm ivory, restrained lavender, editorial type and minimal original elephant artwork are the approved direction.
- A mobile-friendly web app comes first. App Store distribution, community and social integrations are later decisions.

## Evidence and limits of this review

Reviewed repository: [maciekt07/TodoApp](https://github.com/maciekt07/TodoApp), pinned to `426d979b895cd61577af763c4eb0dd4589aaf4cf`.

Evaluation checkout was isolated from the Safety product repository; the reviewed upstream commit is pinned above.

| Check | Result |
| --- | --- |
| Actual source and license inspection | React/TypeScript/Vite application; MUI/Emotion styling; 110 files under src; MIT license. |
| Dependency installation | Passed using the committed lockfile, with package lifecycle scripts disabled. |
| Production build | Passed, including TypeScript and PWA service-worker generation. |
| Existing automated tests | 67 passed in five files. They cover utilities and reduced-motion styling, not the complete task workflow, accounts or AI. |
| Lint | Passed. |
| Dependency audit | 38 package findings across all dependency groups: 2 critical, 26 high, 7 moderate, 3 low. Production-only audit: 4 package findings, comprising 3 high and 1 moderate. |
| Prior live demo test | Added three synthetic tasks, expanded descriptions, edited, completed one task and confirmed same-browser persistence after refresh. |

Audit counts are package-level advisory findings, not 38 distinct exploitable application flaws. Many concern development tooling or framework/server features that this static app may not use. Runtime findings still need applicability review and dependency updates before adoption. No exploit testing was performed. No automatic dependency fixes were applied.

The build and test runner initially hit a Windows sandbox directory-access error. Both passed after authorized execution outside that restriction. That initial failure is an environment issue, not an upstream code defect. Runtime used: Node 24.14.0 and npm 11.9.0.

This was not an exhaustive security audit. Phone installation, real push delivery, offline conflict recovery, accessibility and multi-user privacy were not certified. The existing Safety API and separate website were inspected; they were not redeployed or retested end to end in this review.

## What TodoApp saves and what it does not

| Product need | Existing code | Remaining work if we adopt it |
| --- | --- | --- |
| Add/edit/complete/delete a task | Available | Simplify interaction and test our exact behavior. |
| Expand descriptions and render links | Available | Replace the presentation; add explicit duration and reviewed-resource fields. |
| Local persistence | Available | Suitable for a device-only prototype; build hosted storage and ownership for a returning-user beta. |
| Account-based saving across devices | Not provided | Implement managed login and per-user data access. Manual PeerJS pairing exists, but is a different experience. |
| Category → concerns → three suggestions | Not provided | Build the whole selection/generation flow. |
| AI personalization and approved links | Not provided | Build the generation contract, content library, validation, fallback, cost controls and quality evaluation. |
| Save selected suggestions; generate more without duplicates | Not provided | Add suggestion batches, saved-task state and repeat prevention. |
| Elephant growth | Not provided | Create art/states and completion-based progress logic. |
| Our visual direction | Substantially different | Replace most visible layouts and styles. |
| Installable web app | PWA configuration available | Adapt icons, caching and update behavior; test devices. |
| Scheduled push reminders | Not found | Build permission, subscription, scheduling, delivery and cancellation. Notification permission in App.tsx is used for the app badge, not a reminder system. |

### Concrete integration concerns

1. **Storage is browser-local.** `UserProvider.tsx` stores one user object through `useStorageState.ts`; tasks, settings and categories are embedded in that object. Clearing browser data can remove the list. The profile screen is not authenticated user accounts. Manual P2P sync does not supply account recovery or a hosted source of truth.
2. **Presentation and task updates are connected.** `TaskProvider.tsx`, `TasksList.tsx` and `TaskMenu.tsx` coordinate UI state and mutate the shared user object. There is no small independent task service we can simply plug into our frontend. Reuse is possible, but extraction needs work.
3. **Our data needs differ.** `Task` has name, description and a done flag, but lacks dedicated estimated minutes, resource IDs, suggestion provenance and a completion-award record. Simply extending text fields will make reliable AI and growth behavior harder later.
4. **Inherited third-party behavior needs cleanup.** `index.html` contains the upstream author's Google Analytics property. `RenderTaskDescription.tsx` sends a task's resource URL to Google's favicon endpoint. Neither should be carried over automatically into a product containing personal concerns.
5. **Persistence needs hardening.** `useStorageState.ts` parses JSON and writes storage without validation or local error recovery. The app has some default-field migration logic, but no explicit versioned task-data migration contract. Corruption, denied storage and quota errors require handling.
6. **Dependency maintenance is real work.** The repository uses legacy peer-dependency resolution and an override for the bottom-sheet library. Installation warned about an unmaintained gesture dependency. These do not prove broken behavior, but they add upgrade work before a long-lived fork.
7. **Unneeded features create surface area.** QR sharing, P2P sync, many appearance controls, speech and other utilities serve the original app. Our first product does not need to maintain that entire feature set.

Source references at the reviewed commit: [storage hook](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/src/hooks/useStorageState.ts), [user/task types](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/src/types/user.ts), [task provider](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/src/contexts/TaskProvider.tsx), [link renderer](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/src/components/tasks/RenderTaskDescription.tsx), [HTML](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/index.html), [package manifest](https://github.com/maciekt07/TodoApp/blob/426d979b895cd61577af763c4eb0dd4589aaf4cf/package.json).

Retain the MIT copyright and license notice if copying substantial source. This review does not grant rights to third-party or Finch artwork; the elephant should be original.

## We are not starting with an empty project

The existing Cloudflare pilot contains a server-side OpenAI call, protected secret handling, D1 storage, request validation, structured output, result caching and a generation limit. These are useful patterns to extend.

It is currently a seven-day-plan pilot: `/api/scans` and `/api/generate`, a scan-based database model and five total generations per day. It is not a task/account backend. We must adapt the output contract, retry behavior, task storage and cost limits for the new flow. A failed generation currently enters a state that does not permit an ordinary retry, which needs attention.

The separate React branding website already uses Radix, Tailwind, Inter and Instrument Serif. Its README explicitly says it has no connected forms or Safety API. It can supply components and branding, not a completed app. The approved interactive task preview supplies another useful design reference.

These are separate existing artifacts, not an already integrated product. This assessment made no changes to them.

## Comparable workload estimates

These are planning estimates for one experienced developer working with Codex, with approximately six focused engineering hours per day. They are not measurements, vendor quotes or calendar commitments. Both options target the same behavior and quality. Design revisions, founder content decisions and external specialist review can extend calendar time.

| Deliverable | Focused custom app | Adapt the whole TodoApp |
| --- | --- | --- |
| One polished, clickable sick-day journey; sample content; same-browser saving | 2–4 engineering days | 3–6 engineering days |
| Private beta: all five category flows, real AI, reviewed resource IDs, managed accounts, cloud-saved tasks, simple elephant growth and core tests | 10–16 days total | 13–22 days total |
| Add scheduled web push after the core beta | Another 3–6 days | Another 3–6 days |

The first row is included in the beta total, not added to it. Native App Store/Play Store releases, payment, community, complex character animation, offline multi-device editing and professional medical review are excluded. The beta assumes a modest initial content library approved in parallel and no medical diagnosis/treatment feature. Actual device QA and content iteration may reveal more work.

For the custom beta, the main work is approximately: UI and interaction (3–4 days), generation/resource pipeline (2–4), accounts and saved data (2–3), simple growth (0.5–1), and release testing/fixes (2–4), with some overlap. There is no defensible exact percentage saving from a fork; the basic list implementation is a small part of the total.

### Risks common to both choices

- **Useful AI output:** validate three concise tasks; measure relevance, effort and practical value against representative examples. A good prompt alone is insufficient.
- **Trustworthy links:** start with a curated, region-tagged directory. The model returns approved resource IDs; the server supplies URLs. Reject unknown IDs and retain a reviewed fallback. Do not rely on the model to invent URLs.
- **Private saved data:** enforce ownership for every task read/update/delete and test access between two different users. Avoid storing unnecessary health or location details.
- **Reliable progress:** completion should award growth once per task; repeated clicks, retries or marking done/undone must not multiply rewards.
- **Repeat prevention and spending:** track shown and saved suggestions; cap generation per user and globally; recover cleanly from timeouts and invalid output. Cache where appropriate.
- **Maintenance:** both approaches need dependency updates, error monitoring, data deletion and restore/export procedures. Custom code also needs tests; it is not inherently secure because we wrote it.

## Tools I would use

| Tool | Job | Decision |
| --- | --- | --- |
| Codex + GitHub | Build, review and keep portable source/history | Continue using. The founder does not need to choose or learn programming languages first. |
| React + existing Radix/Tailwind components | App screens and accessible interaction primitives | Reuse these building blocks and approved visual assets. No need to change to Next.js solely for this app. |
| Cloudflare | Serve the app and run the server-side generation endpoint | Keep the existing investment. D1 remains useful for the current pilot and can also support a device-only trial. |
| OpenAI API | Personalize the three suggestions within our content rules | Extend the existing server integration; do not expose credentials to the browser. |
| Supabase Auth + Postgres, when accounts are introduced | Managed login and cloud-saved per-user tasks | Recommended option for the private beta to avoid implementing account infrastructure ourselves. Use row-level access policies and test them. Keep new task data in one database; do not mirror it into D1. No migration or account creation is authorized by this assessment alone. |
| Lovable | Optional rapid visual experiments | Not necessary for this route. Its documented GitHub integration can export and sync Lovable-created projects, but currently cannot import an existing GitHub repository. It is not a direct way to open this TodoApp and restyle it. |
| Make | Optional later operational automations | Keep outside the immediate save/complete/generate path. Reconsider for email follow-ups or administrative workflows when there is a real need. |
| Figma / notification service | Optional design collaboration / later delivery | No Figma upgrade is needed to build. Evaluate a push provider when reminders are actually scheduled for implementation. |

Supabase introduces another service and its own billing/operational decisions. It is an engineering-time tradeoff, not a claim that migrating all existing data is necessary. If keeping D1 for all app data is a hard requirement, a managed identity provider plus ownership checks in the Worker is a viable alternative; decide once before implementing accounts. Do not build two parallel task databases.

Current official references: [Supabase authentication](https://supabase.com/docs/guides/auth), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Lovable GitHub integration and limitations](https://docs.lovable.dev/integrations/github), [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Apple web push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

For early testing, Cloudflare's free allowances may cover hosting and database activity; its paid Workers plan starts at $5/month before additional usage. OpenAI usage and any account, email or notification service are separate costs. An exact monthly estimate needs active users, generations per user, model choice and average token usage. Buying several builders/automation subscriptions now is not required to validate the product.

Web push requires user permission and platform testing. On supported iPhones/iPads it also requires the web app to be added to the Home Screen. “Installable” does not by itself supply a reminder scheduler or guarantee delivery.

## Recommended execution gates

1. **Approve the product feel with one working journey.** Use “I want to prepare for being home sick.” Show three sample suggestions, expansion, +, My list and a simple elephant response. Use same-browser saving for this explicitly labeled prototype. Done when the founder can use it on a phone and approves the interaction and style.
2. **Make the advice useful and the progress durable.** Connect real AI, approved resources, duplicate control and managed accounts/cloud saving; then populate the other category flows. Done when sample scenarios pass content review, two users cannot access each other's tasks, refresh/re-login preserve progress and failed generation can be retried safely.
3. **Run a small returning-user pilot.** Invite approximately 10–20 people through the founder, observe whether they save and complete useful actions, then test reminders if returning behavior warrants them. Done when the team has evidence about helpfulness, completion, repeat use and generation cost—not merely a deployed URL.

Confirm completion of each gate to the founder. The founder's main inputs are visual preference, whether the recommendations feel useful, and whether the elephant is encouraging. Technical implementation choices should be handled by the engineering lead and explained in plain language when they affect cost, portability or experience.

## What should remain portable

Keep the content/resource directory, task records, prompt/output schema, generation checks, visual tokens and original character assets in clearly owned files or exportable records. Separate suggestion generation from task storage and from the UI. Keep durable IDs for resources, tasks and completion awards. Store code in GitHub and maintain database migrations and export procedures.

These assets transfer to another hosting provider or a future mobile app. React web UI would not automatically become native mobile UI; that interface may need rebuilding even when the backend and content can be reused.


## Candidate research retained from the first search


| Resource | What we can get | Fit for this V0 |
| --- | --- | --- |
| [Super Productivity](https://github.com/super-productivity/super-productivity) | An established task app with schedules, time tracking, recurring-task workflows and optional sync. Its main code is [MIT licensed](https://github.com/super-productivity/super-productivity/blob/master/LICENSE). | The most promising full-app fork among those reviewed if broad task-management features become essential. Its Angular application would replace our React direction and require considerable simplification and custom UI work. |
| [Vikunja](https://github.com/go-vikunja/vikunja) | A substantial task backend and frontend, deployed as a binary or container. | Useful if we need shared projects and a full task service. Its documented server deployment adds infrastructure outside the current Pages/D1 setup. The main code is AGPL; a modified network-served version has corresponding-source obligations. |
| [Habitica](https://github.com/HabitRPG/habitica) | A working task-and-reward game. | Useful for studying interaction patterns. Its failure/health-loss loop conflicts with our philosophy. Code is GPLv3, while Habitica-designed assets/content use a noncommercial license; do not reuse that artwork for our commercial product. |
| [TaskTrove](https://github.com/dohsimpson/TaskTrove) | A React-based task application with recurring tasks and several task views. | Exclude as the default commercial foundation: the current Sustainable Use License limits use to internal business, personal or noncommercial purposes. It is source-available with restrictions, rather than a permissively licensed product starter. |
| [shadcn/ui](https://ui.shadcn.com/docs) | Editable component source for controls such as checkboxes, dialogs and collapsible details. | Recommended reuse layer alongside the Radix components already in our site. It is not a task database or complete app. We can apply the approved ivory/lavender design without adopting another product's screens. |

License and hosting sources: [Vikunja license](https://github.com/go-vikunja/vikunja/blob/main/LICENSE), [Vikunja installation](https://vikunja.io/docs/installing/), [Habitica license](https://github.com/HabitRPG/habitica/blob/develop/LICENSE), [TaskTrove current license](https://github.com/dohsimpson/TaskTrove/blob/main/LICENSE.md), [shadcn/ui MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md). Keep copyright/license notices for reused code and inspect any separately licensed assets or dependencies at adoption time.

GitHub repository metadata checked on the review date: none of the five repositories was archived. Super Productivity, Vikunja, Habitica and shadcn/ui reported pushes on September 29; TaskTrove reported January 9, 2026. Push timestamps indicate activity, not quality or security assurance.


## Smaller-app shortlist retained from the second search


| Candidate | Existing foundation | Reuse judgment |
| --- | --- | --- |
| [TodoApp — maciekt07](https://github.com/maciekt07/TodoApp) | React 19, TypeScript, Vite, MUI; tasks, descriptions, categories, PWA configuration, local persistence and JSON import/export. MIT. | Closest candidate among the smaller task apps examined; the final decision remains a custom app. Compatible with the language/framework direction of our current site. MUI styling differs from our existing Tailwind/Radix UI, so integration and restyling are still work. |
| [MinimalTodoApp — huuquyet](https://github.com/huuquyet/MinimalTodoApp) | A small Expo/Next/Tamagui monorepo; add, complete, delete and filter tasks; Zustand/MMKV persistence. MIT. | Actual reusable starter, but too thin to save much work on descriptions, resources and reminders. Inspected native dependencies still use Expo SDK 51 and React Native 0.74.5, so native adoption needs an upgrade assessment. |
| [Doable](https://github.com/theakhinabraham/doable-todo-list-app) | Flutter, SQLite, task title/description, scheduling and local notification code. MIT. | A smaller native-app alternative if mobile-store delivery becomes the priority. Does not reuse our React UI. Reminder scheduling code was inspected, but delivery was not tested on a device. |
| [Zest](https://github.com/darkmoonight/Zest) | Flutter task app with categories, subtasks and scheduled notification support. MIT. | More complete native alternative, with Android downloads and a broader feature set. More than we need for the first web pilot. Native platforms and notifications were not tested. |
| [ZenDo](https://github.com/rishikanthc/zendo) | Weekly task planning, tags, progress and PWA support. MIT. | Additional small web candidate, but its planning-first structure is less aligned with our three-suggestion flow. Reviewed documentation/configuration, not live behavior. |
| [tududi](https://github.com/chrisvel/tududi) | React/Node task service with API, recurring tasks, projects and notes. Main LICENSE is MIT. | Worth retaining for a fuller service later. Larger than the small list we need; its server/storage architecture would add integration work. |

Actual LICENSE files were downloaded and checked, rather than relying only on README claims. MIT code can be commercially adapted subject to retaining its required notices. Separately licensed assets and dependencies still need review before copying them.

Sources: [TodoApp license](https://github.com/maciekt07/TodoApp/blob/main/LICENSE), [MinimalTodoApp license](https://github.com/huuquyet/MinimalTodoApp/blob/main/LICENSE), [Doable license](https://github.com/theakhinabraham/doable-todo-list-app/blob/main/LICENSE.md), [Zest license](https://github.com/darkmoonight/Zest/blob/main/LICENSE), [ZenDo license](https://github.com/rishikanthc/zendo/blob/main/LICENSE), [tududi license](https://github.com/chrisvel/tududi/blob/main/LICENSE).


## Observed live behavior before the engineering assessment

These were synthetic tests of upstream demos on September 29. They do not change the custom-app decision above.

## Live test A: TodoApp


[Open the upstream demo](https://react-cool-todo-app.netlify.app/).

Used three synthetic tasks in the demo browser:

1. Set up a sick-day shelf — 10 min.
2. Arrange a simple check-in — 5 min.
3. Save a grocery delivery option — 5 min.

| Check | Observed result |
| --- | --- |
| Add three tasks | Passed; all three appeared in the list. |
| Save a two-sentence description | Passed. |
| Expand description | Passed; Show More revealed the full text. |
| Mark a task completed | Passed; progress changed to one of three / 33%. |
| Reload page | Passed; three tasks and the completed state remained after loading. |
| Edit an existing description | Passed; saved text updated. |
| Render a resource URL | Passed; a sample URL rendered as an external link in the expanded description. Navigation to that resource was not tested. |
| Display estimated minutes | Worked only by including minutes in the title; no dedicated estimate field was observed in the form. |

The resource URL used was an ordinary retailer website solely to test link rendering; this was not a vetted Safety recommendation.

Observed fit gaps:

- The add/edit form uses a 40-character name limit and 350-character description limit. We need separate estimated time and resource fields to avoid crowding titles/descriptions.
- Task completion is available in the task menu. Our intended completion checkbox should be obvious and separate from expansion.
- The current colors, large cards, metadata and productivity slogans need substantial simplification for our warm editorial style.
- Its technical Task Details screen exposes IDs and timestamps; we should use our brief actionable description view.
- No AI safety generation, three-item suggestion batch, selection-before-saving or elephant growth was tested or provided by this flow. These remain custom work.
- Persistence was verified within the same browser only. This is not proof of account-based cross-device sync.
- The project advertises PWA/offline behavior. Airplane-mode operation, phone installation and notification delivery were not verified in this test.

## Live test B: MinimalTodoApp

[Open the upstream demo](https://minimaltodoapp.vercel.app/).

Added the shelf task, clicked its title, confirmed completion, reloaded, then opened Completed and verified the task remained. The list briefly appeared empty during loading before the stored task was available.

Adding, completion, completion filtering and same-browser persistence passed. Clicking the title completed the task; it did not open a description. The inspected task model contains text, completion and color, without a description, resource list or estimated duration. That makes this a usable tiny starter, but a weaker fit for the preview-before-adding experience.

Both tested demo tabs were kept available. The sample tasks belong to the tested browser's local state; another device or browser will not necessarily show them.


## Source versions from the second search


Source snapshots, license files, package manifests and repository metadata remain in the original local `second-search` research folder, outside this curated repository. Recorded heads: TodoApp `426d979b895cd61577af763c4eb0dd4589aaf4cf`; MinimalTodoApp `45dd8057330a3d6fb1866c759458c014e4e8614a`; Doable `1dbd62ca3bb5c5021ea375c2850470127152eb48`; Zest `9b2d2631f036dec13b3062025cec9ce68f191551`. Upstream live demos may be running different commits.

No upstream code was incorporated into the Safety site, and the existing deployment was not changed. A local clone attempt hit a Windows Git TLS credential error; this did not block the requested live-demo tests or source/license inspection through HTTPS.


## Verification record

[Machine-readable verification](verification.json) records the reviewed commit and summarized build/test/audit results. Full execution logs and raw package-audit responses remain in the local recovery material; no upstream application source was adopted. No production deployment, data migration or paid purchase was made in the assessment.
