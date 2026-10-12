import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createSafetyClient, SafetyApiError } from '../src/cloud-api.ts';
import type { ProfileChanges } from '../src/api-contracts.ts';

// Backend imports exist only in this Node test. The browser client imports no
// server modules. Dynamic paths avoid adding backend JS to the app's TS project.
const httpModule = new URL('../../personalization/http.mjs', import.meta.url);
const fixtureModule = new URL('../../personalization/test/fixtures.mjs', import.meta.url);
const contractsModule = new URL('../../personalization/contracts.mjs', import.meta.url);
const { createHandler } = await import(httpModule.href);
const { makeCatalog } = await import(fixtureModule.href);
const { FlowError } = await import(contractsModule.href);
const migration = readFileSync(new URL('../../personalization/migrations/0001_user_memory.sql', import.meta.url), 'utf8');
const ALICE = 'synthetic-integration-alice';
const BOB = 'synthetic-integration-bob';
const errorCode = (code: string) => (error: unknown) => error instanceof SafetyApiError && error.code === code;

type Prepared = {
  sql: string;
  values: SQLInputValue[];
  bind: (...values: SQLInputValue[]) => Prepared;
  first: () => Promise<Record<string, unknown> | null>;
};

function setup(t: TestContext) {
  // Disposable in-memory SQL test double only; product persistence remains D1.
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(migration);
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0002_task_journey.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0004_ai_adaptation.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const db = {
    prepare(sql: string) {
      const statement = (values: SQLInputValue[]): Prepared => ({ sql, values,
        bind: (...next) => statement(next),
        async first() { const row = sqlite.prepare(sql).get(...values); return row ? { ...row } : null; }
      });
      return statement([]);
    },
    async batch(statements: Prepared[]) {
      sqlite.exec('BEGIN');
      try {
        const result = statements.map(s => ({ success: true, results: sqlite.prepare(s.sql).all(...s.values).map(row => ({ ...row })) }));
        sqlite.exec('COMMIT');
        return result;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  const identities = new Map([['alice-test-token', ALICE], ['bob-test-token', BOB]]);
  const calls: Array<{ path: string; method: string; body: unknown }> = [];
  let dropNextCommittedResponse = false;
  const handler = createHandler({ catalog: makeCatalog(),
    // Injected test identity mapping, not JWT verification or real customer sign-in.
    verifyIdentity: async (request: Request) => {
      const authorization = request.headers.get('Authorization') || '';
      const owner = authorization.startsWith('Bearer ') ? identities.get(authorization.slice(7)) : undefined;
      if (!owner) throw new FlowError('authentication_invalid');
      return owner;
    }
  });
  const env = { MEMORY_DB: db, SYNTHETIC_TEST_MODE: 'true' }; // No OpenAI credentials or model.
  const fetchImpl: typeof fetch = async (url, options = {}) => {
    const request = new Request(url, options);
    assert.equal(new URL(request.url).origin, 'https://integration.invalid');
    calls.push({ path: new URL(request.url).pathname, method: request.method,
      body: options.body ? JSON.parse(options.body as string) : null });
    const response = await handler(request, env);
    if (dropNextCommittedResponse) {
      dropNextCommittedResponse = false;
      assert.ok(response.ok, 'Simulate loss only after a successful server mutation.');
      throw new Error('Synthetic response loss after commit');
    }
    return response;
  };
  const client = (owner: 'alice' | 'bob') => createSafetyClient({ baseUrl: 'https://integration.invalid',
    getAccessToken: async () => `${owner}-test-token`, fetchImpl });
  return { client, calls, sqlite, loseNextResponse: () => { dropNextCommittedResponse = true; } };
}

const sick = { request: { topicId: 'sick_care' as const, concernIds: ['low_energy'], noSpend: true, maxMinutes: 10 } };

test('client and real HTTP/D1 modules agree on owned create/read/edit contracts and stale edits', async t => {
  const { client, calls, sqlite } = setup(t);
  const alice = client('alice');
  const bob = client('bob');
  const created = await alice.createMemory({ answers: { home: 'alone', country: 'US' }, interests: ['sick_care'] });
  await bob.createMemory({ answers: { home: 'shared', country: 'CA' } });
  assert.equal(created.profile.userId, ALICE);
  assert.equal(created.profile.revision, 1);
  assert.equal(created.profile.answers.style, null);
  const edited = await alice.updateMemory({ expectedRevision: 1, changes: { answers: { style: 'choice' } } });
  assert.equal(edited.profile.revision, 2);
  assert.equal(edited.profile.answers.home, 'alone');
  await assert.rejects(alice.updateMemory({ expectedRevision: 1, changes: { answers: { home: 'shared' } } }), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.code, 'stale_profile'); assert.equal(error.status, 409);
    assert.equal(error.conflict, true); assert.equal(error.outcomeUnknown, false); return true;
  });
  const reopened = await client('alice').getMemory();
  assert.equal(reopened.profile.answers.style, 'choice');
  assert.equal(reopened.stateVersion, '2');
  const untouched = await bob.getMemory();
  assert.equal(untouched.profile.userId, BOB);
  assert.equal(untouched.profile.answers.country, 'CA');
  assert.equal(untouched.profile.revision, 1);
  assert.deepEqual(untouched.taskStates, []);

  const beforeRows = sqlite.prepare('SELECT * FROM memory_profiles ORDER BY user_id').all();
  const beforeCalls = calls.length;
  assert.throws(() => alice.createMemory({ userId: BOB } as unknown as ProfileChanges), errorCode('invalid_request'));
  assert.throws(() => alice.updateMemory({ expectedRevision: 2, changes: { userId: BOB } } as never), errorCode('invalid_request'));
  assert.equal(calls.length, beforeCalls);
  assert.deepEqual(sqlite.prepare('SELECT * FROM memory_profiles ORDER BY user_id').all(), beforeRows);
  assert.ok(calls.filter(call => call.body).every(call => !JSON.stringify(call.body).includes('userId')));
});

test('pool recommendation envelope carries committed version and save/like use the same task contract', async t => {
  const { client } = setup(t);
  const alice = client('alice');
  const bob = client('bob');
  await alice.createMemory({ answers: { country: 'US' } });
  await bob.createMemory({});
  const result = await alice.recommendations(sick);
  assert.equal(result.source, 'pool');
  assert.equal(result.delivery, 'shown');
  assert.equal(result.batch.status, 'ready');
  assert.equal(result.batch.tasks.length, 3);
  assert.equal(result.metadata, null);
  assert.equal(result.trace.stateVersion, '1');
  assert.equal(result.reviewRequired, true, 'Synthetic engineering copy remains review-only.');
  if (result.source !== 'pool') throw new Error('Expected pool result');
  assert.equal(result.stateVersion, '2');
  const actionKey = result.batch.tasks[0].action_key;
  const saved = await alice.taskAction({ expectedStateVersion: result.stateVersion, actionKey, event: { type: 'save' } });
  assert.equal(saved.task.userId, ALICE);
  assert.equal(saved.task.actionKey, actionKey);
  assert.equal(saved.task.contentRef, `${actionKey}@1`);
  assert.ok(saved.task.savedAt);
  assert.equal(saved.stateVersion, '3');
  assert.equal(saved.changed, true);
  const repeated = await alice.taskAction({ expectedStateVersion: saved.stateVersion, actionKey, event: { type: 'save' } });
  assert.equal(repeated.changed, false);
  assert.equal(repeated.stateVersion, saved.stateVersion);
  assert.equal(repeated.task.savedAt, saved.task.savedAt);
  const liked = await alice.taskAction({ expectedStateVersion: repeated.stateVersion, actionKey, event: { type: 'like' } });
  assert.equal(liked.stateVersion, '4');
  await assert.rejects(alice.taskAction({ expectedStateVersion: '3', actionKey, event: { type: 'remove' } }), errorCode('stale_state'));
  await assert.rejects(bob.taskAction({ expectedStateVersion: '1', actionKey, event: { type: 'like' } }), errorCode('task_not_found'));
  const persisted = await client('alice').getMemory();
  assert.equal(persisted.stateVersion, '4');
  assert.equal(persisted.taskStates.length, 3);
  assert.ok(persisted.taskStates.find(task => task.actionKey === actionKey)?.likedAt);
  assert.deepEqual((await bob.getMemory()).taskStates, []);
});

test('reset clears active preferences while retaining owned progress and the other account', async t => {
  const { client } = setup(t);
  const alice = client('alice');
  const bob = client('bob');
  await alice.createMemory({ answers: { country: 'US' } });
  await bob.createMemory({ answers: { country: 'US' } });
  const first = await alice.recommendations(sick);
  await bob.recommendations(sick);
  if (first.source !== 'pool') throw new Error('Expected pool result');
  const actionKey = first.batch.tasks[0].action_key;
  let version = first.stateVersion;
  for (const event of [{ type: 'save' as const }, { type: 'complete' as const }, { type: 'like' as const },
    { type: 'feedback' as const, code: 'helpful' as const }]) {
    version = (await alice.taskAction({ expectedStateVersion: version, actionKey, event })).stateVersion;
  }
  const beforeBob = await bob.getMemory();
  const beforeAlice = await alice.getMemory();
  const reset = await alice.resetMemory({ expectedRevision: beforeAlice.profile.revision });
  assert.equal(reset.profile.revision, beforeAlice.profile.revision + 1);
  assert.ok(reset.profile.signalsResetAt);
  const afterAlice = await client('alice').getMemory();
  const task = afterAlice.taskStates.find(item => item.actionKey === actionKey)!;
  assert.ok(task.savedAt);
  assert.ok(task.completedAt);
  assert.equal(task.likedAt, null);
  assert.equal(task.feedbackCode, null);
  assert.equal(task.feedbackAt, null);
  assert.ok(Date.parse(afterAlice.profile.signalsResetAt!) > Date.parse(task.savedAt));
  assert.equal(afterAlice.taskStates.length, beforeAlice.taskStates.length);
  assert.deepEqual(await bob.getMemory(), beforeBob);
  await assert.rejects(alice.resetMemory({ expectedRevision: 1 }), errorCode('stale_profile'));
});

test('new-topic and exhausted-pool results pass the client contract without repeating prior outcomes', async t => {
  const { client } = setup(t);
  const alice = client('alice');
  await alice.createMemory({ answers: { home: 'alone', focus: 'sick', country: 'US' }, interests: ['sick_care'] });
  const first = await alice.recommendations(sick);
  const next = await alice.recommendations({ request: { topicId: 'home_confidence', concernIds: ['settle_in'], maxMinutes: 5, noSpend: true } });
  assert.equal(next.source, 'pool');
  assert.equal(next.batch.status, 'no_more_ideas');
  assert.deepEqual(next.batch.tasks.map(task => task.action_key), ['home_essentials']);
  assert.ok(next.batch.tasks.every(task => !first.batch.tasks.some(previous => previous.action_key === task.action_key)));
  const before = await alice.getMemory();
  const exhausted = await alice.recommendations({ request: { topicId: 'home_confidence', concernIds: ['settle_in'] } });
  assert.equal(exhausted.batch.status, 'no_more_ideas');
  assert.deepEqual(exhausted.batch.tasks, []);
  if (exhausted.source !== 'pool') throw new Error('Expected pool result');
  assert.equal(exhausted.stateVersion, before.stateVersion);
  assert.deepEqual(await alice.getMemory(), before);
});

test('lost response after real commit remains unknown until an explicit reread; no mutation retry', async t => {
  const { client, calls, loseNextResponse } = setup(t);
  const alice = client('alice');
  loseNextResponse();
  await assert.rejects(alice.createMemory({ interests: ['home_confidence'] }), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.code, 'network_error');
    assert.equal(error.outcomeUnknown, true);
    assert.equal(error.retryable, false);
    assert.doesNotMatch(error.message, /saved|Synthetic response loss/);
    return true;
  });
  assert.equal(calls.length, 1, 'The client must not retry an unconfirmed create.');
  const recovered = await client('alice').getMemory();
  assert.equal(recovered.profile.userId, ALICE);
  assert.equal(recovered.profile.revision, 1);
  assert.deepEqual(recovered.profile.interests, ['home_confidence']);
  assert.equal(calls.length, 2);
});
