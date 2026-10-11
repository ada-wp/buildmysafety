import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIClient } from '../openai.mjs';
import { prepare, buildRequest, recommend } from '../flow.mjs';
import { options, sampleBatch, apiResponse } from './fixtures.mjs';

test('mock transport posts exact structured request and reads raw Responses API output', async () => {
  const p = await prepare(options());
  const body = buildRequest(p, 'test-model');
  let count = 0;
  const client = createOpenAIClient({ apiKey: 'synthetic-not-a-secret', fetchImpl: async (url, init) => {
    count++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(JSON.parse(init.body), body);
    return new Response(JSON.stringify(apiResponse(sampleBatch(p))), { status: 200 });
  } });
  const result = await client.generate(body);
  assert.equal(count, 1);
  assert.equal(result.batch.status, 'ready');
  assert.deepEqual(result.metadata, { responseId: 'resp_fixture_only', model: 'test-model', inputTokens: 10, outputTokens: 20 });
});

for (const [name, response, expected] of [
  ['refusal', () => new Response(JSON.stringify(apiResponse(null, { output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'Cannot comply' }] }] }))), 'model_refusal'],
  ['incomplete', () => new Response(JSON.stringify(apiResponse(null, { status: 'incomplete' }))), 'incomplete_output'],
  ['rate limit', () => new Response('private upstream text must not leak', { status: 429 }), 'rate_limited'],
  ['upstream error', () => new Response('private upstream text must not leak', { status: 500 }), 'upstream_error'],
  ['network failure', () => { throw new Error('private network info'); }, 'network_or_response_error'],
  ['timeout', () => { throw new DOMException('Timeout', 'TimeoutError'); }, 'request_timeout'],
  ['invalid JSON', () => new Response(JSON.stringify(apiResponse(null, { output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'not json' }] }] }))), 'invalid_output_json']
]) {
  test(`handles ${name} without retry or private error text`, async () => {
    const o = options({ route: 'adapt', model: 'test-model' });
    let calls = 0;
    o.client = createOpenAIClient({ apiKey: 'synthetic-not-a-secret', fetchImpl: async () => { calls++; return response(); } });
    const result = await recommend(o);
    assert.equal(result.status, expected);
    assert.equal(result.batch, null);
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(result).includes('private'));
  });
}
