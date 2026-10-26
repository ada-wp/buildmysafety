import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createProgressStore, createProgressHandler } from '../progress.mjs';
import { createD1Store } from '../d1-store.mjs';

const catalog = { topics: [{ id: 'sick_care' }, { id: 'home_confidence' }], actions: [
  ...Array.from({ length: 11 }, (_, i) => ({ actionKey: `sick_${i}`, topicIds: ['sick_care'] })),
  { actionKey: 'home_one', topicIds: ['home_confidence'] }
] };
const at = '2026-10-14T12:00:00.000Z';
function setup(t) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys=ON');
  const migrations = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'));
  t.after(() => sql.close());
  const db = { beforeWrite: null,
    prepare(text) { const make = values => ({ sql: text, values, bind: (...v) => make(v),
      async first() { const row = sql.prepare(text).get(...values); return row ? { ...row } : null; } }); return make([]); },
    async batch(statements) {
      if (statements.some(s => s.sql.startsWith('INSERT INTO memory_category_progress')) && db.beforeWrite) {
        const fn = db.beforeWrite; db.beforeWrite = null; await fn();
      }
      sql.exec('BEGIN');
      try { const result = statements.map(s => ({ results: sql.prepare(s.sql).all(...s.values).map(r => ({ ...r })) })); sql.exec('COMMIT'); return result; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    }
  };
  const store = createProgressStore(db, catalog, { now: () => at });
  const memory = createD1Store(db, { now: () => at });
  const seed = async (owner, count = 0) => { await memory.createProfile(owner);
    for (let i = 0; i < count; i++) {
      sql.prepare(`INSERT INTO memory_task_states(user_id,action_key,content_ref,shown_at,saved_at,completed_at) VALUES (?,?,?,?,?,?)`)
        .run(owner, `sick_${i}`, `sick_${i}@1`, at, at, at);
      sql.prepare('INSERT INTO memory_completion_awards VALUES (?,?,?)').run(owner, `sick_${i}`, at);
    }
  };
  return { sql, db, store, memory, seed };
}
const write = (changes = {}) => ({ topicId: 'sick_care', expectedRevision: 0, expectedStateVersion: '1', milestone: 1, ...changes });
const code = value => error => error.code === value;

test('category counts are separate; undo changes completion but never earned awards; removing done retains history', async t => {
  const s = setup(t); await s.seed('alice', 3); await s.seed('bob', 1);
  s.sql.prepare(`INSERT INTO memory_task_states(user_id,action_key,content_ref,shown_at,saved_at) VALUES ('alice','home_one','home_one@1',?,?)`).run(at, at);
  const first = await s.store.read('alice');
  assert.equal(first.categories[0].completedCount, 3); assert.equal(first.categories[0].earnedCount, 3);
  assert.equal(first.categories[1].pendingCount, 1); assert.equal(first.categories[1].completedCount, 0);
  await s.memory.applyTaskAction('alice', '1', 'sick_0', { type: 'remove' });
  assert.equal((await s.store.read('alice')).categories[0].completedCount, 3);
  await s.memory.applyTaskAction('alice', '2', 'sick_1', { type: 'undo_complete' });
  const after = await s.store.read('alice');
  assert.equal(after.categories[0].completedCount, 2); assert.equal(after.categories[0].earnedCount, 3);
  assert.equal(after.categories[0].pendingCount, 1); assert.equal((await s.store.read('bob')).categories[0].completedCount, 1);
});
test('milestones 1/3/6/9/10, optional latest check-in and identical replay persist without creating awards', async t => {
  const s = setup(t); await s.seed('alice', 10);
  let revision = 0;
  for (const milestone of [1, 3, 6, 9, 10]) {
    const result = await s.store.update('alice', write({ milestone, expectedRevision: revision }));
    revision++; assert.equal(result.categories[0].revision, revision);
    assert.equal(result.categories[0].latestCheckIn, null);
  }
  const before = await s.store.read('alice');
  assert.deepEqual((await s.store.update('alice', write({ milestone: 10 }))), before);
  const ready = await s.store.update('alice', write({ milestone: 10, expectedRevision: revision, feeling: 'ready' }));
  assert.deepEqual(ready.categories[0].latestCheckIn, { feeling: 'ready', milestone: 10, answeredAt: at });
  const reopened = createProgressStore(s.db, catalog);
  assert.deepEqual(await reopened.read('alice'), ready);
  assert.deepEqual(await reopened.update('alice', write({ milestone: 10, feeling: 'ready' })), ready);
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_completion_awards').get().n, 10);
  assert.equal(ready.stateVersion, '1');
});
test('unearned milestones, raw fields, unknown category, invalid feelings and unsafe versions are rejected', async t => {
  const s = setup(t); await s.seed('alice', 1);
  for (const body of [write({ milestone: 3 }), write({ milestone: undefined }), write({ userId: 'bob' }), write({ feeling: 'safe' }), write({ topicId: 'none' }), write({ expectedStateVersion: '999999999999999999999' })])
    await assert.rejects(s.store.update('alice', body));
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_category_progress').get().n, 0);
});
test('task undo between read and progress write is rejected by task-state CAS', async t => {
  const s = setup(t); await s.seed('alice', 1);
  s.db.beforeWrite = () => s.memory.applyTaskAction('alice', '1', 'sick_0', { type: 'undo_complete' });
  await assert.rejects(s.store.update('alice', write()), code('stale_state'));
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_category_progress').get().n, 0);
});
test('concurrent category writes have one winner; stale answers do not overwrite newer feelings', async t => {
  const s = setup(t); await s.seed('alice', 1);
  s.db.beforeWrite = () => s.store.update('alice', write({ feeling: 'ready' }));
  await assert.rejects(s.store.update('alice', write({ feeling: 'unsure' })), code('stale_state'));
  assert.equal((await s.store.read('alice')).categories[0].latestCheckIn.feeling, 'ready');
});
test('handler verifies owner, denies owner override, cross-origin and query attempts; deletion cascades only that owner', async t => {
  const s = setup(t); await s.seed('alice', 1); await s.seed('bob', 3);
  const handler = createProgressHandler({ catalog, verifyIdentity: async r => r.headers.get('X-Test-Owner') });
  const call = (method = 'GET', body, extra = {}, suffix = '') => handler(new Request(`https://app.invalid/api/progress${suffix}`,
    { method, headers: { 'X-Test-Owner': 'alice', ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) }), { MEMORY_DB: s.db });
  assert.equal((await (await call()).json()).categories[0].completedCount, 1);
  assert.equal((await call('PATCH', write({ userId: 'bob' }))).status, 400);
  assert.equal((await call('GET', undefined, { Origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await call('GET', undefined, {}, '?user_id=bob')).status, 400);
  assert.equal((await call('GET', undefined, { 'X-Test-Owner': '' })).status, 401);
  await s.store.update('alice', write()); await s.store.update('bob', write({ milestone: 3 }));
  s.sql.prepare('DELETE FROM memory_profiles WHERE user_id=?').run('alice');
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_category_progress WHERE user_id=?').get('alice').n, 0);
  assert.equal((await s.store.read('bob')).categories[0].revision, 1);
  assert.equal((await call()).status, 404);
});
test('private generated actions belong only to their supported category; unowned keys never count', async t => {
  const s = setup(t); await s.seed('alice');
  s.sql.prepare(`INSERT INTO memory_task_states(user_id,action_key,content_ref,shown_at,saved_at,completed_at) VALUES ('alice', 'custom_sick_care_test', 'ai_test',?,?,?)`).run(at, at, at);
  assert.equal((await s.store.read('alice')).categories[0].completedCount, 1);
  assert.equal((await s.store.read('alice')).categories[1].completedCount, 0);
});
