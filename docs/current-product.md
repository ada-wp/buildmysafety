# Current product — My Safety V0

Decision snapshot: 30 September 2026, updated with the approved V1 generation prompt and Ada's confirmed email sign-in requirement. This is the current implementation reference. Dated research and archived proposals do not override it. Product flow is agreed; the latest connected screen treatments await founder visual review.

## Purpose

Help women living independently enjoy solo life with practical knowledge, preparation and people/resources they can turn to. Each visit should make one useful action feel possible. Follow [founder voice](founder-voice.md); do not frame solo living as a problem, manufacture fear or imply guaranteed protection.

## First loop

1. Meet an original, minimal elephant companion from the beginning.
2. Choose **one** category: Sick days; Daily life; My home; People I can turn to; Peace of mind.
3. Choose any of that category's **five** concerns, type a concern, or combine both. Continue requires at least one choice or nonblank input. Do not add a long questionnaire. Keep each category's draft separate when switching.
4. Receive **three** relevant AI suggestions. Expand before saving: two short sentences explaining the action, estimated time, and a useful reviewed link when relevant.
5. Use **+** to add selected suggestions to My list. Request another batch without losing saved tasks or repeating shown actions. Handle exhaustion with a clear message instead of cycling endlessly.
6. Open a saved task for two to four simple steps (usually three), a clear completion condition, and up to two useful resource links. Use the [approved Option A screen](../design/app/task-detail/README.md): steps visible together, optional links and purchase considerations in initially collapsed rows. Show two or three purchase checks only when relevant. Generate and save these details with the original task; opening it does not trigger another generation or silently change its instructions.
7. Complete a real action in My list with one completion checkbox for the whole task. The elephant grows in acknowledgment. Generation and saving do not earn growth. A task can earn its completion award only once, including across undo/re-completion or request retries.

No punishment for absence, regressing animal, distress-based streak, fear score or claimed level of real-world safety. The user may remove, defer or decide a task no longer matters. Detailed growth milestones and reminder behavior remain to be decided after this interaction is reviewed.

## Content and AI

AI personalization is required for the eventual app. The clickable design currently uses nine sample tasks to test interaction. Ada approved the [task-generator V1 prompt](prompts/task-generator-v1.md) on September 30 as the current implementation baseline. It is saved, but not yet connected to the live generator or evaluated through the paid API. The requirements below continue to apply.

- Generate preventive actions that can be taken now, tailored to selected needs and feasible time, energy, budget and support. Do not assume money, a nearby helper, a car or good health.
- Prefer small practical steps, explicit help-request messages, existing supplies, official guidance and ways to evaluate local services. Do not equate browsing a directory with confirmed help.
- Start with a curated resource catalog. The model returns resource IDs; the server validates and attaches approved URLs. Do not accept invented links. Research records are candidates, not a professionally reviewed production catalog.
- Validate structured output, relevance, duplication, length, duration and resource eligibility before display. Keep reviewed fallbacks for invalid output or outages. A useful refusal/redirect is better than unsafe advice.
- Do not diagnose, prescribe, offer hazardous DIY/security tactics or behave as an emergency service. Immediate-danger inputs require a short region-appropriate redirect, not an ordinary task batch. The content handling needs review before public release.
- Mental/body options stay optional and gentle. No treatment claims or claims that calmness proves safety. The first practical sick-day path can be tested without expanding into therapy.
- Never collect passwords, recovery codes, precise home access instructions or unnecessary medical details. Do not use private concerns in analytics or model-facing design-state summaries.

Suggested future task fields: id, categoryId, concernIds, actionKey, title, description, estimatedMinutes, resourceIds, batchId, status, savedAt, completedAt and schemaVersion. Record a unique completion award separately. Separate generation, resource lookup, task storage and UI so each can change later.

## Visual direction

Warm ivory, restrained lavender and deep ink; Instrument Serif + Inter; flat minimal elephant; chic editorial spacing. Short copy and no unnecessary subheadlines. Finch is an interaction reference, not a source of artwork. The cinematic branding website is a separate design asset; it does not replace the approved app palette.

## Delivery and scope

Start with a free mobile-friendly web product, using a focused custom React interface and the existing Cloudflare/OpenAI investment. Reuse accessible UI primitives, not a whole task-manager application. GitHub holds portable code, content, decisions and original assets.

**Email sign-in is required for V0**, confirmed by Ada on September 30. The [five-part design preview](../design/app/v0-flow/README.md) proposes a passwordless code, first-save continuation and returning-user behavior. It does not send email or verify real accounts. Account provider and task database are still an engineering decision. The assessment recommends evaluating managed identity/storage before a returning-user beta; no provider has been connected. Do not implement two task databases. Device-only saving is acceptable for this clearly labeled design prototype, not a claim of durable account sync.

Defer payments, memberships, App Store releases, community, social integrations, advanced recurrence, complex animation and push delivery until the core loop proves useful. The historical $29 four-week offer, Tally/Make setup, fixed-only content and seven-day map are earlier experiments, not V0 requirements. No Figma subscription upgrade is needed for implementation.

## Next gates

1. Review this clickable sick-day journey on a phone: three suggestions → + → My list → completion → elephant. Confirm the visual direction with the founder.
2. Implement the approved flow with real structured generation, reviewed resources, error recovery, durable owned tasks and one-time growth awards. Reconcile deployment source before touching the live site.
3. Test with 10–20 invited people. Observe task relevance, save and completion rates, time to first useful action, returning use, link usefulness and cost per useful generated batch. Ask why people abandon or do not complete; avoid rewarding raw generation volume. Prices, retention thresholds and a paid offer need evidence, not assumptions.

Confirm completion of each step to Ada. Do not label previews, proposed content or historical deployments as newly tested production behavior.
