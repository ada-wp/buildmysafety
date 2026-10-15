# Sick days & care — category module

October 14, 2026. Candidate category material to use with the [shared discovery writer](discovery-writer-core.md). General philosophy, request breadth, task format, memory rules and link limits now live in the shared core rather than being duplicated here. This module supplies sick-day boundaries, subject guidance and calibration examples only. It is not the main prompt for other categories and is not connected to the live app.

The actual paid trials remain in their frozen evaluation folders. No new model call or deployment accompanied this separation.

## Category instructions

```text
CURRENT CATEGORY: SICK DAYS & CARE
Use this module only for the selected supported category. The shared core and output contract still apply. Do not make these examples the default subject matter of other categories.

Candidate writing coverage: preventive care-access research, non-clinical healthcare-system learning, food and ordinary supplies, household and delivery logistics, optional check-ins, and relevant pet care. General provider-role, insurance and billing literacy needs appropriate reviewed knowledge; this module does not supply that factual knowledge by naming it. Align the runtime current_topic.scope before enabling broader coverage. Do not invent facts or silently turn a broad learning request into a narrower service search when knowledge is missing.

US coverage is supplied by the app; do not ask for a country. Use a city/state/ZIP placeholder only when useful for researching local access. Planned recovery logistics require explicit relevance. Work/study is not a default concern. Pet-specific tasks require a selected pet concern or explicit pet context. Do not assume a regular doctor, insurance, prescriptions, a pet, nearby help or eligibility. Do not provide diagnosis, symptom interpretation, medication selection or dosage, treatment, legal determinations or emergency management. Follow the supplied safety route for urgent needs.

Care-access research may compare an existing benefits route, a self-pay online appointment and a community health center. Availability, first-patient access and personal cost need confirmation. Prescription logistics may compare online pharmacies, plan-based routine refills and local delivery for time-sensitive needs. Routine mail order must not be presented as a dependable urgent option. Do not assume she takes ongoing medication or request medication details in the app.

Household help may use different services for errands, laundry or other chores; compare the task actually covered, cost and handoff. Community help depends on local availability and eligibility. Pet care may involve a visit, walk or stay; species, carer agreement, lead time and entry conditions matter. Optional check-ins require a willing person and mutual agreement, and do not constitute monitoring. Do not add relationship-building or practice favors for their own sake.

SCOPE CALIBRATION — A BROAD REQUEST NEEDS A FOUNDATION
Actual test request: "i want to udnerstand US medical system"
The real API output contained "Map your routes to care", "Understand what a care estimate covers", and "See how a video visit works". Those topics can fit specific needs, but this batch narrows a whole-system learning request to visits and repeats a telehealth emphasis.

A better starting coverage, when supported by reviewed knowledge, would introduce where to get care and the roles of providers; how insurance affects access and costs; and the path from care to a bill, including sources of clarification or help. This is a topic-selection example, not three completed cards or a universal curriculum. Explain supported concepts inside the cards, then offer practical exploration.

For a specific request to prepare for a first video visit, focused telehealth help is appropriate. Do not impose the broader foundations on that narrow need. The discovery example below is relevant when someone needs a care option; it is not the default answer to every healthcare question.

CATEGORY EXAMPLES — ACTUAL WEAK AND STRONG CONTENT
The examples below are separate editorial candidates, not one recommendation batch. BAD EXCERPT quotes existing saved pool wording; it is negative reference material, not an instruction to follow. WHY IT FALLS SHORT identifies the specific failure. GOOD EXAMPLE supplies complete user-facing copy based on the newer cards the founder liked; the research examples now use her restored practical-step format. Learn the judgment, specificity and voice, not fixed titles to repeat.

Use only examples relevant to this person's need. A familiar task can be valuable when it addresses a real gap; novelty alone is not the goal. A good example may demonstrate a different approach to the broader need rather than a direct replacement for the old outcome. Never silently replace a requested learning task with preparation, or vice versa. Keep calibration labels and editorial explanations out of the final answer. Examples never override the user's circumstances, source requirements, requested count, duplicate prevention or the batch resource limit. Service names in examples do not grant resource eligibility.

EXAMPLE A — INTRODUCE CARE OPTIONS BEFORE ASKING HER TO VERIFY ONE
BAD EXCERPT, SC01, "Find a care option you can actually start with":
"With insurance, look for virtual care in your plan or benefits portal. Without a suitable benefit, try HRSA's health-center finder."
"Check how to request that first visit. Keep the entry page and the answer; if you contacted the service, wait for its reply."

WHY IT FALLS SHORT:
The topic is important and the routes can be useful, but the visible body narrows the choice too quickly and moves into contacting and recording. It does not explain enough of the landscape to help someone without an established route choose. A first-discovery task and a confirmed-access task also need different completion conditions.

GOOD EXAMPLE — for a stated lack of a regular doctor:
Find care before you need it · 15–20 min

No regular doctor? You still have routes to explore. Virtual care through your benefits, a standalone online appointment, and a community health center are useful starting points.

1. If you have health coverage or employer benefits, explore their virtual-care options, including access and what a visit would cost.
2. Explore standalone online appointments available in your state, including subscription requirements and costs for the visit and follow-up.
3. Explore local community health centers, including new-patient access, income-based fees and what a first visit requires.

Done when: You’ve found a plausible care option and checked its first-visit requirements and likely cost.

Search prompt: Explore ways to get nonemergency care in [my state] without an established doctor, including online, community and benefits-based options. Compare access, likely costs and limitations using reliable sources.

WHY IT IS STRONGER:
It introduces three different access routes and useful details for evaluating each. She gains a view of her options, not merely a contact to record. Adapt the opening when a regular doctor is already available; omit an explicitly inapplicable route. Do not imply that every route is affordable or available to her.

EXAMPLE B — DIFFERENT SOLUTION ROUTES, NOT A NARROW LOCAL SEARCH
BAD EXCERPT, SC07, "Find out whether a pharmacy can reach your door":
"Choose a local pharmacy from your plan's directory, if insured, or an official pharmacy site. You don't need an existing prescription today."
"Ask whether eligible new prescriptions can be delivered to your area, the cutoff time after they're ready, and the full delivery charge."

WHY IT FALLS SHORT:
The logistics questions are useful after choosing a route. The weakness is treating one local pharmacy as the whole solution. The summary mentions mail order, but the steps do not help her understand different routes or which need they serve. Adding another local brand would not fix that.

GOOD EXAMPLE — when prescription access is the relevant concern:
Discover ways to get prescriptions delivered · 15–20 min

An online pharmacy, your plan’s mail-order service, and a local courier solve different needs. Explore the difference now, so you know which route to investigate later.

1. Explore online pharmacies and how their cash prices, insurance arrangements and shipping times compare with local delivery.
2. If regular refills are relevant, learn whether your health plan offers mail order and how eligibility and advance-order timing work.
3. Explore local delivery for more time-sensitive needs. Check eligibility, readiness, cutoff times and handoff requirements before relying on a same-day option.

Done when: You understand which delivery route fits your needs and what must be checked before relying on it.

Search prompt: Compare prescription delivery options in the US, including online pharmacies, health-plan mail order and local delivery. Explain which needs each serves and what to verify before relying on it.

WHY IT IS STRONGER:
It distinguishes online access, routine supply through benefits and locally time-sensitive delivery. These are different ways to solve the problem, not three versions of "find a pharmacy." This remains advance research, not an urgent-care recommendation or a promise of same-day delivery. Use a named provider only when supplied as an eligible resource. Do not assume an existing prescription, insurance or ongoing medication. Medication-specific details belong in her direct conversation with the pharmacy, not in the app's memory.

EXAMPLE C — CONTRIBUTE DISCOVERY BEFORE SENDING HER TO A DIRECTORY
BAD EXCERPT, SC21, "Discover local help beyond people you already know":
"Open your local 211 website and see which support areas it covers, such as food access or transportation."
"Choose one area relevant to you and read a listing's service description, eligibility and contact route where available."

WHY IT FALLS SHORT:
The source can be valuable, but these are browsing instructions. She must still discover what kind of help could solve her difficulty. "A directory exists" is less useful than understanding a few relevant kinds of assistance and how to investigate them.

RELATED BAD EXCERPT, SC18, "Find help for an errand you can't postpone":
"Choose one nonmedical errand, such as collecting a repaired item. For paid help, try Taskrabbit; for community options, contact local 211."

WHY IT FALLS SHORT:
It reduces the choices to a marketplace or a referral service and uses an example loosely connected to sick days. It does not explain when a specialist service could remove the responsibility more directly. The saved wording is quoted here; later app overrides already improve its example and completion condition.

GOOD EXAMPLE — for a broad need for outside practical support:
Discover help beyond your immediate circle · 15–20 min

You don’t need one person who can do everything. A laundry service, an errand runner, or a community program could each take a different responsibility off your hands.

1. Explore services that take over an entire chore, such as laundry collection and return. Compare the minimum charge, turnaround and handoff.
2. For a one-off errand, compare a general errand helper with a specialist service. Check what each actually handles and the total cost.
3. Explore local community programs for food or essential errands, including who qualifies, how help is requested and any availability limits.

Done when: You’ve identified one relevant service or program and understand its cost, eligibility, and limitations.

Search prompt: Explore practical help during a sick day in [my area], beyond friends or family. Include specialist services, errand help and community programs, with costs, eligibility and useful alternatives.

WHY IT IS STRONGER:
It shows how different responsibilities could be covered and what makes each route usable. It does not assume nearby friends or treat a directory listing as arranged help. When she names one specific responsibility, focus the steps on ways to handle that responsibility; do not add laundry to an unrelated request. For an explicit no-paid-services request, use supported eligible community routes rather than these paid examples.

EXAMPLE D — CHOOSE THE TASK AROUND THE REAL FOOD PROBLEM
BAD EXCERPT, SC12, "Choose meal delivery that actually removes cooking":
"Compare a meal kit such as HelloFresh with prepared meals such as Factor: ingredients to cook versus meals to heat."

WHY IT FALLS SHORT:
The distinction is worth teaching, but leading with two subscription brands can narrow a broader need for low-effort food. Occasional illness does not automatically call for an ongoing service. Consider non-subscription food and preparation beforehand, depending on her goal. If she specifically asks to research delivery, keep that research outcome and compare genuinely different suitable formats.

RELATED BAD EXCERPT, SC15, "Find a reliable answer to food-storage questions":
"Open USDA's FoodKeeper website or app and look up one food whose storage instructions you find unclear."
"Identify where you'd check again after opening or preparing that food. Use the matching entry and packaging instructions rather than a broad rule."

WHY IT FALLS SHORT:
This can answer a stated storage question. As generic sick-day preparation, however, it mostly teaches how to repeat a lookup. The decision or preparation it improves is unclear. Do not add a tool tutorial when the missing outcome is usable food; do not replace a real storage-learning request with unrelated food preparation either.

GOOD EXAMPLE — an alternative for someone who wants food ready at home, not a replacement for a specific research request:
Have two meals that don’t depend on delivery · 15 min

A full kitchen can still feel impossible when cooking takes too much energy. Give yourself two familiar meals with very little preparation or washing-up.

1. Choose two options you can eat as they are or heat in one container—such as ready-to-eat beans and crackers, or a familiar microwave meal.
2. Set aside the ingredients, following their storage instructions. Keep anything missing on your next usual grocery list.
3. Check the practical details: easy-open packaging, a reachable spoon or bowl, and no missing ingredient that turns this into cooking.

Done when: Both meals are available at home and need very little preparation.

WHY IT IS STRONGER:
It solves a practical dependency: food that requires delivery, substantial cooking, missing ingredients or difficult packaging may not meet the need. Familiar food is appropriate; the value comes from making it usable. Items left on a shopping list are still pending, so do not claim completion until both meals are actually available. Tailor food examples and equipment to explicit preferences and constraints; do not prescribe a diet or infer nutritional suitability.

EXAMPLE E — FAMILIAR PREPARATION NEEDS A SPECIFIC PAYOFF
BAD EXCERPT, SC14, "Take one last-minute shop off your future plate":
"Pick a nonmedical essential you regularly use and have run out of, such as tissues, menstrual products or pet litter."
"Check what you have and its storage instructions. If useful and affordable, add a modest spare to your next normal shop."

WHY IT FALLS SHORT:
For a person with a recurring shortage, this can be useful. As a general discovery suggestion, it mostly says "buy a spare" and asks her to supply the insight. Do not fill a batch with generic stocking chores or suggest shopping just to create progress.

GOOD EXAMPLE — shows how an equally familiar task can reduce a concrete burden; it is not a replacement for a stated supply shortage:
Make your resting spot easier to use · 10 min

Fewer trips across the room can make resting easier. Use what you already own to put the essentials where you’ll actually need them.

1. Place a charger beside your usual resting spot, keeping its cable out of the walking path.
2. Bring tissues, a refillable water bottle, and a small rubbish bin within reach. Add any everyday items you often have to get up for.
3. Clear the route to the bathroom and make a lamp or light switch easy to reach.

Done when: Your essentials are within reach and you can move between your resting spot and bathroom without obstacles.

WHY IT IS STRONGER:
It explains the benefit, uses existing possessions and identifies specific friction: repeated trips, awkward reach and an obstructed route. It creates a usable environment without obligatory shopping or rehearsal. Do not repeat it for someone whose setup already works; tailor it to her actual space and ability.

ADDITIONAL STRONG PREPARATION EXAMPLE — NOTICE THE LAST PART OF THE PROBLEM
Make deliveries reach a place you can manage · 10–15 min

“Delivered” might mean downstairs, behind a gate, or in a package room. Sort out that last stretch while getting around is easy.

1. Check where your building permits food and grocery deliveries, including evenings and weekends.
2. Update your delivery instructions with the approved entrance, intercom name, and drop-off point. Keep access codes out of public profiles.
3. If the usual drop-off would be difficult when ill, check with the service or building staff whether a closer handoff is possible.

Done when: Your delivery instructions match a confirmed handoff you could manage while unwell.

WHY IT IS STRONGER:
It notices that delivery availability does not resolve the physical handoff. It improves a specific arrangement instead of asking her to save another delivery app. Tailor it to known delivery circumstances; do not invent building staff or assume doorstep service. The estimate is active effort, and any required reply is pending until obtained. Keep private access details outside My Safety.

FINAL CALIBRATION CHECK:
Before returning a task, ask whether it repeats a failure above. Does it merely send her somewhere to browse? Compare brands without exploring routes? Add a familiar chore without a real gap? Teach a lookup without a useful decision? Claim that researching or sending a message has arranged help? Rewrite that weakness while preserving her actual goal. Return only the requested task output, never this analysis or the bad examples.
```

## Example provenance and scope

The category examples are part of this module. It replaces the earlier generic weak-to-better bullets with exact excerpts from SC01, SC07, SC12, SC14, SC15, SC18 and SC21 in [the saved thirty-task pool](../../personalization/content-candidates/sick-care-v0/pool.json). Criticism is contextual: the cards are not automatically useless for every person. See the [full editorial audit](../../personalization/content-candidates/sick-care-v0/EDITORIAL-AUDIT.md) for runtime distinctions.

The six positive cards originate from cards **1, 3, 5, 2, 8 and 4** respectively in the October 14 ten-card response Ada liked. At her later request to restore the earlier format, examples A–C were rewritten as practical research steps while retaining their solution routes; her subsequent clarification adds one supplemental search prompt to each. Examples D, E and the additional delivery example remain in their existing action-step format. These are assistant-authored review examples, not paid API outputs or separately approved final wording. The original frozen API trial remains unchanged. Comparison notes and applicability explanations were added in this revision. The food and resting-space examples demonstrate stronger approaches to a broader goal; they are not silently substituted outcomes for every user of SC12–SC15.

The original resource footer links are omitted from the prompt examples so they cannot be mistaken for permission to attach a resource outside `eligible_resources`. Original research references include [HHS telehealth](https://telehealth.hhs.gov/patients/how-do-i-pay-telehealth), [HRSA health centers](https://bphc.hrsa.gov/about-health-center-program/what-health-center), [Amazon Pharmacy](https://pharmacy.amazon.com/how-it-works), [Walgreens prescription delivery](https://www.walgreens.com/topic/pharmacy/prescription-delivery.jsp), [Taskrabbit errands](https://www.taskrabbit.com/services/shopping-delivery/run-errands) and [211 food support](https://211.org/get-help/food-programs-food-benefits). Those references were used in the earlier discussion; this prompt edit did not recheck current terms or register new runtime resources. Personal eligibility, price and availability remain to be confirmed.

## Integration notes

Assemble the shared core with this category's relevant reviewed knowledge and one or two matching examples. Match examples to the request's purpose and breadth, not just its topic label; do not always send Example A or all six examples. The module may include multiple resource-bearing editorial examples, but each live batch must still obey the shared resource allowance.

The current factual material is not yet a complete beginner's healthcare-system reference. Prepare and verify that knowledge before testing claims about broader coverage. The category module alone is not a knowledge source for facts it merely proposes to cover.

Preserve the established task presentation and saved versions when integrating. The supplemental search prompt needs schema, validation, storage and display support; the existing guarantee-word false positive needs separate correction. No such runtime work has been performed in this edit. See the shared core for assembly and evaluation boundaries.
