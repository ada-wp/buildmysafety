import test from 'node:test';
import assert from 'node:assert/strict';
import { orderTopics } from '../src/topic-order.ts';
import { interestEntries } from '../src/interest-labels.ts';
import { emptyDraft } from '../src/profile-draft.ts';
import type { ProfileAnswers, TopicId } from '../src/api-contracts.ts';

const defaultIds = interestEntries.map(([id]) => id);
const ids = (draft: ReturnType<typeof emptyDraft>) => orderTopics(draft).map(([id]) => id);

test('explicit interests lead over an unselected onboarding focus, without hiding other topics', () => {
  const draft = emptyDraft();
  draft.interests = ['pet_care', 'digital'];
  draft.answers.focus = 'sick';
  const ordered = ids(draft);
  assert.deepEqual(ordered.slice(0, 3), ['digital', 'pet_care', 'sick_care']);
  assert.deepEqual(ordered.slice(3), defaultIds.filter(id => !['digital', 'pet_care', 'sick_care'].includes(id)));
  assert.deepEqual(new Set(ordered), new Set(defaultIds));
  assert.equal(ordered.length, defaultIds.length);
});

test('focus matches lead within selected interests while tap order and ties stay neutral', () => {
  const draft = emptyDraft();
  draft.interests = ['rest', 'unexpected', 'digital', 'home_confidence'];
  draft.answers.focus = 'home';
  const before = structuredClone(draft);
  const ordered = ids(draft);
  assert.deepEqual(ordered.slice(0, 4), ['home_confidence', 'unexpected', 'digital', 'rest']);
  assert.deepEqual(draft, before, 'Ordering must not rewrite profile choices.');
  draft.interests.reverse();
  assert.deepEqual(ids(draft), ordered, 'A different selection sequence is not a stronger preference.');
});

test('with no interests, only the explicit conservative focus mapping comes first', () => {
  const cases: Array<[NonNullable<ProfileAnswers['focus']>, TopicId[]]> = [
    ['sick', ['sick_care']], ['home', ['home_confidence', 'unexpected']],
    ['daily', ['daily_upkeep']], ['people', ['asking_help']],
    ['peace', ['grounded']], ['change', ['life_change']], ['unsure', []]
  ];
  for (const [focus, expected] of cases) {
    const draft = emptyDraft();
    draft.answers.focus = focus;
    assert.deepEqual(ids(draft), [...expected, ...defaultIds.filter(id => !expected.includes(id))], focus);
  }
});

test('unknown or skipped focus does not invent matches, and unknown interests cannot inject topics', () => {
  const draft = emptyDraft();
  assert.deepEqual(ids(draft), defaultIds);
  for (const focus of ['future-focus', 'toString', '__proto__']) {
    draft.answers.focus = focus as ProfileAnswers['focus'];
    assert.deepEqual(ids(draft), defaultIds);
  }
  draft.interests = ['future-topic' as TopicId, 'rest', 'rest'];
  assert.deepEqual(ids(draft), ['rest', ...defaultIds.filter(id => id !== 'rest')]);
});

test('turning personalization off restores the original order despite saved interests and focus', () => {
  const draft = emptyDraft();
  draft.interests = ['rest', 'pet_care'];
  draft.answers.focus = 'change';
  draft.personalizationEnabled = false;
  assert.deepEqual(orderTopics(draft), interestEntries);
});

test('other profile answers do not turn circumstances or feelings into category rankings', () => {
  const draft = emptyDraft();
  const before = ids(draft);
  draft.answers.why = 'change';
  draft.answers.home = 'alone';
  draft.answers.constraints = ['energy', 'cost', 'support'];
  draft.answers.difficulty = ['alone', 'too_much'];
  draft.answers.strengths = ['person'];
  draft.answers.hope = ['trust', 'support'];
  draft.answers.style = 'resources';
  draft.answers.country = 'US';
  draft.elephantName = 'Pip';
  assert.deepEqual(ids(draft), before);
});

test('returned entries keep original labels and cannot mutate the shared catalog', () => {
  const draft = emptyDraft();
  draft.interests = ['rest'];
  const before = structuredClone(interestEntries);
  const result = orderTopics(draft);
  for (const [id, label] of result) assert.equal(label, interestEntries.find(([key]) => key === id)?.[1]);
  result[0][1] = 'Caller edit';
  result.pop();
  assert.deepEqual(interestEntries, before);
  assert.deepEqual(orderTopics(emptyDraft()), before);
});
