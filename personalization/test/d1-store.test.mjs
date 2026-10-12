import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createD1Store } from '../d1-store.mjs';
import { makeCatalog } from './fixtures.mjs';
import { hash } from '../contracts.mjs';

const migration = readFileSync(new URL('../migrations/0001_user_memory.sql', import.meta.url), 'utf8');
const T0 = '2026-10-11T12:00:00.000Z';
const T1 = '2026-10-11T13:00:00.000Z';
const T2 = '2026-10-11T14:00:00.000Z';

// Test double ONLY. Product code uses env.MEMORY_DB and never node:sqlite/local files.
// SQLite exercises real migration/query semantics; it does not emulate D1 networking.
function d1Double(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(migration);
  sqlite.exec(readFileSync(new URL('../migrations/0002_task_journey.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const binding = {
    beforeBatch: null,
    beforeStatement: null,
    failBatchAt: null,
    prepare(sql) {
      const make = values => ({
        sql, values,
        bind(...next) { return make(next); },
        async first() {
          binding.beforeStatement?.(sql);
          const row = sqlite.prepare(sql).get(...values);
          return row ? { ...row } : null;
        },
        async all() { return { success: true, results: sqlite.prepare(sql).all(...values).map(row => ({ ...row })) }; },
        async run() {
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, results: [], meta: { changes: Number(result.changes) } };
        }
      });
      return make([]);
    },
    async batch(statements) {
      const hook = binding.beforeBatch;
      binding.beforeBatch = null;
      if (hook) await hook(statements);
      sqlite.exec('BEGIN');
      try {
        const results = statements.map((statement, index) => {
          if (binding.failBatchAt === index) throw new Error('Synthetic batch failure');
          const rows = sqlite.prepare(statement.sql).all(...statement.values).map(row => ({ ...row }));
          const changes = sqlite.prepare('SELECT changes() AS n').get().n;
          return { success: true, results: rows, meta: { changes } };
        });
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
  return { binding, sqlite };
}

const code = wanted => error => error.code === wanted;
const state = (owner, changes = {}) => ({ userId: owner, actionKey: 'easy_meals', contentRef: 'easy_meals@1',
  shownAt: T0, savedAt: T1, removedAt: null, completedAt: null, likedAt: null,
  feedbackCode: null, feedbackAt: null, ...changes });

test('D1 profile/task state persists across adapter instances and owners stay isolated', async t => {
  const { binding } = d1Double(t);
  const first = createD1Store(binding, { now: () => T0 });
  const created = await first.createProfile('alice', { answers: { home: 'alone', country: 'US' }, interests: ['sick_care'] });
  assert.equal(created.userId, 'alice');
  assert.equal(created.revision, 1);
  assert.equal(created.updatedAt, T0);
  assert.equal(created.answers.focus, null);
  await first.createProfile('bob', { answers: { home: 'shared' } });
  await first.saveTaskState('alice', state('alice'));
  await first.saveTaskState('bob', state('bob', { contentRef: 'easy_meals@2', likedAt: T1 }));
  const reopenedAdapter = createD1Store(binding);
  const alice = await reopenedAdapter.readSnapshot('alice');
  const bob = await reopenedAdapter.readSnapshot('bob');
  assert.equal(alice.profile.answers.home, 'alone');
  assert.equal(alice.taskStates.length, 1);
  assert.equal(alice.taskStates[0].contentRef, 'easy_meals@1');
  assert.equal(bob.taskStates[0].contentRef, 'easy_meals@2');
  assert.equal(alice.stateVersion, '2');
  await assert.rejects(first.saveTaskState('alice', state('bob')), code('owner_mismatch'));
  assert.equal((await first.readSnapshot('bob')).stateVersion, '2');
});

test('profile writes reject server-owned fields, raw notes, invalid countries, and duplicates', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await assert.rejects(store.createProfile('alice', { userId: 'bob' }), code('invalid_profile_changes'));
  await assert.rejects(store.createProfile('alice', { answers: { note: 'private narrative' } }), code('invalid_profile'));
  await assert.rejects(store.createProfile('alice', { answers: { country: 'ZZ' } }), code('invalid_country'));
  await assert.rejects(store.createProfile('alice', { interests: null }), code('invalid_profile'));
  await assert.rejects(store.createProfile('alice', { personalizationEnabled: null }), code('invalid_profile'));
  await store.createProfile('alice');
  await assert.rejects(store.createProfile('alice', { interests: ['pet_care'] }), code('profile_exists'));
  await assert.rejects(store.editProfile('alice', 1, { signalsResetAt: T1 }), code('invalid_profile_changes'));
  await assert.rejects(store.editProfile('alice', 1, { email: 'alice@example.invalid' }), code('invalid_profile_changes'));
  assert.deepEqual((await store.readSnapshot('alice')).profile.interests, []);
  await assert.rejects(store.readSnapshot('missing'), code('profile_not_found'));
  await assert.rejects(store.readSnapshot(''), code('authentication_required'));
});

test('profile edits merge explicit answers and enforce optimistic concurrency', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice', { answers: { home: 'alone', country: 'US' } });
  const edited = await store.editProfile('alice', 1, { answers: { style: 'one' }, interests: ['pet_care'] });
  assert.equal(edited.revision, 2);
  assert.equal(edited.answers.home, 'alone');
  assert.equal(edited.answers.style, 'one');
  assert.equal(edited.updatedAt, '2026-10-11T12:00:00.001Z');
  await assert.rejects(store.editProfile('alice', 1, { interests: ['digital'] }), code('stale_profile'));
  const saved = await store.readSnapshot('alice');
  assert.deepEqual(saved.profile.interests, ['pet_care']);
  assert.equal(saved.stateVersion, '2');
});

test('edit CAS also rejects a competing revision after the initial read', async t => {
  const { binding, sqlite } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  binding.beforeStatement = sql => {
    if (!sql.startsWith('UPDATE memory_profiles')) return;
    binding.beforeStatement = null;
    sqlite.prepare('UPDATE memory_profiles SET revision = revision + 1, state_version = state_version + 1 WHERE user_id = ?').run('alice');
  };
  await assert.rejects(store.editProfile('alice', 1, { interests: ['digital'] }), code('stale_profile'));
  assert.deepEqual((await store.readSnapshot('alice')).profile.interests, []);
});

test('task saves replace one current row, pin content, and preserve the first shown marker', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.saveTaskState('alice', state('alice'));
  await store.saveTaskState('alice', state('alice'));
  assert.equal((await store.readSnapshot('alice')).stateVersion, '2');
  const changed = await store.saveTaskState('alice', state('alice', { shownAt: T2, likedAt: T1 }));
  assert.equal(changed.shownAt, T0);
  const snapshot = await store.readSnapshot('alice');
  assert.equal(snapshot.taskStates.length, 1);
  assert.equal(snapshot.stateVersion, '3');
  await assert.rejects(store.saveTaskState('alice', state('alice', { contentRef: 'easy_meals@2', completedAt: T2 })), code('immutable_content_ref'));
  assert.deepEqual(await store.readSnapshot('alice'), snapshot);
  await store.saveTaskState('alice', state('alice', { savedAt: null, removedAt: T2 }));
  await store.saveTaskState('alice', state('alice', { savedAt: T2, removedAt: null }));
  assert.equal((await store.readSnapshot('alice')).taskStates[0].contentRef, 'easy_meals@1');
});

test('task state rejects impossible combinations and requires an existing profile', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding);
  await assert.rejects(store.saveTaskState('alice', state('alice')), code('profile_not_found'));
  await store.createProfile('alice');
  await assert.rejects(store.saveTaskState('alice', state('alice', { removedAt: T2 })), code('invalid_task_state'));
  await assert.rejects(store.saveTaskState('alice', state('alice', { feedbackCode: 'helpful' })), code('invalid_task_state'));
  await assert.rejects(store.saveTaskState('alice', { ...state('alice'), note: 'not allowed' }), code('invalid_task_state'));
  assert.equal((await store.readSnapshot('alice')).taskStates.length, 0);
});

test('reset is atomic, clears only preference signals, and keeps owned task progress', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T2 });
  await store.createProfile('alice');
  await store.createProfile('bob');
  await store.saveTaskState('alice', state('alice', { likedAt: T1, completedAt: T1, feedbackCode: 'helpful', feedbackAt: T1 }));
  await store.saveTaskState('bob', state('bob', { likedAt: T1, feedbackCode: 'helpful', feedbackAt: T1 }));
  const before = await store.readSnapshot('alice');
  const reset = await store.resetPreferences('alice', 1);
  assert.equal(reset.revision, 2);
  assert.ok(Date.parse(reset.signalsResetAt) > Date.parse(T1));
  const after = await store.readSnapshot('alice');
  assert.deepEqual(after.taskStates[0], { ...before.taskStates[0], likedAt: null, feedbackCode: null, feedbackAt: null });
  assert.equal(after.stateVersion, '3');
  assert.equal((await store.readSnapshot('bob')).taskStates[0].likedAt, T1);
  await assert.rejects(store.resetPreferences('alice', 1), code('stale_profile'));
  assert.deepEqual(await store.readSnapshot('alice'), after);
});

test('stale reset racing after its read does not clear likes or feedback', async t => {
  const { binding, sqlite } = d1Double(t);
  const store = createD1Store(binding, { now: () => T2 });
  await store.createProfile('alice');
  await store.saveTaskState('alice', state('alice', { likedAt: T1, feedbackCode: 'helpful', feedbackAt: T1 }));
  binding.beforeBatch = () => {
    sqlite.prepare('UPDATE memory_profiles SET revision = revision + 1, state_version = state_version + 1 WHERE user_id = ?').run('alice');
  };
  await assert.rejects(store.resetPreferences('alice', 1), code('stale_profile'));
  const after = await store.readSnapshot('alice');
  assert.equal(after.profile.signalsResetAt, null);
  assert.equal(after.taskStates[0].likedAt, T1);
  assert.equal(after.taskStates[0].feedbackCode, 'helpful');
});

test('D1 batch failure rolls back the task write and state-version update together', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding);
  await store.createProfile('alice');
  binding.failBatchAt = 1;
  await assert.rejects(store.saveTaskState('alice', state('alice')), code('storage_unavailable'));
  binding.failBatchAt = null;
  const after = await store.readSnapshot('alice');
  assert.equal(after.taskStates.length, 0);
  assert.equal(after.stateVersion, '1');
});

test('shown batch is an atomic server-stamped insertion and cannot rewrite existing actions', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  const result = await store.markShownBatch('alice', '1', [
    { actionKey: 'easy_meals', contentRef: 'easy_meals@1' },
    { actionKey: 'rest_station', contentRef: 'rest_station@1' }
  ]);
  assert.equal(result.stateVersion, '2');
  assert.equal(result.taskStates.length, 2);
  assert.equal(result.taskStates[0].shownAt, '2026-10-11T12:00:00.001Z');
  assert.equal(result.taskStates[0].savedAt, null);
  const before = await store.readSnapshot('alice');
  await assert.rejects(store.markShownBatch('alice', '2', [
    { actionKey: 'easy_meals', contentRef: 'easy_meals@2' },
    { actionKey: 'defer_chore', contentRef: 'defer_chore@1' }
  ]), code('task_already_shown'));
  assert.deepEqual(await store.readSnapshot('alice'), before);
  await assert.rejects(store.markShownBatch('alice', '1', [{ actionKey: 'defer_chore', contentRef: 'defer_chore@1' }]), code('stale_state'));
  await assert.rejects(store.markShownBatch('alice', '2', [{ actionKey: 'x', contentRef: 'x@1', shownAt: T0 }]), code('invalid_shown_batch'));
  await assert.rejects(store.markShownBatch('alice', '2', []), code('invalid_shown_batch'));
  await assert.rejects(store.markShownBatch('alice', '2', Array.from({ length: 4 }, (_, i) => ({ actionKey: `x${i}`, contentRef: `x${i}@1` }))), code('invalid_shown_batch'));
  await assert.rejects(store.markShownBatch('alice', '2', [
    { actionKey: 'x', contentRef: 'x@1' }, { actionKey: 'x', contentRef: 'x@2' }
  ]), code('duplicate_action'));
});

test('shown batch rolls back all inserted markers and the version if a later insertion fails', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  binding.failBatchAt = 2;
  await assert.rejects(store.markShownBatch('alice', '1', [
    { actionKey: 'easy_meals', contentRef: 'easy_meals@1' },
    { actionKey: 'rest_station', contentRef: 'rest_station@1' }
  ]), code('storage_unavailable'));
  binding.failBatchAt = null;
  const after = await store.readSnapshot('alice');
  assert.equal(after.stateVersion, '1');
  assert.deepEqual(after.taskStates, []);
});

test('task action timestamps are server-owned and changes preserve content and completion', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  const liked = await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'like' });
  assert.equal(liked.stateVersion, '3');
  assert.equal(liked.changed, true);
  assert.ok(Date.parse(liked.task.likedAt) > Date.parse(liked.task.shownAt));
  const saved = await store.applyTaskAction('alice', '3', 'easy_meals', { type: 'save' });
  assert.ok(Date.parse(saved.task.savedAt) > Date.parse(saved.task.likedAt));
  const completed = await store.applyTaskAction('alice', '4', 'easy_meals', { type: 'complete' });
  const removed = await store.applyTaskAction('alice', '5', 'easy_meals', { type: 'remove' });
  assert.equal(removed.task.savedAt, null);
  assert.equal(removed.task.completedAt, completed.task.completedAt);
  assert.equal(removed.task.contentRef, 'easy_meals@1');
  assert.equal(removed.task.shownAt, liked.task.shownAt);
  const duplicateComplete = await store.applyTaskAction('alice', '6', 'easy_meals', { type: 'complete' });
  assert.equal(duplicateComplete.changed, false);
  assert.equal(duplicateComplete.stateVersion, '6');
  await store.applyTaskAction('alice', '6', 'easy_meals', { type: 'unlike' });
  const feedback = await store.applyTaskAction('alice', '7', 'easy_meals', { type: 'feedback', code: 'helpful' });
  assert.equal(feedback.task.likedAt, null);
  assert.equal(feedback.task.feedbackCode, 'helpful');
  const duplicateFeedback = await store.applyTaskAction('alice', '8', 'easy_meals', { type: 'feedback', code: 'helpful' });
  assert.equal(duplicateFeedback.changed, false);
  assert.equal(duplicateFeedback.stateVersion, '8');
  const clear = await store.applyTaskAction('alice', '8', 'easy_meals', { type: 'feedback', code: null });
  assert.equal(clear.task.feedbackAt, null);
});

test('duplicate events are no-ops only with a current version; stale retries require refresh', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  const saved = await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' });
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' }), code('stale_state'));
  const repeated = await store.applyTaskAction('alice', saved.stateVersion, 'easy_meals', { type: 'save' });
  assert.deepEqual(repeated, { ...saved, changed: false });
  assert.equal((await store.readSnapshot('alice')).taskStates.length, 1);
});

test('task events reject unknown/cross-user actions, invalid feedback, and caller metadata', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.createProfile('bob');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  await assert.rejects(store.applyTaskAction('bob', '1', 'easy_meals', { type: 'complete' }), code('task_not_found'));
  await assert.rejects(store.applyTaskAction('alice', '2', 'missing', { type: 'complete' }), code('task_not_found'));
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save', savedAt: T2 }), code('invalid_event'));
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save', userId: 'bob' }), code('invalid_event'));
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'feedback', code: 'invented' }), code('invalid_event'));
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'feedback' }), code('invalid_event'));
  await assert.rejects(store.applyTaskAction('alice', 2, 'easy_meals', { type: 'save' }), code('invalid_state_version'));
  assert.equal((await store.readSnapshot('bob')).taskStates.length, 0);
  assert.equal((await store.readSnapshot('alice')).stateVersion, '2');
});

test('reset during an in-flight task action makes that action stale without restoring old signals', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T2 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'like' });
  const race = async statements => {
    if (!statements[0].sql.startsWith('UPDATE memory_profiles')) { binding.beforeBatch = race; return; }
    await store.resetPreferences('alice', 1);
  };
  binding.beforeBatch = race;
  await assert.rejects(store.applyTaskAction('alice', '3', 'easy_meals', { type: 'save' }), code('stale_state'));
  const after = await store.readSnapshot('alice');
  assert.equal(after.profile.revision, 2);
  assert.equal(after.stateVersion, '4');
  assert.equal(after.taskStates[0].likedAt, null);
  assert.equal(after.taskStates[0].savedAt, null);
  const newLike = await store.applyTaskAction('alice', '4', 'easy_meals', { type: 'like' });
  assert.ok(Date.parse(newLike.task.likedAt) > Date.parse(after.profile.signalsResetAt));
});

test('a conflicting task action after the read wins and the stale event cannot overwrite it', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  const race = async statements => {
    if (!statements[0].sql.startsWith('UPDATE memory_profiles')) { binding.beforeBatch = race; return; }
    await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'remove' });
  };
  binding.beforeBatch = race;
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' }), code('stale_state'));
  const after = await store.readSnapshot('alice');
  assert.equal(after.stateVersion, '3');
  assert.equal(after.taskStates[0].savedAt, null);
  assert.ok(after.taskStates[0].removedAt);
});

test('a task action between reset read and commit makes the reset stale without erasing the new choice', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  binding.beforeBatch = () => store.applyTaskAction('alice', '2', 'easy_meals', { type: 'like' });
  await assert.rejects(store.resetPreferences('alice', 1), code('stale_profile'));
  const after = await store.readSnapshot('alice');
  assert.equal(after.profile.revision, 1);
  assert.equal(after.profile.signalsResetAt, null);
  assert.equal(after.stateVersion, '3');
  assert.ok(after.taskStates[0].likedAt);
});

test('reset cutoff is later than existing save signals even when the server clock has not advanced', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.markShownBatch('alice', '1', [{ actionKey: 'easy_meals', contentRef: 'easy_meals@1' }]);
  const saved = await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' });
  await store.applyTaskAction('alice', '3', 'easy_meals', { type: 'like' });
  const reset = await store.resetPreferences('alice', 1);
  const after = await store.readSnapshot('alice');
  assert.equal(after.taskStates[0].savedAt, saved.task.savedAt);
  assert.ok(Date.parse(reset.signalsResetAt) > Date.parse(saved.task.savedAt));
  assert.equal(after.taskStates[0].likedAt, null);
  const likedAgain = await store.applyTaskAction('alice', after.stateVersion, 'easy_meals', { type: 'like' });
  assert.ok(Date.parse(likedAgain.task.likedAt) > Date.parse(reset.signalsResetAt));
});

function delivery(keys = ['easy_meals'], requestId = 'batch_request_0001') {
  const actions = keys.map(key => makeCatalog().actions.find(action => action.actionKey === key));
  const request = { topicId: 'sick_care', concernIds: ['low_energy'] };
  return {
    requestId, requestHash: hash(request), request,
    contents: actions.map(action => ({ actionKey: action.actionKey, contentRef: action.contentRef, content: action.task })),
    result: { status: 'ok', source: 'pool', delivery: 'shown', reviewRequired: true,
      batch: { status: 'no_more_ideas', message: 'One useful option.', tasks: actions.map(action => action.task) } }
  };
}

test('durable delivery stores content once, recovers current batch and isolates owners across adapter instances', async t => {
  const { binding, sqlite } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice');
  await store.createProfile('bob');
  const content = delivery();
  assert.deepEqual(await store.readLatestBatch('bob'), { result: null, stateVersion: '1' });
  assert.deepEqual(await store.deliverBatch('alice', '1', content), { stateVersion: '2' });
  await store.deliverBatch('bob', '1', content);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_content').get().n, 1);
  const fresh = createD1Store(binding);
  const recovered = await fresh.readLatestBatch('alice');
  assert.equal(recovered.result.requestId, content.requestId);
  assert.equal(recovered.result.replayed, true);
  assert.deepEqual(recovered.result.batch.tasks, content.result.batch.tasks);
  const listing = await fresh.readTasks('alice');
  assert.equal(listing.tasks[0].state.userId, 'alice');
  assert.deepEqual(listing.tasks[0].content, content.contents[0].content);
  assert.equal(listing.earnedCount, 0);
  await store.applyTaskAction('alice', listing.stateVersion, 'easy_meals', { type: 'save' });
  assert.equal((await fresh.readLatestBatch('alice')).stateVersion, '3');
  assert.equal((await fresh.readTasks('bob')).tasks[0].state.savedAt, null);
  const savedJson = sqlite.prepare('SELECT payload_json FROM memory_latest_batch WHERE user_id = ?').get('alice').payload_json;
  assert.equal(savedJson.includes('Choose two easy meals'), false, 'per-user batch stores references rather than duplicate content');
});

test('existing task content cannot be overwritten by another owner with the same content version', async t => {
  const { binding, sqlite } = d1Double(t);
  const store = createD1Store(binding);
  await store.createProfile('alice'); await store.createProfile('bob');
  await store.deliverBatch('alice', '1', delivery());
  const modified = delivery();
  modified.contents[0].content.title = 'Changed without a version';
  await assert.rejects(store.deliverBatch('bob', '1', modified), code('immutable_content_ref'));
  assert.equal((await store.readSnapshot('bob')).stateVersion, '1');
  assert.equal((await store.readTasks('alice')).tasks[0].content.title, 'Choose two easy meals');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_latest_batch').get().n, 1);
});

test('delivery transaction rollback never consumes unseen actions or replaces recovery record', async t => {
  const { binding, sqlite } = d1Double(t);
  const store = createD1Store(binding);
  await store.createProfile('alice');
  await store.deliverBatch('alice', '1', delivery());
  const before = await store.readSnapshot('alice');
  binding.failBatchAt = 3;
  await assert.rejects(store.deliverBatch('alice', '2', delivery(['rest_station'], 'batch_request_0002')), code('storage_unavailable'));
  binding.failBatchAt = null;
  assert.deepEqual(await store.readSnapshot('alice'), before);
  assert.equal((await store.readLatestBatch('alice')).result.requestId, 'batch_request_0001');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_content').get().n, 1);
});

test('a task update racing batch delivery keeps current recovery and prevents unobserved inserts', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding);
  await store.createProfile('alice');
  await store.deliverBatch('alice', '1', delivery());
  binding.beforeBatch = () => store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' });
  await assert.rejects(store.deliverBatch('alice', '2', delivery(['rest_station'], 'batch_request_0002')), code('stale_state'));
  const after = await store.readTasks('alice');
  assert.equal(after.tasks.length, 1);
  assert.ok(after.tasks[0].state.savedAt);
  assert.equal((await store.readLatestBatch('alice')).result.requestId, 'batch_request_0001');
});

test('completion award survives undo, remove, re-add, repeat and stale retries without double growth', async t => {
  const { binding } = d1Double(t);
  const store = createD1Store(binding, { now: () => T0 });
  await store.createProfile('alice'); await store.createProfile('bob');
  await store.deliverBatch('alice', '1', delivery());
  await assert.rejects(store.applyTaskAction('alice', '2', 'easy_meals', { type: 'complete' }), code('task_not_saved'));
  await store.applyTaskAction('alice', '2', 'easy_meals', { type: 'save' });
  const completed = await store.applyTaskAction('alice', '3', 'easy_meals', { type: 'complete' });
  assert.equal(completed.awardEarned, true); assert.equal(completed.earnedCount, 1);
  await assert.rejects(store.applyTaskAction('alice', '3', 'easy_meals', { type: 'complete' }), code('stale_state'));
  const repeat = await store.applyTaskAction('alice', '4', 'easy_meals', { type: 'complete' });
  assert.equal(repeat.changed, false); assert.equal(repeat.awardEarned, false);
  const undone = await store.applyTaskAction('alice', '4', 'easy_meals', { type: 'undo_complete' });
  assert.equal(undone.task.completedAt, null); assert.equal(undone.earnedCount, 1);
  await store.applyTaskAction('alice', '5', 'easy_meals', { type: 'remove' });
  await store.applyTaskAction('alice', '6', 'easy_meals', { type: 'save' });
  const again = await store.applyTaskAction('alice', '7', 'easy_meals', { type: 'complete' });
  assert.equal(again.awardEarned, false); assert.equal(again.earnedCount, 1);
  assert.equal((await createD1Store(binding).readTasks('alice')).earnedCount, 1);
  assert.equal((await store.readTasks('bob')).earnedCount, 0);
});
