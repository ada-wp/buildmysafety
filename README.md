# My Safety

A peaceful place to embrace solo living and enjoy it fully. Practical knowledge, preparation and support, one manageable action at a time.

## Start here

| Need | Canonical reference |
| --- | --- |
| What we are building now | [Current product](docs/current-product.md) |
| Latest writing prompt — candidate, not live | [Shared discovery writer](docs/prompts/discovery-writer-core.md) + selected [Sick days & care](docs/prompts/sick-care-discovery-draft.md) or [My home](docs/prompts/my-home-discovery-draft.md) module |
| My home content and ranking | [56-task review package](personalization/content-candidates/my-home-v0/README.md) — research, concerns, ranked options and examples; not deployed |
| Approved AI task-generation prompt | [Task generator V1](docs/prompts/task-generator-v1.md) |
| Writing calibration before building the pool | [V1.1 draft and teaching plan](docs/prompts/task-writer-v1.1-draft.md) — not activated |
| Memory storage and API test flow | [Cloud personalization module](personalization/README.md) — D1 staging verified; email login and live backend AI call pending |
| Mobile-web implementation | [App foundation](app/README.md) — shared cloud client and preserved onboarding; real email provider is next |
| First real writing test | [October 11 sick-day result and review](docs/prompts/evaluations/2026-10-11-sick-day-smoke-test.json) — founder review pending |
| Urgent resource-discovery test | [October 11 pet-care result and review](docs/prompts/evaluations/2026-10-11-urgent-pet-care-test.json) — urgent handling needs revision |
| Philosophy and founder voice | [Founder voice](docs/founder-voice.md) |
| What works, what is still a prototype | [Technical status](docs/technical-status.md) |
| Try the sick-day interaction | Download [the standalone preview](design/app/sick-day-journey.html) and open it in a browser; GitHub's file viewer shows source |
| App screens, Figma and landing-page source | [Design index](design/README.md) |
| Customer research, resources and spreadsheet | [Research index](research/README.md) |
| Build versus reuse decision | [Engineering assessment](research/open-source/decision.md) |
| Where older files went | [Document map](docs/document-map.md) |

## Repository and deployment status

This collection was consolidated on 29 September 2026 on a review branch. The root static website is older than the locally saved Cloudflare pilot. Its runtime files are unchanged by this consolidation. The pilot's separate source is preserved in [archive/deployed-pilot](archive/deployed-pilot/README.md); the React branding website and clickable app preview are separate artifacts, not an integrated deployed app.

**Do not deploy this repository root or merge this collection into a deploy-triggering branch until the deployment source and public output directory are reconciled.** The old Pages setting publishes `/`; that could expose project research and archived source. This private research collection is not intended as public website content. The sync commit uses Cloudflare's `[CF-Pages-Skip]` prefix to skip automatic deployment.

The app preview uses sample tasks. It does not call OpenAI, create an account or send reminders. Follow the technical status before describing any feature as live.
