# Sick days & care — first category package

October 12, 2026. **Thirty complete authored task candidates, proposed checkboxes and selection guidance for founder review.** Sources were researched; tasks are not professionally approved, published in the app or tested as new API outputs. Start with this category, then repeat the approach for the other categories. The existing app flow stays intact.

- [Read the 30 tasks](REVIEW.md) — readable view generated from the pool.
- [Proposed priority mapping for all 30](REVIEW.md#proposed-priority-mapping) — 15 Core preparation, 11 Make it reliable, 4 Extra ease; individual ratings await review.
- [Twelve practical learning tasks](REVIEW.md#practical-learning--proposed-rewrite) — the October 13 rewrite adds useful knowledge and resource awareness, with ten learning tasks in tiers 2/3.
- [Historical selection rehearsals](SELECTION-REVIEW.md) — exact outputs from the strict approach Ada subsequently rejected; not validation of the current priority-first policy or a live app/AI test.
- [Pool data](pool.json) — canonical editable task content and plain-language fit conditions.
- [Research and source limitations](../../../research/sick-care-pool-sources.md).
- [Category-specific AI prompt](../../../docs/prompts/sick-care-category-v0.md).

## Learning is useful preparation

Ada's October 13 correction is **roughly 30–50% dedicated learning tasks**, especially in the second and third tiers, with fewer relationship exercises or trials for their own sake. The revised draft has twelve: 2 Core preparation, 8 Make it reliable, 2 Extra ease. That is 40% of all thirty, or 44% of the twenty-seven non-parked candidates. The remaining tasks may also include research; this count describes each task's primary completion outcome.

Learning should leave her with a useful distinction, a resource she did not know, a better-informed choice or a way to find reliable answers. Give a concrete insight in the task plus a checked starting point; don't simply assign vague research. She may finish by understanding which service fits or recognizing what still needs confirmation. No compulsory notes, quizzes, calls, account creation, purchases or rehearsals. Use ordinary deliberate task completion and elephant feedback; opening a link is not automatic completion and learning does not prove support is arranged.

SC03/06/08/09/12/15/16/17/20/21/25/26 are rewritten as learning tasks. SC20 and SC21 now teach home-help service types and local resource discovery instead of arranging or practicing favors. Keep an actual chosen-carer introduction (SC27), veterinary permissions (SC28) or a wanted mutual check-in (SC19) when it addresses a real need. Do not make every task passive reading or force the pool ratio onto each recommendation batch. All texts remain drafts for review.

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

**Latest founder correction, October 13: prioritize, rather than over-exclude.** A selected checkbox is enough to show interest. Her current need gets the strongest priority, matching concerns come next, and research-informed importance plus known preferences help order useful options. Unselected concerns, unknown circumstances and an unstated precise gap are not automatic bans. Keep room for related discoveries: part of the product's value is introducing options she did not know to ask about. Use conditional wording where needed, without inventing facts or collecting another questionnaire. This supersedes the strict selection rehearsal and the interpretation of every `use_when`/`skip_when` sentence as an executable exclusion. Review those fields as priority/context guidance, retaining true restrictions and dependencies separately before integration. The pool records themselves have not yet been rewritten or deployed.

**October 13 ranking decision:** Ada approved the [shared ranking rules for all categories](../../../docs/personalization-plan-v0.md#shared-ranking-rules--all-categories). Keep default importance as a shared editorial priority for each task, not a user safety score or a fresh model judgment on every request. Consider recurring need, practical impact and value of preparing now. Popularity/upvotes alone do not establish importance or effectiveness.

Approved priority bands, now assigned as a proposed default to every candidate in [the review view](REVIEW.md#proposed-priority-mapping):

| Default priority | Role | Examples, only when relevant |
| --- | --- | --- |
| Core preparation | Establish a missing essential option or arrangement. | Usable food access, a first care route, practical help, pet care; an agreed check-in when she wants one. |
| Make it reliable | Resolve a real remaining dependency in an existing option. | Try a chosen pet-care handoff or check the setup for a first virtual visit. |
| Extra ease | Reduce inconvenience after essential gaps are covered. | Optional laundry services or a more convenient resting setup. |

These are approved editorial bands, not a statistically demonstrated ordering, a clinical urgency scale, roadmap levels or compulsory stages. The October 13 mapping is **15 Core preparation, 11 Make it reliable and 4 Extra ease**. Each task's `priority` contains a proposed band, reason and circumstances that change its position; existing `source_ids`, `use_when` and `skip_when` remain essential. The task-level assignments are not founder approval. What is extra ease for one person may be core preparation for another; an explicit limitation can move it first. Do not split one meaningful action into multiple tasks just to fill bands. The older `stage` tags describe action type and must not be converted mechanically into priority.

**Scope of the 30:** SC22 (absence process), SC23 (work handoff) and SC24 (business pause) are classified but parked outside default checkbox suggestions because Ada removed the work/study choice. Keep the drafts for an explicit supported request; do not delete old user tasks or silently restore a work menu. That leaves 27 candidates potentially eligible through current concerns, each still conditional on fit, not 30 general starting tasks. SC25 stays a conditional practical/pet-care funding route only when employer benefits and that need are explicitly known. SC05, SC29 and SC30 require the specific planned procedure or extended absence in their fit rules and never appear merely because someone lives alone.

Selection order: current need and interests first, then research-informed importance and personal fit. Related lower-ranked options stay available within the supported category. Apply narrow boundaries for known contradictions, explicit restrictions, unavailable regional resources, duplicates and genuine practical prerequisites. Unknown context alone does not establish a contradiction. Broad choices should yield useful starting suggestions; ask one question only when a consequential route cannot be handled conditionally. This ranking needs no AI call. Default priorities remain editorial judgments informed by research, not a proven exact order or live implementation.

Use a few understandable rules, not a safety score:

1. **Start with her current selections and words.** Today's request overrides earlier interests. Use relevant explicit onboarding constraints only as defaults.
2. **Adjust priority for fit.** Favor relevant, accessible actions using what she shared. Missing details and unselected concerns lower confidence or priority rather than automatically removing options. Do not invent a pet, benefit, helper or planned procedure; use a conditional discovery task where appropriate. Genuine action dependencies and explicit limits still matter.
3. **Remove repeated outcomes.** Exclude already shown/saved/completed ordinary suggestions and preparations she says are already handled. Only revisit an outcome at her explicit request. A different provider or title is not automatically a new outcome.
4. **Introduce useful possibilities.** She should not have to know a resource exists or name the exact gap first. Show relevant options and knowledge alongside practical preparation. Avoid generic chores added just to fill slots.
5. **Offer up to three distinct fits.** When several concerns are selected, spread the first options across them where suitable. Do not force variety against a precise typed request. If only one strong fit exists, offer one rather than filler. The existing one-gentle-step preference still applies.

Use a ready pool task or authored variant first. Automatically adapt at most one of the three only when her circumstances materially change the task. A specific new supported need can generate one new action even when unused pool items remain. No AI call just to rank checkboxes, change a greeting or repeat research already in the library.

Some critical facts genuinely matter for a particular action. Pet-service discovery can start from interest alone, with conditional species/coverage guidance. An introduction needs an actual chosen carer. Unknown budget is not a ban on researching service costs; a clear rejection of paid services is different. Use concise conditional guidance or a focused clarification only when necessary for the action, not as the default next screen. No new permanent biography or medical profile is needed.

**Resource limit:** at most one linked task per batch, up to two reviewed links in it. Do not strip away a necessary starting link just to fill three cards. Return fewer useful options if several research tasks all require links. Internal evidence citations are not additional user-facing links.

**October 13 resource-copy agreement:** give one or two concrete, relevant apps/services by name with what each helps with and what to check; visible links are not required in task copy. SC26's learning rewrite now names Rover, plus Meowtel only for a cat, with checked source records. Names still need country/species/budget fit; don't force two recommendations or invent an unsupported provider. Other examples include FoodKeeper, Poplin and the distinction between meal kits and prepared meals. Runtime resource-catalog wiring remains pending. Preserve the existing batch resource limits when connecting named recommendations; names are not a way to bypass the allowance.

**Timing and completion:** times are active effort; replies, shopping, travel and appointments can take longer. If the task's finish needs a reply, a sent message is still in progress. A checked unsuitable option can be a useful decision, but it must never be called support that is now available.

## What the roadmap means here

The internal tags are **Discover → Make workable → Strengthen**. They help authors distinguish finding an option, making it usable and resolving an additional real gap. They are not levels a person must pass or proof of safety.

Examples: SC01 establishes a care route; SC03 teaches joining/support options only if that knowledge is missing. SC26 now teaches pet-care service types; it does not choose, vet or book a sitter. SC27 is relevant only after a candidate has actually been selected, and SC28 only for an unresolved vet-permission arrangement. Someone with a trusted carer can skip discovery. A knowledge task is not proof of a practical prerequisite, and no full chain is shown automatically.

Thirty means thirty options for different circumstances, not thirty requirements per person. Insured/uninsured versions of SC01 and different easy meals in SC12 are variants within one outcome. SC05/SC30 are only for an explicitly planned procedure or hospital recovery; they must not appear as alarming default sick-day advice.

## Useful cases to review together

These are editorial selection examples, not claims of executed backend tests:

| Person's current need and known context | Useful selection | Avoid |
| --- | --- | --- |
| No care route, insured, wants to prepare before illness | SC01 with the plan/benefits route. | Assuming a doctor; requesting an estimate for an imaginary visit; pushing a membership. |
| No insurance, tight budget, asks about online care | SC01 with the health-center route and new-patient/virtual-visit questions. | Requiring comparison of several paid apps. |
| Delivery works; cat has no carer; wants to understand paid care options | SC26 explains service types and named apps; SC27 only after an actual candidate is independently chosen. | Claiming a comparison selected or booked a carer; more delivery setup or another feeding note. |
| No nearby support and paid errands are unaffordable | SC18's specific community-referral route, with honest local limits. | Inventing a friend or promising 211 will supply a helper. |
| Wants to understand support beyond an existing social circle | SC21 teaches a relevant local 211 starting route. For a specific errand, use SC18 instead of generic directory browsing. | A compulsory remote-friend rehearsal, or claiming a referral is arranged help. |
| Already has care, food and pet arrangements; asks for something new | Identify an explicit remaining need or ask one focused question. | Repeat those tasks or invent a new vulnerability. |
| All concerns selected; pet details and support unknown | Use a fitting current request/conditional route; ask one consequential question if needed. | Automatically prescribe five arrangements or infer insurance, a willing helper or a pet species. |
| Outside the US | Use self-contained preparation that fits; require reviewed local routes for provider discovery. | Present HRSA, US 211 or Medicaid as local options. |
| Planned procedure, no escort | SC05; team decides acceptable arrangements. | Claim a rideshare solves the requirement. |
| Immediate symptoms, emergency or medication question | Separate appropriate safety/professional-help response. | Give a preventive roadmap or infer treatment. |

## Integration notes — later, after content review

**Historical October 13 selection checkpoint:** three synthetic cases and fourteen checks ran in [the former strict rehearsal](SELECTION-REVIEW.md). Ada rejected the excessive exclusion approach afterward. Retain this as evidence of the earlier behavior; it does not validate the priority-first correction. Rerun the cases using prioritization before integration. The pet-carer transition remains a useful content issue, while the checkbox-only dead end was a rule error to remove, not a reason to demand more user data. No pool copy, app code or cloud data changed in this policy correction.

This folder is intentionally outside the runtime catalog. `use_when`, `skip_when` and `variants` are editorial conditions, not executable matching code. Don't import the JSON and claim those rules are enforced.

The existing `food`, `check_in`, `getting_care`, `pets`, `daily_tasks` IDs are still in use. The pool's older six editorial concern tags are not the current five-choice screen. Deliberately map the revised screen and tasks before a versioned release; do not import the old menu unchanged. Neither an old `daily_tasks` answer nor household help proves work obligations. Work/study is removed from the menu. Preserve older answers and task candidates rather than silently deleting or reinterpreting them.

`legacy_overlap` flags old outcomes for semantic review; it is not a blanket alias. Completing the old care-contact note does not prove access to a new provider. Honor explicit new gaps while avoiding ordinary repeated suggestions. Do not overwrite saved task versions.

The learning rewrite records `task_kind` and a `learning_takeaway` for shared editorial content. Twelve changed completion meanings receive new draft outcome keys, with `replaces_draft_outcome` retaining provenance. Never treat those old/new keys as interchangeable completion, nor assign existing users a repeated lesson after a related outcome is already understood. Check semantic overlap and relevant explicit knowledge during integration. No user table, inference profile or new reward mechanism is needed for the editorial change.

The current new-need runtime also has a 20-minute cap, broad medication-word preflight and blanket spending/helper wording restrictions. Some good candidates exceed 20 minutes, require an explicitly available helper, or discuss researching paid care. Those conflicts need deliberate implementation and tests. This package does not change those protections or claim live compatibility. All user storage remains in the existing architecture; this shared pool adds no user database.

## Next category packages

The broader candidate categories remain Home & repairs, Practical help & connections, and Going out & travel. Before writing each pool, choose checkboxes that distinguish practical solutions, then research and craft at least thirty meaningful options. Do not reuse the sick-day labels across every category or make thirty rewordings of a few ideas. Sick-day preparation is the first completed draft package, not evidence that all categories are ready.

Edit `pool.json`, then run `node personalization/content-candidates/sick-care-v0/render-review.mjs` from the repository root to refresh the reading view and structural check. Editorial judgments and future real-model tests are separate from that check.
