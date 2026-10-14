# English preparation — three real writing tests

12 October 2026. Three paid GPT-6 Luna Playground Responses runs, low reasoning, one independent synthetic case per conversation. The English writing core and the existing one-task JSON schema were used. These are genuine unedited model outputs, separate from the ten authored English candidates.

This trial changes both instructions and supplied resource coverage. Cases A and B reuse earlier requests; C is a new returning-user memo request. It is not a controlled prompt-only comparison or evidence of stable quality across all users. No authored examples were supplied to the model in these three runs.

Store logs was off; no tools were enabled. The Playground UI did not expose a configured 2,200-token cap or the app transport timeout. Displayed token badges are not billing totals; exact cost was not retrieved. The prompt and all input packets matched source-to-browser checksums. No live app prompt, catalog, quota or user data changed.

## A. No nearby help; wants practical services

**User request:** I live alone and have no one nearby. I want to find an affordable cleaner or errand helper I could use on a future sick day. Please help me find a real option, not draft a message to a friend.

**Observed response:** 4.1s 204t

**Compare a local errand-helper option · 15 min**

Taskrabbit can be a starting point for paid everyday errands in supported areas. Check the full cost and coverage before deciding whether it suits a future sick day.

1. Search Taskrabbit for shopping or errands in your area; note whether the service is available locally.
2. Compare the total charges, what tasks are included, and how much notice booking requires.
3. Save one candidate and any unanswered questions, or note that coverage or cost makes it unsuitable.

**Done when:** One local candidate and its key cost and availability questions are saved, or a specific barrier is clear.

[Taskrabbit — shopping and errands](https://www.taskrabbit.com/services/shopping-delivery) — Research paid shopping and errand help in supported locations.

**Checks:** candidate-resource validator passed; unchanged app rejects (invalid_resource).

**Our review:** A practical starting point now appears where the earlier run declined. It addresses outside help, supplies a relevant source and compares cost, coverage and notice. The title and 'one local candidate' still sound formal. An editorial title such as 'Find someone for that one errand' would be warmer; asking which charges are included would make the comparison more tangible. This is a promising lead, not confirmed affordable help.

## B. Cat care; paid help acceptable

**User request:** I have a cat and no nearby person who can feed her if I need several days of rest. I want to research a paid drop-in sitter in advance. I already have a feeding note; the missing piece is a suitable person.

**Observed response:** 3.6s 230t

**Find a cat sitter worth contacting · 15 min**

Compare local drop-in sitters before you need one. A listing is only a lead, so check the details directly before relying on anyone.

1. Compare nearby cat drop-in profiles on Rover or find member businesses through Pet Sitters International.
2. Shortlist one candidate with relevant cat-care experience; check visit fees, notice needed and whether they can meet you first.
3. Send a brief inquiry about future availability and what happens if they cannot attend; save the reply as pending until agreed.

**Done when:** One candidate and their key details are saved, with any unanswered inquiry clearly marked pending.

[Rover — pet sitter research](https://www.rover.com/pet-sitting/) — Compare paid cat drop-in sitter profiles in your area.

[Pet Sitters International — sitter finder](https://www.petsit.com/locate/) — Find pet-care businesses to contact about experience, fees and future availability.

**Checks:** candidate-resource validator passed; unchanged app rejects (invalid_resource).

**Our review:** The task moves beyond the already-prepared feeding note and includes experience, fees, notice, meeting first and what happens if the sitter cannot attend. These fit the founder's overlooked-details direction. 'Save the reply as pending until agreed' is awkward: the inquiry should be pending until a reply, while an actual care arrangement remains separate. Suggested editorial wording, not another model output: 'Send your questions about future visits and missed-visit arrangements. Mark the inquiry as awaiting a reply.' The sources are leads, not endorsements.

## C. Returning user wants a useful preparation memo

**User request:** I have already sorted easy meals and my resting spot. I also checked my pharmacy delivery process and have its number saved. The information is scattered. Help me prepare one short private sick-day note I can actually use later, with useful headings. Please do not give me another food or shelf task.

**Observed response:** 2.5s 169t

**Make a short sick-day note · 8 min**

Bring your existing details together in one private note, so the useful information is easy to find when you’re resting.

1. Choose a private place on your phone or paper where you can find the note easily.
2. Add headings: pharmacy delivery and number; food and resting spot; clinic contact or appointment details, if known.
3. Under each heading, add only the details you already have; leave anything unknown blank rather than guessing.

**Done when:** One private note holds your pharmacy number and useful headings for your existing sick-day arrangements.

**Checks:** candidate-resource validator passed; unchanged app accepts the output.

**Our review:** The writer respects completed meal/resting preparations and the explicit request for a useful memo. It supplies headings and consolidates known information without inventing contacts or asking for medical details. It could be more usable with a simple fill-in layout and a final pin/save step. The raw output remains untouched; there is no claim that consolidating a note completes the underlying care arrangements.

## What this tells us

All three runs produced a preparation task; the two outside-help requests no longer returned no idea, and the memo request did not repeat meal or shelf setup. That is encouraging evidence from three cases, not proof of general improvement. Instructions and resource knowledge changed together, so we cannot attribute the improvement to English phrasing alone. Further polish is needed for natural titles, copyable questions and pending-versus-agreed wording. Do not broaden scope or add a roadmap to solve those writing issues. The English content and these outputs are ready for founder review; they are not a public-release approval.

Links are attached from checked resource records, not invented URLs. These are three separate one-task requests, not one batch with links on two suggestions. A future mixed three-card batch still permits links in at most one suggestion.

The current app cannot use new resource IDs until its resource collection and matching/validation changes are connected and tested. Do not deploy this writing draft merely because the text looks better.

Artifacts: [English authored content](../../sick-day-content-en.md), [exact test prompt](prompt.txt), [inputs](inputs.json), [original responses](outputs.json), [offline checks](validation.json). `prepare.mjs` freezes synthetic inputs; `review.mjs` validates and renders captured outputs. Neither script makes paid calls.

Test format reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), checked October 12. Schema conformance does not establish editorial usefulness.
