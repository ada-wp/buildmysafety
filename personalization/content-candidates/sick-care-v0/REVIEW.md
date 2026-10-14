# Sick days & care — 30 tasks to review

Authored content candidates, October 12, 2026; proposed priority mapping and twelve-task learning rewrite added October 13. Research-informed; awaiting founder review. Not published in the app or generated in a recorded API test. The pool offers different options for different lives, not thirty things one person must complete.

Generated reading view of [pool.json](pool.json). Edit the JSON and rerun `render-review.mjs`; do not maintain a second copy here. [Selection and checkbox proposal](README.md) · [Source record](../../../research/sick-care-pool-sources.md).

## Current concern screen

Use the [five current concern choices and optional AI input](README.md#the-concern-screen). Work/study was removed from the menu. The six older concern tags in pool.json remain editorial metadata awaiting deliberate remapping; they are not the current screen or executable filters.

## Practical learning — proposed rewrite

12 of 30 tasks (40%) are dedicated learning tasks; 44% of the 27 non-parked candidates. 10 learning tasks are in tiers 2 and 3. Priority counts remain unchanged.

Learning ends with useful understanding, awareness of a resource or a better-informed choice. Reading time alone is not the outcome. No forced quiz, note, trial, purchase, account signup or conversation. The remaining preparation tasks can also include research. This pool mix never overrides an individual need or imposes a quota on each batch.

| Task | Tier | What she learns |
| --- | --- | --- |
| [SC03 — Know how your first video visit will work](#sc03) | Make it reliable | Joining requirements, accessibility support and fallback options are provider-specific; know where to find them before relying on video. |
| [SC06 — Learn what a care estimate leaves out](#sc06) | Make it reliable | An estimate is not necessarily the whole bill: separate providers and services can require separate estimates. |
| [SC08 — Understand why a refill might need another step](#sc08) | Make it reliable | A refill uses an existing prescription's remaining authorization; a renewal can need the prescriber. The actual pharmacy explains individual requirements. |
| [SC09 — Learn how prescription collection by someone else works](#sc09) | Make it reliable | Permitted collection is not guaranteed collection; the pharmacy's requirements and a suitable person's agreement matter separately. |
| [SC12 — Choose meal delivery that actually removes cooking](#sc12) | Make it reliable | Meal kits and prepared meals remove different work. Look past promotions to preparation effort and recurring commitments. |
| [SC15 — Find a reliable answer to food-storage questions](#sc15) | Make it reliable | Storage guidance depends on the food and its condition; a trusted lookup tool is more useful than a universal rule. |
| [SC16 — Decode a laundry pickup service's real cost](#sc16) | Extra ease | Minimums and additional charges can matter more than a low unit price, especially for a small load. |
| [SC17 — Understand what a cleaning booking actually includes](#sc17) | Extra ease | Service scope, charging method and supplied equipment affect whether a cleaning booking solves the actual need. |
| [SC20 — Learn which kind of home help fits](#sc20) | Make it reliable | Different support needs call for different services; the name of the task helps find suitable help and avoid relying on the wrong provider. |
| [SC21 — Discover local help beyond people you already know](#sc21) | Make it reliable | A local information service can help identify options beyond an existing social circle; referrals and available assistance are different things. |
| [SC25 — Discover practical help hidden in your work benefits](#sc25) | Core preparation | Provider marketing is not an employer entitlement; the actual plan's eligible situations and costs determine whether a benefit is useful. |
| [SC26 — Discover the pet-care options you could use](#sc26) | Core preparation | Drop-ins, overnight stays and boarding are different arrangements; choose the format before investigating a particular sitter. |

Drafts whose completion meaning changed have a new outcome key and record the prior key as replaces_draft_outcome. This is provenance, not an equivalence or migration rule. Learning about a route does not prove that help is arranged. Existing live task versions and user completion remain unchanged.

## Proposed priority mapping

All 30 tasks are mapped: 15 Core preparation, 11 Make it reliable, 4 Extra ease. Individual assignments remain proposed for founder review; the shared three-band framework is approved.

Editorial judgments using recurring needs, practical impact and value of preparing ahead. Each task's source_ids support its subject or route, not a validated comparative ranking. Use_when and skip_when still control fit; current needs can override a default band.

These are internal defaults, not user-facing levels, a fixed sequence, equal-size groups or a safety score. Eligibility and current needs come first. A dependency must exist before a follow-up is relevant; finishing earlier task IDs is not required. The older Discover / Make workable / Strengthen tags describe the type of action, not its priority.

**Parked from default suggestions:** SC22, SC23, SC24. The three work/business tasks are retained and classified for completeness, but excluded from default checkbox suggestions after the work/study choice was removed. Consider only for an explicit supported request after content and integration review. SC25 is a conditional source of practical/pet-care help, not a restored work checkbox. No runtime ranking, task approval or deployment is implied.

No within-band order is implied by task IDs. The Why column is editorial reasoning; the evidence links support the underlying need or route, not the tier itself.

### Core preparation

| Task | Why this default | Evidence |
| --- | --- | --- |
| [SC01 — Find a care option you can actually start with](#sc01) | Establishes a missing first route to care, including access and cost, without assuming an existing doctor. | [HHS_FIND](../../../research/sick-care-pool-sources.md#hhs_find), [HRSA](../../../research/sick-care-pool-sources.md#hrsa) |
| [SC02 — Know where an in-person visit could start](#sc02) | Establishes in-person access when that specific route is missing; a map listing alone does not establish access. | [HRSA](../../../research/sick-care-pool-sources.md#hrsa), [HC_NETWORK](../../../research/sick-care-pool-sources.md#hc_network) |
| [SC04 — Find a way to an appointment without driving](#sc04) | Closes a missing transport route that can make otherwise available nonurgent care inaccessible. | [MEDICAID_RIDES](../../../research/sick-care-pool-sources.md#medicaid_rides), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211) |
| [SC05 — Check what 'someone to take you home' really means](#sc05) | Resolves a potentially blocking escort arrangement before an explicitly planned procedure. | [MEDLINE_SURGERY](../../../research/sick-care-pool-sources.md#medline_surgery) |
| [SC07 — Find out whether a pharmacy can reach your door](#sc07) | Establishes a missing way to receive a prescription without going out, including real pharmacy restrictions. | [CVS_DELIVERY](../../../research/sick-care-pool-sources.md#cvs_delivery), [HC_PHARMACY](../../../research/sick-care-pool-sources.md#hc_pharmacy) |
| [SC10 — See whether groceries can reach your actual door](#sc10) | Establishes usable food access by checking actual delivery cost, handoff and substitutions. | [WALMART_DELIVERY](../../../research/sick-care-pool-sources.md#walmart_delivery), [INSTACART_EBT](../../../research/sick-care-pool-sources.md#instacart_ebt), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness) |
| [SC11 — Find food help without a delivery budget](#sc11) | Explores a food-access route when affordability or access makes commercial delivery unsuitable. | [FEEDING_AMERICA](../../../research/sick-care-pool-sources.md#feeding_america) |
| [SC18 — Find help for an errand you can't postpone](#sc18) | Creates a practical outside-help route for an identified errand that cannot reasonably wait. | [TASK_ERRANDS](../../../research/sick-care-pool-sources.md#task_errands), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211) |
| [SC19 — Make a check-in something you both want](#sc19) | Establishes wanted social support through an actual mutual arrangement rather than an assumed available contact. | [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness), [FOUNDER](../../../research/sick-care-pool-sources.md#founder) |
| [SC22 — Find the simplest way to take a sick day](#sc22) **(parked)** | Establishes a missing process for reporting absence when that uncertainty prevents taking needed time away. | [DOL_LEAVE](../../../research/sick-care-pool-sources.md#dol_leave), [FOUNDER](../../../research/sick-care-pool-sources.md#founder) |
| [SC24 — Find the pause button for your own business](#sc24) **(parked)** | Establishes a way to pause incoming business work while identifying commitments that a platform will not pause. | [ETSY_PAUSE](../../../research/sick-care-pool-sources.md#etsy_pause) |
| [SC25 — Discover practical help hidden in your work benefits](#sc25) | Can reveal a previously unknown support option for an essential practical need. | [CARE_BENEFITS](../../../research/sick-care-pool-sources.md#care_benefits) |
| [SC26 — Discover the pet-care options you could use](#sc26) | Builds awareness of possible pet-care routes when the user has not known where to start. | [ROVER_SERVICES](../../../research/sick-care-pool-sources.md#rover_services), [MEOWTEL_SERVICES](../../../research/sick-care-pool-sources.md#meowtel_services) |
| [SC29 — Explore temporary pet care when paid sitting won't stretch](#sc29) | Explores a potentially feasible pet-care route during an expected extended absence when commercial care is unaffordable. | [HUMANE_FOSTER](../../../research/sick-care-pool-sources.md#humane_foster) |
| [SC30 — Help the care team understand your home situation](#sc30) | Establishes needed help at home with the actual care team before a planned stay or procedure assumes an available helper. | [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge) |

### Make it reliable

| Task | Why this default | Evidence |
| --- | --- | --- |
| [SC03 — Know how your first video visit will work](#sc03) | Makes a prospective care route more dependable through understanding its access requirements and support options. | [HHS_PREP](../../../research/sick-care-pool-sources.md#hhs_prep), [HHS_TECH](../../../research/sick-care-pool-sources.md#hhs_tech) |
| [SC06 — Learn what a care estimate leaves out](#sc06) | Improves a care decision by explaining the scope and limits of cost information. | [CMS_ESTIMATE_GUIDE](../../../research/sick-care-pool-sources.md#cms_estimate_guide) |
| [SC08 — Understand why a refill might need another step](#sc08) | Makes an existing medication-access process easier to navigate by explaining a common administrative distinction. | [CVS_REFILL_HELP](../../../research/sick-care-pool-sources.md#cvs_refill_help) |
| [SC09 — Learn how prescription collection by someone else works](#sc09) | Makes a possible collection route understandable before someone relies on it. | [HHS_PICKUP](../../../research/sick-care-pool-sources.md#hhs_pickup) |
| [SC12 — Choose meal delivery that actually removes cooking](#sc12) | Makes a food-access choice more dependable by distinguishing service formats and commitments. | [HELLOFRESH_FORMAT](../../../research/sick-care-pool-sources.md#hellofresh_format), [FACTOR_FORMAT](../../../research/sick-care-pool-sources.md#factor_format) |
| [SC15 — Find a reliable answer to food-storage questions](#sc15) | Strengthens everyday food decisions with a reusable source and the knowledge to match its guidance. | [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper), [FOOD_STORAGE](../../../research/sick-care-pool-sources.md#food_storage) |
| [SC20 — Learn which kind of home help fits](#sc20) | Makes outside-help decisions more reliable by clarifying service scope before relying on a provider. | [MEDLINE_HOME_HELP](../../../research/sick-care-pool-sources.md#medline_home_help) |
| [SC21 — Discover local help beyond people you already know](#sc21) | Improves future help-seeking by teaching a reusable route to relevant local resources. | [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211) |
| [SC23 — Make one work handoff usable without you](#sc23) **(parked)** | Tests whether agreed authorized cover can actually handle a time-sensitive duty without the user. | [FOUNDER](../../../research/sick-care-pool-sources.md#founder) |
| [SC27 — Try the pet-care handoff together](#sc27) | Checks a chosen carer's practical fit through an introduction and routine walkthrough rather than relying on a listing. | [PSI_STANDARDS](../../../research/sick-care-pool-sources.md#psi_standards), [RED_CROSS_PETS](../../../research/sick-care-pool-sources.md#red_cross_pets) |
| [SC28 — Ask your vet what a pet carer would need](#sc28) | Closes a permission and contact gap that a chosen carer and a vet phone number alone do not resolve. | [AVMA_PETS](../../../research/sick-care-pool-sources.md#avma_pets) |

### Extra ease

| Task | Why this default | Evidence |
| --- | --- | --- |
| [SC13 — Make your resting spot work for you](#sc13) | Reduces repeated trips and awkward reach once the essential options are in place. | [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_SICKBOX](../../../research/sick-care-pool-sources.md#reddit_sickbox) |
| [SC14 — Take one last-minute shop off your future plate](#sc14) | Removes a known last-minute shopping inconvenience without inventing a stockpile or universal shopping list. | [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness) |
| [SC16 — Decode a laundry pickup service's real cost](#sc16) | Builds awareness of an optional service that can remove carrying and laundry effort. | [POPLIN_FIRST_ORDER](../../../research/sick-care-pool-sources.md#poplin_first_order), [TASK_LAUNDRY](../../../research/sick-care-pool-sources.md#task_laundry) |
| [SC17 — Understand what a cleaning booking actually includes](#sc17) | Improves decisions about optional household help by explaining the terms that affect fit. | [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning) |

## Browse the pool

Times are active effort. Replies, shopping, travel and appointments can take longer. Do not mark a task complete just because an inquiry has been sent when its finish requires an answer.

| Task | Time | Useful gain |
| --- | --- | --- |
| [SC01 — Find a care option you can actually start with](#sc01) | 20 min | Discover an entry point without presuming an existing doctor; learn whether it is usable before relying on it. |
| [SC02 — Know where an in-person visit could start](#sc02) | 20 min | Find out whether a clinic can actually accept her, rather than treating a map result as access. |
| [SC03 — Know how your first video visit will work](#sc03) | 10 min | Learn how to evaluate virtual-visit access without rehearsing an appointment merely to earn completion. |
| [SC04 — Find a way to an appointment without driving](#sc04) | 20 min | Discover possible transport assistance and its advance-booking and return-trip conditions. |
| [SC05 — Check what 'someone to take you home' really means](#sc05) | 20 min | Learn an easily missed requirement before an appointment is disrupted; access the clinic's coordination help. |
| [SC06 — Learn what a care estimate leaves out](#sc06) | 10 min | Gain the knowledge to question an incomplete headline price without needing a booking or a new quote today. |
| [SC07 — Find out whether a pharmacy can reach your door](#sc07) | 15 min | Discover local prescription delivery without assuming a regular pharmacy, and distinguish it from slower refill shipping. |
| [SC08 — Understand why a refill might need another step](#sc08) | 10 min | Recognize an administrative distinction and a support route without making a practice refill request or creating another reminder. |
| [SC09 — Learn how prescription collection by someone else works](#sc09) | 10 min | Learn an available type of help without asking someone to demonstrate support or claiming a helper is arranged. |
| [SC10 — See whether groceries can reach your actual door](#sc10) | 15 min | Expose minimum-order charges, building handoffs and substitutions before relying on delivery. |
| [SC11 — Find food help without a delivery budget](#sc11) | 20 min | Discover temporary community food support and check whether she could actually receive it. |
| [SC12 — Choose meal delivery that actually removes cooking](#sc12) | 10 min | Distinguish food arriving from cooking being removed, and understand recurring commitments before subscribing. |
| [SC13 — Make your resting spot work for you](#sc13) | 10 min | Test usability rather than collecting more objects or purchasing an emergency basket. |
| [SC14 — Take one last-minute shop off your future plate](#sc14) | 10 min | Close an actual recurring shortage rather than prescribe a stockpile. Lower priority for users seeking unfamiliar options. |
| [SC15 — Find a reliable answer to food-storage questions](#sc15) | 10 min | Build a reusable research skill rather than make someone prepare a portion solely to demonstrate learning. |
| [SC16 — Decode a laundry pickup service's real cost](#sc16) | 10 min | Discover pickup laundry and learn to read its terms without carrying out an artificial trial. |
| [SC17 — Understand what a cleaning booking actually includes](#sc17) | 10 min | Learn to judge a service listing and ask useful questions, without requiring a conversation or booking to count as progress. |
| [SC18 — Find help for an errand you can't postpone](#sc18) | 20 min | Convert an overlooked errand into a checked service option without assuming nearby friends. |
| [SC19 — Make a check-in something you both want](#sc19) | 10 min | An actual mutual arrangement that respects both people's preferences, not a contact list or assumed availability. |
| [SC20 — Learn which kind of home help fits](#sc20) | 10 min | Replace an assumed favor arrangement with useful vocabulary and boundaries for discovering outside support. |
| [SC21 — Discover local help beyond people you already know](#sc21) | 10 min | Discover a reusable local information route without needing a willing friend, placing a practice call or arranging help today. |
| [SC22 — Find the simplest way to take a sick day](#sc22) | 15 min | Discover the actual notice and documentation requirements; the message is a useful byproduct, not the whole task. |
| [SC23 — Make one work handoff usable without you](#sc23) | 25 min | Test someone else's ability to act, rather than writing a vague absence note or duplicating known work information. |
| [SC24 — Find the pause button for your own business](#sc24) | 20 min | Discover that pausing incoming work may leave existing orders and fees active; prepare for the actual limits. |
| [SC25 — Discover practical help hidden in your work benefits](#sc25) | 10 min | Discover potential resources and eligibility limits without making contacting HR a prerequisite to learning. |
| [SC26 — Discover the pet-care options you could use](#sc26) | 10 min | Introduce useful apps and service differences without making a stranger meeting or relationship exercise the task. |
| [SC27 — Try the pet-care handoff together](#sc27) | 30 min | Move from a listing to observed practical fit; make instructions usable by another person. |
| [SC28 — Ask your vet what a pet carer would need](#sc28) | 20 min | Discover an administrative gap that a phone number or feeding note alone does not cover. |
| [SC29 — Explore temporary pet care when paid sitting won't stretch](#sc29) | 25 min | Discover a possible community alternative to commercial boarding without assuming it exists or confusing fostering with surrender. |
| [SC30 — Help the care team understand your home situation](#sc30) | 25 min | Discover discharge or care-coordination support and explain the real home situation before a care plan assumes an available helper. |

## Task details

<a id="sc01"></a>

### SC01. Find a care option you can actually start with · 20 min

You don't need a regular doctor to explore your options. Start with one route that fits your coverage and budget.

1. With insurance, look for virtual care in your plan or benefits portal. Without a suitable benefit, try HRSA's health-center finder.
2. Ask one service: 'Can a new patient in my state have a virtual first visit, and what would it cost?'
3. Check how to request that first visit. Keep the entry page and the answer; if you contacted the service, wait for its reply.

**Done when:** One first-visit route has confirmed new-patient access and cost information. An unanswered inquiry is still pending.

**Offer when:** She wants an initial care route and has not already established a suitable one. US service variant only.

**Skip when:** A suitable care route already exists, or the current request asks for symptom assessment or immediate care.

**Useful gain:** Discover an entry point without presuming an existing doctor; learn whether it is usable before relying on it.

**Cost and timing:** Research only; future care may cost money. No account, booking or subscription required by this task. Provider reply if details are not published.

**Editorial mapping:** care · discover · preparation · care_entry_route

**Proposed priority:** Core preparation. Establishes a missing first route to care, including access and cost, without assuming an existing doctor.

**Context can change the order:** Offer for an explicit care-access gap. If a suitable route already exists, skip rather than add a second provider by default.

**Research:** [HHS_FIND](../../../research/sick-care-pool-sources.md#hhs_find), [HRSA](../../../research/sick-care-pool-sources.md#hrsa).

**Possible user links:** [HHS_FIND](../../../research/sick-care-pool-sources.md#hhs_find), [HRSA](../../../research/sick-care-pool-sources.md#hrsa)

**Variant note:** If explicitly interested in self-pay virtual care, use a reviewed pay-per-visit provider and check current first-patient eligibility and total cost. If uninsured and cost-sensitive, start with the health center. These are variants of one outcome, not extra tasks.

<a id="sc02"></a>

### SC02. Know where an in-person visit could start · 20 min

An online option doesn't answer every access question. If you want an in-person route too, check one clinic before you need it.

1. Use your insurer's provider directory, or HRSA's finder without suitable coverage, to locate a nearby clinic accepting new patients.
2. Check whether first visits need advance registration and whether appointments or walk-ins are offered. Ask about your likely visit charge.
3. Confirm the clinic's address and booking route directly. Leave questions pending until answered; you don't need to book today.

**Done when:** You know one clinic's new-patient process, location and cost information for a future nonurgent visit.

**Offer when:** She explicitly wants an in-person route and lacks one, or has an established virtual route with an identified in-person access gap.

**Skip when:** Her existing clinic already meets this need. Do not add alongside SC01 merely to fill a batch.

**Useful gain:** Find out whether a clinic can actually accept her, rather than treating a map result as access.

**Cost and timing:** Research free; appointment costs vary. Clinic or insurer reply.

**Editorial mapping:** care · discover · preparation · in_person_care_entry

**Proposed priority:** Core preparation. Establishes in-person access when that specific route is missing; a map listing alone does not establish access.

**Context can change the order:** Use when she asks for in-person access or identifies that gap. Do not pair with SC01 merely to fill the batch.

**Research:** [HRSA](../../../research/sick-care-pool-sources.md#hrsa), [HC_NETWORK](../../../research/sick-care-pool-sources.md#hc_network).

**Possible user links:** [HRSA](../../../research/sick-care-pool-sources.md#hrsa)

**Variant note:** For insured users, replace the finder with their own plan directory. No AI judgment about which symptoms belong at which facility.

<a id="sc03"></a>

### SC03. Know how your first video visit will work · 10 min

A joining link isn't the whole picture. Learn what support is available so you can choose a setup that suits you.

1. Use HHS's telehealth guide to learn about joining instructions, captions and technical support.
2. Read your chosen provider's joining page. Look for browser or app requirements and how accessibility help is requested.
3. Find its help route if video fails. A phone alternative depends on the provider; no practice appointment or installation is needed today.

**Done when:** You understand the joining requirements and where to ask about support or an alternative.

**Offer when:** She is considering or has chosen virtual care and wants to understand its technology or accessibility requirements.

**Skip when:** She already knows and uses the setup successfully, or has an actual connection problem requiring specific technical support.

**Useful gain:** Learn how to evaluate virtual-visit access without rehearsing an appointment merely to earn completion.

**Cost and timing:** Reading is free; no account, app installation or appointment required. None for learning. An unconfirmed alternative remains a question, not established access.

**Editorial mapping:** care · strengthen · learning · virtual_visit_access_options_understood

**Proposed priority:** Make it reliable. Makes a prospective care route more dependable through understanding its access requirements and support options.

**Context can change the order:** Move first when technology or accessibility is her stated uncertainty. Actual technical failure needs problem-solving, not another reading task.

**Research:** [HHS_PREP](../../../research/sick-care-pool-sources.md#hhs_prep), [HHS_TECH](../../../research/sick-care-pool-sources.md#hhs_tech).

**Possible user links:** [HHS_PREP](../../../research/sick-care-pool-sources.md#hhs_prep)

**Learning takeaway:** Joining requirements, accessibility support and fallback options are provider-specific; know where to find them before relying on video.

**Draft outcome change:** replaces virtual_visit_connection_tested; not a stored-user migration or completion alias.

<a id="sc04"></a>

### SC04. Find a way to an appointment without driving · 20 min

Some transport options need advance notice. Find out what you could use before the day you need a ride.

1. If you have Medicaid, ask your plan about nonemergency medical transport. Otherwise, ask the clinic or local 211 about suitable transport options.
2. Ask one provider about eligibility, booking notice and the full return-trip cost. Mention any access assistance you actually need.
3. Check how the journey home is arranged, especially if the appointment runs late. Keep a confirmed booking route; don't reserve a trip yet.

**Done when:** You have an eligible transport option with confirmed booking and return-trip details. An unanswered inquiry is still pending.

**Offer when:** She identifies a nonurgent appointment-transport gap. Medicaid route requires confirmed enrollment; local 211 route is US-specific.

**Skip when:** Transport is already arranged, she needs emergency transport, or this is an escort requirement after a procedure.

**Useful gain:** Discover possible transport assistance and its advance-booking and return-trip conditions.

**Cost and timing:** Research free; eligibility and ride charges vary. Do not promise free rides. Transport-provider eligibility confirmation.

**Editorial mapping:** care, support · discover · preparation · nonurgent_appointment_transport

**Proposed priority:** Core preparation. Closes a missing transport route that can make otherwise available nonurgent care inaccessible.

**Context can change the order:** Only offer for a stated transport gap. Use confirmed eligibility, and keep emergency transport and procedure escorts separate.

**Research:** [MEDICAID_RIDES](../../../research/sick-care-pool-sources.md#medicaid_rides), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211).

**Possible user links:** [MEDICAID_RIDES](../../../research/sick-care-pool-sources.md#medicaid_rides), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211)

<a id="sc05"></a>

### SC05. Check what 'someone to take you home' really means · 20 min

For a planned procedure, a ride and an approved escort can be different things. Let the clinic explain what your appointment requires.

1. Ask your procedure team who may accompany you home and whether someone must stay afterward. Use their instructions for your appointment.
2. If you have no suitable person, say so now. Ask the clinic's coordinator about acceptable arrangements and any referral or cost information.
3. Have the team confirm that your proposed arrangement meets its requirements before relying on it. Keep unresolved care needs with the team.

**Done when:** Your procedure team has confirmed an acceptable arrangement. An unresolved gap or a ride booking alone isn't completion.

**Offer when:** She explicitly mentions a planned procedure or recovery with a possible escort requirement.

**Skip when:** Ordinary sick-day preparation with no planned procedure. Never infer a procedure from living alone.

**Useful gain:** Learn an easily missed requirement before an appointment is disrupted; access the clinic's coordination help.

**Cost and timing:** Planning free; acceptable transport or support may cost money. Clinical team and prospective escort confirmation.

**Editorial mapping:** care, support · make_workable · preparation · procedure_escort_requirements_resolved

**Proposed priority:** Core preparation. Resolves a potentially blocking escort arrangement before an explicitly planned procedure.

**Context can change the order:** Only eligible when a planned procedure and possible escort gap are explicit. Never make this a routine sick-day starting task.

**Research:** [MEDLINE_SURGERY](../../../research/sick-care-pool-sources.md#medline_surgery).

**Possible user links:** [MEDLINE_SURGERY](../../../research/sick-care-pool-sources.md#medline_surgery)

<a id="sc06"></a>

### SC06. Learn what a care estimate leaves out · 10 min

A quoted visit price may not explain every charge. Learn what to ask before deciding about a planned self-pay visit.

1. For US care paid without insurance, read CMS's explanation of a good faith estimate.
2. Notice that an estimate can cover one provider or facility; other providers and separately scheduled services may need separate estimates.
3. Identify the question you'd ask before booking: 'Which providers or services aren't included?' Keep the official guide if useful.

**Done when:** You understand what an estimate covers, its limits and how to request one.

**Offer when:** She is exploring or planning nonemergency US self-pay care and does not understand written estimates.

**Skip when:** She already understands estimates, is using insurance for this visit, or needs immediate care. Do not delay needed care for research.

**Useful gain:** Gain the knowledge to question an incomplete headline price without needing a booking or a new quote today.

**Cost and timing:** No purchase or booking. None for learning; obtaining an actual personalized estimate is a separate action.

**Editorial mapping:** care · strengthen · learning · planned_visit_estimate_understood

**Proposed priority:** Make it reliable. Improves a care decision by explaining the scope and limits of cost information.

**Context can change the order:** Move first when pricing uncertainty is the current barrier. This learning task does not establish affordability or supply a personalized estimate.

**Research:** [CMS_ESTIMATE_GUIDE](../../../research/sick-care-pool-sources.md#cms_estimate_guide).

**Possible user links:** [CMS_ESTIMATE_GUIDE](../../../research/sick-care-pool-sources.md#cms_estimate_guide)

**Learning takeaway:** An estimate is not necessarily the whole bill: separate providers and services can require separate estimates.

**Draft outcome change:** replaces planned_visit_written_estimate; not a stored-user migration or completion alias.

<a id="sc07"></a>

### SC07. Find out whether a pharmacy can reach your door · 15 min

A new prescription and a routine mail-order refill can have different delivery arrangements. Check the route you might actually need.

1. Choose a local pharmacy from your plan's directory, if insured, or an official pharmacy site. You don't need an existing prescription today.
2. Ask whether eligible new prescriptions can be delivered to your area, the cutoff time after they're ready, and the full delivery charge.
3. Check how delivery is requested and received. Keep the route if workable; confirm eligibility for any actual prescription with the pharmacy later.

**Done when:** You understand the pharmacy's delivery process and restrictions. Eligibility for an actual future prescription still needs checking.

**Offer when:** She lacks a workable prescription-acquisition route or asks specifically about delivery. US linked example only.

**Skip when:** Delivery already works for her, or she asks which medication to obtain.

**Useful gain:** Discover local prescription delivery without assuming a regular pharmacy, and distinguish it from slower refill shipping.

**Cost and timing:** Research only; delivery and prescriptions may cost money. Pharmacy response; no ordering or transfers now.

**Editorial mapping:** essentials, care · discover · preparation · local_prescription_delivery

**Proposed priority:** Core preparation. Establishes a missing way to receive a prescription without going out, including real pharmacy restrictions.

**Context can change the order:** Only when prescription access is relevant and unresolved. Existing reliable delivery makes this redundant; this never selects medication.

**Research:** [CVS_DELIVERY](../../../research/sick-care-pool-sources.md#cvs_delivery), [HC_PHARMACY](../../../research/sick-care-pool-sources.md#hc_pharmacy).

**Possible user links:** [CVS_DELIVERY](../../../research/sick-care-pool-sources.md#cvs_delivery)

<a id="sc08"></a>

### SC08. Understand why a refill might need another step · 10 min

Refill and renewal don't mean the same thing. Knowing the difference makes pharmacy messages easier to understand.

1. Open your pharmacy's refill help page. CVS's refill FAQ is one example explaining refill and renewal requests.
2. Learn the difference: an expired prescription or no remaining refills may require renewal rather than another routine refill.
3. Find your pharmacy's help route for a stalled request. Follow professional guidance for your prescription; keep your medication routine unchanged.

**Done when:** You understand refill versus renewal and know where to ask if a request stalls.

**Offer when:** She explicitly uses an ongoing prescription and is unsure about refill or renewal messages.

**Skip when:** No ongoing prescription is known, the process is already understood, or the request concerns a current missed dose or medication decision.

**Useful gain:** Recognize an administrative distinction and a support route without making a practice refill request or creating another reminder.

**Cost and timing:** No purchase or account access needed for public guidance. None for learning. This does not confirm eligibility, timing or availability of an actual refill.

**Editorial mapping:** essentials · strengthen · learning · refill_delays_understood

**Proposed priority:** Make it reliable. Makes an existing medication-access process easier to navigate by explaining a common administrative distinction.

**Context can change the order:** Offer for an explicit knowledge gap. A real delay requires the pharmacy's help, not a general lesson instead.

**Research:** [CVS_REFILL_HELP](../../../research/sick-care-pool-sources.md#cvs_refill_help).

**Possible user links:** [CVS_REFILL_HELP](../../../research/sick-care-pool-sources.md#cvs_refill_help)

**Learning takeaway:** A refill uses an existing prescription's remaining authorization; a renewal can need the prescriber. The actual pharmacy explains individual requirements.

**Draft outcome change:** replaces routine_refill_process_known; not a stored-user migration or completion alias.

<a id="sc09"></a>

### SC09. Learn how prescription collection by someone else works · 10 min

Someone else may be able to collect for you, but the pharmacy's requirements matter. You can understand the option without arranging a favor today.

1. Read HHS's explanation of prescription collection by a friend or family member; the pharmacist uses professional judgment.
2. Look for your pharmacy's pickup rules. Check identification, payment and prescription-specific restrictions rather than assuming another person can simply arrive.
3. Decide whether this route could be useful if a trusted willing person is available. Keep unclear requirements as questions for the pharmacy.

**Done when:** You understand the potential route, its limits and which pharmacy requirements still need confirmation.

**Offer when:** She wants to understand third-party pharmacy collection as a possible route; an existing helper is not required just to learn.

**Skip when:** She already knows the rules, explicitly has no interest in this route, or needs a confirmed collection now.

**Useful gain:** Learn an available type of help without asking someone to demonstrate support or claiming a helper is arranged.

**Cost and timing:** No purchase or collection request. None for learning. Actual collection still needs a willing suitable person and pharmacy confirmation.

**Editorial mapping:** essentials, support · strengthen · learning · pharmacy_collection_rules_understood

**Proposed priority:** Make it reliable. Makes a possible collection route understandable before someone relies on it.

**Context can change the order:** If she needs an actual pickup or has no feasible helper, respond to that practical gap instead of offering this as arranged support.

**Research:** [HHS_PICKUP](../../../research/sick-care-pool-sources.md#hhs_pickup).

**Possible user links:** [HHS_PICKUP](../../../research/sick-care-pool-sources.md#hhs_pickup)

**Learning takeaway:** Permitted collection is not guaranteed collection; the pharmacy's requirements and a suitable person's agreement matter separately.

**Draft outcome change:** replaces pharmacy_collection_by_helper; not a stored-user migration or completion alias.

<a id="sc10"></a>

### SC10. See whether groceries can reach your actual door · 15 min

Delivery coverage is only the start. The useful question is whether the cost and handoff would work on a day you need rest.

1. Check your usual grocer's delivery page for your address. If it doesn't deliver, inspect one local alternative without buying a membership.
2. Preview a realistic small order. Check the final fees and minimum, then confirm whether the handoff is at your door or building entrance.
3. Check what happens when an essential item is unavailable. Save a workable option or ask support to resolve the specific obstacle; don't check out.

**Done when:** You understand one service's total order cost, delivery location and substitution options well enough to decide whether it fits.

**Offer when:** Grocery delivery is untested or there is an explicit cost, access or substitution problem.

**Skip when:** She already has a reliable suitable service. If no-spend includes future paid services, prefer SC11 or an agreed existing helper.

**Useful gain:** Expose minimum-order charges, building handoffs and substitutions before relying on delivery.

**Cost and timing:** No test purchase; future food and service costs must fit her budget. Support reply if the delivery location or fees are unclear.

**Editorial mapping:** essentials · discover · preparation · grocery_delivery_workable

**Proposed priority:** Core preparation. Establishes usable food access by checking actual delivery cost, handoff and substitutions.

**Context can change the order:** Offer for an untested or unsuitable route. If future paid delivery is ruled out, use an eligible community or agreed-help route instead.

**Research:** [WALMART_DELIVERY](../../../research/sick-care-pool-sources.md#walmart_delivery), [INSTACART_EBT](../../../research/sick-care-pool-sources.md#instacart_ebt), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

**Variant note:** If she explicitly uses EBT, explain that provider fees may need another payment method and inspect that service's current terms. Do not collect benefit information just to personalize.

<a id="sc11"></a>

### SC11. Find food help without a delivery budget · 20 min

When food costs are the obstacle, another shopping app may not help. A local food program is a different route worth checking.

1. Use Feeding America's finder to reach your local food bank and ask about a nearby pantry or meal program for temporary help.
2. Check who can use it, opening times and what a first visit requires. Say if transport or collecting food is the obstacle.
3. Ask whether delivery or collection by someone else is available there. Keep the confirmed access route; if it doesn't fit, ask for another referral.

**Done when:** You have a confirmed local food option and a workable way to receive it. Unanswered referrals are still pending.

**Offer when:** She explicitly identifies food affordability or lack of paid-delivery access. US only for the linked route.

**Skip when:** No affordability/access concern is expressed. Do not infer financial hardship from living alone or lack of insurance.

**Useful gain:** Discover temporary community food support and check whether she could actually receive it.

**Cost and timing:** Directory research free; program terms vary. Do not promise free home delivery. Local program reply. No eligibility promise.

**Editorial mapping:** essentials, support · discover · preparation · food_assistance_access_route

**Proposed priority:** Core preparation. Explores a food-access route when affordability or access makes commercial delivery unsuitable.

**Context can change the order:** Give priority when the food-access constraint is explicit. Do not infer hardship or promise local eligibility or delivery.

**Research:** [FEEDING_AMERICA](../../../research/sick-care-pool-sources.md#feeding_america).

**Possible user links:** [FEEDING_AMERICA](../../../research/sick-care-pool-sources.md#feeding_america)

<a id="sc12"></a>

### SC12. Choose meal delivery that actually removes cooking · 10 min

A meal kit can still leave you chopping and washing up. Learn which kind of delivery removes the part you actually want help with.

1. Compare a meal kit such as HelloFresh with prepared meals such as Factor: ingredients to cook versus meals to heat.
2. Check equipment needed, minimum order, recurring charges and the deadline to skip a delivery. Your usual grocer may also sell prepared meals.
3. Choose a format that fits your energy and budget; no order or subscription needed. If paid delivery doesn't fit, rule it out.

**Done when:** You understand the formats and have chosen one to explore, or ruled paid delivery out.

**Offer when:** She is curious about meal services or wants less cooking and is open to learning about paid options. US provider examples.

**Skip when:** Paid services are explicitly excluded, suitable low-effort meals already work, or the actual gap is food affordability rather than service knowledge.

**Useful gain:** Distinguish food arriving from cooking being removed, and understand recurring commitments before subscribing.

**Cost and timing:** Browsing is free. Commercial services may involve recurring payment and minimum orders. None; no sample meal, trial order or subscription.

**Editorial mapping:** essentials, home · discover · learning · meal_delivery_formats_understood

**Proposed priority:** Make it reliable. Makes a food-access choice more dependable by distinguishing service formats and commitments.

**Context can change the order:** Offer when choosing a format is the actual gap. Do not displace affordable food access with a comparison of subscriptions.

**Research:** [HELLOFRESH_FORMAT](../../../research/sick-care-pool-sources.md#hellofresh_format), [FACTOR_FORMAT](../../../research/sick-care-pool-sources.md#factor_format).

**Possible user links:** [HELLOFRESH_FORMAT](../../../research/sick-care-pool-sources.md#hellofresh_format), [FACTOR_FORMAT](../../../research/sick-care-pool-sources.md#factor_format)

**Variant note:** A freezer meal is an alternative within this outcome, not a second task called 'prepare soup'. No dietary prescriptions.

**Learning takeaway:** Meal kits and prepared meals remove different work. Look past promotions to preparation effort and recurring commitments.

**Draft outcome change:** replaces easy_meals_ready; not a stored-user migration or completion alias.

<a id="sc13"></a>

### SC13. Make your resting spot work for you · 10 min

Try the setup from where you'll actually sit or lie down. You'll notice more than you do while standing beside it.

1. Sit in your usual resting spot and try reaching your drink, tissues and phone. Test the charger from that position.
2. Move what you keep getting up for onto an existing stable surface. Keep liquids away from electrical equipment and cables out of walkways.
3. Try it again, including getting up normally. Keep only changes that make reaching things and moving around easier.

**Done when:** Your chosen essentials are reachable and the setup leaves a clear way through.

**Offer when:** She reports repeated getting up, awkward reach or an unsuitable resting space, or explicitly wants a simple physical preparation.

**Skip when:** The setup already works. Do not use this familiar task as the default for someone asking for overlooked services.

**Useful gain:** Test usability rather than collecting more objects or purchasing an emergency basket.

**Cost and timing:** No purchase; rearrange existing ordinary items. None.

**Editorial mapping:** home · make_workable · preparation · resting_spot_usable

**Proposed priority:** Extra ease. Reduces repeated trips and awkward reach once the essential options are in place.

**Context can change the order:** Move first when reach or repeated getting up is her actual barrier to using essentials. Never default to rearranging an already-working space.

**Research:** [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_SICKBOX](../../../research/sick-care-pool-sources.md#reddit_sickbox).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc14"></a>

### SC14. Take one last-minute shop off your future plate · 10 min

Think of the everyday item that has actually sent you out at an inconvenient time. Prepare for that gap, instead of buying a generic sick-day kit.

1. Pick a nonmedical essential you regularly use and have run out of, such as tissues, menstrual products or pet litter.
2. Check what you have and its storage instructions. If useful and affordable, add a modest spare to your next normal shop.
3. Place the spare where you'll use it and add a replacement to your shopping list when you open it. Use your existing system.

**Done when:** That specific supply gap is covered and you have a simple cue to replace it when used.

**Offer when:** She describes a recurring shortage or explicitly wants material preparation; the item must come from her own routine.

**Skip when:** Adequate supplies already exist, buying anything is not feasible, or the request concerns medication quantities.

**Useful gain:** Close an actual recurring shortage rather than prescribe a stockpile. Lower priority for users seeking unfamiliar options.

**Cost and timing:** May require a routine purchase; never recommend stockpiling or automatic subscriptions. Next ordinary shop, if needed.

**Editorial mapping:** essentials, home · make_workable · preparation · personal_essentials_gap_closed

**Proposed priority:** Extra ease. Removes a known last-minute shopping inconvenience without inventing a stockpile or universal shopping list.

**Context can change the order:** Treat as core when the specific missing item is necessary for her stated daily needs and replacing it is feasible. Respect no-purchase constraints.

**Research:** [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc15"></a>

### SC15. Find a reliable answer to food-storage questions · 10 min

You don't have to memorize storage rules. Learn where to find guidance for the food you actually use.

1. Open USDA's FoodKeeper website or app and look up one food whose storage instructions you find unclear.
2. Find the matching form and storage conditions, then compare the guidance with the product's packaging instructions.
3. Identify where you'd check again after opening or preparing that food. Use the matching entry and packaging instructions rather than a broad rule.

**Done when:** You can find storage guidance matching that food and know where to look again.

**Offer when:** She wants a reliable food-storage reference or is uncertain about guidance for a familiar food.

**Skip when:** She already knows and uses a suitable reference, or asks whether a particular questionable food is safe to eat.

**Useful gain:** Build a reusable research skill rather than make someone prepare a portion solely to demonstrate learning.

**Cost and timing:** No purchase; the official web reference is enough. None. Do not treat a lookup as clearance that a particular food is safe.

**Editorial mapping:** essentials, home · strengthen · learning · food_storage_reference_skill

**Proposed priority:** Make it reliable. Strengthens everyday food decisions with a reusable source and the knowledge to match its guidance.

**Context can change the order:** Prioritize a stated storage knowledge gap. Do not make it general homework or provide AI food-safety clearance.

**Research:** [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper), [FOOD_STORAGE](../../../research/sick-care-pool-sources.md#food_storage).

**Possible user links:** [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper)

**Learning takeaway:** Storage guidance depends on the food and its condition; a trusted lookup tool is more useful than a universal rule.

**Draft outcome change:** replaces chosen_food_storage_understood; not a stored-user migration or completion alias.

<a id="sc16"></a>

### SC16. Decode a laundry pickup service's real cost · 10 min

A per-pound price isn't always what a small load costs. Learn which terms matter before relying on pickup laundry.

1. Explore Poplin or a local laundromat's pickup page to see how collection, washing and return work in your area.
2. Look beyond the advertised rate: check minimum charges, additional fees, turnaround and whether detergent preferences or certain items have restrictions.
3. Identify which terms would decide whether the service fits your needs. Stop at understanding the option; no trial load or booking.

**Done when:** You understand the charging model and the service terms you would check before ordering.

**Offer when:** She wants to learn about laundry help and is open to a possible future paid service.

**Skip when:** Laundry support is already understood, paid help is ruled out, or the need involves items the ordinary service will not accept.

**Useful gain:** Discover pickup laundry and learn to read its terms without carrying out an artificial trial.

**Cost and timing:** Research free; future service costs vary. None for learning; exact availability and final charges still need checking before a real order.

**Editorial mapping:** home, support · discover · learning · laundry_service_terms_understood

**Proposed priority:** Extra ease. Builds awareness of an optional service that can remove carrying and laundry effort.

**Context can change the order:** Move first when access or lifting is a real barrier. If she needs service now, help locate a feasible option rather than stop at general learning.

**Research:** [POPLIN_FIRST_ORDER](../../../research/sick-care-pool-sources.md#poplin_first_order), [TASK_LAUNDRY](../../../research/sick-care-pool-sources.md#task_laundry).

**Possible user links:** [POPLIN_FIRST_ORDER](../../../research/sick-care-pool-sources.md#poplin_first_order)

**Learning takeaway:** Minimums and additional charges can matter more than a low unit price, especially for a small load.

**Draft outcome change:** replaces laundry_help_route; not a stored-user migration or completion alias.

<a id="sc17"></a>

### SC17. Understand what a cleaning booking actually includes · 10 min

A cleaning listing doesn't tell the whole story. Learn how to spot the difference between a good fit and a booking that leaves your main chore untouched.

1. Look at Taskrabbit's cleaning overview or a local cleaner's service list. Find whether your particular chores appear in the advertised scope.
2. Check hourly versus fixed pricing, minimum booking, supplies and exclusions. A listed hourly rate alone doesn't tell you the total.
3. Identify the two details you would clarify before booking. You can finish without requesting quotes, arranging a visit or sharing home-access information.

**Done when:** You know how to check whether a cleaning service includes the work you actually need.

**Offer when:** She is exploring cleaning help and is unsure how to read service scope and pricing.

**Skip when:** She already understands the relevant service or excludes paid help. Do not substitute a cleaner for personal or clinical care.

**Useful gain:** Learn to judge a service listing and ask useful questions, without requiring a conversation or booking to count as progress.

**Cost and timing:** No purchase or quote request. None for learning; no particular cleaner's cost or suitability is confirmed.

**Editorial mapping:** home, support · discover · learning · cleaning_service_scope_understood

**Proposed priority:** Extra ease. Improves decisions about optional household help by explaining the terms that affect fit.

**Context can change the order:** Prioritize when misunderstanding scope is the stated obstacle. A pressing household need may require finding actual help instead.

**Research:** [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning).

**Possible user links:** [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning)

**Learning takeaway:** Service scope, charging method and supplied equipment affect whether a cleaning booking solves the actual need.

**Draft outcome change:** replaces limited_cleaning_help_route; not a stored-user migration or completion alias.

<a id="sc18"></a>

### SC18. Find help for an errand you can't postpone · 20 min

Some errands fall outside grocery delivery. Start with the exact job, then look for a service or local program that handles it.

1. Choose one nonmedical errand, such as collecting a repaired item. For paid help, try Taskrabbit; for community options, contact local 211.
2. Ask about that exact job, area, notice and total charges. If collection is involved, check the shop's permission or identification requirements.
3. Keep one suitable contact and its booking process. If no service fits, leave the gap open rather than treating a directory as arranged help.

**Done when:** A provider has confirmed it can handle that kind of errand and explained how you would arrange it.

**Offer when:** An identified nonmedical errand needs outside help. Choose the paid or community route from her preferences; linked coverage is US-first.

**Skip when:** The errand already has a solution, it is medication collection, or she needs hands-on personal care.

**Useful gain:** Convert an overlooked errand into a checked service option without assuming nearby friends.

**Cost and timing:** Research free; paid and community routes have different terms. A referral is not a guarantee of free assistance. Service or referral response.

**Editorial mapping:** support, home · discover · preparation · practical_errand_help_route

**Proposed priority:** Core preparation. Creates a practical outside-help route for an identified errand that cannot reasonably wait.

**Context can change the order:** Only offer for a real unresolved nonmedical errand. Do not invent an errand, a nearby friend, affordable paid help or guaranteed community assistance.

**Research:** [TASK_ERRANDS](../../../research/sick-care-pool-sources.md#task_errands), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211).

**Possible user links:** [TASK_ERRANDS](../../../research/sick-care-pool-sources.md#task_errands), [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211)

<a id="sc19"></a>

### SC19. Make a check-in something you both want · 10 min

A short chat can be welcome without becoming another obligation. Set it up with someone you already feel comfortable asking.

1. Choose a person you'd like to hear from on a sick day. They don't need to live nearby.
2. Ask what would suit you both: a message, short call or voice note, and a reasonable time. Make declining or rescheduling easy.
3. Agree how you'd ask for a check-in and let each other know if plans change. Keep it flexible.

**Done when:** You both agree on a comfortable way to arrange a check-in; an unanswered message is still pending.

**Offer when:** She wants companionship and has named or confirmed a trusted person she is comfortable asking.

**Skip when:** She prefers quiet, has no such contact, or wants emergency monitoring. Living alone is not evidence of loneliness.

**Useful gain:** An actual mutual arrangement that respects both people's preferences, not a contact list or assumed availability.

**Cost and timing:** No purchase. The other person's reply.

**Editorial mapping:** support · make_workable · preparation · agreed_social_checkin

**Proposed priority:** Core preparation. Establishes wanted social support through an actual mutual arrangement rather than an assumed available contact.

**Context can change the order:** Only when she wants connection and has a suitable person she is comfortable asking. Skip for someone who prefers quiet; this is not monitoring.

**Research:** [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness), [FOUNDER](../../../research/sick-care-pool-sources.md#founder).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc20"></a>

### SC20. Learn which kind of home help fits · 10 min

Cleaning, errands and hands-on personal care are different kinds of help. Knowing the distinction gives you better words to find the right support.

1. Read MedlinePlus's home-care overview: it separates household work, personal care such as dressing, and healthcare support.
2. Match the help you're exploring to that distinction. An ordinary cleaner or errand worker isn't a substitute for personal or clinical care.
3. Identify which service type to research next. For healthcare needs, use your care team's guidance rather than choosing care from a marketplace listing.

**Done when:** You understand the service types and which kind of provider to ask about your stated need.

**Offer when:** She is exploring outside help and is unsure which type of service fits a stated practical need.

**Skip when:** She already knows the appropriate service, only wants companionship, or needs a professional to assess current care needs.

**Useful gain:** Replace an assumed favor arrangement with useful vocabulary and boundaries for discovering outside support.

**Cost and timing:** No purchase or contact required to learn. None for learning. No provider, eligibility, clinical plan or arrangement is established.

**Editorial mapping:** home, support · strengthen · learning · home_help_service_types_understood

**Proposed priority:** Make it reliable. Makes outside-help decisions more reliable by clarifying service scope before relying on a provider.

**Context can change the order:** Useful for a real service-type knowledge gap. For an actual clinical or personal-care uncertainty, the care team must guide the decision.

**Research:** [MEDLINE_HOME_HELP](../../../research/sick-care-pool-sources.md#medline_home_help).

**Possible user links:** [MEDLINE_HOME_HELP](../../../research/sick-care-pool-sources.md#medline_home_help)

**Learning takeaway:** Different support needs call for different services; the name of the task helps find suitable help and avoid relying on the wrong provider.

**Draft outcome change:** replaces agreed_practical_favor; not a stored-user migration or completion alias.

<a id="sc21"></a>

### SC21. Discover local help beyond people you already know · 10 min

You don't need a local network to start learning what support exists. In the US, 211 is one place to explore community resources.

1. Open your local 211 website and see which support areas it covers, such as food access or transportation.
2. Choose one area relevant to you and read a listing's service description, eligibility and contact route where available.
3. Find how to reach 211 if searching is confusing. It offers information and referrals; a listing does not guarantee assistance.

**Done when:** You know a local starting point and how to investigate one relevant type of support.

**Offer when:** She is in the US, wants awareness of community resources and does not already know a suitable local starting point.

**Skip when:** She already uses local 211, has a confirmed route for the need, is outside the resource's coverage, or needs immediate intervention.

**Useful gain:** Discover a reusable local information route without needing a willing friend, placing a practice call or arranging help today.

**Cost and timing:** Information and referrals are free; referred programs have their own costs and eligibility. None for learning. Directory details need confirmation before relying on a particular service.

**Editorial mapping:** support, home · discover · learning · local_211_resource_awareness

**Proposed priority:** Make it reliable. Improves future help-seeking by teaching a reusable route to relevant local resources.

**Context can change the order:** Offer for resource awareness. If she requests concrete help for a particular errand, use SC18 or a fitting action rather than repeat directory browsing.

**Research:** [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211).

**Possible user links:** [LOCAL_211](../../../research/sick-care-pool-sources.md#local_211)

**Learning takeaway:** A local information service can help identify options beyond an existing social circle; referrals and available assistance are different things.

**Draft outcome change:** replaces remote_practical_help_agreement; not a stored-user migration or completion alias.

<a id="sc22"></a>

### SC22. Find the simplest way to take a sick day · 15 min

Knowing the reporting process beforehand can remove a decision when you're tired. Check the rules that actually apply to your work or course.

1. Open your workplace policy or course guidance. Find whom to notify, the required channel and when notice is expected.
2. If unclear, ask the responsible office about the process and any required documentation. Don't assume paid leave or a particular entitlement.
3. Save a short ready-to-adapt message with only required details. For example: 'I'm unwell and need to be absent today. Please confirm the next step.'

**Done when:** The applicable absence process is clear and your message is ready to adapt.

**Offer when:** She works or studies, doesn't know the reporting process and wants to reduce that friction.

**Skip when:** She already knows the process or works for herself without an employer/course. Legal eligibility questions need jurisdiction-specific guidance.

**Useful gain:** Discover the actual notice and documentation requirements; the message is a useful byproduct, not the whole task.

**Cost and timing:** No purchase. This does not promise paid time off. Workplace or course-office reply if unclear.

**Editorial mapping:** responsibilities · discover · preparation · absence_reporting_process_known

**Proposed priority:** Core preparation — parked from default suggestions. Establishes a missing process for reporting absence when that uncertainty prevents taking needed time away.

**Context can change the order:** Parked outside default suggestions after removal of the work/study choice. Consider only for an explicit supported absence-process request.

**Research:** [DOL_LEAVE](../../../research/sick-care-pool-sources.md#dol_leave), [FOUNDER](../../../research/sick-care-pool-sources.md#founder).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc23"></a>

### SC23. Make one work handoff usable without you · 25 min

Pick the responsibility that really keeps pulling you back in. A tiny tested handoff is more useful than a long document nobody can use.

1. With your manager or teammate, choose one time-sensitive duty they can appropriately cover and confirm that they agree to take it.
2. Put its next action, authorized file location and decision contact in your work system. Use approved access permissions, never shared passwords.
3. Ask them to open the handoff and explain what they'd do first. Fix the missing information their attempt reveals.

**Done when:** An agreed cover person can access and use the handoff for that duty.

**Offer when:** She has a real time-sensitive work responsibility, authorized cover is possible, and absence is difficult because information depends on her.

**Skip when:** No teammate or authorized cover exists, or her work is already covered. Do not pressure her to keep working while ill.

**Useful gain:** Test someone else's ability to act, rather than writing a vague absence note or duplicating known work information.

**Cost and timing:** No purchase. Colleague agreement and short trial. Keep business information out of My Safety.

**Editorial mapping:** responsibilities · strengthen · preparation · one_work_handoff_tested

**Proposed priority:** Make it reliable — parked from default suggestions. Tests whether agreed authorized cover can actually handle a time-sensitive duty without the user.

**Context can change the order:** Parked outside default suggestions. For an explicit supported request, prioritize only when a real handoff is the unresolved obstacle and cover is possible.

**Research:** [FOUNDER](../../../research/sick-care-pool-sources.md#founder).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc24"></a>

### SC24. Find the pause button for your own business · 20 min

If new orders or bookings keep arriving when you're unavailable, learn what your actual platform can pause—and what still needs attention.

1. Open the official help for your shop or booking platform. Look for vacation mode, booking availability or temporary closure.
2. Check whether it pauses only new work, and what happens to existing commitments, recurring fees and messages. Don't change live settings today.
3. Draft a customer notice and a short plan for existing commitments. Keep the official instructions ready for a future decision to pause.

**Done when:** You know the platform's actual pause behavior and have a plan for commitments it doesn't pause.

**Offer when:** She runs a solo business through a named platform and needs a way to handle temporary unavailability.

**Skip when:** No business/platform is known, or this process already exists. No tool action to close a real shop is authorized by this preparation task.

**Useful gain:** Discover that pausing incoming work may leave existing orders and fees active; prepare for the actual limits.

**Cost and timing:** Research free; existing business fees may continue during a future pause. None for preparation. This task never changes live business settings.

**Editorial mapping:** responsibilities · discover · preparation · solo_business_pause_plan

**Proposed priority:** Core preparation — parked from default suggestions. Establishes a way to pause incoming business work while identifying commitments that a platform will not pause.

**Context can change the order:** Parked outside default suggestions. Consider only for an explicit supported solo-business request with a known platform and missing pause process.

**Research:** [ETSY_PAUSE](../../../research/sick-care-pool-sources.md#etsy_pause).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

**Variant note:** Attach ETSY_PAUSE only for an Etsy seller; another platform needs its own reviewed official instructions, not guessed controls.

<a id="sc25"></a>

### SC25. Discover practical help hidden in your work benefits · 10 min

Your benefits may include more than health insurance. Learn whether practical-care support is part of your actual package, rather than assuming a provider's advertisement applies to you.

1. Search your benefits portal for care support, dependent care or pet care. Care.com's employer care programs are an example, not proof of coverage.
2. Read who and which situations qualify, any registration requirement, and what you would pay. Personal sick leave may not qualify.
3. Decide whether a relevant benefit is documented, absent or unclear. If unclear, identify benefits support as the next contact; no inquiry is required today.

**Done when:** You understand the published benefit terms, or know exactly what remains unconfirmed and where to ask.

**Offer when:** Employer benefits are explicitly known and she wants to learn about possible support for a practical or pet-care need.

**Skip when:** No benefit access is known, she already checked, or there is no relevant need. Employment alone does not prove benefits.

**Useful gain:** Discover potential resources and eligibility limits without making contacting HR a prerequisite to learning.

**Cost and timing:** No purchase. Any later benefit use may involve registration, limits or charges. None for learning; unclear eligibility stays unconfirmed.

**Editorial mapping:** responsibilities, pets, support · discover · learning · employer_care_benefit_terms_understood

**Proposed priority:** Core preparation. Can reveal a previously unknown support option for an essential practical need.

**Context can change the order:** Only with explicit benefit access and a relevant need. This is not a restored work/study checkbox or proof that personal sick leave qualifies.

**Research:** [CARE_BENEFITS](../../../research/sick-care-pool-sources.md#care_benefits).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

**Learning takeaway:** Provider marketing is not an employer entitlement; the actual plan's eligible situations and costs determine whether a benefit is useful.

**Draft outcome change:** replaces employer_practical_care_benefit_known; not a stored-user migration or completion alias.

<a id="sc26"></a>

### SC26. Discover the pet-care options you could use · 10 min

Pet care isn't only boarding. Learn which services let your pet stay home and what you would check before choosing a sitter.

1. Explore Rover's pet-sitting and dog-walking options. If you have a cat, also explore Meowtel's in-home cat-care services.
2. Compare drop-in visits, overnight care in your home, and boarding where offered. Check species, area coverage and how much time each service includes.
3. Choose a service type worth researching further. Check how introductions, fees and cancellations work before any future booking; no contact or payment needed today.

**Done when:** You understand the relevant care options and which service type you would explore next.

**Offer when:** A pet-care interest is explicit and she wants to understand available services before choosing a carer; future paid research is welcome.

**Skip when:** She already understands the services and has suitable care, excludes paid options, or needs someone to care for the pet immediately.

**Useful gain:** Introduce useful apps and service differences without making a stranger meeting or relationship exercise the task.

**Cost and timing:** Browsing free; future care may require payment. Check current booking and introduction rules before committing. None for learning. No sitter is vetted, available or booked by completion.

**Editorial mapping:** pets, support · discover · learning · pet_care_options_compared

**Proposed priority:** Core preparation. Builds awareness of possible pet-care routes when the user has not known where to start.

**Context can change the order:** Once she knows the service type, help with the next real gap. An existing sitter should not trigger another app-comparison task.

**Research:** [ROVER_SERVICES](../../../research/sick-care-pool-sources.md#rover_services), [MEOWTEL_SERVICES](../../../research/sick-care-pool-sources.md#meowtel_services).

**Possible user links:** [ROVER_SERVICES](../../../research/sick-care-pool-sources.md#rover_services), [MEOWTEL_SERVICES](../../../research/sick-care-pool-sources.md#meowtel_services)

**Variant note:** Use Meowtel only for cats and where covered. For dogs, Rover is enough unless a second reviewed local resource adds value. Do not force two names or imply either is free.

**Learning takeaway:** Drop-ins, overnight stays and boarding are different arrangements; choose the format before investigating a particular sitter.

**Draft outcome change:** replaces pet_care_candidate_checked; not a stored-user migration or completion alias.

<a id="sc27"></a>

### SC27. Try the pet-care handoff together · 30 min

A real walkthrough can reveal the detail a feeding note misses. Use it to decide whether the arrangement works for both you and your pet.

1. Arrange an introduction with a candidate you've chosen, confirming any charge first. Stay present while they meet your pet.
2. Show the ordinary routine and ask them to walk through it. Capture only the details they need, including who to contact with questions.
3. Resolve unclear instructions and discuss how visits would be requested if you're ill, including what happens if the carer becomes unavailable.

**Done when:** You've met, checked the routine together and decided whether this carer fits. Future dates still need agreement.

**Offer when:** A suitable candidate exists and an introductory visit has not happened. The user wants to take that next step.

**Skip when:** A trusted carer already knows the routine. Do not repeat an existing feeding note; address only a remaining handoff gap.

**Useful gain:** Move from a listing to observed practical fit; make instructions usable by another person.

**Cost and timing:** Meeting or trial charges may apply; ask before arranging. Scheduling and meeting time; travel additional. Never store access codes in My Safety.

**Editorial mapping:** pets · make_workable · preparation · pet_carer_handoff_tested

**Proposed priority:** Make it reliable. Checks a chosen carer's practical fit through an introduction and routine walkthrough rather than relying on a listing.

**Context can change the order:** Move first when a candidate exists but this is the missing step before relying on them. Do not require SC26 if she already found someone.

**Research:** [PSI_STANDARDS](../../../research/sick-care-pool-sources.md#psi_standards), [RED_CROSS_PETS](../../../research/sick-care-pool-sources.md#red_cross_pets).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc28"></a>

### SC28. Ask your vet what a pet carer would need · 20 min

Knowing the vet's number may not be the whole arrangement. Ask how they handle a carer's call when you aren't available.

1. Ask your vet what permission or paperwork they use when someone else brings your pet for care and you can't immediately answer.
2. Discuss the decisions and payment arrangements you are comfortable authorizing. Use the practice's process rather than an AI-written legal form.
3. Share the agreed process with your chosen carer through a private channel, and confirm the practice has what it needs.

**Done when:** Your vet and chosen carer understand the permission and contact process you have agreed.

**Offer when:** A pet and chosen carer exist, and veterinary permission during the user's absence is an unresolved concern.

**Skip when:** This is already arranged or the pet needs medical advice now. Do not suggest blanket authorization or unlimited spending.

**Useful gain:** Discover an administrative gap that a phone number or feeding note alone does not cover.

**Cost and timing:** Administrative preparation; ask about any charge. No treatment authorized by this app. Vet-practice confirmation. Keep permissions and payment details outside My Safety.

**Editorial mapping:** pets · strengthen · preparation · vet_permission_for_pet_carer

**Proposed priority:** Make it reliable. Closes a permission and contact gap that a chosen carer and a vet phone number alone do not resolve.

**Context can change the order:** Move first when she explicitly expects to be unavailable and this administrative arrangement is missing. Require a chosen carer and the vet's actual process.

**Research:** [AVMA_PETS](../../../research/sick-care-pool-sources.md#avma_pets).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc29"></a>

### SC29. Explore temporary pet care when paid sitting won't stretch · 25 min

For an expected longer absence, some communities have temporary foster support for owned pets. Find out whether anything local fits your situation.

1. Contact a local animal shelter or humane organization and ask about temporary care for an owned pet during a planned hospital stay or recovery.
2. Ask about eligibility, notice, space, duration and costs. Make clear that you are asking about temporary care, not giving up your pet.
3. If a program fits, ask about its written owner-caregiver agreement and return arrangements. If not, request a specific local referral.

**Done when:** You understand a local program's suitability and next step, or have an honest answer that this route is unavailable.

**Offer when:** She has a pet, explicitly expects an extended absence and lacks affordable care. Local research is required; no nationwide availability promise.

**Skip when:** Routine short sick-day planning, no pet, or a suitable carer already exists.

**Useful gain:** Discover a possible community alternative to commercial boarding without assuming it exists or confusing fostering with surrender.

**Cost and timing:** Inquiry free; program eligibility, fees and capacity vary. Local organization reply; an inquiry never establishes a placement.

**Editorial mapping:** pets, support · discover · preparation · temporary_pet_care_program_route

**Proposed priority:** Core preparation. Explores a potentially feasible pet-care route during an expected extended absence when commercial care is unaffordable.

**Context can change the order:** Only for an explicitly expected extended absence and affordable-care gap. Never add foster research to ordinary short sick-day preparation.

**Research:** [HUMANE_FOSTER](../../../research/sick-care-pool-sources.md#humane_foster).

**Possible user links:** [HUMANE_FOSTER](../../../research/sick-care-pool-sources.md#humane_foster)

<a id="sc30"></a>

### SC30. Help the care team understand your home situation · 25 min

If a hospital stay or procedure is planned, the team needs to know when there isn't someone at home to do the practical parts.

1. Ask your procedure or hospital team who handles planning for help at home. Explain that you live alone and what help is actually available.
2. Discuss the daily activities you're unsure you could manage. Ask which need professional support and which could use ordinary practical help.
3. Request help coordinating the necessary arrangements, including costs and timing. Ask the team to confirm the plan before relying on it.

**Done when:** You and the care team have an agreed support plan, with unresolved arrangements clearly assigned for follow-up.

**Offer when:** A hospital stay or procedure is explicitly planned and help at home is uncertain.

**Skip when:** Ordinary sick-day preparation with no planned treatment. A cleaner or errand helper must not be substituted for clinical/personal care.

**Useful gain:** Discover discharge or care-coordination support and explain the real home situation before a care plan assumes an available helper.

**Cost and timing:** Ask about coordination and service costs; eligibility and coverage vary. Team coordination; 25 minutes is active discussion/preparation, not total arrangement time.

**Editorial mapping:** care, home, support · make_workable · preparation · planned_recovery_help_coordinated

**Proposed priority:** Core preparation. Establishes needed help at home with the actual care team before a planned stay or procedure assumes an available helper.

**Context can change the order:** Only when planned treatment and uncertain support are explicit. Keep unresolved care requirements with the team; do not substitute a household service.

**Research:** [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge).

**Possible user links:** [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge)

## What this check does and does not establish

The accompanying structural check confirms thirty unique IDs/outcome keys, one valid proposed priority with rationale and context per task, valid exclusion/concern/source references, three steps per task, copy limits and resource counts. It does not establish semantic uniqueness, appropriate ranking, clinical approval, task effectiveness, link availability in a particular region or live app compatibility. The fit rules still require implementation and the copy needs founder review.
