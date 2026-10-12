import test from 'node:test';
import assert from 'node:assert/strict';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createClerkIdentityVerifier } from '../clerk-identity.mjs';

// All identities, issuers and signing keys are synthetic; fetch is injected in every
// test. jose/WebCrypto performs real signature verification, with no Clerk account.
const [first, second, elliptic] = await Promise.all([
  generateKeyPair('RS256', { extractable: true }), generateKeyPair('RS256', { extractable: true }), generateKeyPair('ES256')
]);
const keyA = { ...await exportJWK(first.publicKey), kid: 'key-a', alg: 'RS256', use: 'sig' };
const keyB = { ...await exportJWK(second.publicKey), kid: 'key-b', alg: 'RS256', use: 'sig' };
const env = { CLERK_ISSUER: 'https://fixture.clerk.accounts.dev',
  CLERK_AUTHORIZED_PARTIES: JSON.stringify(['https://app.example', 'http://localhost:4173']) };
const endpoint = `${env.CLERK_ISSUER}/.well-known/jwks.json`;
const request = token => new Request('https://app.example/api/memory', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
const code = wanted => error => error?.name === 'FlowError' && error.code === wanted && error.message === wanted && !('payload' in error);

async function signed(changes = {}, header = {}, key = first.privateKey, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: env.CLERK_ISSUER, sub: 'user_alice', sid: 'sess_alice', azp: 'https://app.example',
    iat: now, nbf: now - 10, exp: now + 60, ...changes })
    .setProtectedHeader({ alg: 'RS256', kid: 'key-a', typ: 'JWT', ...header }).sign(key, options);
}

function jwksServer() {
  const calls = [];
  let keys = [keyA];
  let failing = false;
  return {
    calls,
    publish(next) { keys = next; },
    fail() { failing = true; },
    async fetchImpl(url, options) {
      calls.push({ url: String(url), method: options.method, redirect: options.redirect,
        credentials: options.credentials, headers: new Headers(options.headers) });
      if (failing) throw new Error('private transport details must not escape');
      return new Response(JSON.stringify({ keys }), { status: 200 });
    }
  };
}

test('valid Clerk-shaped signatures identify two owners with no aud and nbf before iat', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  assert.equal(await verify(request(await signed()), env), 'user_alice');
  assert.equal(await verify(request(await signed({ sub: 'user_bob', sid: 'sess_bob', azp: 'http://localhost:4173' })), env), 'user_bob');
  assert.equal(server.calls.length, 1, 'Known public keys should be cached across users.');
  assert.equal(server.calls[0].url, endpoint);
  assert.equal(server.calls[0].method, 'GET');
  assert.equal(server.calls[0].redirect, 'manual');
  assert.equal(server.calls[0].credentials, 'omit');
  assert.equal(server.calls[0].headers.has('Authorization'), false);
});

test('default transport preserves the global fetch receiver required by Cloudflare Workers', async t => {
  const server = jwksServer();
  t.mock.method(globalThis, 'fetch', async function (url, options) {
    if (this !== globalThis) throw new TypeError('Illegal invocation');
    return server.fetchImpl(url, options);
  });
  const unbound = globalThis.fetch;
  await assert.rejects(unbound(endpoint), /Illegal invocation/);
  const verify = createClerkIdentityVerifier();
  assert.equal(await verify(request(await signed()), env), 'user_alice');
  assert.equal(server.calls.length, 1);
  assert.equal(server.calls[0].url, endpoint);
  assert.equal(server.calls[0].redirect, 'manual');
  assert.equal(server.calls[0].credentials, 'omit');
});

test('forged payload and signature from another key are rejected by real verification', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  const parts = (await signed()).split('.');
  parts[1] = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url')), sub: 'user_bob' })).toString('base64url');
  await assert.rejects(verify(request(parts.join('.')), env), code('authentication_invalid'));
  await assert.rejects(verify(request(await signed({}, {}, second.privateKey)), env), code('authentication_invalid'));
});

test('documented oiat and unknown noncritical headers are accepted, bounded and signature-protected', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  const token = await signed({}, { oiat: Math.floor(Date.now() / 1000) - 3600, future_metadata: { version: 2 } });
  assert.equal(await verify(request(token), env), 'user_alice');
  assert.equal(server.calls.length, 1);
  const parts = token.split('.');
  parts[0] = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[0], 'base64url')), oiat: 1 })).toString('base64url');
  await assert.rejects(verify(request(parts.join('.')), env), code('authentication_invalid'));
  await assert.rejects(verify(request(await signed({}, { future_metadata: 'x'.repeat(8192) })), env), code('authentication_invalid'));
  assert.equal(server.calls.length, 1, 'Ignored metadata cannot select a new key source.');
});

test('jose rejects a signed unknown critical header extension before fetching any keys', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  // The signer understands this synthetic extension; the verifier deliberately does not.
  const token = await signed({}, { crit: ['future_extension'], future_extension: true }, first.privateKey,
    { crit: { future_extension: true } });
  await assert.rejects(verify(request(token), env), code('authentication_invalid'));
  assert.equal(server.calls.length, 0);
});

test('issuer, required exact azp, pending session and impersonation restrictions are enforced', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  for (const changes of [
    { iss: 'https://attacker.example' }, { azp: 'https://app.example.attacker.example' },
    { azp: 'https://app.example/' }, { azp: undefined }, { sts: 'pending' }, { sts: 'unknown' },
    { act: { sub: 'user_actor' } }, { act: null }, { sub: 'synthetic-alice' }, { sub: `user_${'x'.repeat(124)}` },
    { sid: 'other_session' }, { sid: undefined }
  ]) await assert.rejects(verify(request(await signed(changes)), env), code('authentication_invalid'));
  assert.equal(await verify(request(await signed({ sts: 'active' })), env), 'user_alice');
  assert.ok(server.calls.every(call => call.url === endpoint), 'No claim may change the key-fetch origin.');
});

test('time claims are integer, short-lived and limited to five seconds of clock skew', async t => {
  const fixed = 1800000000000;
  t.mock.timers.enable({ apis: ['Date'], now: fixed });
  const now = fixed / 1000;
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  for (const changes of [
    { iat: now - 80, nbf: now - 90, exp: now - 6 }, { exp: now + 121 },
    { iat: now + 6, nbf: now + 6, exp: now + 66 }, { nbf: now + 6 },
    { exp: now }, // exp must still exceed the issued-at timestamp.
    { exp: now + 60.5 }, { iat: now - 0.5 }, { nbf: now - 10.5 },
    { exp: undefined }, { iat: undefined }, { nbf: undefined },
    { iat: now - 200, nbf: now - 210, exp: now + 1 }
  ]) await assert.rejects(verify(request(await signed(changes)), env), code('authentication_invalid'));
  assert.equal(await verify(request(await signed({ iat: now + 4, nbf: now + 4, exp: now + 64 })), env), 'user_alice');
  assert.equal(await verify(request(await signed({ iat: now - 63, nbf: now - 73, exp: now - 3 })), env), 'user_alice');
});

test('wrong algorithms and key URLs in headers are rejected before any JWKS request', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  const es = await signed({}, { alg: 'ES256' }, elliptic.privateKey);
  const hs = await signed({}, { alg: 'HS256' }, new Uint8Array(32).fill(7));
  for (const token of [es, hs, await signed({}, { jku: 'https://attacker.example/jwks' }),
    await signed({}, { jwk: keyA }), await signed({}, { kid: undefined }), await signed({}, { typ: 'oauth-access-token' })]) {
    await assert.rejects(verify(request(token), env), code('authentication_invalid'));
  }
  assert.equal(server.calls.length, 0);
});

test('Bearer is required; cookies, body owner, query owner and x-user-id cannot authenticate', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  const valid = await signed();
  const spoofed = new Request('https://app.example/api/memory?userId=user_bob', { method: 'POST',
    headers: { Cookie: `__session=${valid}`, 'x-user-id': 'user_bob' }, body: JSON.stringify({ userId: 'user_bob' }) });
  await assert.rejects(verify(spoofed, env), code('authentication_required'));
  for (const authorization of [`Basic ${valid}`, `Bearer ${'x'.repeat(8193)}.a.a`, 'Bearer a.b', 'Bearer a.b.c,d.e.f']) {
    await assert.rejects(verify(new Request('https://app.example', { headers: { Authorization: authorization } }), env), code('authentication_invalid'));
  }
  assert.equal(server.calls.length, 0);
  assert.equal(await verify(new Request('https://app.example?userId=user_bob', {
    headers: { Authorization: `Bearer ${valid}`, 'x-user-id': 'user_bob' }
  }), env), 'user_alice');
});

test('missing or invalid trusted environment configuration fails closed without network access', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  const goodRequest = request(await signed());
  for (const configuration of [undefined, {}, { ...env, CLERK_ISSUER: 'http://fixture.clerk.accounts.dev' },
    { ...env, CLERK_ISSUER: 'https://user:password@fixture.clerk.accounts.dev' },
    { ...env, CLERK_ISSUER: `${env.CLERK_ISSUER}/` }, { ...env, CLERK_ISSUER: `${env.CLERK_ISSUER}/path` },
    { ...env, CLERK_ISSUER: `${env.CLERK_ISSUER}?query=yes` }, { ...env, CLERK_ISSUER: `${env.CLERK_ISSUER}#hash` },
    { ...env, CLERK_AUTHORIZED_PARTIES: '*' }, { ...env, CLERK_AUTHORIZED_PARTIES: '[]' },
    { ...env, CLERK_AUTHORIZED_PARTIES: JSON.stringify(['https://app.example/path']) },
    { ...env, CLERK_AUTHORIZED_PARTIES: JSON.stringify(['http://app.example']) },
    { ...env, CLERK_AUTHORIZED_PARTIES: JSON.stringify(['https://app.example', 'https://app.example']) }
  ]) await assert.rejects(verify(goodRequest, configuration), code('authentication_not_configured'));
  assert.equal(server.calls.length, 0);
});

test('public-key rotation obeys cooldown and cache expiry, then fails closed if refresh is unavailable', async t => {
  const start = 1800000000000;
  t.mock.timers.enable({ apis: ['Date'], now: start });
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  await verify(request(await signed()), env);
  await verify(request(await signed()), env);
  assert.equal(server.calls.length, 1);
  server.publish([keyB]);
  await assert.rejects(verify(request(await signed({}, { kid: 'key-b' }, second.privateKey)), env), code('authentication_invalid'));
  assert.equal(server.calls.length, 1, 'Unknown kid during cooldown cannot trigger repeated fetches.');
  t.mock.timers.setTime(start + 31000);
  assert.equal(await verify(request(await signed({}, { kid: 'key-b' }, second.privateKey)), env), 'user_alice');
  assert.equal(server.calls.length, 2);
  await assert.rejects(verify(request(await signed()), env), code('authentication_invalid'));
  assert.equal(server.calls.length, 2, 'An old key is not retained outside the new JWKS.');
  t.mock.timers.setTime(start + 332000);
  assert.equal(await verify(request(await signed({}, { kid: 'key-b' }, second.privateKey)), env), 'user_alice');
  assert.equal(server.calls.length, 3, 'Five-minute cache refreshes.');
  server.fail();
  t.mock.timers.setTime(start + 633000);
  await assert.rejects(verify(request(await signed({}, { kid: 'key-b' }, second.privateKey)), env), code('authentication_unavailable'));
  assert.equal(server.calls.length, 4, 'Expired cached keys do not bypass a failed refresh.');
});

test('cache holds at most the current configured issuer and authorization changes take effect immediately', async () => {
  const server = jwksServer();
  const verify = createClerkIdentityVerifier({ fetchImpl: server.fetchImpl });
  await verify(request(await signed()), env);
  await assert.rejects(verify(request(await signed()), { ...env, CLERK_AUTHORIZED_PARTIES: '["https://other-app.example"]' }), code('authentication_invalid'));
  const other = { ...env, CLERK_ISSUER: 'https://second-fixture.clerk.accounts.dev' };
  await verify(request(await signed({ iss: other.CLERK_ISSUER })), other);
  await verify(request(await signed()), env);
  assert.deepEqual(server.calls.map(call => call.url), [endpoint, `${other.CLERK_ISSUER}/.well-known/jwks.json`, endpoint]);
});

test('JWKS transport, redirects, malformed/oversized sets and private keys expose only safe unavailable errors', async () => {
  const token = await signed();
  const responses = [
    () => { throw new Error('sensitive upstream details'); },
    () => new Response('private proxy error', { status: 503 }),
    () => new Response('', { status: 302, headers: { Location: 'https://attacker.example/jwks' } }),
    () => new Response('{broken JSON'),
    () => new Response(JSON.stringify({ keys: [] })),
    () => new Response(JSON.stringify({ keys: Array.from({ length: 33 }, () => keyA) })),
    () => new Response(JSON.stringify({ keys: [{ ...keyA, d: 'private-key-material' }] })),
    () => new Response('x'.repeat(65537)),
    () => new Response('{}', { headers: { 'Content-Length': '999999' } })
  ];
  for (const makeResponse of responses) {
    let calls = 0;
    const verify = createClerkIdentityVerifier({ fetchImpl: async () => { calls++; return makeResponse(); } });
    await assert.rejects(verify(request(token), env), code('authentication_unavailable'));
    assert.equal(calls, 1);
  }
});

test('JWKS request receives a five-second abort signal and fails without an automatic retry', async t => {
  let calls = 0;
  let observed;
  // AbortSignal.timeout uses an unref timer in Node; keep this test alive until it fires.
  const keepAlive = setTimeout(() => {}, 6000);
  t.after(() => clearTimeout(keepAlive));
  const verify = createClerkIdentityVerifier({ fetchImpl: async (_url, options) => {
    calls++;
    observed = options.signal;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  await assert.rejects(verify(request(await signed()), env), code('authentication_unavailable'));
  assert.equal(observed.aborted, true);
  assert.equal(calls, 1);
});

test('edge-compatible manual redirect mode rejects 301/302 without fetching their location', async () => {
  const token = await signed();
  for (const status of [301, 302]) {
    const calls = [];
    const verify = createClerkIdentityVerifier({ fetchImpl: async (url, options) => {
      calls.push(String(url));
      assert.equal(options.redirect, 'manual', 'Workers does not implement redirect:error.');
      assert.equal(options.credentials, 'omit');
      assert.equal(new Headers(options.headers).has('Authorization'), false);
      return new Response(JSON.stringify({ keys: [keyA] }), {
        status, headers: { Location: 'https://untrusted.example/jwks' }
      });
    } });
    await assert.rejects(verify(request(token), env), code('authentication_unavailable'));
    assert.deepEqual(calls, [endpoint], 'Reject even a valid JWKS body on a redirect; never make a second fetch.');
  }
});
