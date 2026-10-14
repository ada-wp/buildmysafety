import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createSafetyClient, SafetyApiError } from '../src/cloud-api.ts';
import { createTaskSession } from '../src/task-session.ts';

const { createAppWorker } = await import(new URL('../worker.mjs', import.meta.url).href);
const { FlowError } = await import(new URL('../../personalization/contracts.mjs', import.meta.url).href);
const { generatedIdeas } = await import(new URL('../../personalization/test/idea-fixtures.mjs', import.meta.url).href);
const origin = 'https://journey.integration.invalid';
type Statement = { sql: string; values: SQLInputValue[]; bind: (...values: SQLInputValue[]) => Statement;
  first: () => Promise<Record<string, unknown> | null> };

function setup(t: TestContext, aiEnabled = false, newNeeds = false) {
  // Only a disposable SQL test double. The product worker uses remote D1.
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const migrations = new URL('../../personalization/migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(file => file.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  t.after(() => sqlite.close());
  const db = {
    prepare(sql: string) {
      const statement = (values: SQLInputValue[]): Statement => ({ sql, values,
        bind: (...next) => statement(next),
        async first() { const row = sqlite.prepare(sql).get(...values); return row ? { ...row } : null; }
      });
      return statement([]);
    },
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(s => ({ success: true,
          results: sqlite.prepare(s.sql).all(...s.values).map(row => ({ ...row })) }));
        sqlite.exec('COMMIT'); return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  const identities = new Map([['Bearer alice-test-token', 'journey_alice'], ['Bearer bob-test-token', 'journey_bob']]);
  const worker = createAppWorker({ contentReviewHosts: ['journey.integration.invalid'],
    generate: async (body: { input: Array<{ content: Array<{ text: string }> }>; model: string }) => {
      const { target_task: task } = JSON.parse(body.input[0].content[0].text);
      if (!task && newNeeds) return { batch: generatedIdeas({
        action_key: 'quiet_phone', concern_ids: ['daily_tasks'], title: 'Make room for a quiet break',
        summary: 'Set up a little quiet for your next rest break.', estimated_minutes: 5,
        steps: ['Open your phone’s focus settings.', 'Choose which contacts can reach you.', 'Save a quiet mode for your next rest break.'],
        done_when: 'Your quiet mode is ready.', resources: [], purchase_checks: [], no_purchase_option: null
      }), metadata: { responseId: 'resp_new_need', model: body.model, inputTokens: 100, outputTokens: 100 } };
      return { batch: { decision: 'adapted', task: { ...task, title: 'Pick two no-cook food options', estimated_minutes: 5,
        steps: ['List two familiar foods you already keep that need no cooking.', 'Check where they are and note anything missing.', 'Save both options in your usual note.'] } },
        metadata: { responseId: 'resp_test', model: body.model, inputTokens: 100, outputTokens: 100 } };
    },
    verifyIdentity: async (request: Request) => {
      const owner = identities.get(request.headers.get('Authorization') || '');
      if (!owner) throw new FlowError('authentication_required');
      return owner;
    }
  });
  const env = { MEMORY_DB: db, AI_ADAPTATION_ENABLED: aiEnabled ? 'true' : 'false', AI_NEW_NEEDS_ENABLED: newNeeds ? 'true' : 'false', OPENAI_MODEL: 'gpt-6-luna',
    get OPENAI_API_KEY() { throw new Error('Task tests must never request paid credentials'); },
    get SYNTHETIC_TEST_MODE() { throw new Error('Real catalog tests must never enable fictional content'); }
  };
  const calls: Array<{ path: string; method: string }> = [];
  let dropPath: string | null = null;
  const fetchImpl: typeof fetch = async (url, options) => {
    const request = new Request(url, options);
    assert.equal(new URL(request.url).origin, origin);
    const path = new URL(request.url).pathname;
    calls.push({ path, method: request.method });
    const response = await worker.fetch(request, env);
    if (path === dropPath && response.ok) { dropPath = null; throw new Error('Response lost after committed write'); }
    return response;
  };
  const client = (owner: 'alice' | 'bob' = 'alice') => createSafetyClient({ baseUrl: origin,
    getAccessToken: async () => `${owner}-test-token`, fetchImpl });
  return { client, calls, sqlite, loseNextResponse(path: string) { dropPath = path; } };
}

test('real client, worker and D1 agree on owned catalog, batch, detail, completion and reload contracts', async t => {
  const { client } = setup(t);
  const alice = client(); const bob = client('bob');
  await alice.createMemory({ answers: { home: 'alone', country: 'US', constraints: ['cost', 'energy'] }, interests: ['sick_care'] });
  await bob.createMemory({ answers: { country: 'CA' } });
  const catalog = await alice.getCatalog();
  assert.equal(catalog.topics.length, 1);
  assert.equal(catalog.topics[0].id, 'sick_care');
  assert.equal(catalog.topics[0].concerns.length, 5);
  assert.ok(catalog.resources.every(resource => resource.url.startsWith('https://')));
  assert.deepEqual(await alice.getTasks(), { tasks: [], stateVersion: '1', earnedCount: 0 });
  assert.deepEqual(await alice.getLatestRecommendation(), { result: null, stateVersion: '1' });
  const input = { request: { topicId: 'sick_care' as const, concernIds: ['food', 'daily_tasks'] },
    requestId: 'integration_request_01', expectedStateVersion: '1' };
  const first = await alice.recommendations(input);
  assert.equal(first.source, 'pool');
  if (first.source !== 'pool') throw new Error('Expected pool result');
  assert.ok(first.batch.tasks.length >= 1 && first.batch.tasks.length <= 3);
  assert.ok(first.batch.tasks.filter(task => task.resources.length).length <= 1);
  // Broad onboarding preferences rank ideas; they are not explicit time limits.
  assert.ok(first.batch.tasks.every(task => task.estimated_minutes <= 30));
  assert.equal(first.requestId, input.requestId);
  assert.deepEqual(first.request, input.request);
  const retry = await client().recommendations(input);
  assert.deepEqual(retry.batch, first.batch);
  const latest = await client().getLatestRecommendation();
  assert.deepEqual(latest.result?.batch, first.batch);
  assert.equal(latest.result?.requestId, input.requestId);
  const taskKey = first.batch.tasks[0].action_key;
  const saved = await alice.taskAction({ actionKey: taskKey, expectedStateVersion: first.stateVersion, event: { type: 'save' } });
  const done = await alice.taskAction({ actionKey: taskKey, expectedStateVersion: saved.stateVersion, event: { type: 'complete' } });
  assert.equal(done.earnedCount, 1); assert.equal(done.awardEarned, true);
  const undo = await alice.taskAction({ actionKey: taskKey, expectedStateVersion: done.stateVersion, event: { type: 'undo_complete' } });
  assert.equal(undo.task.completedAt, null); assert.equal(undo.earnedCount, 1);
  const again = await alice.taskAction({ actionKey: taskKey, expectedStateVersion: undo.stateVersion, event: { type: 'complete' } });
  assert.equal(again.awardEarned, false); assert.equal(again.earnedCount, 1);
  const reopened = await client().getTasks();
  assert.equal(reopened.earnedCount, 1);
  const stored = reopened.tasks.find(task => task.state.actionKey === taskKey)!;
  assert.ok(stored.state.completedAt);
  assert.deepEqual(stored.content.steps, first.batch.tasks[0].steps);
  assert.ok(stored.state.contentRef.startsWith(`${taskKey}@`));
  assert.equal((await client().getTasks()).tasks.find(task => task.state.actionKey === taskKey)?.state.contentRef,
    stored.state.contentRef);
  assert.deepEqual((await bob.getTasks()).tasks, []);
  await assert.rejects(bob.taskAction({ actionKey: taskKey, expectedStateVersion: '1', event: { type: 'save' } }),
    error => error instanceof SafetyApiError && error.code === 'task_not_found');
  await assert.rejects(alice.taskAction({ actionKey: taskKey, expectedStateVersion: '1', event: { type: 'remove' } }),
    error => error instanceof SafetyApiError && error.conflict);
});

test('real journey reaches all five milestones, retains check-ins after reload and keeps undo separate from awards', async t => {
  const { client, calls } = setup(t); const alice = client(); const bob = client('bob');
  await alice.createMemory({ interests: ['sick_care'] }); await bob.createMemory();
  let version = '1'; let completed = 0; let requestNumber = 0;
  for (; completed < 10;) {
    const batch = await alice.recommendations({ route: 'pool', requestId: `progress_journey_${++requestNumber}`,
      expectedStateVersion: version, request: { topicId: 'sick_care', concernIds: ['food', 'getting_care', 'daily_tasks', 'pets', 'check_in'], country: 'US' } });
    assert.equal(batch.source, 'pool'); assert.ok(batch.batch.tasks.length);
    if (batch.source !== 'pool') throw new Error('Expected prepared tasks');
    version = batch.stateVersion;
    for (const task of batch.batch.tasks) {
      const saved = await alice.taskAction({ actionKey: task.action_key, expectedStateVersion: version, event: { type: 'save' } });
      const done = await alice.taskAction({ actionKey: task.action_key, expectedStateVersion: saved.stateVersion, event: { type: 'complete' } });
      version = done.stateVersion; completed++;
      const progress = await alice.getProgress(); const sick = progress.categories[0];
      assert.equal(progress.stateVersion, version); assert.equal(sick.completedCount, completed); assert.equal(sick.earnedCount, completed);
      if ([1, 3, 6, 9, 10].includes(completed)) {
        const write = { topicId: 'sick_care' as const, expectedStateVersion: version, expectedRevision: sick.revision, milestone: completed };
        const acknowledged = await alice.updateProgress(write);
        assert.ok(acknowledged.categories[0].seenMilestones.includes(completed));
        assert.deepEqual(await alice.updateProgress(write), acknowledged);
        if (completed === 6) await alice.updateProgress({ ...write, expectedRevision: acknowledged.categories[0].revision, feeling: 'somewhat' });
      }
      if (completed === 10) {
        const beforeUndo = await client().getProgress();
        assert.deepEqual(beforeUndo.categories[0].seenMilestones, [1, 3, 6, 9, 10]);
        assert.equal(beforeUndo.categories[0].latestCheckIn?.feeling, 'somewhat');
        const undone = await alice.taskAction({ actionKey: task.action_key, expectedStateVersion: version, event: { type: 'undo_complete' } });
        const afterUndo = await alice.getProgress();
        assert.equal(afterUndo.categories[0].completedCount, 9); assert.equal(afterUndo.categories[0].earnedCount, 10);
        assert.deepEqual(afterUndo.categories[0].seenMilestones, [1, 3, 6, 9, 10]);
        await alice.taskAction({ actionKey: task.action_key, expectedStateVersion: undone.stateVersion, event: { type: 'complete' } });
        assert.equal((await alice.getProgress()).categories[0].earnedCount, 10);
        break;
      }
    }
  }
  assert.equal((await bob.getProgress()).categories[0].completedCount, 0);
  assert.deepEqual((await bob.getProgress()).categories[0].seenMilestones, []);
  assert.equal(calls.filter(c => c.path === '/api/progress' && c.method === 'PATCH').length, 11);
});

test('client sends explicit feedback to refine a previously shown unsaved task and reloads its replacement', async t => {
  const { client } = setup(t, true);
  const alice = client();
  await alice.createMemory({ interests: ['sick_care'] });
  const first = await alice.recommendations({ route: 'auto', requestId: 'refinement_seed_01', expectedStateVersion: '1',
    request: { topicId: 'sick_care', concernIds: ['food'] } });
  if (first.source !== 'pool') throw new Error('Expected the initial pool batch.');
  const before = await alice.getTasks();
  const target = before.tasks.find(item => item.state.actionKey === first.batch.tasks[0].action_key)!;
  const result = await alice.recommendations({ route: 'auto', requestId: 'refinement_client_01', expectedStateVersion: first.stateVersion,
    request: { topicId: 'sick_care', concernIds: ['food'], refineActionKey: target.state.actionKey,
      note: 'I have no microwave. Please use food with no cooking.' } });
  assert.equal(result.source, 'mixed'); assert.equal(result.adaptation?.refinement, true);
  assert.equal(result.batch.tasks.length, 1); assert.equal(result.request?.note, undefined);
  const reloaded = await client().getTasks();
  assert.equal(reloaded.tasks.length, before.tasks.length);
  const revised = reloaded.tasks.find(item => item.state.actionKey === target.state.actionKey)!;
  assert.equal(revised.content.title, 'Pick two no-cook food options');
  assert.ok(revised.state.contentRef.startsWith('ai_')); assert.equal(revised.state.savedAt, null);
  assert.deepEqual((await client().getLatestRecommendation()).result?.batch, result.batch);
});

test('mixed AI result crosses real client/worker contract and stays stable across controller reload', async t => {
  const { client, sqlite } = setup(t, true); const alice = client();
  await alice.createMemory({ answers: { home: 'alone', constraints: ['cost'] } });
  const session = createTaskSession(alice, () => 'mixed_client_request01'); t.after(() => session.dispose());
  assert.equal(await session.load(), true);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food', 'daily_tasks'], note: 'I want food with no cooking.' }), true);
  const result = session.getState().latest?.result;
  assert.equal(result?.source, 'mixed'); assert.equal(result?.batch.tasks.length, 3);
  const task = session.getState().collection!.tasks.find(t => t.state.contentRef.startsWith('ai_'))!;
  assert.equal(await session.act(task.state.actionKey, { type: 'save' }), true);
  const again = createTaskSession(client()); t.after(() => again.dispose()); await again.load();
  assert.deepEqual(again.getState().collection!.tasks.find(t => t.state.actionKey === task.state.actionKey)?.content, task.content);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_ai_attempts').get()?.n, 1);
});

test('typed new need crosses controller, enabled worker, private storage and returning-user reload', async t => {
  const { client, sqlite } = setup(t, true, true);
  await client().createMemory({}); await client('bob').createMemory({});
  let id = 0;
  const session = createTaskSession(client(), () => `new_need_client_${++id}`); t.after(() => session.dispose());
  await session.load();
  for (let i = 0; i < 4; i++) await session.recommend({ topicId: 'sick_care', concernIds: ['daily_tasks'] }, 'pool');
  assert.equal(session.getState().latest?.result?.batch.tasks.length, 0);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['daily_tasks'], note: 'Help me reduce phone interruptions while resting.' }), true);
  const result = session.getState().latest!.result!;
  assert.equal(result.adaptation?.status, 'generated'); assert.equal(result.adaptation?.newNeed, true);
  const task = result.batch.tasks[0]; assert.equal(task.action_key, 'custom_sick_care_quiet_phone');
  assert.equal(await session.act(task.action_key, { type: 'save' }), true);
  const returning = createTaskSession(client()); t.after(() => returning.dispose()); await returning.load();
  assert.equal(result.batch.tasks.length, 3);
  assert.deepEqual(returning.getState().latest?.result?.batch.tasks, result.batch.tasks);
  assert.ok(returning.getState().collection?.tasks.find(t => t.state.actionKey === task.action_key)?.state.savedAt);
  assert.deepEqual((await client('bob').getTasks()).tasks, []);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM memory_ai_attempts').get()?.n, 1);
});

test('lost committed batch response recovers through an explicit controller reload without another generation request', async t => {
  const { client, calls, loseNextResponse, sqlite } = setup(t);
  const alice = client();
  await alice.createMemory({ answers: { country: 'US' } });
  const session = createTaskSession(alice, () => 'lost_response_request1');
  t.after(() => session.dispose());
  assert.equal(await session.load(), true);
  loseNextResponse('/api/recommendations');
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(session.getState().error?.outcomeUnknown, true);
  assert.equal(calls.filter(call => call.path === '/api/recommendations').length, 1);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(await session.load(), true);
  assert.equal(session.getState().error, null);
  assert.equal(session.getState().latest?.result?.requestId, 'lost_response_request1');
  const delivered = session.getState().latest!.result!.batch.tasks;
  assert.ok(delivered.length >= 1 && delivered.length <= 3);
  assert.equal(session.getState().collection?.tasks.length, delivered.length);
  assert.equal(calls.filter(call => call.path === '/api/recommendations').length, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_latest_batch').get()?.n, 1);
  const newSession = createTaskSession(client());
  t.after(() => newSession.dispose());
  assert.equal(await newSession.load(), true);
  assert.deepEqual(newSession.getState().latest?.result?.batch, session.getState().latest?.result?.batch);
});

test('lost committed completion response recovers its award once and never replays the write automatically', async t => {
  const { client, calls, loseNextResponse } = setup(t);
  const alice = client();
  await alice.createMemory({});
  const session = createTaskSession(alice, () => 'completion_request01');
  t.after(() => session.dispose());
  await session.load();
  await session.recommend({ topicId: 'sick_care', concernIds: ['food'] });
  const key = session.getState().latest!.result!.batch.tasks[0].action_key;
  assert.equal(await session.act(key, { type: 'save' }), true);
  loseNextResponse('/api/tasks/action');
  assert.equal(await session.act(key, { type: 'complete' }), false);
  assert.equal(session.getState().error?.outcomeUnknown, true);
  const before = calls.filter(call => call.path === '/api/tasks/action').length;
  assert.equal(await session.load(), true);
  assert.equal(session.getState().collection?.earnedCount, 1);
  assert.ok(session.getState().collection?.tasks.find(task => task.state.actionKey === key)?.state.completedAt);
  assert.equal(calls.filter(call => call.path === '/api/tasks/action').length, before);
});
