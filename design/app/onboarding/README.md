# Conversational onboarding preview

1 October 2026. Ada asked to turn the warmer, choice-led onboarding into a clickable funnel, with occasional human comments and the founder philosophy woven through it. She also requested earthy dark green as a restrained addition while keeping ivory and lavender dominant. The direction is requested; this connected screen treatment is ready for her visual review.

Open [the preview](preview.html). The [editable source](source.fragment.html) contains the complete question wording, choices, conditional replies, and connected synthetic task flow. It extends the [five V0 flow details](../v0-flow/README.md); it is not a live app, new deployment, real authentication or AI evaluation.

## Journey

Welcome → eleven questions, one per screen → text-bubble interest picker → editable starting-point recap → sample task ideas → inspect steps → + → demo email sign-in → My list → complete → elephant acknowledgment.

The welcome introduces: **A little more “I can handle this.”** Small preparations, choices and actions build a sense of agency. The elephant accompanies the person from the beginning. No fear score, diagnosis or promise of protection.

| Order | Question | Interaction |
| --- | --- | --- |
| 1 | What brought you here today? | Choose one |
| 2 | What does home look like for you right now? | Choose one; optional |
| 3 | When would you most like to feel, “I can handle this”? | Choose one |
| 4 | What makes that feel difficult? | Multiple choices |
| 5 | How does this feel for you lately? | Choose one; optional |
| 6 | What might make it hard to take a first step? | Multiple choices; “Nothing in particular” is exclusive |
| 7 | What already helps you find your footing? | Multiple choices; “I’m still discovering what helps” is exclusive |
| 8 | What would a stronger sense of safety feel like for you? | Choose up to two that feel closest |
| 9 | How would you like us to help you begin? | Choose one |
| 10 | Which country are you based in? | Optional country/region picker; Keep it general |
| 11 | Anything else you’d like us to understand? | Optional text, up to 600 characters |

Choices remain the main interaction; typing comes last. Back retains answers. A disabled Continue becomes available after a required choice. Optional questions offer Skip. Recap edits return directly to the recap. Its full answer review makes every answer editable without repeating the entire funnel.

Ada approved the revised question 8 and its five answers on 1 October:

- “I trust myself to take care of me.”
- “I have things in place that help me feel more prepared.”
- “I know where to turn—I don’t have to handle everything alone.”
- “When life feels uncertain, I can find my footing.”
- “I feel freer to enjoy life on my own.”

Brief comments appear within selected question screens, not as extra interstitial steps. They respond to an actual choice: for example, choosing self-trust prompts “We can build from small moments of ‘I did that.’” Choosing that everything depends on oneself prompts a reminder that people and resources can be part of feeling capable. Unanswered questions are not interpreted as a deficit.

## Preview personalization and limits

- Ada requested a broader topic-interest screen, explicitly asked not to be constrained by the old categories, and accepted simple text bubbles on 1 October. Sixteen proposed interests now span self-trust, voice, relationships, bodily comfort, rest, exploration and practical preparation. The [research and personalization plan](../../../docs/personalization-plan-v0.md) records their rationale and limitations. No topic is automatically selected. Continue needs one selection; “I’ll explore along the way” allows skipping. This screen does not replace the earlier question about her current concern.
- Selected topics appear in the recap, and can be edited there or from the first ideas. The sample selector prioritizes a selected topic matching her explicit focus, then mixes the selected interests into three authored tasks. Low energy/time affects sample ordering. The current samples can include already-saved cards visibly marked as added; production needs the deduplication described in the generator contract.

- Seven focus paths: being unwell, unexpected things at home, everyday responsibilities, reaching out, feeling unsettled, life changes, and still figuring it out. These are personal contexts; life changes are not a new core safety category. Money remains absent as a category, while cost can be a constraint.
- The recap reflects explicit choices, including constraints and existing strengths. It does not infer personality, trauma, actual risk, or mental-health status.
- When interests are skipped, focus selects a fixed sample task set. “Suggest one gentle first step” shows one idea first, with two other possibilities available. Other preferences show three ideas with adjusted introductory copy. No semantic AI generation happens here.
- Country and optional free text are collected to demonstrate the future interaction; they do not change sample task content. Real localization, resource eligibility and nuanced personalization remain implementation work.
- The established Explore/category route remains reachable after the first ideas. The requested conversational onboarding is a proposed replacement for the initial category-only entry, not an extra mandatory questionnaire on every visit.
- Task detail retains the approved visible-steps layout. The green button treatment in this preview is a palette trial; the earlier approved task-detail reference is preserved.
- Email uses the explicitly displayed demo code **123456**. No email is sent. No real accounts or durable multi-device task ownership are created.

The [personalization plan](../../../docs/personalization-plan-v0.md) maps every input to a useful change in topics, task relevance, feasibility or presentation. Approved generator V1 still accepts one category. Start a real connection with one supported topic the person opens. New topic scopes and mixed-interest generation require an explicitly reviewed input/prompt revision; do not disguise a new topic as an old category. The preview does not silently revise approved V1.



## Palette trial

Ivory and lavender remain the main colors, with original deep-ink text and the existing lavender elephant. Primary buttons use earthy green **#3E5044**; measured text contrast is **8.07:1**. Green is not added to every heading, border, or background.

Optional host design controls compare earthy green with original ink, airy with compact choices, and a soft lavender reply background with a quieter inline reply. These are design review controls, not proposed app settings.

## State and checks

Structured answer IDs, interest IDs and the country choice are retained only in the preview's private host state. Optional free text, email and verification code remain in memory and are omitted from saved snapshots. Model-facing state describes the design only; it does not include questionnaire answers or interest selections. The optional note is escaped when displayed. This preview storage is not a production consent, retention or account-storage design.

[Verification results](verification.json): all eleven questions, seven focus paths, sixteen interest paths, interest select/deselect/skip/restore, mixed-interest sample routing, Back, optional skipping, exclusive choices, the two-choice limit, country picker, conditional replies, recap edits, one-step preference, task detail/return, add, demo sign-in, list completion and Undo are covered. Layouts are checked at 320, 393 and 736 CSS pixels. These checks are not a complete accessibility or security audit.

Before implementation: review length, wording and tone with Ada; decide the necessary fields and their retention; map agreed answers to the approved task-generation contract; choose real identity/storage services; test keyboard and screen-reader behavior on real devices. Keep the [deployment gate](../../../docs/technical-status.md). Do not copy demo authentication into production.
