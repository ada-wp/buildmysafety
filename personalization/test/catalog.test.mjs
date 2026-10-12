import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, sickCareConcerns } from '../catalog.mjs';
import { prepare, recommend, validateBatch } from '../flow.mjs';
import { OWNER, makeStore } from './fixtures.mjs';

function options(request = {}) {
  return {
    owner: OWNER, store: makeStore(), catalog, allowEditorialReview: true,
    request: { topicId: 'sick_care', concernIds: [], country: 'US', ...request }
  };
}

test('authored catalog remains behind explicit editorial preview permission', async () => {
  const result = await recommend({ ...options(), allowEditorialReview: false });
  assert.equal(result.status, 'unsupported_topic');
  assert.equal(catalog.actions.length, 9);
  assert.equal(new Set(catalog.actions.map(action => action.actionKey)).size, 9);
  assert.equal(new Set(catalog.actions.map(action => action.outcomeGroup)).size, 9);
  for (const item of [...catalog.topics, ...catalog.resources, ...catalog.actions]) {
    assert.equal(item.reviewState, 'editorial_review');
    assert.equal(item.review.founderApproved, false);
    assert.equal(item.review.professionalReview, false);
  }
});

test('every authored task passes the runtime output and copy contract', async () => {
  const current = options({ concernIds: sickCareConcerns.map(concern => concern.id) });
  const prepared = await prepare(current);
  assert.equal(prepared.candidates.length, 9);
  for (const action of catalog.actions) {
    const task = structuredClone(action.task);
    assert.doesNotThrow(() => validateBatch({
      status: 'no_more_ideas', message: 'This is the fitting action available.', tasks: [task]
    }, prepared), action.actionKey);
    assert.equal(action.contentRef, `${action.actionKey}@1`);
    assert.ok(action.concernIds.every(id => sickCareConcerns.some(concern => concern.id === id)));
  }
});

test('each concern receives relevant content without filling missing coverage with other concerns', async () => {
  for (const concern of sickCareConcerns) {
    const result = await recommend(options({ concernIds: [concern.id] }));
    assert.equal(result.status, 'ok');
    assert.ok(result.batch.tasks.length >= 1 && result.batch.tasks.length <= 3);
    assert.ok(result.batch.tasks.every(task => task.concern_ids.includes(concern.id)));
    assert.ok(result.batch.tasks.filter(task => task.resources.length > 0).length <= 1);
    if (['check_in', 'pets'].includes(concern.id)) {
      assert.equal(result.batch.status, 'no_more_ideas');
      assert.equal(result.batch.tasks.length, 2);
    }
  }
});

test('resource eligibility respects country and zero-spend choices', async () => {
  for (const country of ['GB', null]) {
    const prepared = await prepare(options({ country }));
    assert.equal(prepared.resources.size, 0);
    assert.ok(prepared.candidates.every(action => action.task.resources.length === 0));
  }
  const free = await prepare(options({ noSpend: true }));
  assert.ok(free.resources.has('us_211_local'));
  assert.equal(free.resources.has('us_rover_sitting'), false);
  assert.ok(free.candidates.every(action => action.actionKey !== 'sick_08_pet_sitter'));
  const pets = await recommend(options({ concernIds: ['pets'], noSpend: true }));
  assert.deepEqual(pets.batch.tasks.map(task => task.action_key), ['sick_07_pet_care_note']);
  assert.equal(pets.batch.status, 'no_more_ideas');
});

test('pet preparation requires an explicit pet concern, not an inferred household', async () => {
  for (const concernIds of [[], ['food'], ['daily_tasks']]) {
    const prepared = await prepare(options({ concernIds }));
    assert.ok(prepared.candidates.every(action => !action.concernIds.includes('pets')));
  }
  const explicit = await prepare(options({ concernIds: ['pets'] }));
  assert.equal(explicit.candidates.length, 2);
});

test('short tasks can fit without a nearby helper and shown outcomes do not repeat', async () => {
  const current = options({ maxMinutes: 5, localSupport: 'unavailable' });
  const first = await recommend(current);
  assert.equal(first.status, 'ok');
  assert.ok(first.batch.tasks.length > 0);
  assert.ok(first.batch.tasks.every(task => task.estimated_minutes <= 5));
  current.store.change(snapshot => {
    snapshot.taskStates = first.batch.tasks.map(task => ({
      userId: OWNER, actionKey: task.action_key, contentRef: `${task.action_key}@1`,
      shownAt: '2026-10-12T10:00:00Z', savedAt: null, removedAt: null,
      completedAt: null, likedAt: null, feedbackCode: null, feedbackAt: null
    }));
  });
  const next = await recommend(current);
  assert.equal(next.status, 'ok');
  assert.equal(next.batch.status, 'no_more_ideas');
  assert.equal(next.batch.tasks.length, 0);
});
