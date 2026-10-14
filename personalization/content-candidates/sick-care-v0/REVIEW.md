# Sick days & care — 30 tasks to review

Authored content candidates, October 12, 2026; proposed priority mapping added October 13. Research-informed; awaiting founder review. Not published in the app or generated in a recorded API test. The pool offers different options for different lives, not thirty things one person must complete.

Generated reading view of [pool.json](pool.json). Edit the JSON and rerun `render-review.mjs`; do not maintain a second copy here. [Selection and checkbox proposal](README.md) · [Source record](../../../research/sick-care-pool-sources.md).

## Current concern screen

Use the [five current concern choices and optional AI input](README.md#the-concern-screen). Work/study was removed from the menu. The six older concern tags in pool.json remain editorial metadata awaiting deliberate remapping; they are not the current screen or executable filters.

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
| [SC25 — Look for practical care help in your work benefits](#sc25) | May uncover an overlooked eligible source of practical-care help before the user researches full-price alternatives. | [CARE_BENEFITS](../../../research/sick-care-pool-sources.md#care_benefits) |
| [SC26 — Find care that fits your kind of pet](#sc26) | Establishes a promising pet-care option and its first-use requirements before help is needed. | [PSI_FIND](../../../research/sick-care-pool-sources.md#psi_find) |
| [SC29 — Explore temporary pet care when paid sitting won't stretch](#sc29) | Explores a potentially feasible pet-care route during an expected extended absence when commercial care is unaffordable. | [HUMANE_FOSTER](../../../research/sick-care-pool-sources.md#humane_foster) |
| [SC30 — Help the care team understand your home situation](#sc30) | Establishes needed help at home with the actual care team before a planned stay or procedure assumes an available helper. | [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge) |

### Make it reliable

| Task | Why this default | Evidence |
| --- | --- | --- |
| [SC03 — Try the doorway to your first video visit](#sc03) | Checks whether a chosen care option can actually be joined and exposes technical or accessibility barriers. | [HHS_PREP](../../../research/sick-care-pool-sources.md#hhs_prep), [HHS_TECH](../../../research/sick-care-pool-sources.md#hhs_tech) |
| [SC06 — Ask what your planned visit will actually cost](#sc06) | Clarifies the actual cost of a chosen self-pay visit rather than relying on a starting price. | [CMS_ESTIMATE](../../../research/sick-care-pool-sources.md#cms_estimate) |
| [SC08 — Find out what could hold up your next refill](#sc08) | Addresses administrative delays that a delivery service alone cannot resolve for an existing prescription. | [CDC_RX](../../../research/sick-care-pool-sources.md#cdc_rx) |
| [SC09 — Check whether someone else can collect for you](#sc09) | Makes an existing willing helper a usable collection option by checking pharmacy permission and handoff requirements. | [HHS_PICKUP](../../../research/sick-care-pool-sources.md#hhs_pickup) |
| [SC12 — Give one easy meal a real-life try](#sc12) | Tests whether a chosen meal is genuinely manageable instead of creating another list of familiar foods. | [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_SICKBOX](../../../research/sick-care-pool-sources.md#reddit_sickbox) |
| [SC15 — Check how your go-to meal keeps](#sc15) | Resolves an actual storage knowledge gap that could undermine an otherwise usable meal plan. | [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper), [FOOD_STORAGE](../../../research/sick-care-pool-sources.md#food_storage) |
| [SC20 — Turn 'let me know' into one easy-to-ask favor](#sc20) | Turns an existing offer of help into a specific, workable favor with timing and cost expectations agreed. | [FOUNDER](../../../research/sick-care-pool-sources.md#founder), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness) |
| [SC21 — Find something a faraway person could help with](#sc21) | Makes an existing distant support relationship practically useful through a real, bounded handoff. | [FOUNDER](../../../research/sick-care-pool-sources.md#founder) |
| [SC23 — Make one work handoff usable without you](#sc23) **(parked)** | Tests whether agreed authorized cover can actually handle a time-sensitive duty without the user. | [FOUNDER](../../../research/sick-care-pool-sources.md#founder) |
| [SC27 — Try the pet-care handoff together](#sc27) | Checks a chosen carer's practical fit through an introduction and routine walkthrough rather than relying on a listing. | [PSI_STANDARDS](../../../research/sick-care-pool-sources.md#psi_standards), [RED_CROSS_PETS](../../../research/sick-care-pool-sources.md#red_cross_pets) |
| [SC28 — Ask your vet what a pet carer would need](#sc28) | Closes a permission and contact gap that a chosen carer and a vet phone number alone do not resolve. | [AVMA_PETS](../../../research/sick-care-pool-sources.md#avma_pets) |

### Extra ease

| Task | Why this default | Evidence |
| --- | --- | --- |
| [SC13 — Make your resting spot work for you](#sc13) | Reduces repeated trips and awkward reach once the essential options are in place. | [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_SICKBOX](../../../research/sick-care-pool-sources.md#reddit_sickbox) |
| [SC14 — Take one last-minute shop off your future plate](#sc14) | Removes a known last-minute shopping inconvenience without inventing a stockpile or universal shopping list. | [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness) |
| [SC16 — Let laundry leave the house without you](#sc16) | Removes laundry transport or lifting effort when a suitable paid service is wanted. | [TASK_LAUNDRY](../../../research/sick-care-pool-sources.md#task_laundry) |
| [SC17 — Price the cleaning help you'd actually want](#sc17) | Reduces household workload through a suitably scoped service rather than assuming a full cleaning package. | [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning) |

## Browse the pool

Times are active effort. Replies, shopping, travel and appointments can take longer. Do not mark a task complete just because an inquiry has been sent when its finish requires an answer.

| Task | Time | Useful gain |
| --- | --- | --- |
| [SC01 — Find a care option you can actually start with](#sc01) | 20 min | Discover an entry point without presuming an existing doctor; learn whether it is usable before relying on it. |
| [SC02 — Know where an in-person visit could start](#sc02) | 20 min | Find out whether a clinic can actually accept her, rather than treating a map result as access. |
| [SC03 — Try the doorway to your first video visit](#sc03) | 15 min | Discover first-use technology or accessibility barriers while there is time to resolve them. |
| [SC04 — Find a way to an appointment without driving](#sc04) | 20 min | Discover possible transport assistance and its advance-booking and return-trip conditions. |
| [SC05 — Check what 'someone to take you home' really means](#sc05) | 20 min | Learn an easily missed requirement before an appointment is disrupted; access the clinic's coordination help. |
| [SC06 — Ask what your planned visit will actually cost](#sc06) | 15 min | Learn a concrete way to clarify planned care costs, beyond saving a provider's advertised starting price. |
| [SC07 — Find out whether a pharmacy can reach your door](#sc07) | 15 min | Discover local prescription delivery without assuming a regular pharmacy, and distinguish it from slower refill shipping. |
| [SC08 — Find out what could hold up your next refill](#sc08) | 15 min | Uncover administrative lead times before a supply gap; delivery setup alone does not solve renewal delays. |
| [SC09 — Check whether someone else can collect for you](#sc09) | 15 min | Resolve a practical permission and logistics question rather than assuming another person can simply show up. |
| [SC10 — See whether groceries can reach your actual door](#sc10) | 15 min | Expose minimum-order charges, building handoffs and substitutions before relying on delivery. |
| [SC11 — Find food help without a delivery budget](#sc11) | 20 min | Discover temporary community food support and check whether she could actually receive it. |
| [SC12 — Give one easy meal a real-life try](#sc12) | 20 min | A practical rehearsal exposes hidden effort; this is not another list of foods she already eats. |
| [SC13 — Make your resting spot work for you](#sc13) | 10 min | Test usability rather than collecting more objects or purchasing an emergency basket. |
| [SC14 — Take one last-minute shop off your future plate](#sc14) | 10 min | Close an actual recurring shortage rather than prescribe a stockpile. Lower priority for users seeking unfamiliar options. |
| [SC15 — Check how your go-to meal keeps](#sc15) | 10 min | A reusable food-storage reference and a specific skill; not another meal-preparation card. |
| [SC16 — Let laundry leave the house without you](#sc16) | 15 min | Discover a service that removes transport and lifting, including the handoff and minimum-charge details. |
| [SC17 — Price the cleaning help you'd actually want](#sc17) | 20 min | Discover whether a limited job is available and worthwhile, rather than assuming a full cleaning package is necessary. |
| [SC18 — Find help for an errand you can't postpone](#sc18) | 20 min | Convert an overlooked errand into a checked service option without assuming nearby friends. |
| [SC19 — Make a check-in something you both want](#sc19) | 10 min | An actual mutual arrangement that respects both people's preferences, not a contact list or assumed availability. |
| [SC20 — Turn 'let me know' into one easy-to-ask favor](#sc20) | 15 min | Resolve what an existing offer actually means; not a generic request-writing exercise for someone without support. |
| [SC21 — Find something a faraway person could help with](#sc21) | 15 min | Make distant support practical through a real, bounded handoff; preserve the user's decisions and privacy. |
| [SC22 — Find the simplest way to take a sick day](#sc22) | 15 min | Discover the actual notice and documentation requirements; the message is a useful byproduct, not the whole task. |
| [SC23 — Make one work handoff usable without you](#sc23) | 25 min | Test someone else's ability to act, rather than writing a vague absence note or duplicating known work information. |
| [SC24 — Find the pause button for your own business](#sc24) | 20 min | Discover that pausing incoming work may leave existing orders and fees active; prepare for the actual limits. |
| [SC25 — Look for practical care help in your work benefits](#sc25) | 15 min | Discover a potentially overlooked subsidized service and check the specific restrictions before assuming coverage. |
| [SC26 — Find care that fits your kind of pet](#sc26) | 20 min | Learn service fit and first-use requirements before a pet-care need arises. |
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

**Editorial mapping:** care · discover · care_entry_route

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

**Editorial mapping:** care · discover · in_person_care_entry

**Proposed priority:** Core preparation. Establishes in-person access when that specific route is missing; a map listing alone does not establish access.

**Context can change the order:** Use when she asks for in-person access or identifies that gap. Do not pair with SC01 merely to fill the batch.

**Research:** [HRSA](../../../research/sick-care-pool-sources.md#hrsa), [HC_NETWORK](../../../research/sick-care-pool-sources.md#hc_network).

**Possible user links:** [HRSA](../../../research/sick-care-pool-sources.md#hrsa)

**Variant note:** For insured users, replace the finder with their own plan directory. No AI judgment about which symptoms belong at which facility.

<a id="sc03"></a>

### SC03. Try the doorway to your first video visit · 15 min

Finding care is one piece; being able to connect is another. A short practice now can uncover the awkward bits.

1. Open your chosen provider's joining instructions. Find its practice or device-check option without starting a paid consultation.
2. Try the camera and sound from a private spot. If video, captions or another feature doesn't work for you, contact support.
3. Ask how to reconnect or whether an appropriate phone alternative exists. Keep the provider's technical-help route with your visit link.

**Done when:** You have tested the connection and know whom to contact if it fails; any needed accessibility arrangement is confirmed.

**Offer when:** A chosen virtual provider exists and the person has not successfully used its setup, or reports an access barrier.

**Skip when:** She already uses this setup successfully. No new app installation or paid visit just for a test.

**Useful gain:** Discover first-use technology or accessibility barriers while there is time to resolve them.

**Cost and timing:** No purchase; use an existing device. Support reply if a test or accommodation is needed.

**Editorial mapping:** care · make_workable · virtual_visit_connection_tested

**Proposed priority:** Make it reliable. Checks whether a chosen care option can actually be joined and exposes technical or accessibility barriers.

**Context can change the order:** Move first when the connection is the stated obstacle to using an otherwise suitable care route; skip an already-working setup.

**Research:** [HHS_PREP](../../../research/sick-care-pool-sources.md#hhs_prep), [HHS_TECH](../../../research/sick-care-pool-sources.md#hhs_tech).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

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

**Editorial mapping:** care, support · discover · nonurgent_appointment_transport

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

**Editorial mapping:** care, support · make_workable · procedure_escort_requirements_resolved

**Proposed priority:** Core preparation. Resolves a potentially blocking escort arrangement before an explicitly planned procedure.

**Context can change the order:** Only eligible when a planned procedure and possible escort gap are explicit. Never make this a routine sick-day starting task.

**Research:** [MEDLINE_SURGERY](../../../research/sick-care-pool-sources.md#medline_surgery).

**Possible user links:** [MEDLINE_SURGERY](../../../research/sick-care-pool-sources.md#medline_surgery)

<a id="sc06"></a>

### SC06. Ask what your planned visit will actually cost · 15 min

A headline consultation price may not cover everything. For a planned self-pay visit, you can ask for a written estimate.

1. For US care you won't pay for through insurance, ask the provider about a written 'good faith estimate' before the planned visit.
2. Ask whether it includes facility charges or likely separate services. If another provider bills separately, ask that provider for its estimate too.
3. Read the answers before deciding about the visit. Keep the estimate privately and ask about any charge you still don't understand.

**Done when:** You have the estimate and understand what it includes; a request without an answer remains pending.

**Offer when:** A specific nonemergency US visit is being planned and the person will not use insurance to pay.

**Skip when:** She is only exploring care generally, using insurance, or seeking emergency care. Do not suggest delaying needed care for an estimate.

**Useful gain:** Learn a concrete way to clarify planned care costs, beyond saving a provider's advertised starting price.

**Cost and timing:** No purchase or booking required to ask. Written estimate from each relevant provider.

**Editorial mapping:** care · make_workable · planned_visit_written_estimate

**Proposed priority:** Make it reliable. Clarifies the actual cost of a chosen self-pay visit rather than relying on a starting price.

**Context can change the order:** Move first when an unknown charge is preventing a decision about a specific planned visit. Not for general browsing or delaying needed care.

**Research:** [CMS_ESTIMATE](../../../research/sick-care-pool-sources.md#cms_estimate).

**Possible user links:** [CMS_ESTIMATE](../../../research/sick-care-pool-sources.md#cms_estimate)

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

**Editorial mapping:** essentials, care · discover · local_prescription_delivery

**Proposed priority:** Core preparation. Establishes a missing way to receive a prescription without going out, including real pharmacy restrictions.

**Context can change the order:** Only when prescription access is relevant and unresolved. Existing reliable delivery makes this redundant; this never selects medication.

**Research:** [CVS_DELIVERY](../../../research/sick-care-pool-sources.md#cvs_delivery), [HC_PHARMACY](../../../research/sick-care-pool-sources.md#hc_pharmacy).

**Possible user links:** [CVS_DELIVERY](../../../research/sick-care-pool-sources.md#cvs_delivery)

<a id="sc08"></a>

### SC08. Find out what could hold up your next refill · 15 min

If you already use a regular prescription, a refill request may need more than a tap in an app. Ask before you're close to running out.

1. Ask your pharmacist how your usual refill process works and whether a prescriber renewal or other approval is needed next time.
2. Ask when they recommend starting the request and whom to contact if it stalls, including before a holiday closure.
3. Set a private reminder using that advice. Keep your prescribed routine unchanged; let the pharmacist or prescriber handle medication decisions.

**Done when:** You know the next refill's process and lead time, with a reminder based on professional guidance.

**Offer when:** She explicitly reports an ongoing prescription and uncertainty or previous delays in getting refills.

**Skip when:** No ongoing prescription is known, or the refill process is already reliable. An immediate missed-dose question requires professional advice.

**Useful gain:** Uncover administrative lead times before a supply gap; delivery setup alone does not solve renewal delays.

**Cost and timing:** No purchase or extra medicine requested. Pharmacist or prescriber reply. Do not store medication details in My Safety.

**Editorial mapping:** essentials · strengthen · routine_refill_process_known

**Proposed priority:** Make it reliable. Addresses administrative delays that a delivery service alone cannot resolve for an existing prescription.

**Context can change the order:** Move first for an explicitly reported recurring refill obstacle. Require a known ongoing prescription; do not infer one.

**Research:** [CDC_RX](../../../research/sick-care-pool-sources.md#cdc_rx).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc09"></a>

### SC09. Check whether someone else can collect for you · 15 min

If delivery won't work, a willing person may be able to collect a prescription. Check the pharmacy's process before either of you makes a trip.

1. Ask your pharmacy what it requires when someone else collects on your behalf, including identification, payment and any prescription-specific restrictions.
2. Ask a person you already trust whether this is help they could offer. Explain the process without sharing account passwords.
3. Agree how you would request a pickup and share only the details the pharmacy needs, privately, when a real collection is arranged.

**Done when:** The pharmacy has explained its process and a willing person understands how a future collection would work.

**Offer when:** A trusted willing local contact exists and pharmacy collection is an identified gap, especially when delivery is unsuitable.

**Skip when:** No suitable contact, acquisition already works, or she wants to send an unverified stranger for medication.

**Useful gain:** Resolve a practical permission and logistics question rather than assuming another person can simply show up.

**Cost and timing:** Planning free; prescription charges remain separate. Both pharmacy answer and helper agreement.

**Editorial mapping:** essentials, support · make_workable · pharmacy_collection_by_helper

**Proposed priority:** Make it reliable. Makes an existing willing helper a usable collection option by checking pharmacy permission and handoff requirements.

**Context can change the order:** Treat as core when this is her only feasible acquisition route. Do not also suggest delivery for the same already-resolved outcome.

**Research:** [HHS_PICKUP](../../../research/sick-care-pool-sources.md#hhs_pickup).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

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

**Editorial mapping:** essentials · discover · grocery_delivery_workable

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

**Editorial mapping:** essentials, support · discover · food_assistance_access_route

**Proposed priority:** Core preparation. Explores a food-access route when affordability or access makes commercial delivery unsuitable.

**Context can change the order:** Give priority when the food-access constraint is explicit. Do not infer hardship or promise local eligibility or delivery.

**Research:** [FEEDING_AMERICA](../../../research/sick-care-pool-sources.md#feeding_america).

**Possible user links:** [FEEDING_AMERICA](../../../research/sick-care-pool-sources.md#feeding_america)

<a id="sc12"></a>

### SC12. Give one easy meal a real-life try · 20 min

'Easy' can still mean thawing, chopping or finding a missing ingredient. Try a meal while you have the energy to spot those catches.

1. Choose a familiar meal you'd want with little effort. Include a no-cook option if cooking is the part you want to avoid.
2. Make it during a normal mealtime. Notice packaging, tools, extra ingredients and cleanup; swap the part that makes it harder than expected.
3. Keep the ingredients available within their storage instructions and your budget. Put anything missing on your next usual shop, rather than buying a special kit.

**Done when:** You have tried the meal and its ingredients are available. A shopping note alone means it is not ready yet.

**Offer when:** She lacks a tested low-effort meal, or her current options have a specific preparation barrier.

**Skip when:** Suitable meals are already prepared. Avoid turning this into generic nutrition or treatment advice.

**Useful gain:** A practical rehearsal exposes hidden effort; this is not another list of foods she already eats.

**Cost and timing:** Use a normal meal and existing food; replacing missing ingredients may cost money. Cooking/storage time is additional to active effort.

**Editorial mapping:** essentials, home · make_workable · easy_meals_ready

**Proposed priority:** Make it reliable. Tests whether a chosen meal is genuinely manageable instead of creating another list of familiar foods.

**Context can change the order:** Treat as core when she has food but no meal she can realistically prepare within her stated limits; skip already-workable meals.

**Research:** [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_SICKBOX](../../../research/sick-care-pool-sources.md#reddit_sickbox).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

**Variant note:** A freezer meal is an alternative within this outcome, not a second task called 'prepare soup'. No dietary prescriptions.

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

**Editorial mapping:** home · make_workable · resting_spot_usable

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

**Editorial mapping:** essentials, home · make_workable · personal_essentials_gap_closed

**Proposed priority:** Extra ease. Removes a known last-minute shopping inconvenience without inventing a stockpile or universal shopping list.

**Context can change the order:** Treat as core when the specific missing item is necessary for her stated daily needs and replacing it is feasible. Respect no-purchase constraints.

**Research:** [CDC_NEEDS](../../../research/sick-care-pool-sources.md#cdc_needs), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc15"></a>

### SC15. Check how your go-to meal keeps · 10 min

This is useful if food you set aside has spoiled or left you guessing. Learn the storage guidance for one meal you actually use.

1. Choose the food that leaves you unsure about storage. Read its packaging and look up the matching food in USDA's FoodKeeper.
2. Check guidance for your situation: unopened, opened or cooked. Follow the product's instructions and official guidance; don't judge safety by smell alone.
3. Use that guidance for the next portion you prepare or open. If you freeze it, label what it is and when it was prepared.

**Done when:** You understand the relevant storage instructions and have applied them to your next portion.

**Offer when:** She reports uncertainty or waste around an existing prepared food. The exact food and storage circumstances must be known to her.

**Skip when:** Storage already works or she wants a general sick-day starting task. Don't assess whether a particular questionable food is safe through AI.

**Useful gain:** A reusable food-storage reference and a specific skill; not another meal-preparation card.

**Cost and timing:** No purchase. Apply at the next normal meal; elapsed time may span days.

**Editorial mapping:** essentials, home · strengthen · chosen_food_storage_understood

**Proposed priority:** Make it reliable. Resolves an actual storage knowledge gap that could undermine an otherwise usable meal plan.

**Context can change the order:** Move first for a stated storage or waste problem with a known food. Do not offer generic food-safety homework or AI clearance of questionable food.

**Research:** [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper), [FOOD_STORAGE](../../../research/sick-care-pool-sources.md#food_storage).

**Possible user links:** [FOODKEEPER](../../../research/sick-care-pool-sources.md#foodkeeper)

<a id="sc16"></a>

### SC16. Let laundry leave the house without you · 15 min

If carrying laundry is the hard part, wash-and-fold pickup may be more useful than another household checklist.

1. Check a local laundromat's pickup service or Taskrabbit laundry help for your area. Look for the work you need, not a recurring plan.
2. Ask about minimum charges, pickup location and return time. Check any detergent needs and which items the service will not accept.
3. Confirm whether you must be present or supply anything. Keep one workable option; no booking or payment needed now.

**Done when:** You know one service's handoff, return time, total charging method and relevant restrictions.

**Offer when:** Laundry access is an expressed burden and future paid help is within her stated preferences.

**Skip when:** Laundry is already covered or paid services are ruled out. Do not treat contaminated laundry as an ordinary service order.

**Useful gain:** Discover a service that removes transport and lifting, including the handoff and minimum-charge details.

**Cost and timing:** Research free; future service paid. Compare minimum total, not hourly rate alone. Provider response.

**Editorial mapping:** home, support · discover · laundry_help_route

**Proposed priority:** Extra ease. Removes laundry transport or lifting effort when a suitable paid service is wanted.

**Context can change the order:** Treat as core if she explicitly cannot access laundry or manage the load and needs essential clean items. Respect cost and service limits.

**Research:** [TASK_LAUNDRY](../../../research/sick-care-pool-sources.md#task_laundry).

**Possible user links:** [TASK_LAUNDRY](../../../research/sick-care-pool-sources.md#task_laundry)

<a id="sc17"></a>

### SC17. Price the cleaning help you'd actually want · 20 min

You may want the dishes and bathroom handled, not a whole-house deep clean. Find out whether a small, specific visit is possible.

1. Choose one or two chores you would want help with. Compare a local cleaner's service page with one Taskrabbit listing if available.
2. Ask about the minimum booking, supplies and full charge for that scope. Check cancellation and household-illness policies before planning a visit.
3. Decide whether the service and cost fit. Keep a suitable candidate and the agreed scope; don't book or share access details yet.

**Done when:** A candidate has answered your scope and price questions, so you can decide whether the service fits.

**Offer when:** Specific household work is the concern and researching paid help is welcome.

**Skip when:** No practical cleaning gap, paid help is excluded, or the need is medical/personal care rather than ordinary cleaning.

**Useful gain:** Discover whether a limited job is available and worthwhile, rather than assuming a full cleaning package is necessary.

**Cost and timing:** Research free; future paid minimum may make a small job unsuitable. Cleaner reply. Follow the provider's illness policy.

**Editorial mapping:** home, support · discover · limited_cleaning_help_route

**Proposed priority:** Extra ease. Reduces household workload through a suitably scoped service rather than assuming a full cleaning package.

**Context can change the order:** Move first when a specific essential household job is beyond her stated capacity. Keep ordinary cleaning separate from personal or clinical care.

**Research:** [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning).

**Possible user links:** [TASK_CLEANING](../../../research/sick-care-pool-sources.md#task_cleaning)

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

**Editorial mapping:** support, home · discover · practical_errand_help_route

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

**Editorial mapping:** support · make_workable · agreed_social_checkin

**Proposed priority:** Core preparation. Establishes wanted social support through an actual mutual arrangement rather than an assumed available contact.

**Context can change the order:** Only when she wants connection and has a suitable person she is comfortable asking. Skip for someone who prefers quiet; this is not monitoring.

**Research:** [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness), [FOUNDER](../../../research/sick-care-pool-sources.md#founder).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc20"></a>

### SC20. Turn 'let me know' into one easy-to-ask favor · 15 min

This is for someone who has already offered help. Make one practical arrangement so neither of you has to guess later.

1. Choose a concrete favor within their offer, such as adding your groceries to an errand they're already doing.
2. Ask when it might work, how much notice they need and how payment or reimbursement would be handled. Leave room for a no.
3. Agree how you would request that favor and arrange a handoff. Keep it flexible; a past offer doesn't guarantee help on every date.

**Done when:** You have a mutually agreed way to request one practical favor, including timing and any costs.

**Offer when:** A suitable trusted person has offered practical help and the user wants to clarify it.

**Skip when:** No available trusted helper, she dislikes asking this person, or the same errand has already been arranged.

**Useful gain:** Resolve what an existing offer actually means; not a generic request-writing exercise for someone without support.

**Cost and timing:** Favor may be free; purchases and reimbursement must be agreed. Mutual agreement.

**Editorial mapping:** support, essentials · make_workable · agreed_practical_favor

**Proposed priority:** Make it reliable. Turns an existing offer of help into a specific, workable favor with timing and cost expectations agreed.

**Context can change the order:** Treat as core when the favor is the missing essential help route. Require a real willing contact and a useful unresolved favor.

**Research:** [FOUNDER](../../../research/sick-care-pool-sources.md#founder), [REDDIT_ILLNESS](../../../research/sick-care-pool-sources.md#reddit_illness).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc21"></a>

### SC21. Find something a faraway person could help with · 15 min

Distance rules out dropping by, but it doesn't rule out practical help. Pick something useful that doesn't require access to your accounts.

1. Choose a trusted person who wants to help and one remote job, such as researching a laundry service or comparing appointment transport options.
2. Agree what they would check and when they'd send the result. Keep final booking, spending and provider decisions with you unless explicitly agreed.
3. Try the handoff while you're well using a real small question. Share only what they need; keep passwords and medical details private.

**Done when:** You have tried one remote handoff and know what this person is comfortable helping with in future.

**Offer when:** She has a willing trusted distant contact and wants practical help, rather than only a social check-in.

**Skip when:** No willing contact, delegation isn't wanted, or the useful work is already done. Do not create artificial research just to practice.

**Useful gain:** Make distant support practical through a real, bounded handoff; preserve the user's decisions and privacy.

**Cost and timing:** No purchase for the handoff. The other person's availability and result.

**Editorial mapping:** support · make_workable · remote_practical_help_agreement

**Proposed priority:** Make it reliable. Makes an existing distant support relationship practically useful through a real, bounded handoff.

**Context can change the order:** Move first when remote help can remove a current burden and a willing contact exists. Do not create artificial research just to practice delegation.

**Research:** [FOUNDER](../../../research/sick-care-pool-sources.md#founder).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

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

**Editorial mapping:** responsibilities · discover · absence_reporting_process_known

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

**Editorial mapping:** responsibilities · strengthen · one_work_handoff_tested

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

**Editorial mapping:** responsibilities · discover · solo_business_pause_plan

**Proposed priority:** Core preparation — parked from default suggestions. Establishes a way to pause incoming business work while identifying commitments that a platform will not pause.

**Context can change the order:** Parked outside default suggestions. Consider only for an explicit supported solo-business request with a known platform and missing pause process.

**Research:** [ETSY_PAUSE](../../../research/sick-care-pool-sources.md#etsy_pause).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

**Variant note:** Attach ETSY_PAUSE only for an Etsy seller; another platform needs its own reviewed official instructions, not guessed controls.

<a id="sc25"></a>

### SC25. Look for practical care help in your work benefits · 15 min

Some employers offer care support beyond health insurance. It is worth checking the actual benefit before paying for help yourself.

1. Search your benefits portal for care support, dependent care or pet care. If nothing is clear, ask benefits support whether such assistance exists.
2. Describe the practical situation you want to prepare for. Ask whether it qualifies, what you pay and whether advance registration is needed.
3. Keep the official claim or booking instructions if eligible. If the benefit doesn't cover your situation, mark that route as unsuitable.

**Done when:** You know whether your employer's benefit fits your situation, and how to use it if eligible.

**Offer when:** She has employer benefits and an unresolved practical-care responsibility. Do not infer benefits from employment alone.

**Skip when:** No employer benefit, already checked, or no relevant care need. Many programs support working employees during care disruptions; personal sick leave may not qualify.

**Useful gain:** Discover a potentially overlooked subsidized service and check the specific restrictions before assuming coverage.

**Cost and timing:** Research free; employer-specific copays, limits and registration may apply. Benefits administrator reply. No promise that a branded provider is included.

**Editorial mapping:** responsibilities, pets, support · discover · employer_practical_care_benefit_known

**Proposed priority:** Core preparation. May uncover an overlooked eligible source of practical-care help before the user researches full-price alternatives.

**Context can change the order:** Only when employer benefits are explicitly known and a practical or pet-care gap exists. Employment alone proves no benefit; this does not restore the work checkbox.

**Research:** [CARE_BENEFITS](../../../research/sick-care-pool-sources.md#care_benefits).

**Possible user links:** None required; use her chosen provider or existing tools where specified.

<a id="sc26"></a>

### SC26. Find care that fits your kind of pet · 20 min

A nearby listing is a starting point. Find out whether the person can handle your pet's routine and how future visits would be arranged.

1. Use PSI's sitter finder to locate one business serving your area and pet type. Check its experience and service details.
2. Ask about notice, total visit cost and any introductory meeting. Mention the routine you need help with, without sending home-access details.
3. Read the reply and decide whether to arrange an introduction. A good candidate is worth keeping; it isn't a confirmed future booking.

**Done when:** One candidate has answered your practical questions and you can decide whether to meet them.

**Offer when:** She has a pet, lacks suitable care and is open to researching paid help. Resource coverage must match her country/area.

**Skip when:** No pet is known, a suitable carer already exists, or paid care is not feasible.

**Useful gain:** Learn service fit and first-use requirements before a pet-care need arises.

**Cost and timing:** Research free; introductions and visits may carry charges. Ask first. Candidate reply. Directory membership is not an endorsement.

**Editorial mapping:** pets, support · discover · pet_care_candidate_checked

**Proposed priority:** Core preparation. Establishes a promising pet-care option and its first-use requirements before help is needed.

**Context can change the order:** Only for a known pet-care gap and feasible paid-care research. Choose resources matching species and location; skip an existing suitable arrangement.

**Research:** [PSI_FIND](../../../research/sick-care-pool-sources.md#psi_find).

**Possible user links:** [PSI_FIND](../../../research/sick-care-pool-sources.md#psi_find)

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

**Editorial mapping:** pets · make_workable · pet_carer_handoff_tested

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

**Editorial mapping:** pets · strengthen · vet_permission_for_pet_carer

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

**Editorial mapping:** pets, support · discover · temporary_pet_care_program_route

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

**Editorial mapping:** care, home, support · make_workable · planned_recovery_help_coordinated

**Proposed priority:** Core preparation. Establishes needed help at home with the actual care team before a planned stay or procedure assumes an available helper.

**Context can change the order:** Only when planned treatment and uncertain support are explicit. Keep unresolved care requirements with the team; do not substitute a household service.

**Research:** [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge).

**Possible user links:** [MEDLINE_DISCHARGE](../../../research/sick-care-pool-sources.md#medline_discharge)

## What this check does and does not establish

The accompanying structural check confirms thirty unique IDs/outcome keys, one valid proposed priority with rationale and context per task, valid exclusion/concern/source references, three steps per task, copy limits and resource counts. It does not establish semantic uniqueness, appropriate ranking, clinical approval, task effectiveness, link availability in a particular region or live app compatibility. The fit rules still require implementation and the copy needs founder review.
