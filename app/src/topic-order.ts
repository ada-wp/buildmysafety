import { interestEntries } from './interest-labels.ts';
import type { ProfileAnswers, TopicId } from './api-contracts.ts';
import type { ProfileDraft } from './profile-draft.ts';

// Explicit browsing matches, deliberately narrower than related-topic inference.
// These mappings do not establish that reviewed tasks exist for any topic.
const focusTopics: Record<NonNullable<ProfileAnswers['focus']>, readonly TopicId[]> = {
  sick: ['sick_care'],
  home: ['home_confidence', 'unexpected'],
  daily: ['daily_upkeep'],
  people: ['asking_help'],
  peace: ['grounded'],
  change: ['life_change'],
  unsure: []
};

/** First-visit browsing order only. Every topic remains available to choose;
 * a subsequent explicit topic choice belongs to the current request instead.
 */
export function orderTopics(draft: ProfileDraft): Array<[TopicId, string]> {
  const entries = interestEntries.map(([id, label]): [TopicId, string] => [id, label]);
  if (!draft.personalizationEnabled) return entries;

  const selected = new Set(draft.interests);
  const focus = draft.answers.focus;
  const matching = new Set(focus !== null && Object.hasOwn(focusTopics, focus) ? focusTopics[focus] : []);
  // Stable groups avoid numeric scores and do not interpret selection order as
  // strength of preference. Unknown choices cannot add or remove a topic.
  return [
    ...entries.filter(([id]) => selected.has(id) && matching.has(id)),
    ...entries.filter(([id]) => selected.has(id) && !matching.has(id)),
    ...entries.filter(([id]) => !selected.has(id) && matching.has(id)),
    ...entries.filter(([id]) => !selected.has(id) && !matching.has(id))
  ];
}
