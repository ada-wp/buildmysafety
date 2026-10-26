import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSafetyClient, SafetyApiError } from '../src/cloud-api.ts';
import type { ProfileChanges, UserProfile, TaskState, RecommendationResponse } from '../src/api-contracts.ts';

const profile: UserProfile = {
  schemaVersion: 1, userId: 'synthetic-client-test', revision: 2, updatedAt: '2026-10-11T12:00:00Z',
  answers: { why: null, home: 'alone', focus: null, difficulty: [], constraints: ['cost'], strengths: [],
    hope: [], style: 'one', country: 'US' }, interests: ['sick_care'], personalizationEnabled: true,
  signalsResetAt: null, elephantName: null
};
const task: TaskState = { userId: profile.userId, actionKey: 'rest_station', contentRef: 'rest_station@1',
  shownAt: profile.updatedAt, savedAt: null, removedAt: null, completedAt: null, likedAt: null, feedbackCode: null, feedbackAt: null };
const snapshot = { profile, taskStates: [task], stateVersion: '3' };
const batch: RecommendationResponse = { status: 'ok', source: 'pool', delivery: 'shown', stateVersion: '4',
  reviewRequired: false, metadata: null, trace: { contextVersion: 1, profileRevision: 2, stateVersion: '3', promptHash: 'synthetic-hash', candidateCount: 1 },
  batch: { status: 'no_more_ideas', message: 'One suitable option remains.', tasks: [{ action_key: 'rest_station', concern_ids: ['low_energy'],
    title: 'Set up a resting place', summary: 'Put familiar things within reach.', estimated_minutes: 5,
    steps: ['Choose a place you rest.', 'Keep a charger nearby.'], done_when: 'A useful item is within reach.', resources: [], purchase_checks: [], no_purchase_option: null }] } };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function fake(...results: Array<Response | Error>) {
  const calls: Array<{ url: string; options: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const result = results.shift();
    if (result instanceof Error) throw result;
    if (!result) throw new Error('Unexpected fetch');
    return result;
  };
  return { calls, fetchImpl };
}
const make = (fetchImpl: typeof fetch, overrides: Partial<Parameters<typeof createSafetyClient>[0]> = {}) => createSafetyClient({
  baseUrl: 'https://memory.example', getAccessToken: async () => 'signed.synthetic.token', fetchImpl, ...overrides
});
const errorCode = (code: string) => (error: unknown) => error instanceof SafetyApiError && error.code === code;

test('catalog accepts only a boolean optional account allowance', async () => {
  for (const aiUnlimited of [undefined, true, false]) {
    const client = make(fake(response({ topics: [], resources: [], aiUnlimited })).fetchImpl);
    assert.equal((await client.getCatalog()).aiUnlimited, aiUnlimited);
  }
  const client = make(fake(response({ topics: [], resources: [], aiUnlimited: 'true' })).fetchImpl);
  await assert.rejects(client.getCatalog(), errorCode('invalid_response'));
});

test('client validates optional quota metadata while accepting older responses', async () => {
  const quota = { scope: 'user', limit: 10, resetsAt: '2026-10-15T00:00:00.000Z' };
  const limited = { ...batch, adaptation: { status: 'limit_reached', actionKey: null, quota } };
  const f = fake(response(limited), response(batch));
  const client = make(f.fetchImpl);
  const input = { request: { topicId: 'sick_care' as const, concernIds: [] } };
  assert.deepEqual((await client.recommendations(input)).adaptation?.quota, quota);
  assert.equal((await client.recommendations(input)).adaptation, undefined);
  for (const broken of [{ ...quota, limit: -1 }, { ...quota, scope: 'unknown' }, { ...quota, resetsAt: 'tomorrow' }]) {
    const invalid = make(fake(response({ ...limited, adaptation: { ...limited.adaptation, quota: broken } })).fetchImpl);
    await assert.rejects(invalid.recommendations(input), errorCode('invalid_response'));
  }
});

test('health is public; memory uses a fresh identity token and no cookie or redirect authentication', async () => {
  const f = fake(response({ ok: true }), response(snapshot), response(snapshot));
  let tokenReads = 0;
  const client = make(f.fetchImpl, { getAccessToken: async () => `token-${++tokenReads}` });
  assert.deepEqual(await client.health(), { ok: true });
  assert.equal(tokenReads, 0);
  assert.equal(new Headers(f.calls[0].options.headers).has('Authorization'), false);
  assert.deepEqual(await client.getMemory(), snapshot);
  await client.getMemory();
  assert.equal(tokenReads, 2);
  assert.equal(f.calls[1].url, 'https://memory.example/api/memory');
  assert.equal(new Headers(f.calls[1].options.headers).get('Authorization'), 'Bearer token-1');
  assert.equal(new Headers(f.calls[2].options.headers).get('Authorization'), 'Bearer token-2');
  for (const call of f.calls) {
    assert.equal(call.options.redirect, 'error');
    assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.cache, 'no-store');
  }
});

test('profile create/update/reset preserve canonical envelopes and send only editable fields/versions', async () => {
  const f = fake(response({ profile }, 201), response({ profile }), response({ profile }));
  const client = make(f.fetchImpl);
  const fields: ProfileChanges = { answers: { home: 'alone', style: 'choice' }, interests: ['sick_care'] };
  assert.deepEqual(await client.createMemory(fields), { profile });
  await client.updateMemory({ expectedRevision: 2, changes: { elephantName: 'Lumi' } });
  await client.resetMemory({ expectedRevision: 3 });
  assert.deepEqual(f.calls.map(call => [call.url, call.options.method, JSON.parse(call.options.body as string)]), [
    ['https://memory.example/api/memory', 'POST', fields],
    ['https://memory.example/api/memory', 'PATCH', { expectedRevision: 2, changes: { elephantName: 'Lumi' } }],
    ['https://memory.example/api/memory/reset', 'POST', { expectedRevision: 3 }]
  ]);
  assert.equal(f.calls.some(call => (call.options.body as string).includes('userId')), false);
  assert.throws(() => client.createMemory({ userId: 'someone-else' } as unknown as ProfileChanges), errorCode('invalid_request'));
  assert.throws(() => client.updateMemory({ expectedRevision: 1, changes: { revision: 99 } } as never), errorCode('invalid_request'));
  assert.equal(f.calls.length, 3);
});

test('task actions and recommendations use versioned canonical wire shapes without browser timestamps or identity', async () => {
  const actionResult = { task: { ...task, savedAt: profile.updatedAt }, stateVersion: '4', changed: true };
  const f = fake(response(actionResult), response(batch));
  const client = make(f.fetchImpl);
  const action = { expectedStateVersion: '3', actionKey: task.actionKey, event: { type: 'save' as const } };
  assert.deepEqual(await client.taskAction(action), actionResult);
  const input = { request: { topicId: 'sick_care' as const, concernIds: ['low_energy'], noSpend: true, maxMinutes: 5 } };
  assert.deepEqual(await client.recommendations(input), batch);
  assert.deepEqual(JSON.parse(f.calls[0].options.body as string), action);
  assert.deepEqual(JSON.parse(f.calls[1].options.body as string), input);
  assert.throws(() => client.taskAction({ ...action, event: { type: 'save', savedAt: 'invented' } } as never), errorCode('invalid_request'));
  assert.throws(() => client.recommendations({ ...input, owner: 'other-person' } as never), errorCode('invalid_request'));
  assert.throws(() => client.recommendations({ request: { ...input.request, userId: 'other-person' } } as never), errorCode('invalid_request'));
  assert.equal(f.calls.length, 2);
});

test('missing/invalid tokens fail before any fetch; identity-adapter failures do not expose raw errors', async () => {
  const f = fake();
  for (const getAccessToken of [async () => null, async () => undefined, async () => '  ']) {
    await assert.rejects(make(f.fetchImpl, { getAccessToken }).getMemory(), errorCode('authentication_required'));
  }
  await assert.rejects(make(f.fetchImpl, { getAccessToken: async () => 'bad\r\nheader' }).getMemory(), errorCode('authentication_invalid'));
  await assert.rejects(make(f.fetchImpl, { getAccessToken: async () => { throw new Error('private auth detail'); } }).getMemory(), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.code, 'authentication_unavailable');
    assert.equal(error.message.includes('private auth detail'), false);
    return true;
  });
  assert.equal(f.calls.length, 0);
});

test('conflicts and unavailable reads expose safe status/codes without raw server content or retries', async () => {
  const f = fake(response({ error: 'stale_profile', private: 'never show this' }, 409),
    response({ error: 'storage_unavailable', detail: 'database password' }, 503),
    response({ error: '<script>secret</script>', message: 'raw body' }, 400));
  const client = make(f.fetchImpl);
  await assert.rejects(client.updateMemory({ expectedRevision: 1, changes: {} }), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.status, 409); assert.equal(error.code, 'stale_profile');
    assert.equal(error.conflict, true); assert.equal(error.outcomeUnknown, false); assert.equal(error.retryable, false);
    assert.equal(JSON.stringify(error).includes('never show'), false); return true;
  });
  await assert.rejects(client.getMemory(), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.status, 503); assert.equal(error.retryable, true); assert.equal(error.code, 'storage_unavailable'); return true;
  });
  await assert.rejects(client.getMemory(), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.status, 400); assert.equal(error.code, 'request_failed');
    assert.equal(error.message.includes('secret'), false); assert.equal(error.message.includes('raw body'), false); return true;
  });
  assert.equal(f.calls.length, 3);
});

test('unconfirmed mutation failures require refreshing, never say saved, and never retry automatically', async () => {
  for (const failed of [new Error('private transport detail'), response({ profile: null }),
    new Response('not JSON', { status: 200 }), response({ error: 'storage_unavailable' }, 503)]) {
    const f = fake(failed, response(snapshot));
    const client = make(f.fetchImpl);
    await assert.rejects(client.createMemory({}), error => {
      assert.ok(error instanceof SafetyApiError);
      assert.equal(error.outcomeUnknown, true); assert.equal(error.retryable, false);
      assert.match(error.message, /not confirmed/); assert.doesNotMatch(error.message, /saved|private transport/); return true;
    });
    assert.equal(f.calls.length, 1);
    assert.deepEqual(await client.getMemory(), snapshot);
    assert.equal(f.calls.length, 2);
  }
});

test('AI requests are explicit, never retried and retain their review-only response', async () => {
  const ai: RecommendationResponse = { status: 'ok', batch: batch.batch, trace: batch.trace, source: 'ai', delivery: 'review_preview',
    reviewRequired: true, metadata: { responseId: 'synthetic-response', model: 'configured-model', inputTokens: 10, outputTokens: 20 } };
  const f = fake(response(ai), response({ error: 'request_timeout' }, 504));
  const client = make(f.fetchImpl);
  const input = { route: 'adapt' as const, request: { topicId: 'sick_care' as const, concernIds: [] } };
  assert.deepEqual(await client.recommendations(input), ai);
  assert.equal(JSON.parse(f.calls[0].options.body as string).route, 'adapt');
  await assert.rejects(client.recommendations(input), errorCode('request_timeout'));
  assert.equal(f.calls.length, 2);
});

test('timeouts abort fetch and interrupted mutations remain unconfirmed', async () => {
  let calls = 0;
  let observed: AbortSignal | undefined;
  const fetchImpl: typeof fetch = async (_url, options) => {
    calls++; observed = options?.signal as AbortSignal;
    return new Promise((_resolve, reject) => observed!.addEventListener('abort', () => reject(observed!.reason), { once: true }));
  };
  await assert.rejects(make(fetchImpl, { timeoutMs: 10 }).createMemory({}), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.code, 'request_timeout'); assert.equal(error.outcomeUnknown, true); return true;
  });
  assert.equal(observed?.aborted, true);
  assert.equal(calls, 1);
});

test('caller abort preserves its signal reason and is distinguished from a timeout', async () => {
  const controller = new AbortController();
  const reason = new Error('user cancelled');
  let calls = 0;
  const fetchImpl: typeof fetch = async (_url, options) => {
    calls++;
    const signal = options!.signal!;
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => { assert.equal(signal.reason, reason); reject(signal.reason); }, { once: true });
      controller.abort(reason);
    });
  };
  await assert.rejects(make(fetchImpl).getMemory({ signal: controller.signal }), error => {
    assert.ok(error instanceof SafetyApiError);
    assert.equal(error.code, 'request_aborted'); assert.equal(error.outcomeUnknown, false); return true;
  });
  await assert.rejects(make(fetchImpl).createMemory({}, { signal: controller.signal }), error => {
    assert.ok(error instanceof SafetyApiError); assert.equal(error.outcomeUnknown, false); return true;
  });
  assert.equal(calls, 1);
});

test('non-JSON errors keep HTTP status; malformed success envelopes do not masquerade as saved memory', async () => {
  const f = fake(new Response('<h1>private proxy details</h1>', { status: 503 }), response({ profile, taskStates: 'wrong', stateVersion: '3' }));
  const client = make(f.fetchImpl);
  await assert.rejects(client.getMemory(), error => {
    assert.ok(error instanceof SafetyApiError); assert.equal(error.status, 503); assert.equal(error.code, 'request_failed');
    assert.equal(error.message.includes('private proxy'), false); return true;
  });
  await assert.rejects(client.getMemory(), errorCode('invalid_response'));
});

test('base origin is HTTPS only except localhost development and cannot carry credentials/query/path', async () => {
  for (const baseUrl of ['http://example.com', 'https://user:password@example.com', 'https://example.com/api',
    'https://example.com/?token=secret', 'https://example.com/#token', '//example.com', 'https://localhost.evil.example/path']) {
    assert.throws(() => make(fake().fetchImpl, { baseUrl }), errorCode('invalid_client_configuration'));
  }
  for (const baseUrl of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
    const f = fake(response({ ok: true }));
    await make(f.fetchImpl, { baseUrl }).health();
    assert.equal(f.calls[0].url, `${baseUrl}/health`);
  }
});

test('client module has no browser storage, server imports or embedded credentials', () => {
  const source = readFileSync(new URL('../src/cloud-api.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:window|document|localStorage|sessionStorage|process)\b|node:|OPENAI_API_KEY|sk-[a-zA-Z0-9]/);
  assert.doesNotMatch(source, /from ['"](?:.*server|.*personalization)/);
});
