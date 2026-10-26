# Completion and elephant growth — proposal

September 30, 2026. Proposed next interaction after completion from either task details or the list. Ada requested Finch-like encouragement and connection in a fun, gentle way. This proposal is not yet approved or implemented; the approved task-detail screen remains unchanged.

## Product direction

Call the companion journey **Growing together**. Show practical actions the user marked done and clearly fictional elephant growth, without a safety percentage or a score purporting to measure real-world risk. Two people completing the same number of tasks are not necessarily equally safe or equally prepared.

Lead with a specific benefit of the action, then a small playful elephant response. The real accomplishment belongs to the person. The character is an original fictional companion celebrating their actions, not an emergency guardian or a substitute for people and professional support.

## Completion behavior

Both entry points use the same saved completion record and reward rules. Save successfully before confirming progress. Preserve the user's list and position. Failed saves must show a recoverable state rather than silently claiming that progress was recorded.

For an ordinary completion, show a checked task, a brief elephant wiggle and a small acknowledgment such as “Your sick-day shelf is ready. One less thing for a tired day.” Keep the person in their current context. Several rapid checks should not stack dialogs or force repeated animations.

For the first completion and an occasional milestone, show one dismissible celebration view. Its proposed elements are:

1. A short title: **A little more ready.**
2. A grounded line linked to the task: **Your sick-day essentials have a place now.**
3. The familiar lavender elephant, central and larger than on the task page, doing a brief happy sway.
4. A playful invitation: **Tiny trunk high-five?** Tapping the character triggers a small response; it is optional and never required to receive the reward.
5. A single **Growing together** indicator showing companion growth, clearly separate from safety or readiness. Do not put a currency wallet, streak, safety score and multiple meters on this screen.
6. **Back to my list**, immediate close and an accessible Undo action. The person can leave without choosing another task.

An animal animation is a proposal here, not an asset that already exists. Preserve the original minimal elephant style when drawing or animating future poses. Respect reduced motion; provide the same acknowledgment as text/static art. Sound is optional and off by default. Do not hold the completion action behind an animation.

## Small V0 reward system

Prototype pacing, to be tested rather than treated as validated thresholds:

| Moment | Proposed response |
| --- | --- |
| First distinct task completion | First shared celebration and the elephant's little greeting |
| Every subsequent distinct completion | A short character reaction and one growth increment |
| Five distinct actions celebrated | First visibly different growth pose |
| Fifteen distinct actions celebrated | Another growth pose and a small original keepsake |

Use three original visual states initially. Avoid a shop, multiple currencies, random paid rewards, time-limited collectibles or daily attendance gates in V0. The character can become more expressive as the journey grows; no stage implies actual physical protection. Do not award more for expensive purchases or pressure users to choose more difficult tasks. Generating suggestions, opening links and saving tasks do not earn completion growth.

Task progress and keepsakes must stay conceptually separate. Correct an accidental completion with Undo; preserve already unlocked character art without a loss animation or guilt message. Checking the same task again cannot earn a second award. A durable, unique award ledger and server-controlled task identity are needed; model-generated action keys alone cannot guarantee uniqueness. Clearly label any lifetime reward count as companion growth, not a count of currently completed tasks. Milestone pacing and the exact visible meter label still need founder selection.

## Making the elephant familiar

- Let the person choose its name once, with an easy way to change it later.
- Give it a small consistent personality: curious, quietly playful, fond of tiny discoveries. Keep fictional dialogue brief.
- Keep the same character visible across the list, task detail and celebration; return its evolved appearance to the normal interface after a milestone.
- Let tapping or gently petting it produce a response without earning points or starting a compulsory conversation.
- Preserve a small **Our little wins** history containing the actions the user actually chose to save/complete. Any story-like memory must derive from those records, not invented personal facts or inferred feelings.
- Welcome returning users with “Ready when you are.” No hunger, illness, sadness, lost growth or “you abandoned me” messaging for absence.

Example reviewed copy candidates: “A little care for future you.” / “Tiny trunk high-five?” / “One less thing for a tired day.” Specific benefit text should match the actual task completion condition. A sent request is not confirmed support; an order is not received supplies. Avoid generic superlatives or interpreting every action as a profound emotional breakthrough.

## Research basis and limits

Finch documents a loop in which completed goals provide energy for adventures, followed by stories and occasional discoveries. Its interface also supports interacting with and petting the character. These are useful references for a sense of continuity and shared experience; the official pages describe features, not evidence that our proposed design will improve retention or wellbeing. [Finch new-user guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide), [Finch home-page guide](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page).

Self-determination theory emphasizes supporting choice and competence, including useful positive feedback, while the effect of a reward depends on how the person experiences it. This motivates the design choices of specific acknowledgment, easy dismissal and freedom to stop. It does not establish that attachment to a fictional pet is equivalent to human relatedness, or that these particular animations will cause a psychological benefit. [SDT research overview](https://selfdeterminationtheory.org/topics/application-intrinsic-motivation/).

A meta-analysis of 138 randomized studies found that interventions promoting progress monitoring improved goal attainment on average. This supports making actual progress legible, but does not validate a safety score, a particular growth threshold or a pet reward mechanic. [Harkin et al., 2016](https://pubmed.ncbi.nlm.nih.gov/26479070/).

Sources checked September 30, 2026. Copy, milestone intervals and response timing are our product hypotheses, not findings established by those sources.

## Validation before rollout

Observe whether people can explain what their progress represents, whether the action itself feels worthwhile, and whether the elephant feels encouraging rather than demanding. Test ordinary and milestone completion from both entry points, duplicate requests, rapid checks, Undo, failed saves, reduced motion and returning after a break. Ask if the celebration feels childish, distracting, pleasant or worth revisiting. Measure actual useful actions and voluntary return alongside feedback; raw tapping and generated-task volume are not the success criteria.

Use small reviewed copy templates and local character state for V0; completion feedback does not need a new AI request. A more elaborate adventure/story system can wait until people value the core loop.
