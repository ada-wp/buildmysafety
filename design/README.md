# Design collection

There are two distinct design assets: the approved ivory/lavender app direction and a separate cinematic branding website. Neither is a newly deployed app.

## App journey

- [Completion and elephant-growth proposal](app/completion-feedback-proposal.md): research-informed next-screen behavior under discussion; fun, gentle feedback after either completion entry point.
- [Approved task detail](app/task-detail/README.md): Option A as shown in Ada's screenshot, with visible steps and collapsed optional link/purchase rows. The [three-option comparison](app/task-detail-options/README.md) is retained as design history.
- [Interactive sick-day preview and Figma reference](app/README.md): the next list/completion/growth views, plus links to seven editable onboarding frames.
- [My list](app/screens/03-my-list.png) and [first elephant growth](app/screens/04-first-growth.png).
- [Current concern choices](app/concern-content.json): five categories, five choices each, mapped to research IDs.
- [Chosen minimal elephant direction](assets/meet-your-protector-minimal.png) and [revision brief](assets/minimal-revision-prompt.md).

The preview extends the earlier two-screen task concept; keep this version as the active reference. Earlier realistic animal options were rejected and remain in local history. Do not copy Finch's artwork. The new screens await founder review and have not been written into Figma.

## Branding website source

[React/Vite source and run instructions](website-preview/README.md), [third-party notices](website-preview/THIRD_PARTY_LICENSES.txt) and [vendor provenance](vendor/) are preserved together. The approved woman illustration has one canonical file in `website-preview/public/media`; the duplicate documentation copy was omitted. About-page story, SEO/prerender behavior and optional scene motion are documented in the source README. Earlier setup/animation plans were consolidated into it rather than kept as parallel instructions.

Run from `design/website-preview` with `npm ci --ignore-scripts`, then `npm run dev`. The committed lockfile preserves the existing source environment; no dependency upgrade was performed in this cleanup. Review third-party asset rights and dependencies before production use.

## Review focus

Try adding a suggestion, opening My list, completing a task, and returning for more ideas. Check whether the list feels calm and usable, task detail is short enough, and the elephant acknowledges progress without dominating the action. Sample content is for interaction review; personalized AI quality is the next implementation gate.
