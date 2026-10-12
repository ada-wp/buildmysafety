import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHandler, verifyJwtIdentity } from '../http.mjs';
import { makeCatalog, apiResponse } from './fixtures.mjs';

const ALICE = 'synthetic-alice';
const BOB = 'synthetic-bob';
const migration = readFileSync(new URL('../migrations/0001_user_memory.sql', import.meta.url), 'utf8');
const algorithm = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const keys = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
const publicKey = { ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid: 'synthetic-key', alg: 'RS256', use: 'sig' };
const auth = { AUTH_ISSUER: 'https://test-issuer.invalid', AUTH_AUDIENCE: 'my-safety-test', AUTH_JWKS_JSON: JSON.stringify({ keys: [publicKey] }) };
const base64 = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
async function token(owner = ALICE, claims = {}, header = {}, privateKey = keys.privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const input = `${base64({ alg: 'RS256', kid: 'synthetic-key', typ: 'JWT', ...header })}.${base64({
    iss: auth.AUTH_ISSUER, aud: auth.AUTH_AUDIENCE, sub: owner, iat: now, nbf: now, exp: now + 300, ...claims
  })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(input));
  return `${input}.${Buffer.from(signature).toString('base64url')}`;
}
const req = (path, method = 'GET', body, credential, extraHeaders = {}) => new Request(`https://app.example${path}`, {
  method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(credential ? { Authorization: `Bearer ${credential}` } : {}), ...extraHeaders },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {})
});

// In-memory SQLite is a test double for Cloudflare D1 only. Product code receives
// env.MEMORY_DB, and has no node:sqlite dependency or local persistence fallback.
function setup(t, configuration = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(migration);
  sqlite.exec(readFileSync(new URL('../migrations/0002_task_journey.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0004_ai_adaptation.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const db = {
    prepare(sql) {
      const statement = values => ({ sql, values, bind: (...next) => statement(next),
        async first() { const row = sqlite.prepare(sql).get(...values); return row ? { ...row } : null; } });
      return statement([]);
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(s => ({ success: true, results: sqlite.prepare(s.sql).all(...s.values).map(r => ({ ...r })) }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  const catalog = makeCatalog();
  const env = { ...auth, MEMORY_DB: db, SYNTHETIC_TEST_MODE: 'true', ...configuration };
  return { sqlite, db, env, catalog, handle: createHandler({ catalog }) };
}
async function create(handle, env, credential, fields = {}) {
  const response = await handle(req('/api/memory', 'POST', fields, credential), env);
  assert.equal(response.status, 201, JSON.stringify(await response.clone().json()));
  return (await response.json()).profile;
}
const sick = { topicId: 'sick_care', concernIds: ['low_energy'] };

test('RS256 verifies trusted issuer/audience/owner and rejects forged or expired identities', async () => {
  const credential = await token();
  assert.equal(await verifyJwtIdentity(req('/api/memory', 'GET', undefined, credential), auth), ALICE);
  const parts = credential.split('.');
  const forged = `${parts[0]}.${base64({ ...JSON.parse(Buffer.from(parts[1], 'base64url')), sub: BOB })}.${parts[2]}`;
  const now = Math.floor(Date.now() / 1000);
  for (const candidate of [forged, await token(ALICE, { exp: now - 1, iat: now - 20, nbf: now - 20 }),
    await token(ALICE, { iss: 'https://attacker.invalid' }), await token(ALICE, { aud: 'other-app' }),
    await token(ALICE, { exp: now + 901 }), await token(ALICE, { nbf: now + 20 }),
    await token(ALICE, { iat: now + 20 }), await token(ALICE, { nbf: undefined }),
    await token(ALICE, {}, { alg: 'HS256' }), await token(ALICE, {}, { kid: 'unknown' }),
    await token(ALICE, {}, { jku: 'https://attacker.invalid/keys' })]) {
    await assert.rejects(verifyJwtIdentity(req('/api/memory', 'GET', undefined, candidate), auth), e => e.code === 'authentication_invalid');
  }
});

test('missing identity, unconfigured auth and browser-supplied identity fail closed', async t => {
  const { handle, env } = setup(t);
  const missing = await handle(req('/api/memory', 'GET', undefined, undefined, { 'x-user-id': ALICE }), env);
  assert.equal(missing.status, 401);
  assert.deepEqual(await missing.json(), { error: 'authentication_required' });
  assert.equal(missing.headers.get('Cache-Control'), 'no-store');
  assert.equal(missing.headers.has('Access-Control-Allow-Origin'), false);
  const unconfigured = await handle(req('/api/memory'), { ...env, AUTH_JWKS_JSON: undefined });
  assert.equal(unconfigured.status, 503);
  assert.deepEqual(await unconfigured.json(), { error: 'authentication_not_configured' });
  const credential = await token();
  const identityBody = await handle(req('/api/memory', 'POST', { userId: BOB }, credential), env);
  assert.equal(identityBody.status, 400);
  const identityQuery = await handle(req(`/api/memory?userId=${BOB}`, 'GET', undefined, credential), env);
  assert.equal(identityQuery.status, 400);
});

test('profile creation/read/edit uses verified owner and stale edits cannot overwrite', async t => {
  const { handle, env } = setup(t);
  const alice = await token(ALICE), bob = await token(BOB);
  const first = await create(handle, env, alice, { answers: { home: 'alone', country: 'US' }, interests: ['sick_care'] });
  await create(handle, env, bob, { answers: { home: 'shared' } });
  assert.equal(first.userId, ALICE);
  const edited = await handle(req('/api/memory', 'PATCH', { expectedRevision: 1, changes: { answers: { style: 'choice' } } }, alice), env);
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).profile.revision, 2);
  const stale = await handle(req('/api/memory', 'PATCH', { expectedRevision: 1, changes: { answers: { home: 'shared' } } }, alice), env);
  assert.equal(stale.status, 409);
  const other = await (await handle(req('/api/memory', 'GET', undefined, bob), env)).json();
  assert.equal(other.profile.userId, BOB);
  assert.equal(other.profile.revision, 1);
  assert.equal(other.profile.answers.home, 'shared');
  assert.deepEqual(other.taskStates, []);
  const own = await (await handle(req('/api/memory', 'GET', undefined, alice), env)).json();
  assert.equal(own.profile.answers.home, 'alone');
  assert.equal(own.profile.answers.style, 'choice');
});

test('cross-origin, oversized, malformed and unknown body fields are rejected without writes', async t => {
  const { handle, env } = setup(t);
  const credential = await token();
  const foreign = await handle(req('/api/memory', 'POST', {}, credential, { Origin: 'https://attacker.invalid' }), env);
  assert.equal(foreign.status, 403);
  const oversized = await handle(req('/api/memory', 'POST', { padding: 'x'.repeat(17000) }, credential), env);
  assert.equal(oversized.status, 413);
  const malformed = new Request('https://app.example/api/memory', { method: 'POST',
    headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal((await handle(malformed, env)).status, 400);
  const noJson = req('/api/memory', 'POST', {}, credential, { 'Content-Type': 'text/plain' });
  assert.equal((await handle(noJson, env)).status, 415);
  const missing = await handle(req('/api/memory', 'GET', undefined, credential), env);
  assert.equal(missing.status, 404);
});

test('pool results are recorded atomically and task signals/reset remain owner-isolated', async t => {
  const { handle, env } = setup(t);
  const alice = await token(ALICE), bob = await token(BOB);
  await create(handle, env, alice, { answers: { country: 'US' } });
  await create(handle, env, bob);
  const response = await handle(req('/api/recommendations', 'POST', { request: sick }, alice), env);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const delivered = await response.json();
  assert.equal(delivered.source, 'pool');
  assert.equal(delivered.delivery, 'shown');
  assert.equal(delivered.batch.tasks.length, 3);
  const actionKey = delivered.batch.tasks[0].action_key;
  const savedResponse = await handle(req('/api/tasks/action', 'POST', { expectedStateVersion: delivered.stateVersion,
    actionKey, event: { type: 'save' } }, alice), env);
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  assert.ok(saved.task.savedAt);
  const denied = await handle(req('/api/tasks/action', 'POST', { expectedStateVersion: '1', actionKey, event: { type: 'like' } }, bob), env);
  assert.equal(denied.status, 404);
  const forgedTimestamp = await handle(req('/api/tasks/action', 'POST', { expectedStateVersion: saved.stateVersion,
    actionKey, event: { type: 'like', likedAt: '1900-01-01T00:00:00Z' } }, alice), env);
  assert.equal(forgedTimestamp.status, 400);
  const liked = await handle(req('/api/tasks/action', 'POST', { expectedStateVersion: saved.stateVersion,
    actionKey, event: { type: 'like' } }, alice), env);
  assert.equal(liked.status, 200);
  const reset = await handle(req('/api/memory/reset', 'POST', { expectedRevision: 1 }, alice), env);
  assert.equal(reset.status, 200);
  const snapshot = await (await handle(req('/api/memory', 'GET', undefined, alice), env)).json();
  assert.equal(snapshot.taskStates.length, 3);
  const kept = snapshot.taskStates.find(state => state.actionKey === actionKey);
  assert.ok(kept.savedAt);
  assert.equal(kept.likedAt, null);
  assert.ok(snapshot.profile.signalsResetAt);
  const next = await (await handle(req('/api/recommendations', 'POST', { request: sick }, alice), env)).json();
  assert.ok(next.batch.tasks.every(task => !delivered.batch.tasks.some(old => old.action_key === task.action_key)));
});

test('synthetic content requires both server test flag and a synthetic identity', async t => {
  const { handle, env } = setup(t);
  const synthetic = await token(), ordinary = await token('real-person-placeholder');
  await create(handle, env, synthetic);
  await create(handle, env, ordinary);
  const flagOff = await handle(req('/api/recommendations', 'POST', { request: sick }, synthetic), { ...env, SYNTHETIC_TEST_MODE: 'false' });
  assert.equal(flagOff.status, 422);
  const wrongOwner = await handle(req('/api/recommendations', 'POST', { request: sick }, ordinary), env);
  assert.equal(wrongOwner.status, 422);
  const browserFlag = await handle(req('/api/recommendations', 'POST', { request: sick, testMode: true }, synthetic), env);
  assert.equal(browserFlag.status, 400);
});

test('adaptation receives freshly updated memory/current topic and remains an unwritten review preview', async t => {
  const { handle, env } = setup(t, { OPENAI_API_KEY: 'synthetic-secret-never-returned', OPENAI_MODEL: 'synthetic-model' });
  const credential = await token();
  await create(handle, env, credential, { answers: { home: 'alone', focus: 'sick', country: 'US' }, interests: ['sick_care'] });
  const delivered = await (await handle(req('/api/recommendations', 'POST', { request: sick }, credential), env)).json();
  const action = delivered.batch.tasks[0].action_key;
  await handle(req('/api/tasks/action', 'POST', { expectedStateVersion: delivered.stateVersion, actionKey: action, event: { type: 'save' } }, credential), env);
  await handle(req('/api/memory', 'PATCH', { expectedRevision: 1,
    changes: { answers: { style: 'resources', constraints: ['cost'] }, interests: ['home_confidence'] } }, credential), env);
  const before = await (await handle(req('/api/memory', 'GET', undefined, credential), env)).json();
  let outbound;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer synthetic-secret-never-returned');
    outbound = JSON.parse(options.body);
    const packet = JSON.parse(outbound.input[0].content[0].text);
    return new Response(JSON.stringify(apiResponse({ status: 'no_more_ideas', message: 'One useful option fits this topic.',
      tasks: packet.candidate_solutions.map(candidate => candidate.task) })));
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const response = await handle(req('/api/recommendations', 'POST', { route: 'adapt', request: {
    topicId: 'home_confidence', concernIds: ['settle_in'], note: 'Help me find everyday essentials.', noSpend: true, maxMinutes: 5
  } }, credential), env);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const result = await response.json();
  assert.equal(result.delivery, 'review_preview');
  assert.equal(result.reviewRequired, true);
  assert.equal(result.trace.profileRevision, 2);
  assert.equal(result.batch.tasks[0].action_key, 'home_essentials');
  assert.equal(outbound.store, false);
  const packet = JSON.parse(outbound.input[0].content[0].text);
  assert.equal(packet.current_topic.id, 'home_confidence');
  assert.equal(packet.user_memory.explicit_preferences.preferred_help, 'resources');
  assert.deepEqual(packet.user_memory.preference_signals, []);
  assert.deepEqual(packet.previous_actions, []);
  assert.equal(JSON.stringify(packet).includes(ALICE), false);
  assert.equal(JSON.stringify(result).includes('synthetic-secret'), false);
  const after = await (await handle(req('/api/memory', 'GET', undefined, credential), env)).json();
  assert.deepEqual(after, before);
});

test('paid adaptation is disabled outside the explicitly enabled synthetic rehearsal', async t => {
  const { handle, env } = setup(t, { OPENAI_API_KEY: 'synthetic-secret', OPENAI_MODEL: 'synthetic-model' });
  const synthetic = await token(), ordinary = await token('ordinary-test-identity');
  // Denied before reading a profile or invoking an API; adding a valid future identity
  // provider alone must never open the review-only paid route to real users.
  for (const [credential, configuration] of [[ordinary, env], [synthetic, { ...env, SYNTHETIC_TEST_MODE: 'false' }]]) {
    const response = await handle(req('/api/recommendations', 'POST', { route: 'adapt', request: sick }, credential), configuration);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'adaptation_disabled' });
  }
});

test('storage failures and model credentials return safe errors without internal messages', async t => {
  const { handle, env } = setup(t);
  const credential = await token();
  const badDb = { prepare() { throw new Error('private connection details'); }, async batch() { throw new Error('private connection details'); } };
  const unavailable = await handle(req('/api/memory', 'GET', undefined, credential), { ...env, MEMORY_DB: badDb });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'storage_unavailable' });
  await create(handle, env, credential);
  const noKey = await handle(req('/api/recommendations', 'POST', { route: 'adapt', request: sick }, credential), env);
  assert.equal(noKey.status, 503);
  assert.deepEqual(await noKey.json(), { error: 'api_key_required' });
});

test('durable pool retry returns the same batch, latest recovery survives actions, and older attempts cannot consume another batch', async t => {
  const { handle, env, sqlite } = setup(t);
  const credential = await token();
  await create(handle, env, credential, { answers: { country: 'US' } });
  const body = { request: sick, requestId: 'request_first_0001', expectedStateVersion: '1' };
  const send = data => handle(req('/api/recommendations', 'POST', data, credential), env);
  const firstResponse = await send(body);
  assert.equal(firstResponse.status, 200, JSON.stringify(await firstResponse.clone().json()));
  const first = await firstResponse.json();
  assert.equal(first.replayed, false);
  const retry = await (await send(body)).json();
  assert.equal(retry.replayed, true);
  assert.deepEqual(retry.batch, first.batch);
  assert.equal(retry.stateVersion, first.stateVersion);
  assert.equal((await send({ ...body, request: { ...sick, maxMinutes: 5 } })).status, 409);
  const tasks = await (await handle(req('/api/tasks', 'GET', undefined, credential), env)).json();
  assert.equal(tasks.tasks.length, 3);
  assert.equal(tasks.tasks[0].state.userId, ALICE);
  assert.ok(tasks.tasks.every(task => task.content.action_key === task.state.actionKey));
  const saved = await (await handle(req('/api/tasks/action', 'POST', {
    expectedStateVersion: first.stateVersion, actionKey: first.batch.tasks[0].action_key, event: { type: 'save' }
  }, credential), env)).json();
  const latest = await (await handle(req('/api/recommendations/latest', 'GET', undefined, credential), env)).json();
  assert.deepEqual(latest.result.batch, first.batch);
  assert.equal(latest.stateVersion, saved.stateVersion);
  assert.deepEqual(latest.result.request, sick);
  const second = await (await send({ ...body, requestId: 'request_second_002', expectedStateVersion: saved.stateVersion })).json();
  assert.ok(second.batch.tasks.every(task => !first.batch.tasks.some(old => old.action_key === task.action_key)));
  const before = sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_states').get().n;
  assert.equal((await send(body)).status, 409);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_states').get().n, before);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_latest_batch').get().n, 1);
});

test('concurrent identical delivery requests replay one atomic batch and retain one shared content version', async t => {
  const { handle, env, sqlite } = setup(t);
  const credential = await token();
  await create(handle, env, credential);
  const body = { request: sick, requestId: 'concurrent_request_1', expectedStateVersion: '1' };
  const responses = await Promise.all([1, 2].map(() => handle(req('/api/recommendations', 'POST', body, credential), env)));
  for (const response of responses) assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const data = await Promise.all(responses.map(response => response.json()));
  assert.deepEqual(data[0].batch, data[1].batch);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_states').get().n, 3);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_content').get().n, 3);
  assert.equal(sqlite.prepare('SELECT state_version FROM memory_profiles').get().state_version, 2);
});

test('owned task detail stays immutable when a later deploy changes or removes catalog actions', async t => {
  const { handle, env, catalog } = setup(t);
  const credential = await token();
  await create(handle, env, credential);
  const delivered = await (await handle(req('/api/recommendations', 'POST', {
    request: sick, requestId: 'immutable_request_01', expectedStateVersion: '1'
  }, credential), env)).json();
  const key = delivered.batch.tasks[0].action_key;
  const original = catalog.actions.find(action => action.actionKey === key).task;
  const expected = structuredClone(original);
  original.title = 'Changed copy that must not appear';
  const tasks = await (await handle(req('/api/tasks', 'GET', undefined, credential), env)).json();
  assert.deepEqual(tasks.tasks.find(task => task.state.actionKey === key).content, expected);
  catalog.actions.length = 0;
  const latest = await (await handle(req('/api/recommendations/latest', 'GET', undefined, credential), env)).json();
  assert.deepEqual(latest.result.batch, delivered.batch);
});

test('manual input never silently becomes a pool answer or a stored narrative', async t => {
  const { handle, env, sqlite } = setup(t);
  const credential = await token();
  await create(handle, env, credential);
  const response = await handle(req('/api/recommendations', 'POST', {
    request: { ...sick, note: 'Private specific situation that needs discussion.' }, requestId: 'manual_request_0001', expectedStateVersion: '1'
  }, credential), env);
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: 'adaptation_needed' });
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_latest_batch').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM memory_task_states').get().n, 0);
});
