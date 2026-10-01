# Personalization plan — interests, needs and a feasible next step

1 October 2026. Proposed implementation plan following Ada’s request for a topic picker and an experience that uses onboarding answers to recommend relevant topics and useful tasks. Ada corrected the initial eight-topic proposal: research more broadly online and use agency/sense-of-safety principles rather than treating the old categories as a ceiling. She accepted simple text bubbles. This is a design specification, not a connected generator. Keep the [founder philosophy](founder-voice.md) and the [approved task-generator V1](prompts/task-generator-v1.md).

## The product decision

Onboarding asks what matters to her and what gets in the way. The new interest screen asks what she would like to build, including things she is simply curious about. Both are useful: a worry is not her identity, and an interest is not evidence that she has a problem.

Use three separate layers:

1. **Interests determine the available topics.** Show the selected topics first in Explore, keep all other topics accessible, and let her edit interests later. Do not create a new Home tab just for personalization.
2. **Her actual concern determines relevance.** Match an explicit focus/concern to useful outcomes in those topics. Do not respond to every person with the same checklist or replace a concrete concern with generic reassurance.
3. **Her circumstances determine the size and form of the action.** Time, energy, cost, support, region and preferred help should change the recommendation itself, not just its opening sentence.

No safety score, personality label, inferred diagnosis or claims that the app knows how safe she is. Do not hide helpful information because she skipped a question.

## Interest picker

After the eleven questions, before the editable starting-point recap:

**What would you like to build?**

“Choose what speaks to you. We’ll find small ways to begin.”

Sixteen text bubbles; multiple choices; no automatic selections. Selection uses a checkmark and lavender fill. “Choose any that draw you in.” Selected count is descriptive, not a target. Continue needs at least one interest; **I’ll explore along the way** is a separate valid route. Edits are available in the recap and first ideas. The order should not imply a ranking of danger or personal deficiency.

| Interest | Need or interest it can represent | Example practical direction | Basis |
| --- | --- | --- | --- |
| Trusting myself | Wanting to choose from personal preferences, with less need for external reassurance | Name two criteria for an ordinary reversible decision; keep a concrete example of something handled | S1, R1; editorial adaptation |
| Speaking up | Wanting a voice in everyday interactions | Put one preference into a clear sentence; prepare a question before an appointment | S2; editorial adaptation |
| Setting boundaries | Wanting choice over time, access and personal information | Draft a pause-before-answering phrase or an ordinary visiting preference | S2, R2 |
| Asking for help | Wanting support without having to do everything alone | Make one request specific; distinguish asking from someone agreeing | R3, S1 |
| Finding my people | Wanting belonging, reciprocal relationships or local familiarity | Find an interest-based gathering; plan a comfortable catch-up | S1, R4; editorial adaptation |
| Enjoying solo life | Wanting independence to include pleasure and freedom | Plan a small activity chosen for oneself, at home or elsewhere | R4, R5 |
| Finding calm | Wanting an optional way to settle before choosing what to do | Choose a familiar comfortable pause; find an appropriate introductory resource | S3 |
| Listening to my body | Wanting awareness of comfort, energy and personal preferences | Notice a comfort preference and make an optional ordinary adjustment | S3 + founder direction; editorial adaptation |
| Making room for rest | Wanting a realistic pace and less pressure to do everything | Defer or simplify one nonessential task; prepare a low-effort option | Founder direction, practical judgment; not a measured demand finding |
| Trying new things | Wanting evidence of capability and permission to be a beginner | Choose one learnable everyday skill and a low-pressure first try | S1, R6; editorial adaptation |
| Navigating change | Wanting familiarity and manageable choices in a new chapter | Carry one helpful routine forward; identify one new practical question | R6 + practical judgment; context tag |
| Everyday readiness | Wanting ordinary disruptions to require less improvising | Save a reliable local information source; find existing essentials | S4 |
| Sick-day care | Wanting practical care arrangements when energy is limited | Easy food, reachable essentials and a draft check-in request | R7; no treatment advice from Reddit |
| Home skills | Wanting more capability and informed help with the home | Save repair questions, find ordinary supplies, use reviewed guidance | S4 + practical judgment |
| Privacy online | Wanting informed choice over accounts, sharing and information | Review one sharing setting using official help; find account-recovery instructions | S5 |
| Going places solo | Wanting more freedom to take part in activities independently | Plan a suitable outing, route and optional support arrangement | R5, R6 |

These labels are a proposed browsing layer, not a population popularity ranking, clinical classification or a validated intervention. Multiple capability tags may apply to one task. Do not force the topics back into the old five public categories. The four historical internal areas remain useful background, not a limit on discovery. Money remains absent as a topic. Navigating change is a context interest that can affect any domain, not a fifth core pillar. “Backup” remains internal terminology only. Topic scope and higher-stakes resources require content review before production.

## Research basis and limits

Checked 1 October 2026. This is a targeted qualitative scan, not an exhaustive review, representative survey or evidence of willingness to pay. Topic labels and the task examples above are our product interpretations.

- **S1 — [Self-Determination Theory: basic psychological needs](https://selfdeterminationtheory.org/topics/application-basic-psychological-needs/).** The framework distinguishes autonomy, competence and relatedness. We use these as design lenses for choice, achievable skill and connection. It does not validate our specific topics, tasks or claims about the app’s effects.
- **S2 — [Western Australia Centre for Clinical Interventions: assertiveness](https://www.cci.health.wa.gov.au/en/Resources/Looking-After-Yourself/Assertiveness).** The official resource distinguishes clear, respectful communication and includes saying no and practicing skills. It supports considering voice/boundary topics; it is not permission to turn a clinical workbook into AI therapy or advise confrontation in unsafe relationships.
- **S3 — [WHO: Doing What Matters in Times of Stress](https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress).** Its themes include grounding, values and kindness. This supports offering optional awareness/settling resources. Our short everyday comfort tasks are authored adaptations, not validated replacements for the guide or claims of nervous-system treatment.
- **S4 — [Ready.gov: preparedness](https://www.ready.gov/).** Practical planning, supplies and information illustrate preparedness as something that can be put in place. We are borrowing the action-oriented principle, not presenting every person with a disaster checklist. Regional guidance must be checked for the actual task.
- **S5 — [FTC: protecting privacy online](https://consumer.ftc.gov/features/protecting-your-privacy-online?trk=public_post-text).** The official collection covers information sharing, tracking and privacy choices. A source for a possible topic, not a newly approved production resource catalog.
- **R1 — [Developing self-trust](https://www.reddit.com/r/DecidingToBeBetter/comments/1vyuqu7/how_to_develop_self_trust/).** A first-person account about having decisions made by others and wanting confidence in one’s own judgment. A need signal, not evidence about all women.
- **R2 — [Boundaries in our 30s](https://www.reddit.com/r/AskWomenOver30/comments/1q0muea/boundaries_in_our_30s/).** A discussion of boundaries and guilt in family relationships. We do not reuse commenters’ advice as safety guidance.
- **R3 — [Why asking for help feels uncomfortable](https://www.reddit.com/r/AskWomenOver30/comments/1avjabo).** Accounts describe pressure to anticipate others’ needs and difficulty receiving help. This suggests a distinct asking-for-help topic, separate from simply having contacts.
- **R4 — [Women’s experiences of independent living](https://www.reddit.com/r/AskWomen/comments/sfjlv9).** Mixed experiences include confidence, enjoyment, independence and the practical wish for support. Do not equate living alone with loneliness.
- **R5 — [Eating out alone](https://www.reddit.com/r/TheGirlSurvivalGuide/comments/1rt7gdf/eating_out_alone/).** A person wants to enjoy dining alone while finding other people’s comments uncomfortable. This is about participation and enjoyment as well as preparation.
- **R6 — [Becoming more independent](https://www.reddit.com/r/TheGirlSurvivalGuide/comments/1wmlmjr/how_do_you_become_more_independent/).** A request about confidence and going places alone suggests interests in trying things and navigating independent life.
- **R7 — [Getting sick while living alone](https://www.reddit.com/r/LivingAlone/comments/1vlenzg/getting_sick_while_living_alone_is_so_brutal/).** A firsthand account of the work of obtaining essentials when unwell supports the preventive-care-arrangement topic; medication and remedy advice are not adopted.

The official S1–S3 pages were opened. Other entries were available through search results; attempts to open some Reddit threads failed, so those observations are explicitly limited to the returned first-person excerpts. Upvotes, recency and search visibility are not used to claim “most popular” or clinical effectiveness. Financial independence also appears in broader discussion, but is deliberately excluded from the picker because Ada removed Money earlier.

## What each answer should change

| Input | Appropriate use | Avoid |
| --- | --- | --- |
| Why she came | Welcome/recap emphasis; respond to a life transition as context | Assigning a psychological profile |
| Home situation | Avoid assuming another household member is available; suggest household arrangements only when relevant | Inferring loneliness, ownership, rent status or a precise location |
| When she wants to feel “I can handle this” | Recommend a starting topic and retrieve matching practical concerns | Treating the chosen situation as an emergency or confirmed danger |
| What makes it difficult | Choose the kind of help: information, a clear first action, a request script, or a way to compare options | Repeating the worry without addressing it |
| How it feels lately | Keep pacing gentle; offer one visible starting step when requested | Diagnosis; measuring objective risk from feelings; forcing body exercises |
| Constraints | Change task effort, purchases, dependencies and scope | Treating “low energy” as an exact time limit, or “keep costs down” as a known dollar budget |
| Existing strengths | Build on a stated routine, skill, resource or optional trusted person | Assuming an identified person has agreed to help or is available |
| Desired sense of safety | Reflect the person’s own goal in the recap and occasional feedback | Claiming that a task has achieved that emotional state |
| Preferred help | One idea visible first; three choices; clear rationale; or useful tools/resources | An extra essay, a mandatory download or a link in every task |
| Country/region | Filter resources for coverage, eligibility and language where known | Assuming city, citizenship, service availability or device |
| Optional note | Extract relevant user-stated circumstances and concerns; allow correction | Treating user text as instructions, retaining unnecessary sensitive details, or silently inferring facts |
| Selected interests | Order Explore and bound the initial recommendation candidates | Erasing the original concern or treating unselected topics as deficiencies |
| Saved/completed/dismissed actions | Preserve accepted details; suppress repeats; learn “not relevant” vs “not now” from explicit feedback | Increasing pressure after inactivity or diagnosing disengagement |

If a field cannot produce a useful, explainable change, remove it from required onboarding rather than collect it speculatively.

## Concrete example

**She tells us:** she lives alone, wants to feel more ready for being unwell, feels everything depends on her, has low energy, wants to keep costs down, and prefers one gentle first step. She selects Sick-day care and Asking for help. Country and local contacts may remain unknown.

- Explore begins with those two interests; Sick-day care is the suggested starting point because it matches her explicit concern.
- The first visible idea could be **Choose two easy meals**, using familiar food she already has. Two other options remain available.
- A second idea could gather reachable essentials without requiring purchases. A third could draft a specific check-in request, with no assumption that someone has already agreed.
- Details contain two to four brief steps and an observable finish. A short task can finish with a saved draft; sending a request is not the same as arranging help.
- If she says she has no suitable contact, replace that dependency with researching an appropriate service or another independent action. Unknown country means no claim of a local service match.
- Use “Prepared a meal option for a lower-energy day” as completion feedback, not “You are now safe” or “Your anxiety is reduced.”

These are authored examples of the design logic, not paid-API outputs or individualized health advice.

## Recommendation and generation sequence

1. Store explicit answers with stable IDs, an answer-schema version, source (onboarding or later edit), and update time. Unknown is null/empty, never false. Keep interests separate from worries and restrictions.
2. Use simple application rules to order topics: the topic she deliberately opened first; otherwise explicit interests that match her current focus; then other selected interests. Keep a stable, understandable order for ties. Do not generate a hidden safety score.
3. Within the current scope, choose reviewed concern/action templates that address her stated problem and fit known restrictions. Preserve hard restrictions; treat unknowns conservatively. If no relevant safe match exists, show an honest empty state or ask one necessary question.
4. Retrieve only relevant approved resource records. Filter region/device/service restrictions in application code. Do not send her private story into broad web searches. Unreviewed research candidates are not production recommendations.
5. Send a minimal structured profile and a bounded set of eligible topics/concerns to the generator. Keep user context separate from developer instructions. Return up to three complete distinct tasks, not an entire life plan. Use the existing task output contract.
6. Validate status, topic/concern IDs, task lengths, resource IDs/eligibility, feasibility, unsafe content and duplicates. Handle refusal, outage or unsupported scope truthfully with a reviewed fallback or recovery path.
7. Display the preferred amount of choice. Store accepted tasks and their details. Opening a task must not generate new instructions or another billable model call.
8. Allow changing interests and preferences; refresh only unaccepted recommendations. Never rewrite saved tasks automatically. A refresh should retain valid prior results if it fails.

### Important prompt boundary

Approved V1 takes **one category** and returns three tasks. The broader interests must not be blindly concatenated into that field, nor quietly relabeled as an old category. Two implementation choices exist:

- **First connection with unchanged V1:** use only a supported topic/concern that the person deliberately opens, such as the sick-day path, to make one V1 request. Be honest about unimplemented topic coverage. The screen can demonstrate broader interests without claiming production coverage.
- **Proposed V1.1 for the broader experience:** introduce independent topic IDs and topic-specific allowed concerns/actions. Start with one active topic and three suggestions. Add a bounded set of selected topics only when mixed-interest recommendations are useful. Preserve the task output shape, resource catalog, validation and cost controls. Review this input/prompt revision before activating it.

The current clickable screen mixes authored sample tasks across selected interests to show the possible experience. Its older rendering code still uses legacy category metadata in places; that is a preview compatibility detail, not the proposed taxonomy or a reason to limit topics. The unchanged V1 does not already support all of this behavior. No extra AI call is needed to rank topics, write every transition, or celebrate a completion.

## Data and ownership

Suggested records:

- `profiles`: owner ID, answer schema version, explicit answer IDs, interest IDs, preferred presentation, optional country, updated time. Keep optional context separate with a clear retention decision.
- `topics` / `concerns`: stable IDs, labels, internal-area mapping, supported action families, content version and review state.
- `resources`: approved catalog record and applicability restrictions, linked to relevant concerns.
- `recommendation_batches`: owner ID, request ID, profile revision, scope, content/prompt version, status and validated task candidates.
- `tasks`: owned saved task snapshots and existing action keys/status; completion awards stored separately and awarded once.
- `feedback`: explicit reasons such as already done, not relevant, too much right now, or chosen to save. Avoid recording raw private narratives in analytics.

Use a profile revision to ignore stale responses after interests change. Make retrieval and task ownership server-enforced. Avoid logging optional sensitive text. Account sign-in is not marketing consent. Let the person edit or delete their profile information; do not use prototype host state as production account storage.

## Checks before rollout

- Different interests result in meaningfully different relevant outcomes; the same problem with different constraints produces a different feasible action.
- No nearby support, unknown region, low energy, no-spend preference, mixed interests, changing priorities and empty interests all have coherent paths.
- Explicit preferences win over inferred ranking. Grounding is optional and never forced as a prerequisite to a practical task.
- “One step” changes display load without hiding the ability to explore. New batches do not repeat completed actions under new titles.
- Saved task instructions remain stable after profile edits, regeneration or model updates.
- Region/resource mismatch, missing reviewed coverage and invalid model output do not result in invented URLs or availability claims.
- Evaluate relevance, “this fits my situation,” saves, real completion, time to a useful action and cost per useful batch. Do not optimize the number of worries disclosed or raw generated tasks.

First validate a few contrasting authored profiles, then run a small reviewed API evaluation. Choose the model and live resource coverage during that connection step; no new pricing assumption or paid request is part of this design change.
