# Discovery follow-up — three real AI answers

12 October 2026. Three independent paid GPT-6 Luna Playground Responses calls, low reasoning. Each received the revised English writing core, the same one-task schema/adapter and a manually selected resource packet. No authored task examples were supplied. Exactly one call per scenario; no retries or selected best-of runs.

All three returned a task. These are original model answers, followed by separately labeled editorial review. The visible prompt and each input matched the frozen source checksums. Store logs and tools were off. The app output cap and timeout were not configured in this Playground test; UI latency/token badges are observations, not billing totals. Exact cost was not retrieved.

## A. Insured through work, no regular doctor

**Synthetic request:** I live alone in the US and have health insurance through work, but I don't have a regular doctor. I don't know where I would start if I wanted a virtual visit on a future sick day. I'd like to prepare while I'm well. I have 15 minutes to look into this, but I'm not booking a visit today.

**Observed response:** 2.9s 239t

**Find your plan’s virtual-care route · 15 min**

Your work health plan may offer virtual visits, but access and costs vary. Find the route and the questions to answer before relying on it.

1. Open your benefits portal or plan materials and search for “virtual care” or “telehealth”; note the service name, if listed.
2. Check whether it accepts first-time patients in your area and what a visit would cost; use the plan’s contact route if unclear.
3. If no service is named, use the HHS telehealth guide to find another starting point, such as a health center, and check access and costs.

**Done when:** You have a named route and know what to verify, or a specific question ready for your plan.

[HHS — finding telehealth](https://telehealth.hhs.gov/patients/how-do-i-schedule-telehealth-appointment) — Find a starting route if your work plan does not name a virtual-care service.

**Technical replay:** request preflight allows the request. Separately, candidate-resource output validation passed; unchanged-app output validation rejected (invalid_resource). Steps contain 20, 22, 25 whitespace-separated words. All resource IDs supplied: true.

**Editorial review — not model output:** The answer starts with the person's actual insurance benefit rather than assuming a doctor or recommending a random provider. It checks first-patient access and personal cost, and does not assume Teladoc is included. The third step switches routes only if the plan names no service; it could instead first ask member support, or help a person who did find a service understand first-use setup. 'Know what to verify' is weaker than having an answer or sending a specific inquiry. The title and summary still sound administrative. Keep the useful route, improve the finish and voice.

## B. Uninsured, limited budget, no established clinic

**Synthetic request:** I live alone in the US, don't have health insurance or a regular clinic, and money is tight. Before a future sick day, I want to find out whether there is an affordable way to talk to a clinician online. I'm well now and have 15 minutes to research; I'm not booking or paying for care today.

**Observed response:** 2.7s 279t

**Compare two ways to reach a clinician online · 15 min**

You can explore a community health center and a self-pay virtual-care service without booking or paying today. Check what each would actually cost and whether a first visit can be online.

1. Use HRSA’s Find a Health Center to find one nearby center; note its contact details and ask about new patients, fees or reduced-fee eligibility, and virtual first visits.
2. Check One Medical On-Demand Care’s current price, state eligibility, scope, and any extra charges; it does not accept insurance.
3. Compare the answers you find, including whether either option fits your budget and can be used online; leave booking or payment for another day.

**Done when:** You have one or two options to consider, with costs and virtual availability confirmed or clearly marked unanswered.

[HRSA — Find a Health Center](https://findahealthcenter.hrsa.gov/) — Find a community health center to ask about fees and virtual first visits.

[One Medical — On-Demand Care](https://health.amazon.com/onemedical) — Check a paid one-time virtual-care option’s current price, eligibility, and scope.

**Technical replay:** request preflight allows the request. Separately, candidate-resource output validation rejected (copy_too_long); unchanged-app output validation rejected (invalid_resource). Steps contain 28, 19, 24 whitespace-separated words. All resource IDs supplied: true.

**Editorial review — not model output:** It recognizes the lack of insurance and supplies two different research routes, without promising either is free or available. Community care comes first, which fits the stated budget concern. However, step one is overloaded and longer than the format limit; comparing both routes may be too much for the stated 15-minute effort. Prefer one starting route with a conditional alternative, and prioritize fees/reduced-fee access and virtual first-visit availability. 'Self-pay' accurately describes the provider's payment route, but the current blanket keyword rule also treats it as prohibited spending; do not confuse this implementation conflict with a purchase instruction.

## C. Care and delivery sorted; new need is cat care

**Synthetic request:** I live alone in the US. I already have a doctor I can contact and have sorted prescription delivery. My cat's feeding instructions are also written down. What I haven't sorted is someone to visit my cat if I get sick; I have no one nearby who can do it. I'm well now, have 15 minutes, and can consider paid help. How can I prepare?

**Observed response:** 2.2s 222t

**Find a cat sitter worth contacting · 15 min**

Since you don’t have nearby help, compare one local paid drop-in sitter and ask what future sick-day visits could involve.

1. Use the PSI sitter finder or Rover to find one local candidate offering cat visits.
2. Check whether they serve your area and ask about fees, visit notice, experience, and meeting your cat beforehand.
3. Ask what happens if they can’t make a scheduled visit; save their reply and note anything still unconfirmed.

**Done when:** One candidate and a specific question are saved, with any unconfirmed details clearly noted.

[Pet Sitters International — sitter finder](https://www.petsit.com/locate/) — Find a local pet-care business to contact about future drop-in visits.

[Rover — pet sitter research](https://www.rover.com/pet-sitting/) — Compare potential paid local cat sitters.

**Technical replay:** request preflight would stop before calling the model (safety_redirect). Separately, candidate-resource output validation passed; unchanged-app output validation rejected (invalid_resource). Steps contain 15, 18, 18 whitespace-separated words. All resource IDs supplied: true.

**Editorial review — not model output:** It follows the new cat-care request despite past care-contact and pet-note saves. It does not repeat the doctor, delivery or feeding-note work. The introductory meeting and what happens if the sitter cannot attend are useful overlooked details. 'Compare one' is awkward; use 'find one' or actually compare multiple candidates. The steps ask the person to contact someone and save a reply, but the completion condition needs only a saved question. Define whether this task finishes with an inquiry sent or with a reply received; do not imply an arrangement is confirmed. Fifteen minutes describes active effort, not waiting for a reply.

**Preflight finding:** the current clinical-keyword pattern matches "prescription" even though this request describes an already-arranged delivery and asks for advance cat care. Replacing only "prescription delivery" with "pharmacy delivery" makes preflight allow the input in an offline diagnostic. No model call was repeated and the original input remains unchanged. This semantic false positive needs a bounded fix and safety regression checks before integration.

## What we learned

Three tasks generated; each used supplied resource IDs and added an actionable discovery route. These three samples support continuing the sick-day writing work, not declaring stable quality or public readiness. The tests used the revised prompt plus manually curated resource packets; they do not isolate prompt effects, establish a new automatic retrieval system or prove that memory alone caused case C's behavior. Case C repeats its known preparations in the current request as well as supplying stored task context. We should refine the completion conditions, reduce research overload and improve natural voice before accepting tasks into the shared pool. Ada's new direction is a category-specific prompt/knowledge package, around thirty carefully crafted reusable tasks and a simple optional roadmap, starting with this one category. Do not mass-generate thirty unreviewed cards or silently add these outputs to the app.

The current word limit and blanket spending-keyword rules are separate from content quality. Preserve the failures; do not alter original answers to make the report pass. New care-resource IDs still need to be connected before the app can use them. The source catalog remains unchanged.

Case C includes synthetic completed care-contact and pet-note records. Prescription delivery is stated in the current request; this test does not claim a new durable prescription-memory field. No real account data, user tasks, quotas, runtime prompts or deployment were changed.

These are separate one-task calls, not one three-task batch. The rule of at most one linked task per delivered batch still applies. Sources were checked in the preceding editorial research; the model did not browse during generation.

Artifacts: [exact prompt](prompt.txt), [synthetic inputs](inputs.json), [original output text](outputs.json), [candidate source catalog](candidate-catalog.json), [offline replay](validation.json), [editorial notes](review-notes.json). `prepare.mjs` and `review.mjs` make no paid calls.

Format reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), checked October 12. Schema conformance does not establish usefulness or satisfy every application rule.
