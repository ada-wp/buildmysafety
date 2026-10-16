# Protector Interaction

Final design package for My Safety · 15 October 2026

**Complete the first task today → send your elephant → wait 30 minutes → receive her return reminder → tap the elephant → read an affirmation in a conversation popup.**

The elephant is your protector. She brings back encouragement for **you**, supporting self-trust, self-love, and feeling steady. The experience takes inspiration from Finch's companion-and-return pattern and uses My Safety's existing elephant and visual style.

## Files

| File | Purpose |
| --- | --- |
| [product-design-brief.md](product-design-brief.md) | Final feature scope, screen flow, copy, and build requirements. |
| [affirmation-library.json](affirmation-library.json) | Supporting editorial library of 13 short second-person affirmations, including the message shown in the approved mockups. |
| [mockups/01-invitation.html](mockups/01-invitation.html) | First task completed: invitation popup with Send your elephant and Later. |
| [mockups/02-journey.html](mockups/02-journey.html) | Journey popup explaining the 30-minute wait. |
| [mockups/03-return-reminder.html](mockups/03-return-reminder.html) | Returned elephant and reminder; tap her to open the conversation. |
| [mockups/04-affirmation-conversation.html](mockups/04-affirmation-conversation.html) | The protector's affirmation conversation popup. |
| [mockups/source/](mockups/source/) | Original approved interactive mockup fragments. |
| [assets/elephant.svg](assets/elephant.svg) | Existing My Safety elephant artwork. |
| [assets/elephant-provenance.json](assets/elephant-provenance.json) | Source of the existing, unchanged elephant artwork. |

## Scope and status

These are design documents and interactive mockups, not an integrated production feature. Open the numbered HTML files in a browser to review the four states. Any sample task counts or task content are illustrative.

GitHub displays the HTML files as source code. Download a numbered HTML file, or clone the repository, and open it in your browser to use the mockup. No application build is required. Artwork is embedded; fonts and icons may require an internet connection. The editable fragments are preserved in `mockups/source/`.

Production work still includes connecting the first-task trigger, saving journey state per user, choosing and retaining one affirmation per journey, and checking the return time when the app opens. A reminder outside the app also needs optional notification permission, scheduling, and delivery integration. The mockups do not deliver push notifications.

The journey delivers only an affirmation. There are no journey tasks, stories, resources, collectibles, streaks, or added check-ins. Existing task behavior, progress, AI suggestions, confidence checks, and navigation remain outside this feature's scope.

This package is the current reference for **Protector Interaction**. Earlier adventure, chapter, milestone, and saved-note proposals are not part of this version.
