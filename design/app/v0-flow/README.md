# Five V0 flow details

30 September 2026. Ada confirmed email sign-in and asked to work through items 1–5 from the pre-build review, step by step. The five items now have connected, tested **design-preview behavior**. This is not live authentication, durable account storage, email delivery, or AI generation. Specific copy, email-code interaction and milestone pacing are proposed defaults for visual review, not separately approved production behavior.

The [preview](preview.html) opens at the first-save email step; use `you@example.com` and the explicitly displayed demo code `123456`. The [editable fragment](source.fragment.html) includes all five flows. The host's optional design controls can show expired code, empty list, tasks to manage, all done, generation error, exhausted ideas, and growth milestones. These are preview controls, not product settings.

## 1. Email sign-in and returning

- Decision confirmed by Ada: **email sign-in**.
- Proposed interaction: passwordless six-digit email code. One flow handles both new and returning users; no password/reset screen or social login in this design.
- Explore is available before signing in. Ask for sign-in when a person first tries to save a task, or when they deliberately open sign-in. Preserve the pending task and its original details through code retry, email correction and cancellation. After successful verification, save it once and show My list.
- The preview starts with one pending synthetic task to illustrate that transition. It does not mean sign-in precedes onboarding or every visit.
- Copy: **Keep your little wins.** / **Sign in with email to keep your list and grow together.** / **Email me a code**. Verification: **Check your inbox.** / **Six-digit code** / **Continue**. Error: **That code didn’t match. Please try again.** Expired: **That code has expired. Request a new one.**
- The preview has no real emails, identities, sessions, or separate accounts. Signing out hides the sample list; signing back in restores that same synthetic preview list. An email typed here is never proof of identity. Do not reuse the demo verification code or boolean `signedIn` as real authentication.
- Production requirements: use an established identity service, verify email on the server, rate-limit sends and attempts, enforce expiration and one-time use, neutral responses that do not reveal account existence, a resend cooldown, secure sessions, and server-enforced task ownership. Choose timing limits with the provider. Maintain pending-task intent across the auth redirect/session flow without placing private text in URLs or emails. Test same-email return, different-account isolation, session expiry, unavailable email service and revoked sessions.
- Account provider selection and live email sender setup remain build work. Sign-in is not marketing consent. Give account deletion/export a clear place before the public beta.

## 2. Changing your mind

- A labeled task-options button opens a short action view: **Open task** or **Remove from my list**.
- Removal is immediate and offers **Undo**, preserving its position and completed status if restored. No guilt or confirmation wall for ordinary reversible removal.
- Completion also supports Undo. Repeated completion, undo/re-completion, or removing/re-adding the same action cannot multiply growth awards. Deleting/removing tasks does not take away unlocked elephant growth.
- Back and tab switching retain category selections and manual input during the current preview session. Production should persist drafts appropriately to the signed-in owner and allow changing them without deleting already saved tasks.
- Only the most recent reversible operation has the inline Undo in this V0 design. Production should also offer a recovery path for recently removed tasks if immediate Undo expires. Permanent account deletion is a separate confirmed destructive action.

## 3. Empty and all-done lists

- Empty: **Your list starts here.** / **Choose one small thing you’d like to make easier.** / **Find my first task**.
- All done: **A little room to breathe.** / **You’ve finished what you chose. It’s okay to stop here.** / **Explore when you’re ready**.
- Keep the completed-task section accessible. No forced next task, deadline, streak or loss of growth.

## 4. Waiting, failure and exhausted ideas

- Loading: **A moment for your ideas.** / **Finding a few manageable places to start…**. My list stays reachable; leaving the loading screen need not discard completed results or force the user back when a result arrives.
- Generation error: **A small pause.** / **We couldn’t get your ideas this time. Your choices and saved tasks are still here.** / **Try again**. If a previous batch exists, offer **Keep my previous ideas**.
- Exhausted: **Let’s leave a little space.** / **No new ideas for these choices right now. You can keep what feels useful or try another concern.** Preserve the prior batch and offer a path to change concerns.
- The mock uses a timer and fixed sample tasks. Its next-batch path deliberately demonstrates exhaustion rather than inventing fresh AI output. The host's optional design controls expose an error outcome; Retry demonstrates recovery. None is evidence of API reliability.
- Production: validate and persist server-generated batches, keep request identities and per-category draft versions, cancel or ignore stale results, suppress double submits, deduplicate task additions and action keys. Retrying an uncertain request should retrieve its status/result before starting a new billable generation. Keep prior valid results through failed regeneration. Give rate-limit/offline/time-out states truthful recovery actions. Do not promise that an already submitted upstream request is unbilled merely because the user left the page.

## 5. Elephant relationship and growth

- Name is optional and can be set in Account. The same original lavender elephant appears throughout.
- One distinct completed whole task earns one growth credit. Proposed larger celebrations at **1, 5 and 15** credits; ordinary completion stays in the list with brief feedback and Undo. These are testable product hypotheses, not research-validated thresholds.
- Three illustrative growth treatments use the existing artwork at modestly increasing sizes with labels **First little steps**, **Finding our rhythm** and **A growing friendship**. New illustrated poses/keepsakes have not been created here.
- A voluntary **Tiny trunk high-five?** triggers one short sway. Respect reduced motion, avoid autoplay loops or blocking dismissal. No sound in this preview.
- Growth is a playful record of effort, not a safety/risk score. It never decreases for absence, task removal or Undo. The completed-task list reflects actual current task state, separately from lifetime growth credits.
- Approved task-detail source is untouched. The first celebration can use the specific task outcome; later copy comes from a small reviewed library rather than an extra model call on every completion.

## Checks and implementation boundary

- Email validation/code entry, wrong and expired code recovery, editing email, pending-task continuation, synthetic sign-out/return.
- Removal/Undo, retained concern selections and manual input across tab navigation, empty/all-done states and completed history.
- Loading exit with background completion, cancel ignoring late results, Retry, retaining previous results, exhausted suggestions.
- Completion from detail/list, no duplicate growth through Undo/re-completion, optional naming, milestones and reduced motion.
- All preview scenarios fit 320, 393 and 736 CSS pixels; no JavaScript page errors. Email and free-text concern values are omitted from the stored host/model-facing snapshot. Only static allowed font/runtime resources are requested; there are no account, email-delivery or AI API calls.
- This is a synthetic design exercise, not a security/accessibility audit, a real generation evaluation or a live multi-device sync test. The prototype's private local host state is for reviewing screens only. Drafts and email input remain in memory; account storage must be built separately.
- Preserve [the deployment gate](../../../docs/technical-status.md) before any merge or deployment. Provider choice, server routes, ownership, durable records, revised generation/resource validation, costs, browser routing and real-device checks are still required before beta.
