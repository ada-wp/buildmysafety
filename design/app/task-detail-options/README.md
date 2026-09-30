# Task detail — three design options

September 30, 2026. Alternatives for founder review; no layout has been selected yet. The approved [V1 generator prompt](../../../docs/prompts/task-generator-v1.md) supplies the underlying task content. These are sample interactions, not a live generator integration or an update to the deployed app/Figma file.

Download and open [preview.html](preview.html) to compare A, B and C. The [editable fragment](source.fragment.html) is the conversation-host source; the standalone export provides local preview-state storage. All three reuse the existing minimal elephant, ivory/lavender palette and editorial type.

| Option | User benefit | Tradeoff |
| --- | --- | --- |
| A — Simple guide (recommended) | All three steps can be scanned before starting; optional resources and buying considerations expand underneath | A little more reading on the initial view |
| B — One step | One instruction at a time can feel more manageable when energy is low; See all steps restores the overview | More taps; the full scope is less visible until requested |
| C — Quick peek | A sheet keeps the list context visible and closes directly back to it | Expandable step details add taps and are less convenient to scan together |

Shared essentials: back/close, task title, time estimate, short description, numbered instructions, one observable completion condition, up to two relevant resource links, conditional purchase guidance, and one completion action for the whole task. Keep the elephant small while the user is doing the task. No timer, compulsory subtask tracking, new questionnaire or automatic external action.

Screens: [A](screens/01-simple-guide.png), [A with help open](screens/02-guide-expanded.png), [B](screens/03-one-step.png), [C](screens/04-quick-peek.png).

Verification passed: overview steps, optional resource/purchase expansion, focus next/previous and full overview, sheet expansion and close/reopen, completion/undo, saved layout preference, approved elephant rendering, all layouts at 320/393/736px without horizontal overflow, and no JavaScript page errors. Screenshots were visually reviewed. This does not test AI output, real user storage or production accessibility; modal focus behavior and long-content scrolling require implementation/device testing if the sheet is chosen.

Recommendation: start with A. Keep required instructions visible and optional information collapsible. Consider B only if testing shows that users benefit from a guided sequence. The preview does not award real product growth or send notifications.
