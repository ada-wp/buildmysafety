import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createOnboardingHandler } from '../onboarding.mjs';
import { createD1Store } from '../d1-store.mjs';
import { FlowError } from '../contracts.mjs';

const example = JSON.parse(readFileSync(new URL('../../docs/contracts/user-profile-v0.example.json', import.meta.url), 'utf8'));
const fields = ['answers', 'interests', 'personalizationEnabled', 'elephantName'];
const draft = changes => ({ ...structuredClone(Object.fromEntries(fields.map(key => [key, example[key]]))), ...changes });
const T0 = '2026-10-11T12:00:00.000Z';
const T1 = '2026-10-11T13:00:00.000Z';

// Test-only binding. Real SQLite executes all current migrations and transaction
// SQL; production continues to use Cloudflare D1, never a local database.
function fixture(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const name of ['0001_user_memory.sql', '0002_task_journey.sql', '0003_onboarding.sql', '0007_task_step_checks.sql']) {
    sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
  }
  t.after(() => sqlite.close());
  const binding = {
    beforeMutation: null, failMutationAt: null,
    prepare(sql) {
      const make = values => ({
        sql, values, bind(...next) { return make(next); },
        async first() { const row = sqlite.prepare(sql).get(...values); return row ? { ...row } : null; },
        async all() { return { success: true, results: sqlite.prepare(sql).all(...values).map(row => ({ ...row })) }; },
        async run() { const result = sqlite.prepare(sql).run(...values); return { success: true, results: [], meta: { changes: Number(result.changes) } }; }
      });
      return make([]);
    },
    async batch(statements) {
      const mutation = statements[0].sql.startsWith('INSERT INTO onboarding_progress');
      if (mutation && binding.beforeMutation) {
        const hook = binding.beforeMutation;
        binding.beforeMutation = null;
        await hook();
      }
      sqlite.exec('BEGIN');
      try {
        const result = statements.map((statement, index) => {
          if (mutation && binding.failMutationAt === index) throw new Error('Test database failure');
          const results = sqlite.prepare(statement.sql).all(...statement.values).map(row => ({ ...row }));
          return { success: true, results, meta: { changes: sqlite.prepare('SELECT changes() AS n').get().n } };
        });
        sqlite.exec('COMMIT');
        return result;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  const verifyIdentity = async request => {
    const header = request.headers.get('Authorization');
    if (!header) throw new FlowError('authentication_required');
    return header.slice('Bearer '.length);
  };
  let handler = createOnboardingHandler({ verifyIdentity });
  return {
    sqlite, binding, store: createD1Store(binding, { now: () => T0 }),
    reopen() { handler = createOnboardingHandler({ verifyIdentity }); },
    async call(owner = 'alice', body, { path = '/api/onboarding', method = body ? 'POST' : 'GET', origin, headers = {} } = {}) {
      const response = await handler(new Request(`https://safety.example${path}`, {
        method, headers: { ...(owner ? { Authorization: `Bearer ${owner}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(origin ? { Origin: origin } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {})
      }), { MEMORY_DB: binding });
      return { status: response.status, headers: response.headers, body: await response.json() };
    }
  };
}

const save = (value = draft(), expectedRevision = 0, checkpoint = 'question/constraints') => ({ expectedRevision, draft: value, checkpoint });
const finish = (value = draft(), expectedRevision = 0, expectedProfileRevision = 0) => ({
  ...save(value, expectedRevision, 'complete'), expectedProfileRevision
});

test('signed-in draft resumes across handlers and is isolated from another account', async t => {
  const f = fixture(t);
  assert.deepEqual((await f.call()).body, { progress: null, legacyComplete: false });
  const alice = await f.call('alice', save());
  assert.equal(alice.status, 200);
  assert.equal(alice.body.progress.revision, 1);
  assert.equal(alice.body.progress.checkpoint, 'question/constraints');
  assert.deepEqual(alice.body.progress.draft, draft());
  assert.equal(alice.headers.get('Cache-Control'), 'no-store');
  const bobDraft = draft({ interests: ['pet_care'] });
  await f.call('bob', save(bobDraft, 0, 'interests'));
  f.reopen();
  assert.deepEqual((await f.call('alice')).body.progress.draft, draft());
  assert.deepEqual((await f.call('bob')).body.progress.draft, bobDraft);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM memory_profiles').get().n, 0);
});

test('raw notes, feelings, extra identity and invalid profile fields never persist', async t => {
  const f = fixture(t);
  const invalid = [
    { ...save(), note: 'private text' },
    save({ ...draft(), feeling: 'overwhelmed' }),
    save({ ...draft(), userId: 'bob' }),
    save({ ...draft(), answers: { ...draft().answers, note: 'private text' } }),
    save({ ...draft(), answers: { ...draft().answers, feeling: 'overwhelmed' } }),
    save({ ...draft(), answers: { ...draft().answers, country: 'ZZ' } }),
    save({ ...draft(), interests: ['sick_care', 'sick_care'] }),
    save({ ...draft(), personalizationEnabled: null })
  ];
  for (const body of invalid) {
    const result = await f.call('alice', body);
    assert.equal(result.status, 400, JSON.stringify(body));
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM onboarding_progress').get().n, 0);
});

test('checkpoint and revision validation prevent completion through ordinary autosave', async t => {
  const f = fixture(t);
  for (const body of [save(draft(), -1), save(draft(), 0.5), save(draft(), 0, 'unknown'), save(draft(), 0, 'complete')]) {
    assert.equal((await f.call('alice', body)).status, 400);
  }
  assert.equal((await f.call('alice', save(), { path: '/api/onboarding/complete' })).status, 400);
  const completed = finish();
  delete completed.expectedProfileRevision;
  assert.equal((await f.call('alice', completed, { path: '/api/onboarding/complete' })).status, 409);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM onboarding_progress').get().n, 0);
});

test('stale draft writes and races cannot overwrite the latest checkpoint', async t => {
  const f = fixture(t);
  await f.call('alice', save());
  const stale = await f.call('alice', save(draft({ interests: ['digital'] }), 0, 'interests'));
  assert.equal(stale.status, 409);
  f.binding.beforeMutation = () => {
    f.sqlite.prepare("UPDATE onboarding_progress SET revision = revision + 1, checkpoint = 'question/hope' WHERE user_id = ?").run('alice');
  };
  const racing = await f.call('alice', save(draft({ interests: ['digital'] }), 1, 'interests'));
  assert.equal(racing.status, 409);
  const stored = (await f.call('alice')).body.progress;
  assert.equal(stored.revision, 2);
  assert.equal(stored.checkpoint, 'question/hope');
  assert.deepEqual(stored.draft.interests, draft().interests);
});

test('two first-save requests cannot both claim a missing checkpoint', async t => {
  const f = fixture(t);
  f.binding.beforeMutation = async () => {
    const winner = await f.call('alice', save(draft({ interests: ['pet_care'] }), 0, 'interests'));
    assert.equal(winner.status, 200);
  };
  const loser = await f.call('alice', save());
  assert.equal(loser.status, 409);
  const progress = (await f.call()).body.progress;
  assert.equal(progress.revision, 1);
  assert.equal(progress.checkpoint, 'interests');
  assert.deepEqual(progress.draft.interests, ['pet_care']);
});

test('completion creates the canonical profile and removes the duplicate draft atomically', async t => {
  const f = fixture(t);
  await f.call('alice', save());
  const result = await f.call('alice', finish(draft(), 1), { path: '/api/onboarding/complete' });
  assert.equal(result.status, 200);
  assert.equal(result.body.progress.revision, 2);
  assert.equal(result.body.progress.checkpoint, 'complete');
  assert.equal(result.body.progress.draft, null);
  assert.ok(result.body.progress.completedAt);
  const snapshot = await f.store.readSnapshot('alice');
  assert.equal(snapshot.profile.revision, 1);
  assert.equal(snapshot.stateVersion, '1');
  assert.deepEqual(snapshot.profile.answers, draft().answers);
  assert.deepEqual(snapshot.profile.interests, draft().interests);
  assert.equal(snapshot.profile.userId, 'alice');
  assert.equal(f.sqlite.prepare('SELECT draft_json FROM onboarding_progress WHERE user_id = ?').get('alice').draft_json, null);
  f.reopen();
  assert.deepEqual((await f.call('alice')).body, result.body);
  assert.deepEqual((await f.call('bob')).body, { progress: null, legacyComplete: false });
});

test('profile edits through onboarding preserve reset cutoff, task progress and earned awards', async t => {
  const f = fixture(t);
  await f.store.createProfile('alice', draft());
  await f.store.saveTaskState('alice', {
    userId: 'alice', actionKey: 'sick_01_easy_food', contentRef: 'sick_01_easy_food@1', shownAt: T0,
    savedAt: T1, removedAt: null, completedAt: T1, likedAt: T1, feedbackCode: null, feedbackAt: null
  });
  await f.store.resetPreferences('alice', 1);
  f.sqlite.prepare('INSERT INTO memory_completion_awards (user_id, action_key, awarded_at) VALUES (?, ?, ?)').run('alice', 'sick_01_easy_food', T1);
  const before = await f.store.readSnapshot('alice');
  const changed = draft({ interests: ['pet_care'] });
  const result = await f.call('alice', finish(changed, 0, before.profile.revision), { path: '/api/onboarding/complete' });
  assert.equal(result.status, 200);
  const after = await f.store.readSnapshot('alice');
  assert.equal(after.profile.revision, before.profile.revision + 1);
  assert.equal(Number(after.stateVersion), Number(before.stateVersion) + 1);
  assert.equal(after.profile.signalsResetAt, before.profile.signalsResetAt);
  assert.deepEqual(after.taskStates, before.taskStates);
  assert.deepEqual(after.profile.interests, ['pet_care']);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM memory_completion_awards WHERE user_id = ?').get('alice').n, 1);
});

test('completion rejects a changed profile, including a change between snapshot read and transaction', async t => {
  const f = fixture(t);
  await f.store.createProfile('alice', draft());
  await f.call('alice', save());
  assert.equal((await f.call('alice', finish(draft(), 1, 0), { path: '/api/onboarding/complete' })).status, 409);
  f.binding.beforeMutation = () => {
    f.sqlite.prepare('UPDATE memory_profiles SET revision = revision + 1, state_version = state_version + 1 WHERE user_id = ?').run('alice');
  };
  const racing = await f.call('alice', finish(draft({ interests: ['pet_care'] }), 1, 1), { path: '/api/onboarding/complete' });
  assert.equal(racing.status, 409);
  const progress = (await f.call()).body.progress;
  assert.equal(progress.revision, 1);
  assert.equal(progress.completedAt, null);
  assert.notEqual(progress.draft, null);
  assert.deepEqual((await f.store.readSnapshot('alice')).profile.interests, draft().interests);
});

test('failed complete transaction rolls back checkpoint, profile and duplicate-draft removal', async t => {
  for (const failureAt of [1, 2]) {
    const f = fixture(t);
    await f.store.createProfile('alice', draft());
    await f.call('alice', save());
    const beforeProgress = (await f.call()).body;
    const beforeProfile = await f.store.readSnapshot('alice');
    f.binding.failMutationAt = failureAt;
    const result = await f.call('alice', finish(draft({ interests: ['pet_care'] }), 1, 1), { path: '/api/onboarding/complete' });
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { error: 'storage_unavailable' });
    f.binding.failMutationAt = null;
    assert.deepEqual((await f.call()).body, beforeProgress);
    assert.deepEqual(await f.store.readSnapshot('alice'), beforeProfile);
  }
});

test('failed first completion leaves neither a new profile nor a completed checkpoint', async t => {
  const f = fixture(t);
  f.binding.failMutationAt = 2;
  const result = await f.call('alice', finish(), { path: '/api/onboarding/complete' });
  assert.equal(result.status, 503);
  f.binding.failMutationAt = null;
  assert.deepEqual((await f.call()).body, { progress: null, legacyComplete: false });
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM memory_profiles').get().n, 0);
});

test('previous final-Continue profiles count as completed until an explicit preference draft is saved', async t => {
  const f = fixture(t);
  await f.store.createProfile('alice', draft());
  assert.deepEqual((await f.call()).body, { progress: null, legacyComplete: true });
  await f.call('alice', save(draft(), 0, 'question/home'));
  const progress = (await f.call()).body;
  assert.equal(progress.legacyComplete, false);
  assert.equal(progress.progress.checkpoint, 'question/home');
});

test('authentication, origin, query and method checks do not touch stored draft data', async t => {
  const f = fixture(t);
  assert.equal((await f.call(null)).status, 401);
  assert.equal((await f.call(' alice ')).status, 401);
  assert.equal((await f.call('alice', save(), { origin: 'https://other.example' })).status, 403);
  assert.equal((await f.call('alice', undefined, { path: '/api/onboarding?userId=bob' })).status, 400);
  assert.equal((await f.call('alice', save(), { method: 'PUT' })).status, 405);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM onboarding_progress').get().n, 0);
});
