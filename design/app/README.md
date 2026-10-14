# Build My Safety — Figma onboarding draft

Created in Ada Weng's team. File: https://www.figma.com/design/dAt91BbHcckeU7yTxggGhF

## Completed
- Editable elephant welcome screen: node 4:21.
- One-category selection screen: node 4:45. Headline: Where would you like to start?
- Five concern branches: Sick days (4:109), Daily life (4:159), My home (4:205), People I can turn to (4:251), Peace of mind (4:297).
- Each branch has exactly five checkbox choices and an optional Add your own field.
- Money was removed explicitly at the user's request.
- Welcome, category cards and back navigation have native Figma prototype links.
- Native editable text, vector elephant, reusable controls, 30 variables and six text styles.

## Interaction specification
Choosing one category opens its branch immediately. The concerns are multi-select. Free text can stand alone or accompany selected concerns. The eventual app enables Continue once there is at least one checked item or nonblank custom text. Changing category should retain a per-category draft rather than mixing unrelated concerns into the active request. Do not generate a plan until the user continues and supplies the needed context.

Checkboxes show editable visual states in this Figma draft; they do not toggle in the current prototype. Manual typing and Continue submission are implementation work. The sick-day screen shows two example selections, not a default for real users. No AI call or website deployment was performed.

## Research basis
The choices are an editorial shortlist of recurring themes and solution opportunities from the September 23 research, not a statistically ranked top five. concern-content.json maps each to row IDs in ../../research/data/concerns-resources-evidence.json. The source spreadsheet is ../../research/Safety_Concerns_and_Solutions.xlsx. Preserve the original four product areas internally; these five entry topics are user-facing navigation, not a replacement taxonomy. Life transitions remain context.

## Verification
All seven frames are 393 x 852. Structural checks found no direct screen-child overflow. Welcome, category and sick-day screenshots were reviewed; text auto-sizing was corrected. The duplicate footer elephant on the category screen was hidden after review. Five native category destinations were re-read and confirmed. All seven screens were visible in the browser canvas.

Figma Starter MCP quota was reached on the final screenshot requests. The final category re-export and four branch close-up exports could not run. Earlier screenshots and the live canvas were used for review; do not claim these failed exports passed. The file and all changes are saved. No upgrade was purchased.

## Design direction
Minimal ivory/lavender/deep-ink palette, Instrument Serif + Inter, flat elephant illustration, no subheadlines. Welcoming preparation and agency; no fear score, distress-based engagement or claim that the guardian guarantees safety.


## New sick-day journey preview — September 29

Open [sick-day-journey.html](sick-day-journey.html) after downloading it. GitHub renders the file's source rather than running it. Start on suggestions, expand a card, add with +, open My list and check an action to see growth. The back arrow opens concerns. The preview uses sample tasks and same-browser state; manual input does not call a model. Changing inputs explores the UI, not a validated personalization algorithm.

[Editable fragment](source/sick-day-journey.fragment.html) and [standalone export](sick-day-journey.html) are an intentional source/export pair. The fragment is designed for the conversation host; the export supplies a local state wrapper. Both embed the approved original elephant. The host-only optional design controls are guarded; the standalone works without them. These new list/growth screens have not been added to Figma or deployed.

Screenshots: [suggestions](screens/01-suggestions.png), [expanded task](screens/02-expanded.png), [My list](screens/03-my-list.png), [first growth](screens/04-first-growth.png), [completed list](screens/05-completed-list.png), [concerns](screens/06-concerns.png).

The [interaction check](tools/check-preview.cjs) can be run with Node, the `playwright` package available to Node and Microsoft Edge installed: `node design/app/tools/check-preview.cjs`. It opens the standalone export and writes screenshots to the ignored `qa-output` folder. The committed screenshots are reviewed snapshots; this check does not exercise a real AI or account service.
