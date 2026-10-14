import test from 'node:test';
import assert from 'node:assert/strict';
import { createSignInHandoff } from '../src/sign-in-handoff.ts';
import { emptyDraft } from '../src/profile-draft.ts';

test('handoff clones the selected draft and releases it only for the next identity epoch', () => {
  const handoff = createSignInHandoff(() => 1000);
  const draft = emptyDraft();
  draft.answers.home = 'alone';
  draft.answers.constraints = ['time'];
  draft.interests = ['sick_care'];
  const expected = structuredClone(draft);
  handoff.begin(draft, 4);
  draft.answers.home = 'shared';
  draft.answers.constraints.push('cost');
  draft.interests.push('pet_care');
  assert.equal(handoff.peek(4), null);
  assert.equal(handoff.peek(3), null);
  assert.deepEqual(handoff.peek(5), expected);
});

test('repeated reads are independent clones so React remounts cannot mutate the handoff', () => {
  const handoff = createSignInHandoff(() => 1000);
  const draft = emptyDraft();
  draft.answers.hope = ['prepared'];
  handoff.begin(draft, 0);
  const first = handoff.peek(1)!;
  first.answers.hope.push('choice');
  first.interests.push('pet_care');
  const second = handoff.peek(1);
  assert.deepEqual(second, draft);
  assert.notEqual(first, second);
  assert.notEqual(second?.answers, draft.answers);
});

test('handoff is valid before its fifteen-minute boundary and expires exactly at it', () => {
  let time = 1234;
  const handoff = createSignInHandoff(() => time);
  const draft = emptyDraft();
  handoff.begin(draft, 8);
  time += 15 * 60_000 - 1;
  assert.deepEqual(handoff.peek(9), draft);
  time++;
  assert.equal(handoff.peek(9), null);
  time--;
  assert.equal(handoff.peek(9), null, 'an expired handoff cannot be revived by a clock adjustment');
});

test('checking an earlier epoch cannot extend the expiry window', () => {
  let time = 0;
  const handoff = createSignInHandoff(() => time);
  handoff.begin(emptyDraft(), 2);
  time = 14 * 60_000;
  assert.equal(handoff.peek(2), null);
  time = 15 * 60_000;
  assert.equal(handoff.peek(3), null);
});

test('cancelling sign-in clears its pending draft for every later account transition', () => {
  const handoff = createSignInHandoff(() => 1000);
  handoff.begin(emptyDraft(), 6);
  handoff.clear();
  assert.equal(handoff.peek(7), null);
  assert.equal(handoff.peek(8), null);
});

test('a later identity epoch discards the draft instead of handing it to a different account', () => {
  const handoff = createSignInHandoff(() => 1000);
  handoff.begin(emptyDraft(), 6);
  assert.equal(handoff.peek(8), null);
  assert.equal(handoff.peek(7), null, 'the stale expected epoch cannot resurrect a discarded draft');
});

test('starting a new intentional sign-in replaces the previous draft and expiry', () => {
  let time = 1000;
  const handoff = createSignInHandoff(() => time);
  const old = emptyDraft();
  old.interests = ['sick_care'];
  handoff.begin(old, 2);
  time += 14 * 60_000;
  const latest = emptyDraft();
  latest.interests = ['pet_care'];
  handoff.begin(latest, 2);
  time += 2 * 60_000;
  assert.deepEqual(handoff.peek(3), latest);
});
