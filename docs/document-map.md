# Document map and consolidation record

Reviewed September 29, 2026. The local review inventoried 212 files across the Safety source/output folders and indexed 36 authored Markdown documents. PDF and DOCX text were inspected; the workbook's 60 concern IDs were checked against the assembled JSON. This covers located project files, not a claim to have recovered every conversation or remote attachment.

| Former materials | Canonical home | Handling |
| --- | --- | --- |
| Founder Voice + Philosophy Source Notes | [Founder voice](founder-voice.md) | Direct founder facts, philosophy and provenance merged |
| Pilot Current Plan + Project Instructions + later app decisions | [Current product](current-product.md) | One current reference; old plan clearly archived |
| Three open-source recommendation reports | [Engineering assessment](../research/open-source/decision.md) | Latest decision plus unique candidate/live-test evidence; contradictory old recommendations removed |
| Market report + competitors + social research | [Research](../research/README.md) | Retain unique evidence, source URLs and uncertainty; omit raw search-response duplicates |
| Split research JSON + workbook | [Dataset](../research/data/concerns-resources-evidence.json) + [readable workbook](../research/Safety_Concerns_and_Solutions.xlsx) | One assembled data source and one dated readable export |
| Earlier two-screen task preview | [Current sick-day journey](../design/app/README.md) | Latest active interaction reference; earlier view kept only in local history |
| Figma drafts and elephant options | [Design](../design/README.md) | Preserve file/node references, category mapping and chosen minimal direction |
| Branding setup/About/animation plans | [Website README](../design/website-preview/README.md) and source | Retain implemented behavior, editable source, art and MIT provenance; no duplicated planning briefs |
| Old build/setup PDF + DOCX pairs | [Historical text sources](../archive/README.md) | Keep one editable source of each in Git; original formats in local recovery storage |
| Deployed-pilot local source vs stale Git root | [Pilot source archive](../archive/deployed-pilot/README.md) | Preserve separately, without changing runtime root or deploying |

## Deliberately excluded

Node modules, build outputs, caches, `.wrangler`, generated binding types, runtime logs, Office lock files, repeated QA page renders, empty research placeholders, raw web-search responses and superseded split datasets are not useful active project documents. They were excluded from the curated collection. License notices and original vendor snapshots are intentionally retained, even when similar text appears more than once. Unique rejected design concepts are retained locally, not deleted as duplicates.

The only byte-identical group in the inspected source inventory consists of four raw search/scrape responses; it is excluded. Most redundancy was semantic (multiple evolving plans), so consolidation preserves unique details rather than deleting similar files blindly. The standalone design and editable fragment, and JSON/workbook, are intentional source/export pairs.

## Traceability and recovery

[Source manifest](source-manifest.json) records copied/merged files with SHA-256 and source-root aliases, without exposing local usernames or credentials. Ten superseded document exports and briefs were removed from the old active output folders after every original was saved and checksum-verified in a local recovery ZIP. The [cleanup receipt](cleanup-receipt.json) records exact workspace-relative paths, checksums and the recovery location. Folder index notes point to this collection. Unrelated projects, unique research and the original read-only branding project are untouched.

Repository root runtime files remain byte-for-byte unchanged. This is a private review-branch sync. Before merging, resolve the deployment gate in [technical status](technical-status.md).

## October 1 writing calibration

[Approved V1](prompts/task-generator-v1.md) remains unchanged. [V1.1](prompts/task-writer-v1.1-draft.md) is the candidate writing revision requested by Ada, with a single [calibration data file](prompts/task-writer-calibration.json) holding the teaching example and development/reserved cases. These are intentional baseline/candidate/test artifacts, not competing product briefs. The calibration pack is not a solution pool or a record of completed API tests. Product position and flow still live in the current product and personalization documents above.

## October 11 first real writing test

The [single test record](prompts/evaluations/2026-10-11-sick-day-smoke-test.json) contains the actual Playground input/output, settings, displayed metrics and review notes. It is evaluation evidence, not another specification or a published pool. The original response is preserved separately from suggested wording edits. The earlier teaching examples and twelve evaluation cases retain their existing not-run status.

The [second test record](prompts/evaluations/2026-10-11-urgent-pet-care-test.json) records Ada's urgent pet-care scenario, synthetic assumptions, two checked source records and the actual revised-prompt response. It passed structural checks but exposed an unresolved urgent-help fallback. Neither test record replaces the canonical product decisions or activates urgent behavior in the app.
