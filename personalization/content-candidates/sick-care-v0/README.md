# Sick days & care — first category package

October 12, 2026. **Thirty complete authored task candidates, proposed checkboxes and selection guidance for founder review.** Sources were researched; tasks are not professionally approved, published in the app or tested as new API outputs. Start with this category, then repeat the approach for the other categories. The existing app flow stays intact.

- [Read the 30 tasks](REVIEW.md) — readable view generated from the pool.
- [Pool data](pool.json) — canonical editable task content and plain-language fit conditions.
- [Research and source limitations](../../../research/sick-care-pool-sources.md).
- [Category-specific AI prompt](../../../docs/prompts/sick-care-category-v0.md).

## The concern screen

**October 13 research proposal, awaiting Ada's review:** keep six choices but merge home-rest logistics with practical household/errand help, and give optional check-ins their own choice. Proposed wording: “Food and essentials without going out”; “Knowing where to get care, and what it costs”; “Help with errands and things at home”; “Someone to check in with”; “My pet being cared for”; “Taking time off work or study.” Proposed question: “What would help you feel more prepared for a sick day?” Keep multi-select and optional typing. Work/study has weaker direct demand evidence in the reviewed sources; placing it last is a proposed default, not a market ranking. Food access, physical help and contact needs should not be treated as interchangeable. See the [research refresh](../../../research/sick-care-pool-sources.md#october-13-checkbox-review--research-interpretation). The original draft below, pool IDs and live choices have not been changed or approved. Any later change must preserve older answers and give affected tasks deliberate new mappings.

**What would you like to have figured out before a sick day?**

Choose what matters to you. We'll start with a few useful options.

| Checkbox | What it helps us choose | What it does not tell us |
| --- | --- | --- |
| Where to get care, and what it might cost | Initial care routes, access barriers and practical appointment preparation. | Whether she has insurance, a doctor, a diagnosis or an appointment. |
| Getting food, prescriptions and everyday essentials | Acquisition routes, usable meals and concrete supply gaps. | That she takes medicine, needs food assistance or lacks delivery. |
| Making things easier at home while I rest | A usable resting setup and specific household help. | That she wants to buy supplies or hire someone. |
| Having my pet cared for if I can't do the usual routine | Pet-care options and missing parts of a real care arrangement. | The species, routine, medical needs or whether a sitter already exists. |
| Keeping work or study manageable if I need time off | Absence processes, feasible cover or a solo-business pause plan. | Her employment type, benefits or entitlement to leave. |
| Finding practical help or someone to check in with | Suitable services or mutually agreed personal support. | That she has no friends, is lonely or wants monitoring. |

**Why six rather than the previous five:** pet care and work/study need different prerequisites. Separating them makes a selection informative and avoids an additional question merely to find out which she meant. This is proposed screen copy, not a deployed menu change.

Keep multiple selection, optional manual input and the same Continue route. Manual label: **Anything specific you'd like help with?** Example placeholder: “I have a cat, no nearby help, and want to prepare without booking anything yet.” Do not require personal disclosure or replay onboarding.

No selections: offer help choosing a starting area or allow a specific typed need. Do not pretend to personalize a random batch. Checking every box does not show thirty tasks or make her complete a program.

## Selecting a useful first batch

Use a few understandable rules, not a safety score:

1. **Start with her current selections and words.** Today's request overrides earlier interests. Use relevant explicit onboarding constraints only as defaults.
2. **Remove tasks that don't fit.** Match country, current gap, prerequisites, time and spending preferences. A pet, employer benefit, willing helper or planned procedure must not be invented. Unknown stays unknown.
3. **Remove repeated outcomes.** Exclude already shown/saved/completed ordinary suggestions and preparations she says are already handled. Only revisit an outcome at her explicit request. A different provider or title is not automatically a new outcome.
4. **Prefer a real missing capability.** A useful source of care, an accessible service, a tested process or an agreed arrangement beats an unrelated tiny chore. Basic supplies still belong when she describes that need.
5. **Offer up to three distinct fits.** When several concerns are selected, spread the first options across them where suitable. Do not force variety against a precise typed request. If only one strong fit exists, offer one rather than filler. The existing one-gentle-step preference still applies.

Use a ready pool task or authored variant first. Automatically adapt at most one of the three only when her circumstances materially change the task. A specific new supported need can generate one new action even when unused pool items remain. No AI call just to rank checkboxes, change a greeting or repeat research already in the library.

Some critical facts genuinely matter. If absent, use a concise conditional route or ask one relevant question only when it would change the next suggestion. For work, for example: “Is this for a job, your own business, or study?” Do not collect a new permanent biography or medical profile. A pet-care interest can justify showing a pet-care option, but it cannot justify inventing a cat or a paid-care budget.

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
| All concerns selected; pets and work circumstances unknown | Use a fitting current request/conditional route; ask one consequential question if needed. | Automatically prescribe six arrangements or infer a job, insurance and a pet species. |
| Outside the US | Use self-contained preparation that fits; require reviewed local routes for provider discovery. | Present HRSA, US 211 or Medicaid as local options. |
| Planned procedure, no escort | SC05; team decides acceptable arrangements. | Claim a rideshare solves the requirement. |
| Immediate symptoms, emergency or medication question | Separate appropriate safety/professional-help response. | Give a preventive roadmap or infer treatment. |

## Integration notes — later, after content review

This folder is intentionally outside the runtime catalog. `use_when`, `skip_when` and `variants` are editorial conditions, not executable matching code. Don't import the JSON and claim those rules are enforced.

The existing `food`, `check_in`, `getting_care`, `pets`, `daily_tasks` IDs are still in use. The proposed concern IDs need an explicit mapping and versioned release. In particular, an old `daily_tasks` answer does not prove work obligations; the added work/study checkbox needs a fresh choice. Preserve older answers rather than silently reinterpreting them.

`legacy_overlap` flags old outcomes for semantic review; it is not a blanket alias. Completing the old care-contact note does not prove access to a new provider. Honor explicit new gaps while avoiding ordinary repeated suggestions. Do not overwrite saved task versions.

The current new-need runtime also has a 20-minute cap, broad medication-word preflight and blanket spending/helper wording restrictions. Some good candidates exceed 20 minutes, require an explicitly available helper, or discuss researching paid care. Those conflicts need deliberate implementation and tests. This package does not change those protections or claim live compatibility. All user storage remains in the existing architecture; this shared pool adds no user database.

## Next category packages

The broader candidate categories remain Home & repairs, Practical help & connections, and Going out & travel. Before writing each pool, choose checkboxes that distinguish practical solutions, then research and craft at least thirty meaningful options. Do not reuse the six sick-day labels across every category or make thirty rewordings of a few ideas. Sick-day preparation is the first completed draft package, not evidence that all categories are ready.

Edit `pool.json`, then run `node personalization/content-candidates/sick-care-v0/render-review.mjs` from the repository root to refresh the reading view and structural check. Editorial judgments and future real-model tests are separate from that check.
