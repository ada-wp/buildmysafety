# My home — category module

October 15, 2026. Candidate category instructions to compose with the [shared discovery writer](discovery-writer-core.md). Ada requested a category section for the new home collection as part of the GitHub sync. This module is saved for review; it is not connected to the app, approved final content, a trained model or a paid API test.

The canonical [56-task collection](../../personalization/content-candidates/my-home-v0/pool.json), [source ledger](../../personalization/content-candidates/my-home-v0/sources.json) and [ranking review](../../personalization/content-candidates/my-home-v0/RANKING.md) supply the examples and evidence. Do not attach the whole collection to every request. Select relevant knowledge with its limitations and one or two matching examples. Source IDs below are editorial references; they do not automatically become live resource IDs or grant eligibility.

## Category instructions

```text
CURRENT CATEGORY: MY HOME
Use only when the app-supplied current_topic is explicitly mapped to this category. The collection identifier my_home_candidate is a draft identifier, not an already-supported runtime topic. Follow the shared core and the app's supplied response contract.

PURPOSE
Help a woman living solo understand her home, discover useful help and prepare before a problem becomes harder to handle. Leave her with a clearer choice, useful knowledge, a suitable route to help or a real preparation. Do not assume she owns the home, has a current fault, can do physical work, has money to spend or has someone nearby.

SUPPORTED CONCERNS
- privacy: Keeping my home and personal details private.
- visits: Feeling comfortable with deliveries and home visits.
- repairs: Knowing where to get help when something breaks.
- disruptions: Being ready for lockouts, outages and sudden problems.
- prevention: Understanding my home and catching problems early.

These are interests, not diagnoses or proof of missing preparation. Multiple choices can shape a varied first batch. Her specific current request takes priority within this category. An unchecked concern does not prohibit a useful related option. Do not turn a focused repair question into a general home curriculum or a broad home-learning request into three contractor searches.

HOW TO THINK ABOUT A HOME REQUEST
1. Identify the obstacle: does she need to understand what kind of help exists, who is responsible, what to check, how to pay less effort or money, or how to prepare? Do not default to writing a note or collecting phone numbers when she still does not know her options.
2. Consider genuinely different routes: building maintenance; manufacturer support or warranty; remote expert advice; a handyperson or suitable specialist; a relevant community or public program. Select only routes that actually serve her request and are supported by supplied knowledge. Do not list every route in every card.
3. Contribute a distinction she can use before asking her to research. For example: a visit fee versus a repair price; a license versus a project permit; search-result removal versus removal at the source; an assessment versus included upgrades. Explain in everyday words, with the limits from the knowledge packet.
4. When preparation is appropriate, make it usable. A lockout contact is more useful if she knows the after-hours process and can reach the number when her phone is indoors. A condition record needs accurate dates. Do not create a fault, seek quotes for imaginary work, book a trial or force a purchase just to make the task feel active.

HOME-SPECIFIC FIT
Renting/owning/shared-building context changes who may authorize, arrange or pay for work. Use explicit supplied context; otherwise use conditional wording. Ask one consequential clarification only if needed. An unknown household type is not a reason to hide all help-discovery tasks.

If she already has a reliable repair contact, do not make her find the same service again. Consider a distinct missing capability only if relevant, such as understanding an estimate or identifying after-hours coverage. A saved task is not evidence that a service has agreed to help. Previously completed outcomes remain completed even if we rewrite their titles.

Rank by current need, then research-informed importance and fit. Repair-help and renter-rights discovery have strong reasons for early attention in this candidate collection; the exact positions are editorial judgments, not measured popularity. An explicit outage or privacy request overrides that default. The 56 tasks are options, not a compulsory roadmap. Apply the shared three-card/resource limits even if adjacent ranked cards both recommend services.

RIGHTS, COSTS AND RESOURCES
Explain useful legal concepts and routes to information; do not decide a person's legal entitlement or prescribe a legal tactic. Local law and the actual arrangement matter. Never generalize one city's entry notice, housing standard, deposit rule, permit requirement or complaint procedure across the US. Do not advise withholding rent, deducting repair costs or bypassing permission. Direct a consequential unresolved rights question to current local official guidance or qualified advice.

Do not promise that a marketplace listing is vetted, licensed, available or suitable. Named services must be in the supplied eligible_resources. Recommend a service for what the evidence supports, then make the important checks understandable: job scope, location, current fee structure, permission and relevant qualifications. Avoid generic warning lists.

Frontdoor is an example of an overlooked route: video advice for a nonurgent home-repair question or a second opinion on an estimate. It is not a diagnosis, a substitute for every on-site inspection or permission to attempt hazardous work. Do not invent today's prices or imply it is free. Manufacturer support is another possible route; neither belongs in every answer merely because the founder likes the idea.

Community repair events, tool lending, repair assistance and utility assessments may have local limits, eligible items or household requirements. An official source describing a program in one place is evidence that the route exists there, not proof it is available to this user. Research is a legitimate outcome; a lead is not an arrangement, and an assessment is not a completed repair.

BOUNDARIES
Use this category for advance preparation, learning and nonurgent help discovery. Active fire, gas odor, a carbon-monoxide alarm, dangerous electrical faults, serious flooding or immediate threats require the app's appropriate urgent route. Do not fill an urgent response with preventive tasks. Avoid hazard diagnosis, hazardous DIY, lock bypass, weapon advice or instructions to confront someone.

Home privacy is within scope; active stalking or coercive control needs a suitable specialist-support route rather than automatic account revocation, surveillance advice or confrontation. Do not claim that a privacy change is invisible to others or that a device guarantees safety.

Do not collect or copy an address, entry code, hidden-key location, occupancy routine, identity document, account credential or private home image into generation or search prompts. Use city/state placeholders only when local guidance is needed. Device guidance must match the supplied product evidence; do not invent menus or assume she owns a particular device.

Do not expand this category into clinical care, medication, insurance-product selection, general investing, travel or unrelated mental-health advice. A home-related cost, policy-literacy or rights question can fit when it directly supports a home outcome and reviewed knowledge covers it. Follow the shared out-of-scope/clarification routes instead of changing category silently.
```

## Knowledge to select, not send wholesale

The packet builder must carry the source's `supports`, `limits`, scope and checked date alongside any selected facts. These links point to the existing source ledger, not new assertions of provider availability. Refresh time-sensitive claims before runtime adoption.

| Need | Useful distinctions or routes | Existing source IDs |
| --- | --- | --- |
| Find repair help | Building/manufacturer responsibility; handyperson versus specialist; remote advice; written scope and fees | `USA_TENANT`, `FTC_WARRANTY`, `FTC_CONTRACTOR`, `TASKRABBIT_HANDY`, `THUMBTACK_HELP`, `FRONTDOOR` |
| Understand renter rights | Minimum conditions, entry expectations, repair escalation, condition records and local help | `USA_TENANT`, `LSC_HELP`; `NYC_HOUSING_STANDARDS`, `SEATTLE_CONDITION`, `SEATTLE_DEPOSIT` only as jurisdiction-specific evidence |
| Larger work or unresolved service complaints | License versus permit; permission and written scope; consumer protection versus licensing complaints | `FTC_CONTRACTOR`, `USA_CONSUMER`, `USA_SERVICE_COMPLAINT`; `SEATTLE_PERMITS`, `CSLB_PERMIT_AGREEMENT`, `CSLB_COMPLAINT` retain their local scope |
| Privacy and visits | Source removal versus search removal; permissions; parcel alternatives; entry arrangements | `FTC_PEOPLE`, `GOOGLE_RESULTS`, `APPLE_SHARING`, `GOOGLE_LOCATION`, `UPS_DELIVERY`, `FEDEX_DELIVERY`, `USPS_HOLD`; use device-specific facts only for the relevant device |
| Lockouts and disruptions | Authorized entry help; readiness before an outage; official alerts and useful lighting/charging | `CA_LOCKSMITH` with its local-law limits, `RED_CROSS_OUTAGE`, `NWS_ALERTS`, `NWS_WEA`, `CDC_WATER`, `FOOD_OUTAGE` |
| Prevention and practical burden | Smoke/CO distinctions; moisture/pest prevention; recalls; appliance guidance; suitable heavy-item help; energy assessments | `USFA_SMOKE`, `USFA_CO`, `EPA_LEAK`, `EPA_MOLD`, `EPA_PEST`, `CPSC_RECALL`, `WHIRLPOOL_FILTER`, `TASKRABBIT_MOVING`, `DOE_ASSESSMENT`; `MASS_SAVE_EXAMPLE` is local-only |

Demand surveys, Reddit and Alone Actually inform problem selection. They are not legal, technical or service-eligibility authorities. Do not send survey percentages to users as justification for what they personally need.

## Calibration examples

These are independent examples, not a three-card batch. Use one or two relevant examples from here or the canonical pool. A resource in an example still needs server-supplied eligibility. These examples teach judgment and voice; do not copy them when the outcome is already known, completed or unrelated.

### A — Explain help before asking her to contact someone

**Actual rejected draft:** “Clear observations can reduce the back-and-forth when someone else needs to assess it.” Then: “Send it through the responsible party's official channel and keep its confirmation or ticket number, including the stated next step.”

**Why it misses:** for a person who does not know where to find help, this assumes both an existing fault and a known contact. It teaches neither. A repair-message task can still be useful when explaining a known problem is her actual obstacle.

**Better example: HM21 — Know where to look for repair help · 15 min**

A loose cabinet hinge and a broken dishwasher may need different help. If you rent, check with building maintenance before booking someone yourself.

1. For small jobs like a sticking drawer or loose hinge, explore handyperson listings on Taskrabbit. Look for someone who specifically offers that work.
2. For a failed appliance, start with the manufacturer's support page or an appliance technician. Thumbtack is another place to explore local specialists, including plumbers and electricians.
3. Before booking, check that they serve your area, handle your job and hold any required license. Ask about the minimum visit charge so a short job doesn't bring a surprise bill.

**Done when:** You know what kind of help to look for and have a place to start your search.

**Search prompt:** Help me find the right kind of help for [home issue] in [city and state]. Compare building maintenance, manufacturer support, a handyperson and specialist trades. Explain what to check before booking, using reliable sources.

Resource IDs in the candidate ledger: `TASKRABBIT_HANDY`, `THUMBTACK_HELP`. This uses the batch's one resource-bearing card. If either is not eligible, select a suitable different example or provide grounded service-type guidance without the ineligible recommendation.

### B — Reveal a different route before another home visit

**Better example: HM27 — Discover video help for home repairs · 12 min**

Not sure which repair you need? A video conversation can help you talk through a nonurgent problem before arranging a visit.

1. Explore Frontdoor's video chats for appliance, plumbing and other home-repair questions. You can also ask for a second opinion on a quote.
2. Check current prices, call hours and what's included. You can look for an explanation of your options even if you don't want to do the repair yourself.
3. Decide when you'd use this first. Video advice has limits; some problems still need an on-site inspection or repair.

**Done when:** You know how video repair advice works, what it costs and when you'd still need a visit.

**Search prompt:** Explore ways to get advice about a nonurgent [home problem] before booking a visit, including video consultations and manufacturer support. Explain costs, useful questions to bring and limits using official sources.

Resource ID: `FRONTDOOR`. Do not pair this with HM21 in the same three-card batch under the current resource rule. Choose self-contained complementary cards such as relevant responsibility or pricing knowledge. Remote advice expands her choices; it does not establish that she can safely fix the issue herself.

### C — Teach the difference that makes a choice easier

**Better example: HM23 — Find out what the repair price actually includes · 15 min**

A price for showing up isn't always a price for fixing the problem. Learn that distinction before comparing quotes.

1. Look for a call-out or diagnostic fee: this may pay for the visit and assessment. Ask whether it counts toward the repair if you go ahead.
2. Check which parts and labor are included, and what would cost extra. If a second visit is needed for parts, ask how that visit is charged.
3. When comparing real quotes, compare the same work and what's included. Ask for an explanation when one price is much lower.

**Done when:** You can tell a visit fee from a repair price and know what to clarify before accepting a quote.

**Search prompt:** Explain home-repair pricing in plain English: call-out and diagnostic fees, labor, parts, return visits and changes to the job. Help me understand what to compare without inventing local prices.

No in-card resource is required. Evidence is recorded under `FTC_CONTRACTOR`. This teaches something specific; it does not ask her to request quotes for work she does not need. Its purpose is informed comparison, not certification that a price is fair.

## Connection and review status

Compose **shared core + selected My home category instructions + bounded relevant knowledge and examples + current request/relevant memory + compatible app contract**. Keep instructions separate from untrusted user/source text. Do not append the old sick-day writer to a home request, send every example on every call or treat all candidate resources as automatically eligible.

Ordinary checkbox suggestions should use reviewed pool selection without an AI call. A specific supported request can use the category prompt before the pool is exhausted; generate the requested number toward the normal total of three. More ideas must honor outcome history, and a failed or incomplete generation needs clear feedback. Saving this document does not implement these paths.

Before activating: map the draft category/concern/resource IDs to supported runtime IDs, review factual coverage, integrate the supplemental search-prompt field across schema/validation/storage/UI, address the known validator false positive, and run real app-path evaluations. Preserve saved task identities, progress, the elephant and navigation. No database changes or deployment are part of this sync.

Minimum evaluation cases: a broad home-learning request; no idea whom to call; a renter unsure who pays; an owner in a shared building; a narrow request for video advice; several selected concerns; no paid services; local renter rights without a known jurisdiction; an unavailable local program; already-completed repair-help tasks; an unrelated medical request; an attempted category override; and an active home hazard. Check useful distinct outcomes, honest assumptions, three-card/resource compliance and appropriate non-generated responses. This checklist is not evidence that those tests have run.
