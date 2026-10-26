# My Safety — Velorah branding preview

This local first pass keeps the original Velorah layout, black palette, fonts, video backgrounds, glass buttons, section order, animation and feature toggles. It changes branding and content for My Safety.

## Run

- `npm install --ignore-scripts`
- `npm run dev` — local preview at http://127.0.0.1:5173/
- `npm run build` — TypeScript check and production build
- `npm run preview` — built preview at http://127.0.0.1:4173/

The lockfile pins installed versions. Dependency lifecycle scripts were disabled during installation.

## Editing content

Start with `src/content/siteContent.ts` for branding, hero wording, navigation, four safety areas, and the process steps. Supporting prose stays beside the original components in `src/components/velorah`. The original black/white design tokens and animation live in `styles.tsx`; `src/styles/theme.css` only maps them to Tailwind 4.

The hero, statement and closing MP4 backgrounds are requested directly from hirael.com. The feature card uses Ada's approved woman illustration at `public/media/my-safety-woman.png`, with free browser animation in `quiet-scene.tsx` and `src/styles/site.css`. It is an animated still: continuous image drift and zoom, twinkling stars and floating warm lights. Motion starts automatically and loops until manually paused; reduced-motion preferences start it paused, with a visible Play button to opt in. It does not animate the woman's body or hair. Replace that image to change the scene; adjust the `quiet-scene` CSS to change the motion. `Feature` still accepts a `videoSrc` for a future video replacement.

Inter and Instrument Serif are served locally from npm font packages. There are no forms, email collection, scan questions, personalized results, or live My Safety API calls in this pass. Buttons navigate between the original sections. The feature indicator identifies the selected area, not a safety score.

## About Me page

Open `/about` to see Ada's story in the Asme introduction and split image/text layout, using the shared Velorah navigation, fonts, palette and footer. The image is an illustration, not a photograph of Ada. Its browser motion is free and continuous by default. No generated video service is used.

- Copy and metadata: `src/content/aboutContent.ts`.
- Page layout: `src/pages/about.tsx`.
- Navigation links: `src/content/siteContent.ts`.
- Image: `public/media/my-safety-woman.png`.

`npm run build` now prerenders the About page to `dist/about/index.html` and `dist/about.html` through `tools/prerender-about.mjs`, supporting both `/about` and `/about/` on the local production preview. The built HTML contains the complete story, title, description, and factual AboutPage/Person structured data; JavaScript adds the controls. This provides readable content for visitors and search crawlers without requiring JavaScript. It does not guarantee AI citations or rankings.

When a public destination is chosen, build with `SITE_URL` set to the real public origin to generate the About canonical URL, Open Graph URL and a sitemap. These are deliberately omitted from the local build. Before deploying, configure hosting to serve `/about` from `about/index.html` and verify a direct visit and refresh. The existing live website has not been deployed or changed.

Asme source and its provenance are preserved in `../vendor/asme`; its MIT notice is included in `THIRD_PARTY_LICENSES.txt`.

## Source and scope

The implementation uses the current Velorah registry snapshot saved in `../vendor/velorah/velorah.registry.json`, corresponding to Hirael commit `72fa5c747912adb192b0a8dd0306bad044afbe9f`. The two official Toggle/ToggleGroup controls are retained from that same commit. Original MIT notices remain in the components and `THIRD_PARTY_LICENSES.txt`. The earlier pinned source is preserved unchanged in `../vendor/velorah/upstream`.

Vite/Tailwind configuration, self-hosted font adapters, branding/copy and working anchor destinations are local adaptations. The source styling was preserved. No site was registered, published or deployed.

The superseded custom apartment concept remains in the original local project, outside this curated collection. Its placeholder questions are not product requirements.

Selected original browser-check screenshots are under `artifacts/`; raw test outputs remain in the local source project. The setup-specific check script uses the bundled Playwright package and installed Chrome on this machine.


Consolidated September 29 without modifying the application code. This branding site is separate from the ivory/lavender app preview. The existing local checks were not rerun as a production-site test. External video assets require a rights/hosting review before reuse in a public release.
