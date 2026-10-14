import { createRemoteJWKSet, customFetch, decodeProtectedHeader, jwtVerify } from 'jose';
import { FlowError, requireRule } from './contracts.mjs';

const MAX_TOKEN_BYTES = 8192;
const MAX_JWKS_BYTES = 65536;
const MAX_JWKS_KEYS = 32;
const CLOCK_SKEW_SECONDS = 5;
const MAX_SESSION_SECONDS = 120;
const JWKS_TIMEOUT_MS = 5000;
const JWKS_CACHE_MS = 300000;
const JWKS_COOLDOWN_MS = 30000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function origin(value, allowLocalHttp = false) {
  if (typeof value !== 'string' || !value || value.length > 512) return null;
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (value !== url.origin || url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(allowLocalHttp && local && url.protocol === 'http:'))) return null;
    return url.origin;
  } catch { return null; }
}

function configuration(env) {
  const issuer = origin(env?.CLERK_ISSUER);
  requireRule(issuer && typeof env?.CLERK_AUTHORIZED_PARTIES === 'string' &&
    env.CLERK_AUTHORIZED_PARTIES.length <= 8192, 'authentication_not_configured');
  let parties;
  try { parties = JSON.parse(env.CLERK_AUTHORIZED_PARTIES); }
  catch { throw new FlowError('authentication_not_configured'); }
  requireRule(Array.isArray(parties) && parties.length >= 1 && parties.length <= 16 &&
    parties.every(value => origin(value, true) !== null) && new Set(parties).size === parties.length,
  'authentication_not_configured');
  return { issuer, parties: new Set(parties) };
}

async function boundedJwks(response, signal) {
  requireRule(response.status === 200 && !response.redirected && response.body, 'authentication_unavailable');
  const length = response.headers.get('Content-Length');
  requireRule(length === null || (/^\d+$/.test(length) && Number(length) <= MAX_JWKS_BYTES), 'authentication_unavailable');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      if (signal?.aborted) throw new FlowError('authentication_unavailable');
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JWKS_BYTES) {
        await reader.cancel();
        throw new FlowError('authentication_unavailable');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (signal?.aborted) throw new FlowError('authentication_unavailable');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const jwks = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  requireRule(record(jwks) && Array.isArray(jwks.keys) && jwks.keys.length > 0 && jwks.keys.length <= MAX_JWKS_KEYS &&
    jwks.keys.every(key => record(key) && typeof key.kty === 'string' &&
      !['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'].some(field => Object.hasOwn(key, field))), 'authentication_unavailable');
  return new Response(JSON.stringify(jwks), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

/** Clerk session verifier for this web app, using a pinned public Frontend API JWKS.
 * Only a verified sub becomes the database owner. Cookies, body IDs and token-supplied
 * issuer/JWKS URLs never select identity or a fetch destination. No Clerk secret is used.
 * fetchImpl exists for deterministic network tests; production uses standard fetch.
 * Cache is per verifier/isolate: at most one issuer, five minutes, 30-second cooldown
 * for an unknown kid, and five-second network timeout. Key rotation refreshes normally.
 */
export function createClerkIdentityVerifier({ fetchImpl = (...args) => globalThis.fetch(...args) } = {}) {
  // Workers' global fetch requires its receiver; extracting it as a bare
  // function produces Illegal invocation before any JWKS network request.
  requireRule(typeof fetchImpl === 'function', 'authentication_not_configured');
  let currentIssuer;
  let currentJwks;

  function keysFor(issuer) {
    if (currentIssuer === issuer && currentJwks) return currentJwks;
    const endpoint = `${issuer}/.well-known/jwks.json`;
    currentJwks = createRemoteJWKSet(new URL(endpoint), {
      timeoutDuration: JWKS_TIMEOUT_MS, cacheMaxAge: JWKS_CACHE_MS, cooldownDuration: JWKS_COOLDOWN_MS,
      [customFetch]: async (url, options) => {
        try {
          requireRule(String(url) === endpoint, 'authentication_unavailable');
          // Workers supports manual/follow, not redirect:error. Never follow a
          // JWKS redirect: boundedJwks accepts only an unredirected HTTP 200.
          const response = await fetchImpl(endpoint, { ...options, redirect: 'manual', credentials: 'omit' });
          return await boundedJwks(response, options.signal);
        } catch { throw new FlowError('authentication_unavailable'); }
      }
    });
    currentIssuer = issuer;
    return currentJwks;
  }

  return async function verifyClerkIdentity(request, env) {
    const { issuer, parties } = configuration(env);
    const authorization = request.headers.get('Authorization');
    requireRule(authorization, 'authentication_required');
    requireRule(/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization) &&
      authorization.length - 7 <= MAX_TOKEN_BYTES, 'authentication_invalid');
    const token = authorization.slice(7);
    try {
      const header = decodeProtectedHeader(token);
      requireRule(header.alg === 'RS256' && typeof header.kid === 'string' && header.kid.length >= 1 && header.kid.length <= 128 &&
        !['jku', 'jwk', 'x5u', 'x5c'].some(key => Object.hasOwn(header, key)) &&
        (!Object.hasOwn(header, 'typ') || header.typ === 'JWT'), 'authentication_invalid');
      // Clerk adds noncritical headers such as oiat. Ignore additive metadata;
      // the complete token is bounded above, jose rejects unsupported critical
      // extensions, and the signature still covers the entire protected header.
      // Keys continue to come only from our configured issuer's JWKS.
      const { payload } = await jwtVerify(token, keysFor(issuer), {
        algorithms: ['RS256'], issuer, clockTolerance: CLOCK_SKEW_SECONDS, maxTokenAge: MAX_SESSION_SECONDS,
        requiredClaims: ['iss', 'sub', 'sid', 'azp', 'exp', 'iat', 'nbf']
      });
      const now = Math.floor(Date.now() / 1000);
      requireRule(typeof payload.sub === 'string' && /^user_[A-Za-z0-9_-]{1,123}$/.test(payload.sub) &&
        typeof payload.sid === 'string' && /^sess_[A-Za-z0-9_-]{1,123}$/.test(payload.sid) &&
        typeof payload.azp === 'string' && parties.has(payload.azp) &&
        Number.isSafeInteger(payload.exp) && Number.isSafeInteger(payload.iat) && Number.isSafeInteger(payload.nbf) &&
        payload.exp > payload.iat && payload.exp - payload.iat <= MAX_SESSION_SECONDS &&
        payload.iat >= 0 && payload.nbf >= 0 && payload.nbf < payload.exp &&
        payload.iat <= now + CLOCK_SKEW_SECONDS && payload.nbf <= now + CLOCK_SKEW_SECONDS &&
        (!Object.hasOwn(payload, 'sts') || payload.sts === 'active') && !Object.hasOwn(payload, 'act'),
      'authentication_invalid');
      // Clerk session tokens need not carry aud. Exact azp is mandatory for this web
      // integration; native-app authorized-party policy must be reviewed separately.
      return payload.sub;
    } catch (error) {
      if (error instanceof FlowError && error.code === 'authentication_unavailable') throw error;
      throw new FlowError('authentication_invalid');
    }
  };
}
