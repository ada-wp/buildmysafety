import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaskSession } from '../src/task-session.ts';
import { SafetyApiError, type SafetyClient } from '../src/cloud-api.ts';
import type { CatalogResponse, LatestRecommendation, RecommendationInput, RecommendationResponse,
  TaskActionInput, TaskActionResponse, TaskCollection } from '../src/api-contracts.ts';

type TaskClient = Pick<SafetyClient, 'getCatalog' | 'getTasks' | 'getLatestRecommendation' | 'recommendations' | 'taskAction'>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const catalog: CatalogResponse = { topics: [{ id: 'sick_care', label: 'Sick-day care', scope: 'Preparation',
  concerns: [{ id: 'food', label: 'Food when unwell' }] }], resources: [] };
const content = { action_key: 'easy_food', concern_ids: ['food'], title: 'Choose familiar food', summary: 'Make one ordinary day easier.',
  estimated_minutes: 5, steps: ['Choose familiar food.', 'Keep it easy to find.'], done_when: 'An option is ready.',
  resources: [], purchase_checks: [], no_purchase_option: null };
const task = { userId: 'owner_a', actionKey: content.action_key, contentRef: 'easy_food@1', shownAt: '2026-10-12T12:00:00Z',
  savedAt: null, removedAt: null, completedAt: null, likedAt: null, feedbackCode: null, feedbackAt: null };
const response: RecommendationResponse = { status: 'ok', source: 'pool', delivery: 'shown', metadata: null, reviewRequired: true,
  stateVersion: '2', requestId: 'session_request_0001', request: { topicId: 'sick_care', concernIds: ['food'] },
  batch: { status: 'no_more_ideas', message: 'One matching option.', tasks: [content] },
  trace: { contextVersion: 1, profileRevision: 1, stateVersion: '1', candidateCount: 1, promptHash: 'test' } };

function setup() {
  let collection: TaskCollection = { tasks: [], stateVersion: '1', earnedCount: 0 };
  let latest: LatestRecommendation = { result: null, stateVersion: '1' };
  const order: string[] = [];
  const recommendations: RecommendationInput[] = [];
  const actions: TaskActionInput[] = [];
  const client: TaskClient = {
    async getCatalog() { order.push('catalog'); return structuredClone(catalog); },
    async getLatestRecommendation() { order.push('latest'); return structuredClone(latest); },
    async getTasks() { order.push('tasks'); return structuredClone(collection); },
    async recommendations(input) {
      order.push('recommend'); recommendations.push(structuredClone(input));
      collection = { tasks: [{ state: structuredClone(task), content: structuredClone(content) }], stateVersion: '2', earnedCount: 0 };
      latest = { result: { ...structuredClone(response), requestId: input.requestId }, stateVersion: '2' };
      return structuredClone(latest.result!);
    },
    async taskAction(input) {
      order.push('act'); actions.push(structuredClone(input));
      const state = { ...task, savedAt: '2026-10-12T13:00:00Z' };
      collection = { tasks: [{ state, content: structuredClone(content) }], stateVersion: '3', earnedCount: 0 };
      latest = { ...latest, stateVersion: '3' };
      return { task: state, stateVersion: '3', changed: true, earnedCount: 0, awardEarned: false };
    }
  };
  const session = createTaskSession(client, () => 'session_request_0001');
  return { client, session, order, recommendations, actions };
}

test('task session uses authoritative read order and committed versions without optimistic writes', async () => {
  const { session, order, recommendations, actions } = setup();
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(await session.load(), true);
  assert.deepEqual(order, ['catalog', 'latest', 'tasks']);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), true);
  assert.deepEqual(recommendations, [{ request: { topicId: 'sick_care', concernIds: ['food'] },
    requestId: 'session_request_0001', expectedStateVersion: '1', route: 'auto' }]);
  assert.deepEqual(order.slice(3), ['recommend', 'latest', 'tasks']);
  assert.equal(session.getState().collection?.tasks[0].state.savedAt, null);
  assert.equal(await session.act('easy_food', { type: 'save' }), true);
  assert.equal(actions[0].expectedStateVersion, '2');
  assert.equal(session.getState().collection?.stateVersion, '3');
  assert.ok(session.getState().collection?.tasks[0].state.savedAt);
  assert.equal(session.getState().busy, false);
  session.dispose();
});

test('busy session serializes recommendations and task mutations, suppressing double taps', async () => {
  const { client, session } = setup();
  await session.load();
  const pending = deferred<RecommendationResponse>();
  let count = 0;
  client.recommendations = async () => { count++; return pending.promise; };
  const first = session.recommend({ topicId: 'sick_care', concernIds: ['food'] });
  assert.equal(session.getState().busy, true);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(await session.act('easy_food', { type: 'save' }), false);
  assert.equal(await session.load(), false);
  assert.equal(count, 1);
  pending.resolve(response);
  assert.equal(await first, true);
  session.dispose();
});

test('unknown mutation outcome blocks subsequent writes until explicit reload, never automatic replay', async () => {
  const { client, session, recommendations, order } = setup();
  await session.load();
  const original = client.recommendations;
  client.recommendations = async (input, options) => {
    await original(input, options);
    throw new SafetyApiError('network_error', null, true);
  };
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(session.getState().error?.outcomeUnknown, true);
  assert.deepEqual(session.getState().collection?.tasks, [], 'Unconfirmed response must not fake local success.');
  assert.equal(await session.act('easy_food', { type: 'save' }), false);
  assert.equal(await session.recommend({ topicId: 'sick_care', concernIds: ['food'] }), false);
  assert.equal(recommendations.length, 1);
  assert.deepEqual(order, ['catalog', 'latest', 'tasks', 'recommend']);
  assert.equal(await session.load(), true);
  assert.equal(session.getState().error, null);
  assert.equal(session.getState().latest?.result?.requestId, 'session_request_0001');
  assert.equal(session.getState().collection?.tasks.length, 1);
  assert.equal(recommendations.length, 1);
  session.dispose();
});

test('stale action conflicts retain visible confirmed data and require a reload before retry', async () => {
  const { client, session } = setup();
  await session.load();
  await session.recommend({ topicId: 'sick_care', concernIds: ['food'] });
  const before = session.getState().collection;
  let calls = 0;
  client.taskAction = async () => { calls++; throw new SafetyApiError('stale_state', 409); };
  assert.equal(await session.act('easy_food', { type: 'save' }), false);
  assert.equal(session.getState().error?.conflict, true);
  assert.equal(session.getState().collection, before);
  assert.equal(await session.act('easy_food', { type: 'save' }), false);
  assert.equal(calls, 1);
  assert.equal(await session.load(), true);
  assert.equal(session.getState().error, null);
  session.dispose();
});

test('expired authentication clears private task data and suppresses further writes', async () => {
  const { client, session } = setup();
  await session.load(); await session.recommend({ topicId: 'sick_care', concernIds: ['food'] });
  client.getLatestRecommendation = async () => { throw new SafetyApiError('authentication_required', 401); };
  assert.equal(await session.load(), false);
  assert.equal(session.getState().collection, null);
  assert.equal(session.getState().latest, null);
  assert.equal(session.getState().loaded, false);
  assert.equal(await session.act('easy_food', { type: 'save' }), false);
  session.dispose();
});

test('deletion discovered in another tab clears private task data and prevents more changes', async () => {
  for (const [code, status] of [['account_deleted', 410], ['account_deletion_pending', 409]] as const) {
    const { client, session } = setup();
    await session.load(); await session.recommend({ topicId: 'sick_care', concernIds: ['food'] });
    client.getLatestRecommendation = async () => { throw new SafetyApiError(code, status); };
    assert.equal(await session.load(), false);
    assert.equal(session.getState().collection, null); assert.equal(session.getState().latest, null);
    assert.equal(await session.act('easy_food', { type: 'save' }), false);
    session.dispose();
  }
});

test('dispose aborts pending action and prevents its late result from publishing into a new screen', async () => {
  const { client, session } = setup();
  await session.load();
  const pending = deferred<TaskActionResponse>();
  let signal: AbortSignal | undefined;
  client.taskAction = async (_input, options) => { signal = options?.signal; return pending.promise; };
  let notices = 0;
  session.subscribe(() => { notices++; });
  const result = session.act('easy_food', { type: 'save' });
  assert.equal(notices, 1);
  session.dispose();
  assert.equal(signal?.aborted, true);
  pending.resolve({ task, changed: true, stateVersion: '2' });
  assert.equal(await result, false);
  assert.equal(notices, 1);
  assert.equal(await session.load(), false);
});

test('StrictMode reconnect after pending load can start again and ignores the prior completion', async () => {
  const { client, session } = setup();
  const pending = deferred<CatalogResponse>();
  let firstSignal: AbortSignal | undefined;
  let first = true;
  client.getCatalog = async options => {
    if (first) { first = false; firstSignal = options?.signal; return pending.promise; }
    return structuredClone(catalog);
  };
  const old = session.load();
  session.dispose(); session.connect();
  assert.equal(firstSignal?.aborted, true);
  assert.equal(await session.load(), true);
  const restored = session.getState();
  assert.equal(restored.loaded, true); assert.equal(restored.busy, false);
  pending.resolve(catalog);
  assert.equal(await old, false);
  assert.equal(session.getState(), restored);
  session.dispose();
});
