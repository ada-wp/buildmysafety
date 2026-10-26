# Ten real AI answers — review with Ada

12 October 2026 · Sick-day preparation · Current writer baseline · Proposals awaiting review

**My judgment: the writer is not ready for user-facing content approval.** Three answers are promising starting points; the remaining cases expose missing solutions, weak fit, confusing instructions or a delivery block. The problem involves task selection, resource coverage and rule conflicts as well as voice. This is an editorial assessment of ten diagnostic cases, not a measured customer success rate.

**What actually ran:** 10 separate OpenAI Playground Responses conversations using GPT-6 Luna, low reasoning, the unchanged runtime new-needs instructions, the app's strict schema and synthetic inputs assembled by the current code. The conversation was cleared between cases. Input, prompt and schema transfer checks matched the frozen files. No real user input, app account data or deployed prompt was changed. No retries or extra calls were made.

**Results:** 7 tasks generated; 3 no-idea responses; 6 tasks passed the current app validators; 1 generated task was rejected; **0 tasks included a resource link**. All seven task outputs had three steps within their word/time limits. Structural correctness did not establish usefulness. The validation is an offline replay, not ten hosted app deliveries. Exact billed cost was not retrieved.

## Review standard

- Does it address the gap she actually named?
- Does finishing leave a usable option, preparation, decision, skill or agreed support?
- Does known context change the action, rather than just decorate the wording?
- Are the steps and completion condition coherent and realistic?
- Are resources grounded and boundaries respected without making the task useless?

## All ten at a glance

| # | Need | Model result | Editorial verdict |
| --- | --- | --- | --- |
| 01 | No nearby help; wants practical services | No new idea | Missing solution |
| 02 | No-cook food with no microwave | Set up a no-cook food spot | Promising starting point |
| 03 | Five minutes; tired of note-making | Try adding a task hands-free | Rewrite for better fit |
| 04 | Tiny home; no extra basket or shelf | Make your usual storage sick-day friendly | Promising; keep the direction |
| 05 | Cat care; paid help acceptable | No new idea | Missing solution |
| 06 | Nonurgent appointments without a car | No new idea | Missing solution |
| 07 | Remote friend; wants an agreed check-in | Agree on a low-pressure sick-day text | Useful idea; repair the steps |
| 08 | Work messages interrupt rest | Let work know you’re offline—your way | Promising; light polish |
| 09 | Returning user; food and shelf already done | Make laundry manageable on low-energy days | Rewrite; too little practical value |
| 10 | Canada; outside US resource coverage | Map out a grocery-delivery backup | Blocked; resource and wording problems |

## What I would change first

1. **Meet the need before demanding novelty.** An unshown collection task may be the right answer. The cleaner, cat-sitter and transport tests returned no idea despite empty task histories; cat-sitter and transport options existed in the supplied collection. The current novelty wording may confuse “exists in our library” with “already useful to this person.” That cause is a hypothesis, not an inspected model rationale. Let matching reuse a fitting unshown task, then adapt it if necessary; reserve new generation for a real remaining gap.
2. **Separate a repeated outcome from missing knowledge.** The current app maps every `no_new_idea` decision to “That would repeat an earlier outcome.” In these three empty-history cases, that explanation would be wrong. Use a supported existing option or a truthful resource/scope/context-gap response; do not make her rewrite a clear request repeatedly.
3. **Make resource help possible.** The baseline catalog contains only US 211 and US Rover records. Add a small reviewed set for errands, cleaning, food delivery and transport, with coverage and costs. Paid help may be worth researching when she permits it; no nearby friend should not mean “do everything yourself.” Do not default every need to a directory or force links into every task. Keep at most one linked suggestion per batch, with one or two useful resources.
4. **Judge what she has after finishing.** A saved email message solves a communication need. A note saying “rewear or hand-wash” does little for a laundry backlog. Ask whether the proposed action changes the situation, makes a choice easier, creates access to support, or teaches a relevant skill. Do not ban notes; make them earn their place.
5. **Fix rule conflicts, then polish voice.** The Canada output names an unsupplied resource, uses the unwanted word “backup,” and is blocked by the word “order” in a research step. Keep grounded resource IDs and spending constraints, but distinguish investigating a paid service from requiring a purchase. Restore founder wording rules in the actual runtime prompt. Warmth should come from understanding her situation, not decorative titles.

## Proposed writer additions — for discussion, not deployed

> First identify the practical gap in the current request and what would be different after one task is finished. Choose an action that closes that gap within known constraints. A task can produce a useful physical setup, an informed choice, a reusable message, a practiced skill or an accessible support option.
>
> A task existing in the shared collection is not evidence that this person has already done or seen it. Use only her actual previous outcomes for repetition decisions. An unshown fitting action may be reused or adapted. A completed action may have a distinct next stage, but do not relabel the same outcome.
>
> If she wants outside help, prioritize discovering and checking a suitable supplied resource. Do not substitute writing to friends unless she has identified someone she wants to contact. Respect explicit spending limits; separate free research from the eventual cost of a service.
>
> When the needed source is missing, identify that coverage gap. Do not invent a provider, name an unsupplied service, or claim the request is repetitive. Never claim help is arranged when she only found a listing or sent a message.
>
> Steps should be in the order she can actually do them. Done when describes the result she controls today; waiting for another person's agreement remains pending. Use warm, ordinary language. Do not use “backup” in user-facing copy.

These additions also need corresponding selection/resource/validation changes. Prompt wording alone will not fix routing or unsupported resources. Re-run the same cases after an agreed revision before changing the live writer.

## Original answers and proposed improvements

Original outputs below are unedited. Suggested replacements are authored editorial proposals, not additional AI test results or approved tasks.

### 01. No nearby help; wants practical services

**Request:** I live alone and have no one nearby. I want to find an affordable cleaner or errand helper I could use on a future sick day. Please help me find a real option, not draft a message to a friend.

**Current AI answer:**

*No task returned.*

**App validation:** Valid no-task response; no suggestion to show.

**Review — Missing solution:** No task was returned despite a specific, supported need and empty history. The library has no dedicated cleaner/errand resource; 211 is a broad referral lead, not a direct marketplace. The exact cause of this model decline is not proven.

**Proposed change:** Give service-discovery requests a relevant checked source. Do not substitute a message to a nonexistent friend or claim repetition when history is empty.

**Authored replacement to discuss:**

**Find one helper worth contacting · 12 min**

1. Choose the help you’d actually want first: a small errand or a cleaning visit.
2. Open the matching Taskrabbit category and compare coverage, recent reviews, listed fees and any minimum booking time.
3. Save one profile and the price or availability question you still need answered. You haven’t booked anything yet.

**Done when:** One possible helper is saved, with costs and availability still marked for confirmation.

[Taskrabbit errands](https://www.taskrabbit.com/services/shopping-delivery/run-errands) · [Taskrabbit house cleaning](https://www.taskrabbit.com/services/cleaning/house-cleaning)

Uses newly researched candidate sources, not sources available in the baseline test. Show only the category matching her choice; availability and total price require direct checking.

### 02. No-cook food with no microwave

**Request:** I want food ready for future sick days. I have no microwave and do not want to cook. I usually keep crackers, peanut butter and canned beans. Help me do something useful with what I already have.

**Current AI answer:**

**Set up a no-cook food spot · 5 min**

Gather your crackers, peanut butter and canned beans in one place so an easy meal is ready to find on a low-energy day.

1. Choose a spot that’s easy for you to reach.
2. Put the crackers, peanut butter and beans together there.
3. Check whether you already have what you need to open the can and eat the beans; keep it with them if useful.

**Done when:** Your no-cook food and any needed tools are together and easy to reach.

**App validation:** Task accepted by current rules.

**Review — Promising starting point:** Uses the foods she actually has, needs no microwave and leaves something physically prepared. The can-opening check is useful. The value is modest but appropriate for a first step; repeating it later would be poor personalization.

**Proposed change:** Keep the basic idea. Make the result a usable food setup rather than only a list. Use original packaging/storage instructions; do not assume every named canned food is ready to eat.

### 03. Five minutes; tired of note-making

**Request:** I have five minutes to prepare for a future sick day. Please suggest something I can actually set up or test, not another list to write. I already put tissues and a charger beside my bed.

**Current AI answer:**

**Try adding a task hands-free · 5 min**

Test whether your phone can capture one household task by voice, so you have an option when getting up feels like too much.

1. Open the reminders or notes app you already use.
2. Use its voice input to add one ordinary task you could postpone on a sick day.
3. Check that the task was captured correctly, then leave or delete the test entry as you prefer.

**Done when:** You’ve confirmed whether voice entry works for one task.

**App validation:** Task accepted by current rules.

**Review — Rewrite for better fit:** Testing a skill is a valid suggestion angle. Here, however, the skill is capturing another task, while she asked to move beyond lists. It assumes her usual app has voice input and does not identify the preparation gap that voice capture solves.

**Proposed change:** Start with a brief physical rehearsal and fix one actual point of friction. Offer phone skills when her need makes them relevant.

**Authored replacement to discuss:**

**Try your resting setup once · 5 min**

1. Sit where you’d rest and try reaching the essentials you already placed there.
2. Notice one awkward reach or item you still have to get up for.
3. Move that item to an existing reachable spot, keeping the walking space clear.

**Done when:** You’ve tested the setup and fixed one awkward reach, or confirmed it already works.

This is a distinct usability check of the setup she already made, not another request to assemble the same shelf.

### 04. Tiny home; no extra basket or shelf

**Request:** My studio is tiny and I do not want to buy a basket or create another pile of stuff. How can I make everyday essentials easier to reach on a sick day without adding clutter?

**Current AI answer:**

**Make your usual storage sick-day friendly · 8 min**

Reposition a few everyday essentials within storage you already use, so they’re easier to reach without making a new pile.

1. Pick one place you’d likely rest, and name two essentials that are awkward to reach from there.
2. Look for an existing shelf, drawer, or cupboard spot that’s easier to access.
3. Move those items there, swapping with less-needed items so everything still has a home.

**Done when:** Two essentials have easier-to-reach homes, with no new container or pile.

**App validation:** Task accepted by current rules.

**Review — Promising; keep the direction:** The best fit in this set: it respects the tiny studio and no-clutter preference, uses existing storage and creates an observable improvement. The context changes how the task is done.

**Proposed change:** Keep the core action. A shorter title such as “Make two essentials easier to reach” would be more natural. Do not add a new container, shopping task or extra note.

### 05. Cat care; paid help acceptable

**Request:** I have a cat and no nearby person who can feed her if I need several days of rest. I want to research a paid drop-in sitter in advance. I already have a feeding note; the missing piece is a suitable person.

**Current AI answer:**

*No task returned.*

**App validation:** Valid no-task response; no suggestion to show.

**Review — Missing solution:** No task was returned even though the supplied resource set includes Rover, the pet-sitter pool task is unshown, and the person explicitly wants to research paid care. Preparing another feeding note would miss the gap she named.

**Proposed change:** Reuse or adapt the relevant unshown sitter-research action. New wording or a new task identity is not necessary to be useful. Distinguish finding a candidate from having agreed care.

**Authored replacement to discuss:**

**Find a sitter for your cat · 12 min**

1. Open Rover’s sitter search and look for cat drop-in visits covering your area.
2. Compare one promising profile’s cat experience, recent reviews, listed fees and cancellation terms.
3. Save the profile and ask about future sick-day visits and a meet-and-greet; keep care marked as unarranged until agreed.

**Done when:** One sitter candidate is saved and your first questions are ready or sent.

[Rover pet sitting](https://www.rover.com/pet-sitting/)

Research a possible paid service; no booking, availability guarantee or suitability endorsement. Active effort excludes waiting for a reply.

### 06. Nonurgent appointments without a car

**Request:** I do not drive and want to prepare a way to get to a future nonurgent appointment. I would like a realistic transport option I could check now, including what it costs and how far ahead to arrange it.

**Current AI answer:**

*No task returned.*

**App validation:** Valid no-task response; no suggestion to show.

**Review — Missing solution:** No task was returned with empty history, despite an unshown appointment-transport action and a US community-referral resource. This is a delivery failure for an ordinary administrative request, not proof that there is nothing useful to suggest.

**Proposed change:** Use the eligible existing transport task as a starting point. Make cost, booking notice, return trip and eligibility explicit. Add checked local transport resources when available instead of repeatedly sending everyone to a broad directory.

**Authored replacement to discuss:**

**Check one appointment ride option · 15 min**

1. Open your local 211 directory and look for nonurgent transportation support in your area.
2. Check one lead’s eligibility, service area, fares, booking notice and return-trip arrangements.
3. Save its booking contact and any unanswered question. If none fits, ask the referral team for another lead.

**Done when:** One transport lead is saved with its conditions, or a specific referral question is ready.

[Find your local 211](https://211.org/about-us/your-local-211)

211 supplies information/referrals. This does not confirm a ride, eligibility, price or availability; a local transit/operator source could be more useful once supplied.

### 07. Remote friend; wants an agreed check-in

**Request:** My close friend lives in another city and we are happy to check in by text. I want a simple agreement for a future sick day, without expecting her to monitor me all day. What could we arrange now?

**Current AI answer:**

**Agree on a low-pressure sick-day text · 8 min**

Set expectations together now: one chosen check-in time, an easy reply, and no all-day monitoring.

1. Draft a text proposing one check-in time that would work for both of you on a sick day.
2. Agree on a simple reply, such as “I’m okay” or “I’d like to talk,” and that no reply doesn’t mean all-day monitoring.
3. Send it and note the agreed plan somewhere easy to find; if she hasn’t replied, keep it as a draft until you decide together.

**Done when:** You have a shared plan, or a draft ready to discuss.

**App validation:** Task accepted by current rules.

**Review — Useful idea; repair the steps:** A remote friend is used because the person explicitly named one. The order is confused: agree before sending, then treat an already-sent message as a draft. “No reply doesn’t mean all-day monitoring” is unclear. The done condition conflates an agreement with an unsent draft.

**Proposed change:** Separate proposal, reply and agreement. Include a short message she can use, and label pending support honestly.

**Authored replacement to discuss:**

**Make a simple check-in agreement · 5 min**

1. Choose one time that could work for both of you, including your time zones.
2. Send: “On a sick day, could we exchange one text around [time]? I’m not asking you to stay on call.”
3. Save the time after she agrees. Until then, mark it as awaiting a reply.

**Done when:** Your request is sent, and the plan is clearly marked agreed or awaiting a reply.

This is a social arrangement, not automatic monitoring or an emergency response service.

### 08. Work messages interrupt rest

**Request:** Work messages keep pulling me back in when I need a sick day. I use email for work. Help me prepare a simple way to make my availability clear without sharing personal health details.

**Current AI answer:**

**Let work know you’re offline—your way · 5 min**

Draft a brief email boundary for a sick day that shares only what you choose, so you can rest without composing it in the moment.

1. In a draft, choose a simple boundary: when you’ll next check email, or that you’re unavailable until further notice.
2. Write a short reply, such as: “I’m away today and will respond when I’m back.” Add a work-approved alternate contact only if you choose.
3. Save it as a draft or template, and decide when you’d use it; send it only when it suits you.

**Done when:** A privacy-preserving message is ready, with your chosen availability boundary.

**App validation:** Task accepted by current rules.

**Review — Promising; light polish:** A saved email draft is a useful artifact here because the actual need is communicating work availability. The copyable sentence helps and no health details are needed. This is a good counterexample to banning every note/draft task.

**Proposed change:** Keep the draft/template and simplify the final line to “Your short away message is saved and ready to use.” Respect workplace requirements; do not tell her to activate it while she is still working.

### 09. Returning user; food and shelf already done

**Request:** I already sorted easy meals and a resting spot. The suggestion to postpone one chore felt too obvious. A new worry is laundry piling up when I am out of action. Give me a practical new preparation, not more meal or shelf advice.

**Current AI answer:**

**Make laundry manageable on low-energy days · 7 min**

Choose a simple fallback for getting clean essentials when laundry feels like too much—without adding more chores to your plan.

1. Pick one clean clothing item you’d most want available, such as underwear or a shirt.
2. Decide on a no-spend fallback using what you own: rewear something, choose another clean item, or hand-wash one item if manageable.
3. Write your chosen fallback in a note or reminder you can find easily.

**Done when:** Your preferred clean-clothes fallback is written somewhere easy to find.

**App validation:** Task accepted by current rules.

**Review — Rewrite; too little practical value:** The model avoids repeating food/shelf tasks but does not learn enough from “too obvious.” It offers rewearing, selecting another clean item or handwashing, then writing down that choice. Handwashing adds a chore, and rewearing is not an interchangeable answer to having clean essentials.

**Proposed change:** Turn the laundry worry into a small preparation she can use. Do not demand a novel task just because the previous task was rejected; the new outcome should do more for her.

**Authored replacement to discuss:**

**Put a clean change aside · 5 min**

1. Choose a comfortable clean change from clothes you already own.
2. Keep it together in an existing drawer spot you can easily reach.
3. When you use it, return a clean change to that spot with your next usual laundry load.

**Done when:** A clean change is together and ready to use when laundry can wait.

A modest preparation, not a complete laundry solution. If spare clothing is unavailable, choose a different action rather than suggesting a purchase by default.

### 10. Canada; outside US resource coverage

**Request:** I live in Canada with no nearby help. I want to research someone who can bring groceries or run an errand on a future sick day. Please suggest a relevant place to look, not a US-only service or a generic list.

**Current AI answer:**

**Map out a grocery-delivery backup · 15 min**

Find one Canada-relevant service to investigate, and note what to confirm before relying on it on a sick day.

1. Search your province or city’s official community-services directory, or 211 Canada, for grocery delivery or errands.
2. Open one relevant lead and check its service area, eligibility, fees, and how to place an order.
3. Save its name and contact or booking details, plus one question about availability when you’re unwell.

**Done when:** One relevant lead and a clear question are saved, or you know what information is missing.

**App validation:** Rejected: constraint_violation.

**Review — Blocked; resource and wording problems:** The model names 211 Canada even though no Canadian resource was supplied, leaves the link array empty and uses “backup,” which Ada rejected. The current validator rejects “how to place an order” even though it describes researching a process, not making a purchase.

**Proposed change:** Add a checked Canadian resource only if Canada is supported. Keep an honest resource-gap response otherwise. Restore the no-“backup” writing rule and replace blanket keyword rejection with checks that distinguish research from required spending.

**Authored replacement to discuss:**

**Find a local place to ask · 12 min**

1. Open 211 Canada and choose your province or city.
2. Look for grocery or practical-help services; check eligibility, fees, coverage and how to request help.
3. Save one relevant contact or ask the local referral team what could fit. Availability still needs confirmation.

**Done when:** A relevant Canadian contact is saved, with the next question you need answered.

[211 Canada](https://211.ca/)

Newly checked candidate resource, not present in the frozen baseline. It is a referral route, not a promise of an errand or delivery service.

## Resource checks and evidence

Official pages checked on 12 October 2026: [US 211 finder](https://211.org/about-us/your-local-211), [Rover pet sitting](https://www.rover.com/pet-sitting/), [Taskrabbit errands](https://www.taskrabbit.com/services/shopping-delivery/run-errands), [Taskrabbit house cleaning](https://www.taskrabbit.com/services/cleaning/house-cleaning), and [211 Canada](https://211.ca/). Taskrabbit describes paid errand/cleaning services; 211 Canada describes community-service information/referrals. These support the proposed research starting points, not a local availability, price, eligibility, quality or safety guarantee. The additional resources were checked after baseline generation and have not been added to the app.

The current shelf task still fits the approved simple task-detail design. Basic preparation is not inherently bad: it becomes a poor recommendation when it repeats what she has done or avoids the actual gap. Keep the design and short format; improve what the task accomplishes.

Frozen artifacts: [inputs](inputs.json), [exact runtime prompt](prompt.txt), [schema](schema.json), [unedited responses and method limits](outputs.json), [validator replay](validation.json), and [editorial judgments](review-notes.json). Regenerate inputs with `node prepare.mjs`, validators with `node validate.mjs`, and this review with `node render.mjs` from this folder. These commands make no paid calls.

**Suggested discussion order:** outside help (#01/#05), meaningful action (#03/#09), then the check-in agreement (#07). Keep #04 as a positive example of personalization.
