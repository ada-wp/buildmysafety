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
const origin = 'https://journey.integration.invalid';
type Statement = { sql: string; values: SQLInputValue[]; bind: (...values: SQLInputValue[]) => Statement;
  first: () => Promise<Record<string, unknown> | null> };

function setup(t: TestContext) {
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
    verifyIdentity: async (request: Request) => {
      const owner = identities.get(request.headers.get('Authorization') || '');
      if (!owner) throw new FlowError('authentication_required');
      return owner;
    }
  });
  const env = { MEMORY_DB: db,
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
  assert.equal(first.batch.tasks.length, 3);
  assert.ok(first.batch.tasks.every(task => task.estimated_minutes <= 10));
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
  assert.equal(stored.state.contentRef, `${taskKey}@1`);
  assert.deepEqual((await bob.getTasks()).tasks, []);
  await assert.rejects(bob.taskAction({ actionKey: taskKey, expectedStateVersion: '1', event: { type: 'save' } }),
    error => error instanceof SafetyApiError && error.code === 'task_not_found');
  await assert.rejects(alice.taskAction({ actionKey: taskKey, expectedStateVersion: '1', event: { type: 'remove' } }),
    error => error instanceof SafetyApiError && error.conflict);
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
  assert.equal(session.getState().latest?.result?.batch.tasks.length, 3);
  assert.equal(session.getState().collection?.tasks.length, 3);
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
