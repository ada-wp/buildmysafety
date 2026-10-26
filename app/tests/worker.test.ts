import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import { readFileSync } from 'node:fs';

// Server imports are confined to Node tests and the Pages worker entry; they
// are not dependencies of the browser app. No network or identity provider here.
const { createAppWorker, default: defaultWorker } = await import(new URL('../worker.mjs', import.meta.url).href);
const { FlowError } = await import(new URL('../../personalization/contracts.mjs', import.meta.url).href);
const { AI_LIMITS, PREVIEW_AI_LIMITS } = await import(new URL('../../personalization/ai-budget.mjs', import.meta.url).href);
const migration = readFileSync(new URL('../../personalization/migrations/0001_user_memory.sql', import.meta.url), 'utf8');
const origin = 'https://app.example';
const clerkConfig = {
  CLERK_ISSUER: 'https://fixture.clerk.accounts.dev',
  CLERK_AUTHORIZED_PARTIES: JSON.stringify([origin])
};

function req(path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`${origin}${path}`, {
    method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

function privateHeaders(response: Response) {
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
}

async function errorIs(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  privateHeaders(response);
  assert.deepEqual(await response.json(), { error: code });
}

type Prepared = {
  sql: string;
  values: SQLInputValue[];
  bind: (...values: SQLInputValue[]) => Prepared;
  first: () => Promise<Record<string, unknown> | null>;
};

function setup(t: TestContext) {
  const sqlite = new DatabaseSync(':memory:'); // Disposable test SQL only; deployed storage is D1.
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(migration);
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0002_task_journey.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0004_ai_adaptation.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0003_onboarding.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0005_account_privacy.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../personalization/migrations/0007_task_step_checks.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const db = {
    prepare(sql: string) {
      const statement = (values: SQLInputValue[]): Prepared => ({
        sql, values, bind: (...next) => statement(next),
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
  let identityCalls = 0;
  let assetCalls = 0;
  const identities = new Map([['Bearer alice-test', 'user_alice'], ['Bearer bob-test', 'user_bob']]);
  const worker = createAppWorker({
    contentReviewHosts: ['app.example'],
    verifyIdentity: async (request: Request, env: Record<string, unknown>) => {
      identityCalls++;
      assert.deepEqual(Object.keys(env).sort(), ['AI_ADAPTATION_ENABLED', 'AI_LIMITS', 'AI_NEW_NEEDS_ENABLED', 'AI_UNLIMITED_OWNERS', 'CLERK_AUTHORIZED_PARTIES', 'CLERK_ISSUER', 'CLERK_SECRET_KEY', 'MEMORY_DB', 'OPENAI_API_KEY', 'OPENAI_MODEL']);
      const owner = identities.get(request.headers.get('Authorization') || '');
      if (!owner) throw new FlowError('authentication_required');
      return owner;
    }
  });
  const env = {
    ...clerkConfig, MEMORY_DB: db,
    ASSETS: { async fetch() { assetCalls++; return new Response('<!doctype html><title>App</title>'); } },
    get OPENAI_API_KEY() { throw new Error('The profile worker must not read AI secrets'); },
    get CLERK_SECRET_KEY() { throw new Error('Ordinary app routes must not read identity admin secrets'); },
    get SYNTHETIC_TEST_MODE() { throw new Error('The profile worker must not enable test content'); },
    get AUTH_JWKS_JSON() { throw new Error('The profile worker must not read synthetic identity config'); }
  };
  const send = (path: string, method = 'GET', body?: unknown, owner = 'alice') =>
    worker.fetch(req(path, method, body, { Authorization: `Bearer ${owner}-test`, Origin: origin }), env) as Promise<Response>;
  return { worker, env, sqlite, send, counts: () => ({ identityCalls, assetCalls }) };
}

test('default Pages entry serves public health with standard Request/Response and no bindings', async () => {
  const response = await defaultWorker.fetch(req('/health'), undefined);
  assert.ok(response instanceof Response);
  assert.equal(response.status, 200);
  privateHeaders(response);
  assert.deepEqual(await response.json(), { ok: true });
  const wrongMethod = await defaultWorker.fetch(req('/health', 'POST'), undefined);
  assert.equal(wrongMethod.headers.get('Allow'), 'GET');
  await errorIs(wrongMethod, 405, 'method_not_allowed');
  await errorIs(await defaultWorker.fetch(req('/health?private=1'), undefined), 400, 'invalid_request');
});

test('memory create/read/edit reaches real shared handler and keeps two verified owners isolated', async t => {
  const { send, counts } = setup(t);
  const created = await send('/api/memory', 'POST', { answers: { home: 'alone' }, interests: ['sick_care'] });
  assert.equal(created.status, 201); privateHeaders(created);
  const alice = (await created.json()).profile;
  assert.equal(alice.userId, 'user_alice');
  assert.equal(alice.revision, 1);
  assert.equal((await send('/api/memory', 'POST', { answers: { home: 'shared' } }, 'bob')).status, 201);
  const updated = await send('/api/memory', 'PATCH', { expectedRevision: 1, changes: { answers: { style: 'choice' } } });
  assert.equal(updated.status, 200); privateHeaders(updated);
  assert.equal((await updated.json()).profile.revision, 2);
  const snapshot = await (await send('/api/memory')).json();
  assert.equal(snapshot.profile.answers.home, 'alone');
  assert.equal(snapshot.profile.answers.style, 'choice');
  assert.equal(snapshot.stateVersion, '2');
  assert.deepEqual(snapshot.taskStates, []);
  const bob = await (await send('/api/memory', 'GET', undefined, 'bob')).json();
  assert.equal(bob.profile.userId, 'user_bob');
  assert.equal(bob.profile.answers.home, 'shared');
  assert.equal(bob.profile.revision, 1);
  assert.equal(counts().assetCalls, 0);
});

test('stale and browser-owned profile changes are rejected without changing stored data', async t => {
  const { send, sqlite } = setup(t);
  await errorIs(await send('/api/memory', 'POST', { userId: 'user_bob' }), 400, 'invalid_body');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_profiles').get()?.n, 0);
  await send('/api/memory', 'POST', {});
  await send('/api/memory', 'PATCH', { expectedRevision: 1, changes: { interests: ['rest'] } });
  const rows = sqlite.prepare('SELECT * FROM memory_profiles').all();
  await errorIs(await send('/api/memory', 'PATCH', { expectedRevision: 1, changes: { interests: [] } }), 409, 'stale_profile');
  await errorIs(await send('/api/memory', 'PATCH', { expectedRevision: 2, changes: { userId: 'user_bob' } }), 400, 'invalid_body');
  assert.deepEqual(sqlite.prepare('SELECT * FROM memory_profiles').all(), rows);
});

test('reserved API namespace never reaches auth, D1 or SPA fallback', async t => {
  const { worker, env, counts } = setup(t);
  for (const path of ['/api', '/api/',
    '/api/memory/', '/api/%6demory', '/api%2Fmemory', '/API/memory', '/api/memory/unknown']) {
    for (const method of ['GET', 'POST', 'OPTIONS']) {
      await errorIs(await worker.fetch(req(path, method), env), 404, 'route_not_found');
    }
  }
  assert.deepEqual(counts(), { identityCalls: 0, assetCalls: 0 });
});

test('learning reset is an authenticated POST, uses revision checks and preserves profile answers', async t => {
  const { send } = setup(t);
  const profile = await (await send('/api/memory', 'POST', { interests: ['sick_care'] })).json();
  for (const method of ['GET', 'DELETE', 'OPTIONS']) await errorIs(await send('/api/memory/reset', method), 405, 'method_not_allowed');
  const reset = await send('/api/memory/reset', 'POST', { expectedRevision: profile.profile.revision });
  assert.equal(reset.status, 200); privateHeaders(reset);
  const result = await reset.json(); assert.deepEqual(result.profile.interests, ['sick_care']); assert.ok(result.profile.signalsResetAt);
  await errorIs(await send('/api/memory/reset', 'POST', { expectedRevision: profile.profile.revision }), 409, 'stale_profile');
  await errorIs(await send('/api/memory/reset', 'POST', { expectedRevision: 2, userId: 'user_bob' }), 400, 'invalid_body');
});

test('memory method allowlist rejects deletion, HEAD and preflight without invoking backend', async t => {
  const { worker, env, counts } = setup(t);
  for (const method of ['PUT', 'DELETE', 'HEAD', 'OPTIONS']) {
    const response = await worker.fetch(req('/api/memory', method), env);
    assert.equal(response.headers.get('Allow'), 'GET, POST, PATCH');
    await errorIs(response, 405, 'method_not_allowed');
  }
  assert.deepEqual(counts(), { identityCalls: 0, assetCalls: 0 });
});

test('default verifier is fail-closed without Clerk configuration, even with a caller identity', async () => {
  const noFallback = { ASSETS: { fetch() { throw new Error('An API must not fall back to assets'); } } };
  await errorIs(await defaultWorker.fetch(req('/api/memory', 'GET', undefined, {
    Authorization: 'Bearer unsigned.token.value', 'x-user-id': 'user_bob', Cookie: '__session=pretend'
  }), noFallback), 503, 'authentication_not_configured');
  await errorIs(await defaultWorker.fetch(req('/api/memory', 'POST', { userId: 'user_bob' }), noFallback), 503, 'authentication_not_configured');
});

test('configured default Clerk verifier rejects cookies, owner headers and malformed tokens before storage', async () => {
  const env = { ...clerkConfig, get MEMORY_DB() { return undefined; } };
  await errorIs(await defaultWorker.fetch(req('/api/memory', 'POST', { userId: 'user_bob' }, {
    Cookie: '__session=fake', 'x-user-id': 'user_bob'
  }), env), 401, 'authentication_required');
  await errorIs(await defaultWorker.fetch(req('/api/memory', 'GET', undefined, {
    Authorization: 'Bearer malformed'
  }), env), 401, 'authentication_invalid');
});

test('foreign origins and query parameters are rejected by shared HTTP rules with no broad CORS', async t => {
  const { worker, env, counts } = setup(t);
  await errorIs(await worker.fetch(req('/api/memory', 'POST', {}, {
    Origin: 'https://other.example', Authorization: 'Bearer alice-test'
  }), env), 403, 'origin_not_allowed');
  await errorIs(await worker.fetch(req('/api/memory?userId=user_bob', 'GET', undefined, {
    Authorization: 'Bearer alice-test'
  }), env), 400, 'invalid_request');
  assert.deepEqual(counts(), { identityCalls: 0, assetCalls: 0 });
});

test('non-API navigation and asset routes use only ASSETS with its headers and status intact', async () => {
  const worker = createAppWorker({ verifyIdentity: async () => { throw new Error('Static assets must not authenticate'); } });
  const calls: Request[] = [];
  const env = {
    get MEMORY_DB() { throw new Error('Static assets must not access D1'); },
    get CLERK_ISSUER() { throw new Error('Static assets must not access identity settings'); },
    ASSETS: { async fetch(request: Request) {
      calls.push(request);
      return new Response('asset-body', { status: 202, headers: {
        'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=120', 'X-Asset-Header': 'preserved'
      } });
    } }
  };
  for (const path of ['/', '/account', '/onboarding', '/assets/app.js?v=1', '/apiary']) {
    const request = req(path);
    const response = await worker.fetch(request, env);
    assert.equal(calls.at(-1), request);
    assert.equal(response.status, 202);
    assert.equal(response.headers.get('Content-Type'), 'text/html');
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=120');
    assert.equal(response.headers.get('X-Asset-Header'), 'preserved');
    assert.equal(await response.text(), 'asset-body');
  }
  assert.equal(calls.length, 5);
});

test('missing or failed asset binding gives a safe error without private exception details', async () => {
  for (const env of [undefined, {}, { ASSETS: {} }, { ASSETS: { async fetch() { throw new Error('private upstream detail'); } } }]) {
    await errorIs(await defaultWorker.fetch(req('/account'), env), 503, 'assets_unavailable');
  }
});

test('real task routes persist selected work, replay delivery, and count completion only once', async t => {
  const { send, sqlite } = setup(t);
  await send('/api/memory', 'POST', { answers: { country: 'US' }, interests: ['sick_care'] });
  await send('/api/memory', 'POST', {}, 'bob');
  const discovery = await (await send('/api/catalog')).json();
  assert.equal(discovery.reviewRequired, true);
  assert.deepEqual(discovery.topics.map((topic: { id: string }) => topic.id), ['sick_care']);
  assert.equal(discovery.topics[0].concerns.length, 5);
  await errorIs(await send('/api/recommendations', 'POST', { request: { topicId: 'sick_care', concernIds: ['food'] } }), 400, 'invalid_request_id');
  const request = { requestId: 'worker_first_request', expectedStateVersion: '1', request: { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'] } };
  const deliveredResponse = await send('/api/recommendations', 'POST', request);
  assert.equal(deliveredResponse.status, 200, JSON.stringify(await deliveredResponse.clone().json()));
  const delivered = await deliveredResponse.json();
  assert.equal(delivered.source, 'pool');
  assert.equal(delivered.reviewRequired, true);
  assert.ok(delivered.batch.tasks.length >= 1 && delivered.batch.tasks.length <= 3);
  assert.ok(delivered.batch.tasks.filter((task: { resources: unknown[] }) => task.resources.length).length <= 1);
  const replay = await (await send('/api/recommendations', 'POST', request)).json();
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.batch, delivered.batch);
  const actionKey = delivered.batch.tasks[0].action_key;
  await errorIs(await send('/api/tasks/action', 'POST', { expectedStateVersion: delivered.stateVersion, actionKey, event: { type: 'complete' } }), 409, 'task_not_saved');
  const saved = await (await send('/api/tasks/action', 'POST', { expectedStateVersion: delivered.stateVersion, actionKey, event: { type: 'save' } })).json();
  const completed = await (await send('/api/tasks/action', 'POST', { expectedStateVersion: saved.stateVersion, actionKey, event: { type: 'complete' } })).json();
  assert.equal(completed.awardEarned, true);
  assert.equal(completed.earnedCount, 1);
  const undone = await (await send('/api/tasks/action', 'POST', { expectedStateVersion: completed.stateVersion, actionKey, event: { type: 'undo_complete' } })).json();
  assert.equal(undone.task.completedAt, null);
  const again = await (await send('/api/tasks/action', 'POST', { expectedStateVersion: undone.stateVersion, actionKey, event: { type: 'complete' } })).json();
  assert.equal(again.awardEarned, false);
  assert.equal(again.earnedCount, 1);
  const aliceList = await (await send('/api/tasks')).json();
  assert.ok(aliceList.tasks.find((task: { state: { actionKey: string } }) => task.state.actionKey === actionKey).state.completedAt);
  assert.deepEqual((await (await send('/api/tasks', 'GET', undefined, 'bob')).json()).tasks, []);
  await errorIs(await send('/api/tasks/action', 'POST', { expectedStateVersion: '1', actionKey, event: { type: 'save' } }, 'bob'), 404, 'task_not_found');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_completion_awards').get()?.n, 1);
});

test('editorial content stays absent outside exact founder preview hosts and AI remains disabled', async t => {
  const { env, send } = setup(t);
  await send('/api/memory', 'POST', {});
  const worker = createAppWorker({ verifyIdentity: async () => 'user_alice' });
  const discovery = await (await worker.fetch(req('/api/catalog'), env)).json();
  assert.deepEqual(discovery.topics, []);
  assert.equal(discovery.reviewRequired, false);
  await errorIs(await worker.fetch(req('/api/recommendations', 'POST', {
    requestId: 'unapproved_request01', expectedStateVersion: '1', request: { topicId: 'sick_care', concernIds: ['food'] }
  }), env), 422, 'unsupported_topic');
  await errorIs(await send('/api/recommendations', 'POST', { route: 'adapt', request: { topicId: 'sick_care', concernIds: ['food'] } }), 403, 'adaptation_disabled');
});

test('only the exact enabled founder preview receives the higher server policy; outer overrides are ignored', async t => {
  const { env, send } = setup(t); await send('/api/memory', 'POST', {});
  const observed: Array<{ limits: unknown; enabled: unknown; unlimited: unknown }> = [];
  const worker = createAppWorker({ verifyIdentity: async (_request: Request, forwarded: Record<string, unknown>) => {
    observed.push({ limits: forwarded.AI_LIMITS, enabled: forwarded.AI_ADAPTATION_ENABLED, unlimited: forwarded.AI_UNLIMITED_OWNERS });
    return 'user_alice';
  } });
  for (const [host, enabled, expected] of [
    ['app-auth-staging.buildmysafety.pages.dev', 'true', PREVIEW_AI_LIMITS],
    ['app-auth-staging.buildmysafety.pages.dev', 'false', AI_LIMITS],
    ['buildmysafety.pages.dev', 'true', AI_LIMITS],
    ['other.app-auth-staging.buildmysafety.pages.dev', 'true', AI_LIMITS]
  ]) {
    const configuration = Object.create(env, {
      AI_ADAPTATION_ENABLED: { value: enabled },
      AI_UNLIMITED_USER_IDS: { value: '["user_founder01"]' },
      AI_UNLIMITED_OWNERS: { get() { throw new Error('An outer exception override must never be read'); } },
      AI_LIMITS: { get() { throw new Error('An outer quota override must never be read'); } }
    });
    const response = await worker.fetch(new Request(`https://${host}/api/memory`), configuration);
    assert.equal(response.status, 200);
    assert.equal(observed.at(-1)?.limits, expected);
    assert.equal(observed.at(-1)?.enabled, expected === PREVIEW_AI_LIMITS ? 'true' : 'false');
    assert.deepEqual(observed.at(-1)?.unlimited, expected === PREVIEW_AI_LIMITS ? ['user_founder01'] : []);
  }
});
