# Personalization plan — interests, needs and a feasible next step

1 October 2026. Proposed implementation plan following Ada’s request for a topic picker and an experience that uses onboarding answers to recommend relevant topics and useful tasks. Latest founder clarification: living solo remains the key audience/context; the purpose is helping women build a sense of agency, safety and control. Questions add focus rather than rule the experience. Reuse standardized solution pools and avoid unnecessary generative AI. The text-bubble design and established task flow remain. “Living alone” describes the household situation; it does not assume relationship status. This is a design specification, not a connected recommendation service. Keep the [founder philosophy](founder-voice.md) and the [approved task-generator V1](prompts/task-generator-v1.md).

## The product decision

Onboarding asks what matters to her and what gets in the way. The new interest screen asks what she would like to build, including things she is simply curious about. Both are useful: a worry is not her identity, and an interest is not evidence that she has a problem.

Use three separate layers:

1. **Her current choice leads.** Preserve topic → five selectable concerns plus optional manual input → three suggestions → inspect → + → My list → complete → elephant progress. A topic or concern chosen now overrides an earlier onboarding focus. Do not require another questionnaire before each batch.
2. **Onboarding adds helpful defaults.** Selected interests can appear first in Explore; all supported topics remain accessible. Earlier worries can suggest a starting point, but never trap her in a problem or imply she needs to fix every selected interest. Let her edit preferences, change direction and browse without personalization. Do not add a new Home tab.
3. **Circumstances help choose feasible actions.** Use known time, energy, cost, support and resource eligibility to choose appropriate library tasks or authored variants. Hard restrictions must be respected; broad feelings or old answers are not permanent restrictions. Tone and presentation preferences should usually use standard copy rather than AI.

No safety score, personality label, inferred diagnosis or claims that the app knows how safe she is. Do not hide helpful information because she skipped a question.

## Step 1 — proposed selection logic and restrained AI use

The founder decisions above are requirements. The mechanics below are proposed for review; no production selection behavior has been implemented. An isolated [October 11 writer test](prompts/evaluations/2026-10-11-sick-day-smoke-test.json) produced one real batch for founder review; it does not evaluate or implement this recommendation system.

Ada's next instruction is to calibrate the writer before creating the pool. Follow the [V1.1 writing draft and teaching plan](prompts/task-writer-v1.1-draft.md) for this preparation stage. The rules below describe eventual app behavior; they do not require us to populate the library before teaching/testing its writer.

**A reusable solution pool is the default.** Each reviewed action has stable topic/concern tags, a distinct outcome key, short title/summary, two to four steps, active time, a clear finish, relevant dependencies/cost, optional authored variants, approved resource IDs and content version. Keep source-checking separate from content approval. Three tasks that reword the same outcome do not count as three choices.

For each request:

1. Start with the topic and concerns she chose now. If she has not chosen, offer a starting point based on interests and let her change it.
2. Exclude unsupported, unreviewed, unsuitable or already shown/saved/completed actions. Apply known restrictions without inferring unavailable help or treating unknowns as confirmed facts. Explicitly revisiting a completed action is different from presenting it as a new recommendation.
3. Choose up to three distinct useful outcomes within that scope, considering preferences only as a secondary ordering signal. Cover selected concerns when useful; do not force variety or pad a short pool.
4. Use a suitable reviewed variant, such as a smaller task or no-purchase option. Merely changing order, a name, a greeting or an encouragement does not justify generation.
5. If the pool adequately covers the request, serve it with **zero model calls**. Asking for another batch first retrieves unshown eligible actions. Never imply fresh AI generation or live research when displaying stored content.
6. Consider AI only when a supported written request or specific combination of circumstances cannot be served well by available tasks/variants, and supplied reviewed guidance can support a useful adaptation. Missing higher-stakes guidance, irrelevant requests and exhausted coverage require an honest recovery/redirect, not unlimited generation. Generate complete bounded task details once, validate them and preserve any accepted task as a stable snapshot.

**Standardize:** topic/concern menus, onboarding comments, task templates/variants, resource catalog, selection rules, navigation, save/complete/undo behavior, completion messages and elephant growth. Research reusable resources during content preparation, not on every user visit.

**External-help discovery — founder clarification, October 11:** when outside help addresses the selected problem, include one or two checked services, websites, apps or community resources with a clear purpose and a few useful comparison criteria. A person without suitable nearby help needs ways to find support, not a generic draft to an assumed friend. Save an option for possible later use; do not equate a listing with confirmed availability, affordable access or guaranteed safety. Match resources to region and budget, and distinguish free research from a paid service. This is a general capability across relevant topics, not a default brand or a requirement to add links to every self-contained task.

**Reserve AI for:** a meaningful adaptation within supported guidance or interpreting a relevant manual request when necessary. Do not add a mandatory AI classification call before every batch. The reviewed V1 prompt and its broader-topic limitations still apply whenever generation is invoked.

**Example:** she mentioned sick days in onboarding, then opens Going out solo and selects finding a comfortable first outing. Return outing-related actions, not more sick-day tasks. Her keep-costs-down preference can favor a free option; her earlier feelings should not prevent her from exploring. This selection can come entirely from the library.

**Privacy and reuse:** share reviewed generic library content, not another user's personal generated text. Keep adapted tasks private to their owner. A model output does not automatically become an approved pool item. Preserve source, review state and content version internally without cluttering the task screen.

## Interest picker

After the eleven questions, before the editable starting-point recap:

**What would you like to build?**

“Choose what would make life on your own feel a little easier.”

Sixteen text bubbles; multiple choices; no automatic selections. Selection uses a checkmark and lavender fill. “Choose any that draw you in.” Selected count is descriptive, not a target. Continue needs at least one interest; **I’ll explore along the way** is a separate valid route. Edits are available in the recap and first ideas. The order should not imply a ranking of danger or personal deficiency.

| Interest | Living-alone situation | Example practical direction | Basis |
| --- | --- | --- | --- |
| Sick-day care | Getting ordinary essentials or support while unwell | Reachable supplies, familiar meal options, a check-in request | R7 |
| Meals for one | Choosing food and shopping for one household member | Keep a short meal list; plan two uses for a familiar ingredient | Editorial practical judgment |
| Home repairs | Knowing what to ask and whom to contact | Save a repair contact and clear questions about ordinary work | S4 + practical judgment |
| Power-cut prep | Finding supplies and reliable information during disruption | Locate an existing working light; save official outage information | S4 |
| People to call | Having possible sources of practical or social support | Draft one specific request; distinguish a possible contact from agreed help | R3, S1 |
| Knowing neighbors | Becoming familiar with people and resources nearby | Prepare a comfortable introduction; find a local noticeboard | S1 + practical judgment |
| Enjoying time alone | Making independent life enjoyable | Plan an activity chosen for oneself; make a small corner feel personal | R4, R5 |
| Settled evenings | Having comfortable options for evenings at home | Prepare a familiar activity or optional pause | S3 + founder direction |
| Visitor boundaries | Choosing how visits and personal space work | Draft a check-before-visiting preference | S2, R2 |
| Going out solo | Taking part in local activities independently | Pick an enjoyable outing and a suitable route home | R5, R6 |
| Privacy online | Choosing what others can learn about home and routines | Review a public profile or one sharing setting using official help | S5 |
| Pet-care plans | Preparing for a time when the usual caregiver is unavailable | Private routine note; questions for a possible caregiver; ordinary supply reminder | Founder context + practical judgment |
| Solo travel | Keeping practical trip details within reach | Plan arrival; organize booking/contact information privately | R6 + practical judgment; no destination safety ranking |
| New home & routines | Finding familiarity and everyday services after a move | Carry one helpful routine forward; find an everyday local place | R6 + practical judgment; context interest |
| Everyday chores | Managing a household without assuming a second person | Define a smaller useful task and what counts as enough | Founder direction + practical judgment |
| Low-energy days | Keeping everyday life manageable when capacity varies | Defer a nonessential chore; keep a familiar meal option | Founder direction + practical judgment |


These labels are a proposed browsing layer, not a population popularity ranking, clinical classification or a validated intervention. Multiple capability tags may apply to one task. Do not force the topics back into the old five public categories. The four historical internal areas remain useful background, not a limit on discovery. Money remains absent as a topic. New home & routines is a context interest that can affect any domain, not a fifth core pillar. Self-trust, voice, body awareness and connection remain design principles and possible task approaches; they are not broad standalone self-help topics in this picker. “Backup” remains internal terminology only. Topic scope and higher-stakes resources require content review before production.

## Research basis and limits

Checked 1 October 2026. This is a targeted qualitative scan, not an exhaustive review, representative survey or evidence of willingness to pay. Topic labels and the task examples above are our product interpretations. Later practical refinements such as meals for one and pet-care plans are explicitly identified as judgment/context rather than being attributed to a new measured research finding.

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
| Selected interests | Gently order Explore and suggest an initial scope when she has not chosen one | Overriding a current choice, hiding other topics or treating unselected topics as deficiencies |
| Saved/completed/dismissed actions | Preserve accepted details; suppress repeats; learn “not relevant” vs “not now” from explicit feedback | Increasing pressure after inactivity or diagnosing disengagement |

If a field cannot produce a useful, explainable change, remove it from required onboarding rather than collect it speculatively.

## Concrete example

**She tells us:** she lives alone, wants to feel more ready for being unwell, feels everything depends on her, has low energy, wants to keep costs down, and prefers one gentle first step. She selects Sick-day care and People to call. Country and local contacts may remain unknown.

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
5. Prefer existing complete pool tasks or reviewed variants. Only if a supported adaptation is needed, send minimal relevant context and reviewed guidance/resources to the generator. Keep user context separate from developer instructions. Return up to three complete distinct tasks, not an entire life plan. Use the existing task output contract and observe the prompt boundary below.
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
- `solution_templates` / `solution_variants`: reviewed reusable actions, outcome keys, concern/topic tags, dependencies, effort/cost, complete display content, approved resources and version. Keep generated private tasks separate from this shared pool.
- `resources`: approved catalog record and applicability restrictions, linked to relevant concerns.
- `recommendation_batches`: owner ID, request ID, profile revision, scope, content/prompt version, status and validated task candidates.
- `tasks`: owned saved task snapshots and existing action keys/status; completion awards stored separately and awarded once.
- `feedback`: explicit reasons such as already done, not relevant, too much right now, or chosen to save. Avoid recording raw private narratives in analytics.

Use a profile revision to ignore stale responses after interests change. Make retrieval and task ownership server-enforced. Avoid logging optional sensitive text. Account sign-in is not marketing consent. Let the person edit or delete their profile information; do not use prototype host state as production account storage.

## Checks before rollout

- Different interests result in meaningfully different relevant outcomes; the same problem with different constraints produces a different feasible action.
- A new explicit topic wins over an old onboarding focus; all supported topics stay reachable, including with skipped answers or no interests.
- Covered requests, another batch from a nonempty eligible pool, task opening and completion all work without model calls. Pool exhaustion does not trigger repeated generation by default.
- No nearby support, unknown region, low energy, no-spend preference, mixed interests, changing priorities and empty interests all have coherent paths.
- Explicit preferences win over inferred ranking. Grounding is optional and never forced as a prerequisite to a practical task.
- “One step” changes display load without hiding the ability to explore. New batches do not repeat completed actions under new titles.
- Saved task instructions remain stable after profile edits, regeneration or model updates.
- Region/resource mismatch, missing reviewed coverage and invalid model output do not result in invented URLs or availability claims.
- Evaluate relevance, “this fits my situation,” saves, real completion, time to a useful action and cost per useful batch. Do not optimize the number of worries disclosed or raw generated tasks.

Next calibrate the task-writing prompt using synthetic examples and a bounded evaluation, then use the satisfactory writer to draft a small pool for review. Demonstrate pool selection against contrasting profiles before adding runtime adaptations. Choose the model and live resource coverage during the connection step; no new pricing assumption or paid request is part of this planning change.
