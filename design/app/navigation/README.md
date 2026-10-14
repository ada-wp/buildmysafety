# Simple navigation proposal

30 September 2026. Ada asked for simple, functional navigation with no dead ends. This two-tab arrangement is a proposal for review, not a newly approved or deployed app. The approved task-detail source remains unchanged.

## Main destinations

- **My list**: returning-user home; elephant and growth, active tasks, completed tasks, and Find a task. Avoid a separate Home or Progress destination for V0.
- **Explore**: choose one category, select concerns or write your own, receive ideas, preview and save tasks. Keep the current Explore draft and batch when switching tabs.
- Both destinations use visible icon-and-text labels with an obvious selected state. The production bottom bar stays reachable above device safe areas without covering content or the keyboard. This contained preview uses normal document flow instead of emulating an operating-system viewport.
- **Help** is a small, labeled top action; do not put infrequent actions in primary navigation. Account/privacy/delete-data controls need a compact settings destination once storage and identity are selected; do not fabricate those policies in a mockup.

## Return paths

| Screen | Return / exit |
| --- | --- |
| First visit | Meet the elephant, then Explore. Returning users open My list. Onboarding should be brief and dismissible; it is not recreated in this preview. |
| Categories | My list tab; one category opens concerns. |
| Concerns | Back to Categories; My list tab exits while retaining the draft. |
| Task suggestions | Back to Your choices; My list tab or Go to my list. Saved items remain saved when editing choices or requesting another batch. |
| Saved task | Top-left My list. Keep the approved task presentation without the bottom bar. |
| Suggested task preview | Back to Task ideas, preserving the batch and scroll position. Add to my list is explicit. |
| Completion | Back to my list and Undo. Larger celebrations only for a first win or milestone; ordinary list checks stay in the list. |
| Help / settings | Back to the previous screen, plus a reliable My list destination. |
| External resource | Open separately and label it; returning preserves the task. |

## Production requirements before public release

- Browser Back and Forward must match visible navigation. Refresh/deep links should resolve or offer Back to my list instead of a blank screen. Routes and owned saved records, rather than transient UI state, are the source of truth.
- Keep per-category selections and free text, current batch, saved tasks, list scroll and the opened task when appropriate. Do not put concern text in URLs, analytics, or model-facing design state. Authenticated account ownership and durable storage are a separate implementation gate.
- Loading has an exit to My list. Exiting cancels waiting without losing saved items; preserve any completed batch. Failure offers Retry and Change choices, retains the draft, and never duplicates charges or saves from repeated taps.
- A genuinely empty list points to Explore. An all-done list celebrates gently, retains completed history and allows stopping. A missing/deleted task returns to My list. Exhausted ideas offer another concern/category instead of an endless generation button.
- Only show confirmation where an action loses saved data. Ordinary Back/tab changes require none. Use Undo for reversible completion/removal and keep unique completion awards separate from present task status.
- Accessible names, native controls, visible focus, predictable focus restoration, meaningful route announcements, 44px touch targets, reduced motion and sufficient contrast. Long titles and large text must not collide with controls.
- Production shell should keep footer and keyboard behavior correct on actual phones; desktop preview checks do not establish that.

## Preview and limits

- [Open the navigation preview](preview.html) or inspect [the editable source](source.fragment.html).
- Starts with two synthetic saved sick-day tasks so both main tabs can be tried immediately. It contains sample tasks, not live AI generation or a reviewed resource catalog. Non-sick-day sample details are illustrative placeholders, not approved task content.
- Includes two-tab switching, all category/concern pages, draft preservation during navigation, saving sample suggestions, task detail/back, completion/undo and help/return.
- Concern drafts remain only in memory in this version; no claim of cross-device or durable draft storage. Private saved-task preview state uses the host's local visualization-state mechanism. User-entered concern text is not included in model-facing state.
- Does not implement onboarding, authentication, real generation/retry, full saved-task management, notification delivery, native browser history routing, or a public privacy policy. Those remain implementation/QA work.
- Uses the existing original elephant asset; the fixed ivory/lavender direction and the approved task-detail file are preserved.

## Checks performed

Two destinations; all five categories with return paths; selections/manual text survive a tab round-trip; opening a task returns to its source; save action cannot add duplicates; completion can be undone without gaining another growth award; help returns; no horizontal overflow at 320, 393 and 736 CSS pixels; no JavaScript page errors. These are prototype checks, not production acceptance.
