# Sick days & care — first category package

October 12, 2026. **Thirty complete authored task candidates, proposed checkboxes and selection guidance for founder review.** Sources were researched; tasks are not professionally approved, published in the app or tested as new API outputs. Start with this category, then repeat the approach for the other categories. The existing app flow stays intact.

- [Read the 30 tasks](REVIEW.md) — readable view generated from the pool.
- [Pool data](pool.json) — canonical editable task content and plain-language fit conditions.
- [Research and source limitations](../../../research/sick-care-pool-sources.md).
- [Category-specific AI prompt](../../../docs/prompts/sick-care-category-v0.md).

## The concern screen

**October 13 founder correction:** remove “Taking time off work or study” and keep optional manual input for AI generation. The current five choices below supersede the six-choice proposal and earlier wording. See the [research rationale](../../../research/sick-care-pool-sources.md#october-13-checkbox-review--research-interpretation) for separating practical help and check-ins. This is a content/design decision; the pool's older editorial tags and generated reading view still need deliberate remapping before live integration. Removing a checkbox does not delete task candidates or reinterpret stored answers.

**What would help you feel more prepared for a sick day?**

Choose what matters to you. We'll start with a few useful options.

| Checkbox | What it helps us choose | What it does not tell us |
| --- | --- | --- |
| Food and essentials without going out | Acquisition routes, usable meals and concrete supply gaps. | That she takes medicine, needs food assistance or lacks delivery. |
| Knowing where to get care, and what it costs | Initial care routes, access barriers and practical appointment preparation. | Whether she has insurance, a doctor, a diagnosis or an appointment. |
| Help with errands and things at home | A usable resting setup, practical services or specific agreed help. | That she has a nearby helper or can afford paid help. |
| Someone to check in with | An optional, mutually agreed contact arrangement. | That she is lonely, has an available contact or wants monitoring. |
| My pet being cared for | Pet-care options and missing parts of a real care arrangement. | The species, routine, medical needs or whether a sitter already exists. |

Keep multiple selection, optional manual input and the same Continue route. Manual label: **Anything specific you'd like help with?** Example placeholder: “I have a cat, no nearby help, and want to prepare without booking anything yet.” Helper: **We'll use what you share to create a personalized suggestion with AI.** Do not require personal disclosure or replay onboarding.

Checkboxes alone use the reviewed pool and the established optional one-task adaptation. Submitted specific text leads to one focused AI task within sick-day preparation, with or without boxes checked, using relevant allowed context and prior outcomes. It is not merely used to classify a checkbox, and does not require pool exhaustion. In a mixed batch the AI task is within the total three; a direct request can return one task without filler. Generate on submission, not each keystroke. Preserve drafts and explain unsupported requests or failures. Keep existing category, resource, duplicate and privacy rules; raw text is temporary and accepted task content is saved privately through the task flow.

No selections: offer help choosing a starting area or allow a specific typed need. Do not pretend to personalize a random batch. Checking every box does not show thirty tasks or make her complete a program.

## Selecting a useful first batch

**October 13 ranking decision:** Ada approved the [shared ranking rules for all categories](../../../docs/personalization-plan-v0.md#shared-ranking-rules--all-categories). Keep default importance as a shared editorial priority for each task, not a user safety score or a fresh model judgment on every request. Consider recurring need, practical impact and value of preparing now. Popularity/upvotes alone do not establish importance or effectiveness.

Approved priority bands, with illustrative sick-day examples awaiting task-level review:

| Default priority | Role | Examples, only when relevant |
| --- | --- | --- |
| Core preparation | Establish a missing essential option or arrangement. | Usable food access, a first care route, practical help, pet care; an agreed check-in when she wants one. |
| Make it reliable | Resolve a real remaining dependency in an existing option. | Try a chosen pet-care handoff or check the setup for a first virtual visit. |
| Extra ease | Reduce inconvenience after essential gaps are covered. | Optional laundry services or a more convenient resting setup. |

These are approved editorial bands, not a statistically demonstrated ordering, a clinical urgency scale, roadmap levels or compulsory stages. Individual task bands will be reviewed with the content. What is extra ease for one person may be core preparation for another; an explicit limitation can move it first. Do not split one meaningful action into multiple tasks just to fill bands.

Selection order: enforce eligibility and remove repeats; match the current typed need and selected concerns; use default importance among similarly relevant, feasible tasks; then use effort preferences and soft feedback to break ties. Cover different selected concerns when useful without displacing a precise current request. Important-but-inapplicable tasks never enter the batch. If context is insufficient, offer a starting choice or one useful clarification rather than treating every common gap as present. This ranking needs no AI call. The research supports recurring needs more strongly than an exact task order; keep a brief rationale and source references with each eventual default priority and revise through user benefit evidence. No runtime ordering or pool records are changed by this design note.

Use a few understandable rules, not a safety score:

1. **Start with her current selections and words.** Today's request overrides earlier interests. Use relevant explicit onboarding constraints only as defaults.
2. **Remove tasks that don't fit.** Match country, current gap, prerequisites, time and spending preferences. A pet, employer benefit, willing helper or planned procedure must not be invented. Unknown stays unknown.
3. **Remove repeated outcomes.** Exclude already shown/saved/completed ordinary suggestions and preparations she says are already handled. Only revisit an outcome at her explicit request. A different provider or title is not automatically a new outcome.
4. **Prefer a real missing capability.** A useful source of care, an accessible service, a tested process or an agreed arrangement beats an unrelated tiny chore. Basic supplies still belong when she describes that need.
5. **Offer up to three distinct fits.** When several concerns are selected, spread the first options across them where suitable. Do not force variety against a precise typed request. If only one strong fit exists, offer one rather than filler. The existing one-gentle-step preference still applies.

Use a ready pool task or authored variant first. Automatically adapt at most one of the three only when her circumstances materially change the task. A specific new supported need can generate one new action even when unused pool items remain. No AI call just to rank checkboxes, change a greeting or repeat research already in the library.

Some critical facts genuinely matter. If absent, use a concise conditional route or ask one relevant question only when it would change the next suggestion. For pet care, establish whether she needs to find a carer or already has someone willing. Do not collect a new permanent biography or medical profile. A pet-care interest can justify showing a pet-care option, but it cannot justify inventing a cat or a paid-care budget.

**Resource limit:** at most one linked task per batch, up to two reviewed links in it. Do not strip away a necessary starting link just to fill three cards. Return fewer useful options if several research tasks all require links. Internal evidence citations are not additional user-facing links.

**Timing and completion:** times are active effort; replies, shopping, travel and appointments can take longer. If the task's finish needs a reply, a sent message is still in progress. A checked unsuitable option can be a useful decision, but it must never be called support that is now available.

## What the roadmap means here

The internal tags are **Discover → Make workable → Strengthen**. They help authors distinguish finding an option, making it usable and resolving an additional real gap. They are not levels a person must pass or proof of safety.

Examples: SC01 care entry → SC03 connection test, if needed. SC26 pet-care candidate → SC27 introduction → SC28 vet permission, if not already arranged. Someone with a trusted carer can skip the first two. Do not show the whole chain automatically.

Thirty means thirty options for different circumstances, not thirty requirements per person. Insured/uninsured versions of SC01 and different easy meals in SC12 are variants within one outcome. SC05/SC30 are only for an explicitly planned procedure or hospital recovery; they must not appear as alarming default sick-day advice.

## Useful cases to review together

These are editorial selection examples, not claims of executed backend tests:

| Person's current need and known context | Useful selection | Avoid |
| --- | --- | --- |
| No care route, insured, wants to prepare before illness | SC01 with the plan/benefits route. | Assuming a doctor; requesting an estimate for an imaginary visit; pushing a membership. |
| No insurance, tight budget, asks about online care | SC01 with the health-center route and new-patient/virtual-visit questions. | Requiring comparison of several paid apps. |
| Delivery works; cat has no carer; open to paid help | SC26; SC27 only after a candidate is chosen. | More delivery setup or another feeding note. |
| No nearby support and paid errands are unaffordable | SC18's specific community-referral route, with honest local limits. | Inventing a friend or promising 211 will supply a helper. |
| Has a distant willing friend, wants practical help | SC21; SC19 only if she also wants a social check-in. | Assuming distance makes help useless. |
| Already has care, food and pet arrangements; asks for something new | Identify an explicit remaining need or ask one focused question. | Repeat those tasks or invent a new vulnerability. |
| All concerns selected; pet details and support unknown | Use a fitting current request/conditional route; ask one consequential question if needed. | Automatically prescribe five arrangements or infer insurance, a willing helper or a pet species. |
| Outside the US | Use self-contained preparation that fits; require reviewed local routes for provider discovery. | Present HRSA, US 211 or Medicaid as local options. |
| Planned procedure, no escort | SC05; team decides acceptable arrangements. | Claim a rideshare solves the requirement. |
| Immediate symptoms, emergency or medication question | Separate appropriate safety/professional-help response. | Give a preventive roadmap or infer treatment. |

## Integration notes — later, after content review

This folder is intentionally outside the runtime catalog. `use_when`, `skip_when` and `variants` are editorial conditions, not executable matching code. Don't import the JSON and claim those rules are enforced.

The existing `food`, `check_in`, `getting_care`, `pets`, `daily_tasks` IDs are still in use. The pool's older six editorial concern tags are not the current five-choice screen. Deliberately map the revised screen and tasks before a versioned release; do not import the old menu unchanged. Neither an old `daily_tasks` answer nor household help proves work obligations. Work/study is removed from the menu. Preserve older answers and task candidates rather than silently deleting or reinterpreting them.

`legacy_overlap` flags old outcomes for semantic review; it is not a blanket alias. Completing the old care-contact note does not prove access to a new provider. Honor explicit new gaps while avoiding ordinary repeated suggestions. Do not overwrite saved task versions.

The current new-need runtime also has a 20-minute cap, broad medication-word preflight and blanket spending/helper wording restrictions. Some good candidates exceed 20 minutes, require an explicitly available helper, or discuss researching paid care. Those conflicts need deliberate implementation and tests. This package does not change those protections or claim live compatibility. All user storage remains in the existing architecture; this shared pool adds no user database.

## Next category packages

The broader candidate categories remain Home & repairs, Practical help & connections, and Going out & travel. Before writing each pool, choose checkboxes that distinguish practical solutions, then research and craft at least thirty meaningful options. Do not reuse the sick-day labels across every category or make thirty rewordings of a few ideas. Sick-day preparation is the first completed draft package, not evidence that all categories are ready.

Edit `pool.json`, then run `node personalization/content-candidates/sick-care-v0/render-review.mjs` from the repository root to refresh the reading view and structural check. Editorial judgments and future real-model tests are separate from that check.
