# Conversational onboarding preview

1 October 2026. Ada asked to turn the warmer, choice-led onboarding into a clickable funnel, with occasional human comments and the founder philosophy woven through it. She also requested earthy dark green as a restrained addition while keeping ivory and lavender dominant. The direction is requested; this connected screen treatment is ready for her visual review.

Open [the preview](preview.html). The [editable source](source.fragment.html) contains the complete question wording, choices, conditional replies, and connected synthetic task flow. It extends the [five V0 flow details](../v0-flow/README.md); it is not a live app, new deployment, real authentication or AI evaluation.

## Journey

Welcome → eleven questions, one per screen → editable starting-point recap → sample task ideas → inspect steps → + → demo email sign-in → My list → complete → elephant acknowledgment.

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

- Seven focus paths: being unwell, unexpected things at home, everyday responsibilities, reaching out, feeling unsettled, life changes, and still figuring it out. These are personal contexts; life changes are not a new core safety category. Money remains absent as a category, while cost can be a constraint.
- The recap reflects explicit choices, including constraints and existing strengths. It does not infer personality, trauma, actual risk, or mental-health status.
- Focus selects a fixed sample task set. Low energy or limited time sorts those samples by duration. “Suggest one gentle first step” shows one idea first, with two other possibilities available. Other preferences show three ideas with adjusted introductory copy. No semantic AI generation happens here.
- Country and optional free text are collected to demonstrate the future interaction; they do not change sample task content. Real localization, resource eligibility and nuanced personalization remain implementation work.
- The established Explore/category route remains reachable after the first ideas. The requested conversational onboarding is a proposed replacement for the initial category-only entry, not an extra mandatory questionnaire on every visit.
- Task detail retains the approved visible-steps layout. The green button treatment in this preview is a palette trial; the earlier approved task-detail reference is preserved.
- Email uses the explicitly displayed demo code **123456**. No email is sent. No real accounts or durable multi-device task ownership are created.

## Palette trial

Ivory and lavender remain the main colors, with original deep-ink text and the existing lavender elephant. Primary buttons use earthy green **#3E5044**; measured text contrast is **8.07:1**. Green is not added to every heading, border, or background.

Optional host design controls compare earthy green with original ink, airy with compact choices, and a soft lavender reply background with a quieter inline reply. These are design review controls, not proposed app settings.

## State and checks

Structured answer IDs and the country choice are retained only in the preview's private host state. Optional free text, email and verification code remain in memory and are omitted from saved snapshots. Model-facing state describes the design only; it does not include questionnaire answers. The optional note is escaped when displayed. This preview storage is not a production consent, retention or account-storage design.

[Verification results](verification.json): all eleven questions, all seven focus paths, Back, optional skipping, exclusive choices, the two-choice limit, country picker, conditional replies, recap edits, one-step preference, task detail/return, add, demo sign-in, list completion and Undo passed. Layouts were checked at 320, 393 and 736 CSS pixels. No JavaScript page errors or live API calls occurred. These checks are not a complete accessibility or security audit.

Before implementation: review length, wording and tone with Ada; decide the necessary fields and their retention; map agreed answers to the approved task-generation contract; choose real identity/storage services; test keyboard and screen-reader behavior on real devices. Keep the [deployment gate](../../../docs/technical-status.md). Do not copy demo authentication into production.
