import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { catalog, legacyCatalog, sickCareConcerns } from '../catalog.mjs';
import { prepare, recommend, poolBatch, validateBatch } from '../flow.mjs';
import { requestBoundary, checkTaskCopy } from '../adaptation.mjs';
import { buildNewNeedRequest, acceptNewNeed } from '../new-needs.mjs';
import { createD1Store } from '../d1-store.mjs';
import { createHandler } from '../http.mjs';
import { OWNER, makeStore, taskState } from './fixtures.mjs';
import { generatedIdeas, petIdeas } from './idea-fixtures.mjs';

const options = (request = {}) => ({ owner: OWNER, store: makeStore(), catalog, allowEditorialReview: true,
  useProfileDefaults: true, request: { topicId: 'sick_care', concernIds: [], country: 'US', ...request } });
const key = id => `sick_v2_sc${String(id).padStart(2, '0')}`;

test('new collection is preview-only, versioned; historical bodies remain unchanged', async () => {
  assert.equal((await recommend({ ...options(), allowEditorialReview: false })).status, 'unsupported_topic');
  assert.equal(catalog.actions.filter(a => a.actionKey.startsWith('sick_v2_')).length, 27);
  assert.equal(new Set(catalog.actions.map(a => a.actionKey)).size, catalog.actions.length);
  for (const old of legacyCatalog.actions) {
    const current = catalog.actions.find(a => a.actionKey === old.actionKey);
    assert.deepEqual(current.task, old.task); assert.equal(current.contentRef, old.contentRef);
  }
  assert.ok(catalog.actions.every(a => a.reviewState === 'editorial_review'));
});

test('every connected authored task passes the real task shape, length and resource validator', async () => {
  const p = await prepare(options({ concernIds: sickCareConcerns.map(c => c.id) }));
  for (const action of catalog.actions) {
    assert.doesNotThrow(() => validateBatch({ status: 'no_more_ideas', message: 'Reviewed option.', tasks: [action.task] },
      { ...p, candidates: [action] }), action.actionKey);
  }
});

test('active category keeps the agreed three-step format and collection-level learning balance', () => {
  const active = catalog.actions.filter(action => !action.retired);
  const learning = active.filter(action => action.taskKind === 'learning');
  const share = learning.length / active.length;
  assert.ok(share >= 0.3 && share <= 0.5, `Learning share is ${learning.length}/${active.length}`);
  assert.ok(learning.filter(action => action.priority > 0).length > learning.filter(action => action.priority === 0).length,
    'Most dedicated learning belongs in Make it reliable and Extra ease');
  for (const action of active) {
    assert.equal(action.task.steps.length, 3, action.actionKey);
    assert.ok(action.task.done_when.trim(), action.actionKey);
    assert.ok(action.task.resources.length <= 2, action.actionKey);
  }
});

test('checkbox-only starts; unchecked concerns and unknown budget remain ranked options', async () => {
  for (const c of sickCareConcerns) {
    const o = options({ concernIds: [c.id] });
    o.store.change(s => { s.profile.answers.constraints = []; });
    const p = await prepare(o), result = await recommend(o);
    assert.equal(result.status, 'ok', c.id);
    assert.equal(result.batch.tasks.length, 3, c.id);
    assert.ok(result.batch.tasks[0].concern_ids.includes(c.id), c.id);
    assert.ok(p.candidates.some(a => !a.concernIds.includes(c.id)), 'Discovery remains available');
    assert.ok(result.batch.tasks.filter(t => t.resources.length).length <= 1);
  }
});

test('ranked pool keeps looking after linked candidates to fill three distinct cards', async () => {
  const p = await prepare(options({ concernIds: ['getting_care'] }));
  assert.ok(p.candidates.slice(0, 3).every(a => a.task.resources.length));
  const batch = validateBatch(poolBatch(p), p);
  assert.equal(batch.status, 'ready'); assert.equal(batch.tasks.length, 3);
  assert.equal(batch.tasks[0].action_key, key(1));
  assert.equal(batch.tasks.filter(task => task.resources.length).length, 1);
  const onlyLinked = { ...p, candidates: p.candidates.filter(a => a.task.resources.length) };
  const scarce = validateBatch(poolBatch(onlyLinked), onlyLinked);
  assert.equal(scarce.tasks.length, 1); assert.equal(scarce.status, 'no_more_ideas');
  assert.match(scarce.message, /current choices and limits/);
});

test('onboarding preferences order ideas without creating hard time/cost/support restrictions', async () => {
  const o = options({ concernIds: ['pets'] });
  o.store.change(s => { s.profile.answers.constraints = ['cost', 'energy', 'support']; });
  const p = await prepare(o);
  assert.equal(p.effective.noSpend, null); assert.equal(p.effective.maxMinutes, null);
  assert.equal(p.effective.localSupport, 'unknown');
  assert.ok(p.candidates.some(a => a.actionKey === key(26)));
  assert.ok(p.candidates.some(a => a.task.estimated_minutes > 10));
  const explicit = await prepare({ ...o, request: { ...o.request, maxMinutes: 10, noSpend: true } });
  assert.ok(explicit.candidates.every(a => a.task.estimated_minutes <= 10 && !a.futurePaidService && !a.requiresSpending));
  assert.equal(explicit.resources.has('rover_services'), false);
});

test('current concern outranks old preferences; missing facts do not invent an arrangement', async () => {
  const o = options({ concernIds: ['getting_care'] });
  o.store.change(s => { s.profile.answers.style = 'understand'; s.profile.interests = ['pet_care']; });
  const p = await prepare(o);
  assert.equal(poolBatch(p).tasks[0].action_key, key(1));
  assert.ok(p.candidates.some(a => a.actionKey === key(25)), 'Conditional benefits research is not banned');
  assert.ok(p.candidates.every(a => ![key(5), key(27), key(28), key(29), key(30)].includes(a.actionKey)), 'Real dependencies use the specific-request route');
});

test('more ideas stays distinct; reworded rest-space outcome does not duplicate old saved task', async () => {
  const o = options({ concernIds: ['daily_tasks'] });
  o.store.change(s => { s.taskStates = [taskState('sick_02_rest_shelf')]; });
  const p = await prepare(o); assert.ok(!p.candidates.some(a => a.actionKey === key(13)));
  const first = await recommend(o); assert.equal(first.status, 'ok');
  o.store.change(s => { s.taskStates.push(...first.batch.tasks.map(t => taskState(t.action_key, {
    contentRef: catalog.actions.find(a => a.actionKey === t.action_key).contentRef }))); });
  const next = await recommend(o); assert.equal(next.status, 'ok'); assert.ok(next.batch.tasks.length);
  assert.ok(next.batch.tasks.every(t => !first.batch.tasks.some(old => old.action_key === t.action_key)));
});

test('ordinary pool matching does not repeat an outcome already delivered as a private AI task', async () => {
  const o = options({ concernIds: ['food'] });
  const original = catalog.actions.find(action => action.actionKey === key(10));
  const content = { ...structuredClone(original.task), action_key: 'custom_sick_care_groceries_to_door' };
  const state = taskState(content.action_key, { contentRef: 'ai_owned_grocery_outcome' });
  o.store.change(snapshot => { snapshot.taskStates = [state]; });
  o.store.readTasks = async () => ({ stateVersion: o.store.inspect().stateVersion,
    tasks: [{ state, content }], earnedCount: 0 });
  const prepared = await prepare(o);
  assert.ok(!prepared.candidates.some(action => action.actionKey === original.actionKey));
  assert.ok(prepared.candidates.some(action => action.actionKey === key(7)),
    'A different delivery need, pharmacy access, remains available');
  assert.ok(!poolBatch(prepared).tasks.some(task => task.action_key === original.actionKey));
});

test('regional resource limits remain real; bounded AI packet contains useful current resources', async () => {
  const away = await prepare(options({ country: 'GB', concernIds: ['food'] }));
  assert.equal(away.resources.size, 0);
  assert.ok(away.candidates.every(a => !a.task.resources.length));
  const p = await prepare(options({ concernIds: ['pets'], note: 'I have a cat and want to compare pet sitting services before booking.' }));
  const request = buildNewNeedRequest(p, catalog, [], 'gpt-6-luna');
  const packet = JSON.parse(request.input[0].content[0].text);
  assert.ok(packet.eligible_resources.length <= 12);
  assert.ok(packet.eligible_resources.some(r => r.resource_id === 'meowtel_services'));
  assert.ok(Buffer.byteLength(request.input[0].content[0].text) <= 24000);
  assert.match(request.instructions, /prioritize, not to over-filter/);
});

test('prescription logistics and self-pay research work; clinical decisions and unsafe instructions stay blocked', async () => {
  for (const note of ['Research prescription delivery before a future sick day.',
    'I want to understand how to have medicine delivered without going out.',
    'Prescription delivery is arranged. Help me research affordable virtual visits.',
    'I want to understand self-pay clinic costs.']) assert.equal(requestBoundary(note), null, note);
  for (const note of ['What medication should I take?', 'What dose should I take?', 'I have chest pain now'])
    assert.equal(requestBoundary(note), 'safety_redirect', note);
  const p = await prepare(options({ concernIds: ['getting_care'] }));
  const t = structuredClone(catalog.actions.find(a => a.actionKey === key(7)).task);
  assert.doesNotThrow(() => checkTaskCopy(t, p.effective));
  assert.throws(() => checkTaskCopy({ ...t, steps: ['Choose a medication.', ...t.steps.slice(1)] }, p.effective));
  const namedButUnsent = [...p.resources.keys()].find(id => !p.packet.eligible_resources.some(r => r.resource_id === id));
  assert.ok(namedButUnsent);
  assert.throws(() => acceptNewNeed({ decision: 'generated', task: { ...t, action_key: 'different_route',
    resources: [{ resource_id: namedButUnsent, why: 'Research here.' }] } }, p, catalog, [], checkTaskCopy), /invalid_resource/);
});

test('US request coverage supplies resources even when a returning profile has no country', async () => {
  const o = options({ concernIds: ['getting_care'], note: 'I want to research medicine delivery options before I need them.' });
  o.store.change(s => { s.profile.answers.country = null; });
  const p = await prepare(o);
  const packet = JSON.parse(buildNewNeedRequest(p, catalog, [], 'gpt-6-luna').input[0].content[0].text);
  assert.equal(p.effective.country, 'US');
  assert.ok(packet.eligible_resources.length > 0);
  assert.equal(o.store.inspect().profile.answers.country, null);
  const unscoped = await prepare({ ...o, request: { ...o.request, country: null } });
  assert.equal(unscoped.resources.size, 0, 'Shared API still protects regional eligibility outside app market');
});

test('typed-only requests require the model to classify its task within supported concerns', async () => {
  const p = await prepare(options({ note: 'Help me understand home delivery from a pharmacy.' }));
  const body = buildNewNeedRequest(p, catalog, [], 'gpt-6-luna');
  assert.deepEqual(JSON.parse(body.input[0].content[0].text).selected_concerns, []);
  const concerns = body.text.format.schema.properties.tasks.items.properties.concern_ids;
  assert.equal(concerns.minItems, 1);
  assert.deepEqual(concerns.items.enum, sickCareConcerns.map(c => c.id));
});

test('pharmacy delivery remains a new outcome after groceries or clinic research, but not after the same delivery task', async () => {
  const p = await prepare(options({ concernIds: ['getting_care'] }));
  const delivery = { action_key: 'research_pharmacy_delivery', concern_ids: ['getting_care'],
    title: 'Understand pharmacy delivery before you need it', summary: 'Learn which delivery rules could matter on a future sick day.',
    estimated_minutes: 15, steps: ['Find a licensed pharmacy with a delivery information page.',
      'Check area, fees, order cutoffs and handoff requirements; availability depends on the pharmacy.',
      'If anything is unclear, identify the question to ask the pharmacy before relying on delivery.'],
    done_when: 'You understand the delivery conditions and what still needs confirmation.', resources: [], purchase_checks: [], no_purchase_option: null };
  const history = [18, 1].map(id => ({ state: taskState(key(id)), content: catalog.actions.find(a => a.actionKey === key(id)).task }));
  const accepted = acceptNewNeed({ decision: 'generated', task: delivery }, p, catalog, history, checkTaskCopy);
  assert.equal(accepted.decision, 'generated');
  const repeat = [...history, { state: taskState(accepted.task.action_key), content: accepted.task }];
  assert.throws(() => acceptNewNeed({ decision: 'generated', task: delivery }, p, catalog, repeat, checkTaskCopy), /repeated_outcome/);
});

function setup(t, generate) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys = ON');
  const migrations = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(f, migrations), 'utf8'));
  t.after(() => sql.close());
  const db = { prepare(query) { const statement = values => ({ query, values, bind: (...v) => statement(v),
    async first() { const row = sql.prepare(query).get(...values); return row ? { ...row } : null; } }); return statement([]); },
    async batch(items) { sql.exec('BEGIN'); try { const results = items.map(s => ({ results: sql.prepare(s.query).all(...s.values).map(r => ({ ...r })) })); sql.exec('COMMIT'); return results; }
      catch (e) { sql.exec('ROLLBACK'); throw e; } } };
  const env = { MEMORY_DB: db, AI_ADAPTATION_ENABLED: 'true', AI_NEW_NEEDS_ENABLED: 'true', OPENAI_MODEL: 'gpt-6-luna' };
  const handler = createHandler({ catalog, requireDeliveryIds: true, allowEditorialReview: true, allowAutomatic: true,
    verifyIdentity: async r => r.headers.get('Authorization'), generate });
  const api = async (owner, body) => {
    const response = await handler(new Request('https://example.test/api/recommendations', {
      method: 'POST', headers: { Authorization: owner, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env);
    return { status: response.status, body: await response.json() };
  };
  return { store: createD1Store(db), api };
}

test('actual new-catalog HTTP/D1 loop: two owners, more, replay, save, completion and old snapshot preservation', async t => {
  let calls = 0;
  const { store, api } = setup(t, async () => { calls++; throw new Error('Pool should not call AI'); });
  await store.createProfile('alice', { answers: { country: 'US' } }); await store.createProfile('bob', { answers: { country: 'US' } });
  let version = '1'; const shown = new Set();
  for (let i = 0; i < 3; i++) {
    const input = { route: 'pool', requestId: `priority_batch_${i}`, expectedStateVersion: version,
      request: { topicId: 'sick_care', concernIds: ['pets'] } };
    const result = await api('alice', input); assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.ok(result.body.batch.tasks.length);
    for (const task of result.body.batch.tasks) { assert.ok(!shown.has(task.action_key)); shown.add(task.action_key); }
    assert.deepEqual((await api('alice', input)).body.batch, result.body.batch);
    assert.deepEqual((await store.readLatestBatch('alice')).result.batch, result.body.batch);
    version = result.body.stateVersion;
  }
  const before = await store.readTasks('alice'); const item = before.tasks[0];
  const save = await store.applyTaskAction('alice', version, item.state.actionKey, { type: 'save' });
  const complete = await store.applyTaskAction('alice', save.stateVersion, item.state.actionKey, { type: 'complete' });
  const undo = await store.applyTaskAction('alice', complete.stateVersion, item.state.actionKey, { type: 'undo_complete' });
  assert.equal((await store.applyTaskAction('alice', undo.stateVersion, item.state.actionKey, { type: 'complete' })).earnedCount, 1);
  assert.deepEqual((await store.readTasks('alice')).tasks.find(a => a.state.actionKey === item.state.actionKey).content, item.content);
  assert.deepEqual((await store.readTasks('bob')).tasks, []); assert.equal(calls, 0);
});

test('ordinary checkbox selection through the automatic route keeps three reviewed cards without an AI call', async t => {
  let calls = 0;
  const { store, api } = setup(t, async () => { calls++; throw new Error('Checkbox matching should not call AI'); });
  await store.createProfile('alice', { answers: { country: 'US', constraints: ['cost', 'energy', 'support'], style: 'one' } });
  const result = await api('alice', { route: 'auto', requestId: 'ordinary_checkbox_no_model', expectedStateVersion: '1',
    request: { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'] } });
  assert.equal(result.status, 200);
  assert.equal(result.body.adaptation.status, 'not_needed');
  assert.equal(result.body.batch.tasks.length, 3);
  assert.ok(result.body.batch.tasks.every(task => !task.action_key.startsWith('custom_')));
  assert.equal(calls, 0);
});

test('new-catalog linked pet request creates three distinct tasks despite no unlinked pool companions', async t => {
  let calls = 0;
  const { store, api } = setup(t, async request => {
    calls++; assert.match(request.instructions, /Learning is a useful outcome/);
    const p = JSON.parse(request.input[0].content[0].text);
    assert.ok(p.eligible_resources.some(r => r.resource_id === 'rover_services'));
    assert.equal(p.requested_task_count, 3);
    return { batch: { decision: 'generated', tasks: [{ action_key: 'compare_cat_visit_lengths', concern_ids: ['pets'],
      title: 'Compare what a cat visit includes', summary: 'Understand visit length and included care before choosing a sitter.', estimated_minutes: 15,
      steps: ['Explore Rover’s drop-in service description.', 'Compare time included, total fees and cancellation terms.', 'Choose the service format worth researching; no booking or payment needed today.'],
      done_when: 'You know which visit details to compare before choosing a carer.',
      resources: [{ resource_id: 'rover_services', why: 'Understand the service format and its limits.' }], purchase_checks: [], no_purchase_option: null }, ...petIdeas()] }, metadata: null };
  });
  await store.createProfile('alice', { answers: { country: 'US' } });
  const input = { route: 'auto', requestId: 'priority_specific_request', expectedStateVersion: '1',
    request: { topicId: 'sick_care', concernIds: [], note: 'I have a cat and want to understand drop-in visit length before choosing a sitter.' } };
  const result = await api('alice', input); assert.equal(result.status, 200);
  assert.equal(result.body.adaptation.status, 'generated', JSON.stringify(result.body));
  assert.equal(result.body.batch.tasks.length, 3); assert.equal(result.body.batch.status, 'ready');
  assert.equal(result.body.batch.message, null); assert.equal(result.body.request.note, undefined);
  assert.deepEqual((await api('alice', input)).body.batch, result.body.batch); assert.equal(calls, 1);
  const tasks = await store.readTasks('alice'); assert.equal(tasks.tasks.length, 3);
  for (const task of result.body.batch.tasks) assert.deepEqual(tasks.tasks.find(t => t.state.actionKey === task.action_key).content, task);
});

test('new-catalog typed request generates and stores all three private steps in one call', async t => {
  let calls = 0;
  const { store, api } = setup(t, async () => {
    calls++;
    return { batch: generatedIdeas({ action_key: 'quiet_phone_rest', concern_ids: ['daily_tasks'],
      title: 'Give your phone a quiet hour', summary: 'Keep a rest break calmer while allowing important contacts through.',
      estimated_minutes: 5, steps: ['Open your phone’s focus settings.',
        'Choose which contacts can reach you during a rest break.', 'Save a quiet mode to use when you want to rest.'],
      done_when: 'A quiet mode is ready with your chosen contacts allowed.',
      resources: [], purchase_checks: [], no_purchase_option: null }), metadata: null };
  });
  await store.createProfile('alice', { answers: { country: 'US' } });
  const input = { route: 'auto', requestId: 'three_card_current_catalog', expectedStateVersion: '1',
    request: { topicId: 'sick_care', concernIds: [], note: 'Prepare my phone for quieter rest breaks.' } };
  const result = await api('alice', input); assert.equal(result.status, 200);
  assert.equal(result.body.adaptation.status, 'generated'); assert.equal(result.body.batch.status, 'ready');
  assert.equal(result.body.batch.tasks.length, 3); assert.equal(calls, 1);
  assert.equal(result.body.batch.tasks[0].action_key, 'custom_sick_care_quiet_phone_rest');
  assert.ok(result.body.batch.tasks.slice(1).every(task => task.concern_ids.includes('daily_tasks')));
  assert.ok(result.body.batch.tasks.filter(task => task.resources.length).length <= 1);
  assert.deepEqual((await api('alice', input)).body.batch, result.body.batch); assert.equal(calls, 1);
  const saved = await store.readTasks('alice'); assert.equal(saved.tasks.length, 3);
  for (const task of result.body.batch.tasks) assert.deepEqual(saved.tasks.find(t => t.state.actionKey === task.action_key).content, task);
});
