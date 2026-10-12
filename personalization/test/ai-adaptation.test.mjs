import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createHandler } from '../http.mjs';
import { catalog } from '../catalog.mjs';
import { createD1Store } from '../d1-store.mjs';
import { createAiBudget } from '../ai-budget.mjs';
import { prepare } from '../flow.mjs';

function setup(t, generate) {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys = ON');
  const path = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(path).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(file, path), 'utf8'));
  t.after(() => sqlite.close());
  const db = {
    prepare(sql) {
      const statement = values => ({ sql, values, bind: (...v) => statement(v),
        async first() { const row = sqlite.prepare(sql).get(...values); return row ? { ...row } : null; } });
      return statement([]);
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = statements.map(s => ({ results: sqlite.prepare(s.sql).all(...s.values).map(r => ({ ...r })) })); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  const env = { MEMORY_DB: db, AI_ADAPTATION_ENABLED: 'true', OPENAI_MODEL: 'gpt-6-luna' };
  const handler = createHandler({ catalog, requireDeliveryIds: true, allowEditorialReview: true, allowAutomatic: true,
    verifyIdentity: async r => r.headers.get('Authorization'), generate });
  const request = (owner, body) => handler(new Request('https://example.test/api/recommendations', {
    method: 'POST', headers: { Authorization: owner, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env);
  return { sqlite, db, env, request, store: createD1Store(db) };
}
const input = (overrides = {}) => ({ route: 'auto', requestId: 'adaptation_request_01', expectedStateVersion: '1',
  request: { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'], note: 'I have little energy and want food with no cooking.' }, ...overrides });
const packet = body => JSON.parse(body.input[0].content[0].text);
function adapted(body) {
  const task = structuredClone(packet(body).target_task);
  task.title = 'Make two no-cook choices easier';
  task.summary = 'Save a little energy for yourself. Start with familiar food you already keep at home.';
  task.estimated_minutes = 5;
  task.steps = ['List two familiar food options you already keep that need no cooking.',
    'Check where those items are and note anything missing.', 'Save the two options in your usual note for a low-energy day.'];
  return { batch: { decision: 'adapted', task }, metadata: { responseId: 'resp_fixture', model: body.model, inputTokens: 500, outputTokens: 180 } };
}

test('one paid adaptation replaces one task; private stable content, owned read, save, award and replay', async t => {
  let calls = 0; let sent;
  const { request, store, sqlite } = setup(t, async body => { calls++; sent = body; return adapted(body); });
  await store.createProfile('alice', { answers: { home: 'alone', constraints: ['cost'], country: 'US' } });
  await store.createProfile('bob', {});
  const res = await request('alice', input()); assert.equal(res.status, 200);
  const first = await res.json(); assert.equal(first.source, 'mixed'); assert.equal(first.batch.tasks.length, 3);
  assert.equal(calls, 1); assert.equal(sent.store, false); assert.equal(sent.model, 'gpt-6-luna');
  assert.equal(sent.max_output_tokens, 2200); assert.equal(sent.text.format.strict, true);
  assert.equal(JSON.stringify(packet(sent)).includes('alice'), false);
  assert.equal(first.request.note, undefined);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_private_task_content WHERE user_id = ?').get('alice').n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_task_content').get().n, 2);
  assert.equal(sqlite.prepare('SELECT payload_json FROM memory_latest_batch').get().payload_json.includes(input().request.note), false);
  const latest = await store.readLatestBatch('alice'); assert.deepEqual(latest.result.batch, first.batch);
  const collection = await store.readTasks('alice'); const own = collection.tasks.find(x => x.state.contentRef.startsWith('ai_'));
  assert.equal(own.content.action_key, first.adaptation.actionKey);
  assert.equal((await store.readTasks('bob')).tasks.length, 0);
  assert.equal((await store.readLatestBatch('bob')).result, null);
  const retry = await (await request('alice', input())).json(); assert.deepEqual(retry.batch, first.batch); assert.equal(calls, 1);
  let action = await store.applyTaskAction('alice', collection.stateVersion, own.state.actionKey, { type: 'save' });
  action = await store.applyTaskAction('alice', action.stateVersion, own.state.actionKey, { type: 'complete' });
  assert.equal(action.earnedCount, 1);
  action = await store.applyTaskAction('alice', action.stateVersion, own.state.actionKey, { type: 'undo_complete' });
  action = await store.applyTaskAction('alice', action.stateVersion, own.state.actionKey, { type: 'complete' });
  assert.equal(action.earnedCount, 1); assert.equal(action.awardEarned, false);
  const reloaded = await store.readTasks('alice');
  assert.deepEqual(reloaded.tasks.find(x => x.state.actionKey === own.state.actionKey).content, own.content);
  await assert.rejects(store.applyTaskAction('bob', '1', own.state.actionKey, { type: 'save' }), { code: 'task_not_found' });
  // Even a corrupted/forged cross-owner reference cannot read Alice's private copy.
  sqlite.prepare('INSERT INTO memory_task_states(user_id, action_key, content_ref, shown_at) VALUES (?, ?, ?, ?)')
    .run('bob', own.state.actionKey, own.state.contentRef, new Date().toISOString());
  await assert.rejects(store.readTasks('bob'), { code: 'task_content_unavailable' });
});

test('ordinary choice uses zero AI calls and disabled AI uses an honest pool fallback', async t => {
  let calls = 0; const { request, store, env } = setup(t, async b => { calls++; return adapted(b); });
  await store.createProfile('alice', {});
  const first = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: ['food'] } }))).json();
  assert.equal(first.source, 'pool'); assert.equal(first.adaptation.status, 'not_needed'); assert.equal(calls, 0);
  await store.createProfile('bob', {}); env.AI_ADAPTATION_ENABLED = 'false';
  const second = await (await request('bob', input())).json();
  assert.equal(second.adaptation.status, 'unavailable'); assert.equal(second.source, 'pool'); assert.ok(second.adaptation.message); assert.equal(calls, 0);
});

for (const [label, response] of [
  ['provider failure', () => { throw new Error('raw secret and output must not be logged'); }],
  ['invented resource', b => { const r = adapted(b); r.batch.task.resources = [{ resource_id: 'invented', why: 'go' }]; return r; }],
  ['different action', b => { const r = adapted(b); r.batch.task.action_key = 'new_action'; return r; }],
  ['clinical copy', b => { const r = adapted(b); r.batch.task.steps[0] = 'Take a supplement.'; return r; }],
  ['invented URL', b => { const r = adapted(b); r.batch.task.steps[0] = 'Visit https://untrusted.invalid'; return r; }],
  ['too much output', b => ({ ...adapted(b), batch: { decision: 'adapted', task: adapted(b).batch.task, extra: true } })]
]) test(`${label} falls back with no accepted private copy`, async t => {
  const { request, store, sqlite } = setup(t, async b => response(b));
  await store.createProfile('alice', {});
  const res = await request('alice', input()); assert.equal(res.status, 200);
  const result = await res.json(); assert.equal(result.source, 'pool'); assert.equal(result.adaptation.status, 'unavailable');
  assert.equal(result.batch.tasks.length, 3); assert.ok(result.adaptation.message);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_private_task_content').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_ai_attempts WHERE finished = 1').get().n, 1);
});

test('unsafe or private requests stop before a model call; out-of-scope model decision shows no tasks', async t => {
  let calls = 0; const { request, store } = setup(t, async () => { calls++; return { batch: { decision: 'out_of_scope', task: null }, metadata: null }; });
  for (const [owner, note, expected] of [['urgent', 'This is urgent; I need help now', 'safety_redirect'],
    ['private', 'Use my door code for the cleaner', 'needs_context'], ['outside', 'Write an unrelated advertising campaign', 'out_of_scope']]) {
    await store.createProfile(owner, {});
    const res = await (await request(owner, input({ request: { ...input().request, note } }))).json();
    assert.equal(res.batch.status, expected); assert.equal(res.batch.tasks.length, 0);
  }
  assert.equal(calls, 1);
});

test('same-owner concurrent requests make only one provider call, then replay safely', async t => {
  let resolve; let started; const ready = new Promise(r => { started = r; }); let calls = 0;
  const { request, store } = setup(t, async b => { calls++; started(); return await new Promise(r => { resolve = () => r(adapted(b)); }); });
  await store.createProfile('alice', {});
  const first = request('alice', input()); await ready;
  const duplicate = await request('alice', input()); assert.equal(duplicate.status, 409); assert.equal((await duplicate.json()).error, 'generation_in_progress');
  const competing = await request('alice', input({ requestId: 'competing_request_02' })); assert.equal(competing.status, 409);
  assert.equal(calls, 1); resolve(); const done = await first; assert.equal(done.status, 200);
  assert.equal((await request('alice', input())).status, 200); assert.equal(calls, 1);
});

test('profile changes during generation reject delivery without storing stale private content', async t => {
  let storeRef;
  const { request, store, sqlite } = setup(t, async b => { await storeRef.editProfile('alice', 1, { answers: { constraints: ['cost'] } }); return adapted(b); });
  storeRef = store; await store.createProfile('alice', {});
  const res = await request('alice', input()); assert.equal(res.status, 409); assert.equal((await res.json()).error, 'stale_state');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_private_task_content').get().n, 0);
  assert.equal((await store.readTasks('alice')).tasks.length, 0);
});

test('D1 quotas count failures, lock concurrent calls, prevent duplicate attempts and bound all owners', async t => {
  const { db, store } = setup(t); let time = Date.parse('2026-10-12T12:00:00Z');
  const budget = createAiBudget(db, { now: () => time }); await store.createProfile('alice', {});
  let reservation = await budget.reserve('alice', 'quota_request_01', '1'); assert.ok(reservation.token);
  await assert.rejects(budget.reserve('alice', 'quota_request_02', '1'), { code: 'generation_in_progress' });
  await budget.finish('alice', reservation.token, 'unavailable', null);
  assert.equal((await budget.reserve('alice', 'quota_request_01', '1')).reason, 'already_attempted');
  for (let i = 2; i <= 3; i++) { reservation = await budget.reserve('alice', `quota_request_0${i}`, '1'); await budget.finish('alice', reservation.token, 'unavailable', null); }
  assert.equal((await budget.reserve('alice', 'quota_request_04', '1')).reason, 'limit_reached');
  for (let i = 0; i < 27; i++) { const owner = `global_${i}`; await store.createProfile(owner, {});
    reservation = await budget.reserve(owner, 'global_request_01', '1'); assert.ok(reservation.token); await budget.finish(owner, reservation.token, 'keep_pool', null); }
  await store.createProfile('over_limit', {}); assert.equal((await budget.reserve('over_limit', 'global_request_02', '1')).reason, 'limit_reached');
  time += 86400000; reservation = await budget.reserve('alice', 'quota_next_day01', '1'); assert.ok(reservation.token);
});

test('private adapted saves still supply relevant soft signals; shown action stays excluded', async t => {
  const { request, store } = setup(t, async b => adapted(b)); await store.createProfile('alice', {});
  const first = await (await request('alice', input())).json();
  await store.applyTaskAction('alice', first.stateVersion, first.adaptation.actionKey, { type: 'save' });
  const next = await prepare({ owner: 'alice', request: { topicId: 'sick_care', concernIds: ['food'] }, store, catalog, allowEditorialReview: true });
  assert.equal(next.packet.user_memory.preference_signals[0].action_key, first.adaptation.actionKey);
  assert.ok(next.candidates.every(x => x.actionKey !== first.adaptation.actionKey));
});
