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

const freshTask = () => ({ action_key: 'quiet_notifications', concern_ids: ['daily_tasks'],
  title: 'Give your phone a quiet hour', summary: 'Make space to rest without losing track of the people you want to hear from.',
  estimated_minutes: 5, steps: ['Open your phone’s focus settings.',
    'Choose which contacts can reach you during a rest break.', 'Save a quiet mode you can switch on when you need rest.'],
  done_when: 'A quiet mode is ready with your chosen contacts allowed.', resources: [], purchase_checks: [], no_purchase_option: null });

test('new need after pool exhaustion creates a genuinely new private action, replays, saves and supplies memory', async t => {
  let calls = 0; let sent;
  const { request, store, env, sqlite } = setup(t, async body => { calls++; sent = packet(body);
    const task = freshTask(); if (calls > 1) task.action_key = 'renamed_quiet_break';
    return { batch: { decision: 'generated', task }, metadata: { model: body.model, inputTokens: 200, outputTokens: 100 } }; });
  env.AI_NEW_NEEDS_ENABLED = 'true';
  await store.createProfile('alice', {}); await store.createProfile('bob', {});
  const base = { topicId: 'sick_care', concernIds: ['daily_tasks', 'food', 'check_in', 'getting_care', 'pets'], country: 'US' };
  let version = '1';
  for (let i = 0; i < 6; i++) {
    const result = await (await request('alice', input({ requestId: `pool_exhaustion_${i}`, expectedStateVersion: version, request: base }))).json();
    version = result.stateVersion;
    if (!result.batch.tasks.length) break;
  }
  assert.equal((await store.readLatestBatch('alice')).result.batch.tasks.length, 0); assert.equal(calls, 0);
  const before = await store.readTasks('alice');
  const body = input({ requestId: 'new_need_after_exhaustion', expectedStateVersion: version,
    request: { ...base, concernIds: ['food'], note: 'I want fewer phone interruptions while I rest on a future sick day.' } });
  const response = await request('alice', body); assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.adaptation.status, 'generated'); assert.equal(result.adaptation.newNeed, true); assert.equal(calls, 1);
  assert.equal(result.batch.tasks.length, 1); assert.equal(sent.previous_outcomes.length, before.tasks.length);
  const task = result.batch.tasks[0]; assert.equal(task.action_key, 'custom_sick_care_quiet_notifications');
  assert.ok(!catalog.actions.some(a => a.actionKey === task.action_key));
  assert.deepEqual(result.request.concernIds, ['food', 'daily_tasks']);
  assert.deepEqual((await store.readLatestBatch('alice')).result.batch, result.batch);
  assert.equal((await request('alice', body)).status, 200); assert.equal(calls, 1);
  assert.equal((await store.readTasks('bob')).tasks.length, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_task_content WHERE action_key = ?').get(task.action_key).n, 0);
  assert.equal(sqlite.prepare('SELECT payload_json FROM memory_latest_batch WHERE user_id = ?').get('alice').payload_json.includes(body.request.note), false);
  const saved = await store.applyTaskAction('alice', result.stateVersion, task.action_key, { type: 'save' });
  const completed = await store.applyTaskAction('alice', saved.stateVersion, task.action_key, { type: 'complete' });
  assert.equal(completed.earnedCount, 1);
  const prepared = await prepare({ owner: 'alice', request: { ...base, concernIds: ['daily_tasks'] }, store, catalog, allowEditorialReview: true });
  assert.ok(prepared.packet.user_memory.preference_signals.some(s => s.action_key === task.action_key && s.tags.includes('daily_tasks')));
  assert.ok(prepared.candidates.every(a => a.actionKey !== task.action_key));
  // A different slug does not evade a near-identical outcome check.
  const repeated = await (await request('alice', { ...body, requestId: 'new_need_repeat_001', expectedStateVersion: completed.stateVersion })).json();
  assert.equal(repeated.batch.tasks.length, 0); assert.match(repeated.batch.message, /repeat/);
  assert.equal((await store.readTasks('alice')).tasks.length, before.tasks.length + 1);
});

for (const mode of ['fresh_before_exhaustion', 'outside', 'urgent', 'private', 'failure', 'duplicate', 'url', 'resource', 'time', 'clinical', 'pet', 'quota']) {
  test(`new-need route: ${mode}, no silent pool substitution`, async t => {
    let calls = 0;
    const { request, store, env, db } = setup(t, async () => {
      calls++;
      if (mode === 'failure') throw new Error('Synthetic provider error');
      if (mode === 'outside') return { batch: { decision: 'out_of_scope', task: null }, metadata: null };
      const task = freshTask();
      if (mode === 'duplicate') Object.assign(task, structuredClone(catalog.actions[0].task), { action_key: 'renamed_old_food' });
      if (mode === 'url') task.steps[0] = 'Visit https://not-reviewed.example';
      if (mode === 'resource') task.resources = [{ resource_id: 'not_reviewed', why: 'Research here' }];
      if (mode === 'time') task.estimated_minutes = 30;
      if (mode === 'clinical') task.steps[0] = 'Choose a medication.';
      if (mode === 'pet') task.concern_ids = ['pets'];
      return { batch: { decision: 'generated', task }, metadata: null };
    });
    env.AI_NEW_NEEDS_ENABLED = 'true'; await store.createProfile('alice', {});
    let version = '1';
    if (mode === 'duplicate') {
      const initial = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: ['food'] } }))).json(); version = initial.stateVersion;
    }
    if (mode === 'quota') {
      const budget = createAiBudget(db);
      for (let i = 0; i < 3; i++) { const r = await budget.reserve('alice', `new_need_limit_${i}`, version); await budget.finish('alice', r.token, 'unavailable', null); }
    }
    const note = mode === 'urgent' ? 'I need urgent help now' : mode === 'private' ? 'Use my door code' : 'Help me reduce phone interruptions while resting at home.';
    const before = await store.readTasks('alice');
    const response = await request('alice', input({ requestId: 'new_need_scenarios', expectedStateVersion: version,
      request: { topicId: 'sick_care', concernIds: ['daily_tasks'], note, maxMinutes: 10, noSpend: true } }));
    assert.equal(response.status, 200); const result = await response.json();
    if (mode === 'fresh_before_exhaustion') {
      assert.equal(result.adaptation.status, 'generated'); assert.equal(result.batch.tasks.length, 1);
    } else {
      assert.equal(result.batch.tasks.length, 0); assert.ok(result.batch.message);
      assert.deepEqual((await store.readTasks('alice')).tasks, before.tasks);
    }
    assert.equal(calls, ['urgent', 'private', 'quota'].includes(mode) ? 0 : 1);
    if (mode === 'quota') assert.match(result.batch.message, /allowance.*midnight UTC/);
  });
}

test('a new private action can be explicitly refined without adding another task', async t => {
  const { request, store, env } = setup(t, async body => {
    const task = packet(body).target_task;
    if (task) return { batch: { decision: 'adapted', task: { ...task, title: 'Make a little quiet space',
      summary: 'Choose a short rest break, with the contacts you want still able to reach you.' } }, metadata: null };
    return { batch: { decision: 'generated', task: freshTask() }, metadata: null };
  });
  env.AI_NEW_NEEDS_ENABLED = 'true'; await store.createProfile('alice', {});
  const first = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: [], note: 'Prepare my phone for quiet rest breaks.' } }))).json();
  const second = await (await request('alice', input({ requestId: 'refine_new_private', expectedStateVersion: first.stateVersion,
    request: { topicId: 'sick_care', concernIds: ['daily_tasks'], refineActionKey: first.batch.tasks[0].action_key, note: 'Make it a short break.' } }))).json();
  assert.equal(second.adaptation.status, 'adapted'); assert.equal(second.adaptation.newNeed, false);
  assert.equal((await store.readTasks('alice')).tasks.length, 1);
});

test('one mocked adaptation replaces one task; private stable content, owned read, save, award and replay', async t => {
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

test('explicit refinement works after exhaustion, changes only an unsaved idea and replays without another call', async t => {
  let calls = 0; let sent;
  const { request, store, sqlite } = setup(t, async body => { calls++; sent = packet(body); return adapted(body); });
  await store.createProfile('alice', {}); await store.createProfile('bob', {});
  const base = { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'] };
  let current = await store.readSnapshot('alice');
  for (let i = 0; i < 4; i++) {
    const result = await (await request('alice', input({ requestId: `exhaust_request_${i}`, expectedStateVersion: current.stateVersion, request: base }))).json();
    current = await store.readSnapshot('alice');
    if (!result.batch.tasks.length) break;
  }
  assert.equal((await store.readLatestBatch('alice')).result.batch.tasks.length, 0);
  assert.equal(calls, 0);
  const before = await store.readTasks('alice');
  const food = before.tasks.find(x => x.state.actionKey === 'sick_01_easy_food');
  const shelf = before.tasks.find(x => x.state.actionKey === 'sick_02_rest_shelf');
  const saved = await store.applyTaskAction('alice', before.stateVersion, shelf.state.actionKey, { type: 'save' });
  const body = input({ requestId: 'refine_request_001', expectedStateVersion: saved.stateVersion,
    request: { ...base, refineActionKey: food.state.actionKey, note: 'I have no microwave. Please make this work without cooking.' } });
  const response = await request('alice', body); assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.batch.tasks.length, 1); assert.equal(result.adaptation.refinement, true);
  assert.equal(result.adaptation.status, 'adapted'); assert.equal(calls, 1);
  assert.equal(sent.revision_requested, true); assert.deepEqual(sent.target_task, food.content);
  assert.equal(result.request.note, undefined);
  const after = await store.readTasks('alice');
  assert.equal(after.tasks.length, before.tasks.length);
  assert.deepEqual(after.tasks.find(x => x.state.actionKey === shelf.state.actionKey).content, shelf.content);
  const changed = after.tasks.find(x => x.state.actionKey === food.state.actionKey);
  assert.ok(changed.state.contentRef.startsWith('ai_')); assert.equal(changed.state.shownAt, food.state.shownAt);
  assert.equal(changed.state.savedAt, null); assert.equal(after.earnedCount, 0);
  assert.deepEqual((await store.readLatestBatch('alice')).result.batch, result.batch);
  assert.equal((await request('alice', body)).status, 200); assert.equal(calls, 1);
  assert.equal((await store.readTasks('bob')).tasks.length, 0);
  assert.equal(sqlite.prepare('SELECT task_json FROM memory_task_content WHERE content_ref = ?').get(food.state.contentRef).task_json, JSON.stringify(food.content));
  const next = await prepare({ owner: 'alice', request: base, store, catalog, allowEditorialReview: true });
  assert.equal(next.candidates.length, 0, 'Refinement does not reopen the outcome for ordinary new batches.');
  const savedFood = await store.applyTaskAction('alice', after.stateVersion, food.state.actionKey, { type: 'save' });
  const completed = await store.applyTaskAction('alice', savedFood.stateVersion, food.state.actionKey, { type: 'complete' });
  assert.equal(completed.earnedCount, 1);
});

test('refinement rejects unknown, other-owner, saved, removed and completed ideas before any paid call', async t => {
  let calls = 0; const { request, store } = setup(t, async body => { calls++; return adapted(body); });
  await store.createProfile('alice', {}); await store.createProfile('bob', {});
  const initial = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'] } }))).json();
  const key = 'sick_01_easy_food';
  const requestFor = (state, action = key) => input({ requestId: `refine_invalid_${state}`, expectedStateVersion: state,
    request: { topicId: 'sick_care', concernIds: ['food'], refineActionKey: action, note: 'Use food with no cooking.' } });
  assert.equal((await request('alice', requestFor(initial.stateVersion, 'not_owned'))).status, 409);
  assert.equal((await request('bob', requestFor('1'))).status, 409);
  const wrongConcern = requestFor(initial.stateVersion); wrongConcern.request.concernIds = ['pets'];
  assert.equal((await request('alice', wrongConcern)).status, 409);
  const pool = requestFor(initial.stateVersion); pool.route = 'pool';
  assert.equal((await request('alice', pool)).status, 400);
  let state = await store.applyTaskAction('alice', initial.stateVersion, key, { type: 'save' });
  assert.equal((await request('alice', requestFor(state.stateVersion))).status, 409);
  state = await store.applyTaskAction('alice', state.stateVersion, key, { type: 'complete' });
  assert.equal((await request('alice', requestFor(state.stateVersion))).status, 409);
  state = await store.applyTaskAction('alice', state.stateVersion, key, { type: 'remove' });
  assert.equal((await request('alice', requestFor(state.stateVersion))).status, 409);
  assert.equal(calls, 0);
});

for (const mode of ['keep_pool', 'failure', 'limit', 'unsafe']) test(`refinement ${mode} keeps the existing idea unchanged with honest feedback`, async t => {
  const { request, store, db, sqlite } = setup(t, async () => {
    if (mode === 'failure') throw new Error('Synthetic provider failure');
    return { batch: { decision: 'keep_pool', task: null }, metadata: null };
  });
  await store.createProfile('alice', {});
  const initial = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: ['food'] } }))).json();
  const before = await store.readTasks('alice');
  if (mode === 'limit') {
    const budget = createAiBudget(db);
    for (let i = 0; i < 3; i++) { const r = await budget.reserve('alice', `limit_attempt_${i}`, initial.stateVersion); await budget.finish('alice', r.token, 'unavailable', null); }
  }
  const result = await (await request('alice', input({ requestId: 'refine_failure_01', expectedStateVersion: initial.stateVersion,
    request: { topicId: 'sick_care', concernIds: ['food'], refineActionKey: 'sick_01_easy_food',
      note: mode === 'unsafe' ? 'I need urgent medication advice.' : 'Please use ready-to-eat food with no cooking.' } }))).json();
  assert.equal(result.batch.tasks.length, 0); assert.ok(result.batch.message);
  assert.equal(result.batch.status, mode === 'unsafe' ? 'safety_redirect' : 'needs_context');
  if (mode === 'limit') assert.match(result.batch.message, /limit/);
  assert.deepEqual((await store.readTasks('alice')).tasks, before.tasks);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_private_task_content').get().n, 0);
});

test('saving during refinement prevents replacement and leaves the saved version untouched', async t => {
  let storeRef; let before;
  const { request, store, sqlite } = setup(t, async body => {
    await storeRef.applyTaskAction('alice', before.stateVersion, 'sick_01_easy_food', { type: 'save' });
    return adapted(body);
  });
  storeRef = store; await store.createProfile('alice', {});
  const initial = await (await request('alice', input({ request: { topicId: 'sick_care', concernIds: ['food'] } }))).json();
  before = await store.readTasks('alice');
  const res = await request('alice', input({ requestId: 'refine_race_0001', expectedStateVersion: initial.stateVersion,
    request: { topicId: 'sick_care', concernIds: ['food'], refineActionKey: 'sick_01_easy_food', note: 'Please use food with no cooking.' } }));
  assert.equal(res.status, 409);
  const after = await store.readTasks('alice');
  assert.deepEqual(after.tasks[0].content, before.tasks[0].content); assert.ok(after.tasks[0].state.savedAt);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_private_task_content').get().n, 0);
});
