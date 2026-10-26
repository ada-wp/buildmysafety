import test from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgementMessage, startingPointMessage } from '../src/elephant-messages.ts';
import { emptyDraft } from '../src/profile-draft.ts';
import { interestEntries } from '../src/interest-labels.ts';
import type { ProfileAnswers } from '../src/api-contracts.ts';

test('explicit overwhelm takes priority over support difficulty and curiosity', () => {
  const mixed = acknowledgementMessage({ why: 'curious', difficulty: ['alone', 'support'], feeling: 'overwhelmed' });
  assert.equal(mixed.body, acknowledgementMessage({ why: null, difficulty: [], feeling: 'overwhelmed' }).body);
  assert.match(mixed.body, /take this slowly/);
  assert.doesNotMatch(mixed.body, /diagnos|unsafe|protect you|anxiety/i);
});

test('support acknowledgment follows stated difficulty without claiming help is available', () => {
  for (const difficulty of ['alone', 'support'] as const) {
    const message = acknowledgementMessage({ why: 'curious', difficulty: [difficulty], feeling: 'okay' });
    assert.match(message.body, /capable and still want support/);
    assert.doesNotMatch(message.body, /friend will|family will|help is available|you are alone/i);
  }
});

test('curiosity and thinking ahead receive preparation language, not an invented worry', () => {
  const curious = acknowledgementMessage({ why: 'curious', difficulty: [], feeling: null });
  const okay = acknowledgementMessage({ why: null, difficulty: [], feeling: 'okay' });
  assert.deepEqual(curious, okay);
  assert.match(curious.body, /preparation/);
  assert.match(curious.body, /enjoying life/);
});

test('skipped or unrecognized feeling gives a warm neutral response', () => {
  const neutral = acknowledgementMessage({ why: null, difficulty: [], feeling: null });
  for (const feeling of ['private', 'future-option', 'uncertain', 'on_mind']) {
    assert.deepEqual(acknowledgementMessage({ why: null, difficulty: [], feeling }), neutral);
  }
  assert.doesNotMatch(neutral.body, /overwhelmed|anxious|lonely|afraid|unsafe|low energy/i);
});

test('sick-day starting point uses the approved three-sentence example', () => {
  const draft = emptyDraft();
  draft.answers.focus = 'sick';
  draft.answers.constraints = ['energy', 'cost'];
  draft.answers.style = 'one';
  const message = startingPointMessage(draft);
  assert.equal(message.body, 'Let’s start small with sick days. We’ll look for something manageable, using what you already have. You choose what feels useful enough to add to your list.');
});

test('one explicit interest leads over old focus; multiple interests do not acquire an arbitrary priority', () => {
  const draft = emptyDraft();
  draft.answers.focus = 'sick';
  draft.interests = ['pet_care'];
  assert.match(startingPointMessage(draft).body, /pet-care plans/);
  assert.doesNotMatch(startingPointMessage(draft).body, /sick days/);
  draft.interests = ['pet_care', 'digital'];
  const multiple = startingPointMessage(draft);
  draft.interests.reverse();
  assert.deepEqual(startingPointMessage(draft), multiple);
  assert.match(multiple.body, /what you’d like to explore/);
  assert.doesNotMatch(multiple.body, /pet-care plans|privacy online|sick days/);
});

test('missing preferences make no assumptions; opting out ignores populated preference fields', () => {
  const draft = emptyDraft();
  const unknown = startingPointMessage(draft);
  assert.doesNotMatch(unknown.body, /sick days|pet-care|already have|nearby help|low energy/);
  draft.personalizationEnabled = false;
  const optedOut = startingPointMessage(draft);
  draft.answers.focus = 'sick';
  draft.answers.constraints = ['energy', 'cost'];
  draft.answers.style = 'one';
  draft.interests = ['pet_care'];
  assert.deepEqual(startingPointMessage(draft), optedOut);
  assert.match(optedOut.body, /own pace/);
});

test('help styles keep a personal invitation without repeating navigation instructions', () => {
  const draft = emptyDraft();
  for (const [style, expected] of [
    ['one', /start small/], ['choice', /You choose what feels useful/],
    ['understand', /what’s involved/], ['resources', /useful resources/]
  ] as const) {
    draft.answers.style = style;
    const message = startingPointMessage(draft);
    assert.match(message.body, expected);
    assert.match(message.body, /choos(?:e|ing).*add/);
    assert.doesNotMatch(message.body, /every topic|alternatives|Three ideas/);
  }
});

test('messages stay short and read-only across all single topics and presentation styles', () => {
  const draft = emptyDraft();
  const constraints: ProfileAnswers['constraints'][] = [[], ['cost'], ['energy', 'cost'],
    ['time', 'cost'], ['energy', 'time'], ['energy'], ['time'], ['support'], ['start'], ['none']];
  for (const [topic] of interestEntries) {
    draft.interests = [topic];
    for (const style of [null, 'one', 'choice', 'understand', 'resources'] as const) {
      draft.answers.style = style;
      for (const values of constraints) {
        draft.answers.constraints = values;
        const before = structuredClone(draft);
        const message = startingPointMessage(draft);
        assert.ok(message.body.split(/\s+/u).length <= 45, `${topic}/${style}: ${message.body}`);
        assert.deepEqual(draft, before);
        assert.doesNotMatch(message.body, /undefined|\[object|https?:|guarantee|safety score|earned|reward/i);
      }
    }
  }
});

test('temporary free text and irrelevant profile fields cannot enter authored messages', () => {
  const draft = emptyDraft();
  const expected = startingPointMessage(draft);
  const withExtra = { ...draft, note: 'RAW_PRIVATE_NOTE', feeling: 'overwhelmed', elephantName: 'RAW_NAME' };
  withExtra.answers.country = 'US';
  withExtra.answers.home = 'alone';
  assert.deepEqual(startingPointMessage(withExtra), expected);
});
