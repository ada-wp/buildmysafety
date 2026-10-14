# Sick-day selection rehearsal

October 13, 2026. Three fictional situations reviewed against the 30-task learning draft. **This is a candidate-content rehearsal, not a live app test or AI output.** No user accounts, API calls or deployment were involved.

Pool: `sick-care-learning-draft-2026-10-13`. SHA-256: `4486a6b7bad9f8b9b5ea197f7040c65c365b8416a51ddfe25223b5811a0863a8`.

## What ran

The script assesses all thirty candidates using manually authored test annotations drawn from their fit notes, then applies current need, default priority, concern coverage, duplicate exclusions and the existing resource allowance. These annotations are not an automatic interpretation of onboarding or free text and are not a new production recommendation engine. Ties use task ID for repeatability, not a proven quality ranking.

The extra facts in these fictional cases are known for testing. The app does not currently collect every fact as a structured field. Do not add all of them to onboarding: use relevant existing answers, a concise conditional task, or one consequential clarification. A submitted free-text request takes the separate one-task AI route, which was not exercised here.

## Results

| Situation | First batch | Next batch, if she asks for more |
| --- | --- | --- |
| No care route, limited budget, no nearby help | SC01 | SC21 |
| Food and care handled; pet care is the missing piece | SC26 | No further fit with the same context |
| Discover help first, without arranging anything | SC21 | SC20 |

All three first batches contain one task. This is not a target: the pet case has only one eligible starting task, while the other cases are limited by one resource task per batch. There is no filler and no requirement to make 40% of each batch learning.

### No care route, limited budget, no nearby help

A fictional US user selects care and practical help. She has no workable first-care route and wants to discover local support outside her social circle. Insurance, employment benefits, food affordability and specific errands are unknown.

**Checkboxes:** Knowing where to get care, and what it costs; Help with errands and things at home.

**Why this selection:** Start with an actual route to care. Keep the insured/other-route wording conditional. Local 211 discovery fits next, but would be a second resource task in this batch.

**Find a care option you can actually start with · 20 min**

You don't need a regular doctor to explore your options. Start with one route that fits your coverage and budget.

1. With insurance, look for virtual care in your plan or benefits portal. Without a suitable benefit, try HRSA's health-center finder.
2. Ask one service: 'Can a new patient in my state have a virtual first visit, and what would it cost?'
3. Check how to request that first visit. Keep the entry page and the answer; if you contacted the service, wait for its reply.

**Done when:** One first-visit route has confirmed new-patient access and cost information. An unanswered inquiry is still pending.

Resources: HHS_FIND, HRSA. Exact current pool copy; no AI rewrite.

**Important exclusions:**

- SC06, Learn what a care estimate leaves out: No stated need for care_estimate; a checkbox alone does not establish it. Prerequisite selfPayVisit=true is not confirmed.
- SC11, Find food help without a delivery budget: Does not match a selected current concern. No stated need for food_assistance; a checkbox alone does not establish it. Prerequisite foodAffordabilityGap=true is not confirmed.
- SC18, Find help for an errand you can't postpone: No stated need for specific_errand; a checkbox alone does not establish it. Prerequisite identifiedNonmedicalErrand=true is not confirmed.
- SC19, Make a check-in something you both want: Does not match a selected current concern. No stated need for wanted_check_in; a checkbox alone does not establish it. Prerequisite trustedWillingContact=true is not confirmed.
- SC25, Discover practical help hidden in your work benefits: No stated need for care_benefits; a checkbox alone does not establish it. Prerequisite benefitAccess=true is not confirmed.

**What needs attention:** The care and local-support tasks both need resources, so the first batch contains one. Limited budget must not silently become uninsured, food insecurity or a permanent ban on researching paid services.

### Food and care handled; pet care is the missing piece

A fictional US cat owner has workable care and grocery routes. She wants to understand pet-care services, is open to researching future paid care, and has not chosen a carer. There is no planned extended absence or urgent event.

**Checkboxes:** Food and essentials without going out; Knowing where to get care, and what it costs; My pet being cared for.

**Why this selection:** Offer pet-service discovery, with Rover and the conditional cat-specific Meowtel example. Do not repeat care or groceries, assume a selected sitter, or suggest extended-absence foster care.

**Discover the pet-care options you could use · 10 min**

Pet care isn't only boarding. Learn which services let your pet stay home and what you would check before choosing a sitter.

1. Explore Rover's pet-sitting and dog-walking options. If you have a cat, also explore Meowtel's in-home cat-care services.
2. Compare drop-in visits, overnight care in your home, and boarding where offered. Check species, area coverage and how much time each service includes.
3. Choose a service type worth researching further. Check how introductions, fees and cancellations work before any future booking; no contact or payment needed today.

**Done when:** You understand the relevant care options and which service type you would explore next.

Resources: ROVER_SERVICES, MEOWTEL_SERVICES. Exact current pool copy; no AI rewrite.

**Important exclusions:**

- SC01, Find a care option you can actually start with: The synthetic user explicitly says this outcome is already handled. No stated need for first_care_route; a checkbox alone does not establish it.
- SC10, See whether groceries can reach your actual door: The synthetic user explicitly says this outcome is already handled. No stated need for grocery_delivery; a checkbox alone does not establish it.
- SC25, Discover practical help hidden in your work benefits: No stated need for care_benefits; a checkbox alone does not establish it. Prerequisite benefitAccess=true is not confirmed.
- SC27, Try the pet-care handoff together: No stated need for pet_carer_introduction; a checkbox alone does not establish it. Prerequisite chosenCarer=true is not confirmed.
- SC28, Ask your vet what a pet carer would need: No stated need for vet_permission; a checkbox alone does not establish it. Prerequisite chosenCarer=true is not confirmed.
- SC29, Explore temporary pet care when paid sitting won't stretch: No stated need for extended_pet_care; a checkbox alone does not establish it. Prerequisite extendedAbsence=true is not confirmed. Prerequisite affordablePetCareGap=true is not confirmed.

**What needs attention:** After service discovery, the pool lacks a strong standalone bridge to choosing one suitable sitter candidate. SC27 needs an actual candidate, not merely a completed learning task. Do not offer a handoff or vet permissions prematurely.

### Discover help first, without arranging anything

A fictional US user wants to learn where local support exists, how household help differs from personal care, and what laundry services involve. She is open to researching future paid options but wants no contact, booking or trial now.

**Checkboxes:** Help with errands and things at home.

**Why this selection:** Start with local resource discovery. Service-type knowledge and laundry terms are useful alternatives for later batches, not instructions to arrange help now.

**Discover local help beyond people you already know · 10 min**

You don't need a local network to start learning what support exists. In the US, 211 is one place to explore community resources.

1. Open your local 211 website and see which support areas it covers, such as food access or transportation.
2. Choose one area relevant to you and read a listing's service description, eligibility and contact route where available.
3. Find how to reach 211 if searching is confusing. It offers information and referrals; a listing does not guarantee assistance.

**Done when:** You know a local starting point and how to investigate one relevant type of support.

Resources: LOCAL_211. Exact current pool copy; no AI rewrite.

**Important exclusions:**

- SC13, Make your resting spot work for you: No stated need for resting_space; a checkbox alone does not establish it. She currently wants learning, not arranging or physical preparation.
- SC18, Find help for an errand you can't postpone: No stated need for specific_errand; a checkbox alone does not establish it. Prerequisite identifiedNonmedicalErrand=true is not confirmed. She currently wants learning, not arranging or physical preparation.
- SC19, Make a check-in something you both want: Does not match a selected current concern. No stated need for wanted_check_in; a checkbox alone does not establish it. Prerequisite trustedWillingContact=true is not confirmed. She currently wants learning, not arranging or physical preparation.
- SC25, Discover practical help hidden in your work benefits: No stated need for care_benefits; a checkbox alone does not establish it. Prerequisite benefitAccess=true is not confirmed.

**What needs attention:** All three fitting learning tasks use a resource. The existing limit yields one per batch; do not strip the useful source, add a trivial chore, or enforce the 40% pool ratio on this person.

## What this changes about the next build

1. Keep the current checkbox → suggestions → inspect → add flow. Do not make every checkbox imply an unconfirmed deficiency. A broad selection may need a conditional starting task or one optional clarification; the strict rehearsal returns no result without a stated need.
2. Preserve one resource task per batch and up to two resources within it. More ideas can return the next distinct fit. Do not remove valuable links, add filler, or use provider names to evade the allowance.
3. Improve the pet-care bridge before release: learning what services exist is useful, but does not choose a carer. Craft a genuinely useful candidate-selection step or revise the intended transition; no change to the pool was made in this rehearsal.
4. Implement the approved priority and eligibility rules deliberately. The current runtime ranks soft tag signals and uses a lexical tie-break; its batch coverage pass can also take precedence. It does not yet enforce this draft's textual prerequisites or priority bands.
5. Map the five current concerns without conflating wanted check-ins with paid/community household help. Retain saved task versions and do not translate completion of a learning outcome into a practical arrangement.
6. After content corrections, run the same cases against the actual matcher, then test the signed-in preview flow. The existing AI route needs a separate real-generation test using the category prompt and allowed resources.

## Executed checks

- PASS — All 30 candidates assessed in each case; at most 3 distinct outcomes and one resource task.
- PASS — Care gap leads; limited budget alone does not create insurance, food or benefits facts.
- PASS — Handled care and food stay excluded; one fitting pet task is not padded to three.
- PASS — Learning preference can produce a 100% learning batch; pool ratio is not a per-batch quota.
- PASS — More ideas uses remaining fits without repeating earlier shown outcomes.
- PASS — Completing pet learning does not establish a selected carer or unlock a handoff.
- PASS — An explicit paid-services exclusion removes pet-marketplace research.
- PASS — Exact current interest can promote an Extra ease task ahead of a higher default band.
- PASS — Check-in choice does not infer a willing contact or route to household services.
- PASS — Unknown benefit access differs from a confirmed route; named service still consumes allowance.
- PASS — Time limits filter tasks rather than fabricating shorter instructions.
- PASS — Unsupported geography and urgent mode do not reuse this US preventive rehearsal.
- PASS — A broad checkbox without a known gap is insufficient for these strict fit annotations.
- PASS — Rehearsal preserves source input and user-case fixtures.

14 checks passed. These establish behavior of this small rehearsal only, not recommendation usefulness, production readiness or the app's account/data controls.

Rerun: `node personalization/content-candidates/sick-care-v0/selection-rehearsal.mjs` from the repository root. [Machine-readable inputs, assessments and snapshots](selection-results.json). [Source ledger](../../../research/sick-care-pool-sources.md).
