import { createD1Store } from './d1-store.mjs';
import { createOpenAIClient } from './openai.mjs';
import { recommend } from './flow.mjs';
import { deliverAutomatic } from './adaptation.mjs';
import { currentAiAllowance } from './ai-budget.mjs';
import { FlowError, requireRule, hash, validRequest } from './contracts.mjs';

const MAX_BODY_BYTES = 16384;
const PROFILE_FIELDS = ['answers', 'interests', 'personalizationEnabled', 'elephantName'];
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function fields(value, allowed, required = []) {
  requireRule(isRecord(value) && Object.keys(value).every(key => allowed.includes(key)) &&
    required.every(key => Object.hasOwn(value, key)), 'invalid_body');
}

function decodeBase64url(value, maxBytes) {
  requireRule(typeof value === 'string' && value.length > 0 && /^[A-Za-z0-9_-]+$/.test(value) &&
    value.length % 4 !== 1 && value.length <= Math.ceil(maxBytes * 4 / 3), 'authentication_invalid');
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  requireRule(decoded.length <= maxBytes, 'authentication_invalid');
  const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
  const canonical = btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  requireRule(canonical === value, 'authentication_invalid');
  return bytes;
}

/** Static public JWKS for a short-lived, server-issued identity token.
 * This verifier is not email sign-in, token issuance, or an identity provider.
 * Do not accept identity from cookies, query strings, x-user-id, or request bodies.
 */
export async function verifyJwtIdentity(request, env) {
  requireRule(typeof env.AUTH_JWKS_JSON === 'string' && env.AUTH_JWKS_JSON.length > 0 && env.AUTH_JWKS_JSON.length <= 32768 &&
    typeof env.AUTH_ISSUER === 'string' && env.AUTH_ISSUER.length > 0 &&
    typeof env.AUTH_AUDIENCE === 'string' && env.AUTH_AUDIENCE.length > 0, 'authentication_not_configured');
  const authorization = request.headers.get('Authorization');
  requireRule(authorization, 'authentication_required');
  try {
    requireRule(/^Bearer [A-Za-z0-9_.-]+$/.test(authorization) && authorization.length <= 8192, 'authentication_invalid');
    const parts = authorization.slice(7).split('.');
    requireRule(parts.length === 3, 'authentication_invalid');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const header = JSON.parse(decoder.decode(decodeBase64url(parts[0], 1024)));
    const claims = JSON.parse(decoder.decode(decodeBase64url(parts[1], 4096)));
    requireRule(isRecord(header) && Object.keys(header).every(key => ['alg', 'kid', 'typ'].includes(key)) &&
      header.alg === 'RS256' && typeof header.kid === 'string' && header.kid.length > 0 && header.kid.length <= 128 &&
      (!Object.hasOwn(header, 'typ') || header.typ === 'JWT'), 'authentication_invalid');
    const now = Math.floor(Date.now() / 1000);
    requireRule(isRecord(claims) && claims.iss === env.AUTH_ISSUER &&
      (claims.aud === env.AUTH_AUDIENCE || (Array.isArray(claims.aud) && claims.aud.length > 0 &&
        claims.aud.every(a => typeof a === 'string') && claims.aud.includes(env.AUTH_AUDIENCE))) &&
      typeof claims.sub === 'string' && claims.sub.trim() === claims.sub && claims.sub.length > 0 && claims.sub.length <= 128 &&
      Number.isSafeInteger(claims.exp) && Number.isSafeInteger(claims.iat) && Number.isSafeInteger(claims.nbf) &&
      claims.iat <= now && claims.nbf <= now && claims.nbf >= claims.iat && claims.nbf < claims.exp &&
      claims.exp > now && claims.exp > claims.iat && claims.exp - claims.iat <= 900, 'authentication_invalid');
    let jwks;
    try { jwks = JSON.parse(env.AUTH_JWKS_JSON); }
    catch { throw new FlowError('authentication_not_configured'); }
    requireRule(isRecord(jwks) && Array.isArray(jwks.keys) && jwks.keys.length > 0 && jwks.keys.length <= 16, 'authentication_not_configured');
    const matches = jwks.keys.filter(key => isRecord(key) && key.kid === header.kid);
    requireRule(matches.length === 1, 'authentication_invalid');
    const jwk = matches[0];
    requireRule(jwk.kty === 'RSA' && (!jwk.alg || jwk.alg === 'RS256') && (!jwk.use || jwk.use === 'sig') &&
      !['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'].some(key => Object.hasOwn(jwk, key)) &&
      (!jwk.key_ops || (Array.isArray(jwk.key_ops) && jwk.key_ops.length === 1 && jwk.key_ops[0] === 'verify')) &&
      decodeBase64url(jwk.n, 1024).length >= 256, 'authentication_invalid');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key,
      decodeBase64url(parts[2], 1024), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    requireRule(valid, 'authentication_invalid');
    return claims.sub;
  } catch (error) {
    if (error instanceof FlowError && error.code === 'authentication_not_configured') throw error;
    throw new FlowError('authentication_invalid');
  }
}

export async function readBody(request) {
  requireRule(/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || ''), 'json_required');
  const length = request.headers.get('Content-Length');
  requireRule(length === null || (/^\d+$/.test(length) && Number(length) <= MAX_BODY_BYTES), 'body_too_large');
  requireRule(request.body, 'invalid_body');
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new FlowError('body_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new FlowError('invalid_json'); }
}

const STATUS = {
  account_deleted: 410, account_deletion_pending: 409, account_deletion_not_configured: 503, account_identity_unavailable: 503,
  authentication_required: 401, authentication_invalid: 401, origin_not_allowed: 403, adaptation_disabled: 403,
  authentication_not_configured: 503, authentication_unavailable: 503, d1_binding_required: 503, storage_unavailable: 503,
  api_key_required: 503, model_required: 503, profile_not_found: 404, task_not_found: 404,
  route_not_found: 404, method_not_allowed: 405, profile_exists: 409,
  stale_profile: 409, stale_state: 409, immutable_content_ref: 409, task_already_shown: 409,
  request_id_conflict: 409, generation_in_progress: 409, refinement_not_available: 409, task_not_saved: 409, task_content_unavailable: 503,
  body_too_large: 413, json_required: 415, unsupported_topic: 422, adaptation_needed: 422,
  rate_limited: 429, request_timeout: 504, upstream_error: 502,
  network_or_response_error: 502, model_refusal: 422, incomplete_output: 502,
  invalid_api_response: 502, invalid_output_json: 502
};
export function safeError(error) {
  if (!(error instanceof FlowError)) return json({ error: 'internal_error' }, 500);
  if (Object.hasOwn(STATUS, error.code)) return json({ error: error.code }, STATUS[error.code]);
  if (/^(?:invalid_|unknown_|empty_|missing_|unsupported_|unexpected_|too_|repeated_|duplicate_|constraint_|context_|resource_)/.test(error.code)) {
    return json({ error: error.code }, 400);
  }
  // Invariant failures never disclose storage contents, stack traces or arbitrary messages.
  return json({ error: 'internal_error' }, 500);
}

/** Worker entry: export default { fetch: createHandler({ catalog }) }.
 * catalog must be supplied by the deployment. No fictional content is a default.
 * A future email-login adapter may replace verifyIdentity with an equally trusted verifier.
 */
export function createHandler({ catalog, verifyIdentity = verifyJwtIdentity, requireDeliveryIds = false, allowEditorialReview = false,
  allowAutomatic = false, generate }) {
  if (!catalog || typeof verifyIdentity !== 'function') throw new Error('A catalog and trusted identity verifier are required.');
  return async function handle(request, env) {
    try {
      const url = new URL(request.url);
      const origin = request.headers.get('Origin');
      requireRule(!origin || origin === url.origin, 'origin_not_allowed');
      requireRule(!url.search, 'invalid_request');
      if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true });
      const owner = await verifyIdentity(request, env);
      requireRule(typeof owner === 'string' && owner.trim() === owner && owner.length > 0 && owner.length <= 128, 'authentication_invalid');
      const store = createD1Store(env.MEMORY_DB);
      const route = `${request.method} ${url.pathname}`;
      if (route === 'GET /api/catalog') {
        const publishable = item => item.reviewState === 'approved' || (allowEditorialReview && item.reviewState === 'editorial_review');
        return json({
          topics: catalog.topics.filter(publishable).map(({ id, label, scope, concerns }) => ({ id, label: label || id, scope, concerns })),
          resources: catalog.resources.filter(publishable).map(({ id, name, url, purpose, limits, countries, cost }) => ({ id, name, url, purpose, limits, countries, cost })),
          reviewRequired: allowEditorialReview,
          ...(env.AI_UNLIMITED_OWNERS?.includes(owner) ? { aiUnlimited: true } : {})
        });
      }
      if (route === 'GET /api/tasks') return json(await store.readTasks(owner));
      if (route === 'GET /api/recommendations/latest') {
        const { result, stateVersion } = await store.readLatestBatch(owner);
        return json({ result: currentAiAllowance(result, owner, env.AI_UNLIMITED_OWNERS), stateVersion });
      }
      if (route === 'GET /api/memory') return json(await store.readSnapshot(owner));
      if (route === 'POST /api/memory') {
        const body = await readBody(request);
        fields(body, PROFILE_FIELDS);
        return json({ profile: await store.createProfile(owner, body) }, 201);
      }
      if (route === 'PATCH /api/memory') {
        const body = await readBody(request);
        fields(body, ['expectedRevision', 'changes'], ['expectedRevision', 'changes']);
        fields(body.changes, PROFILE_FIELDS);
        return json({ profile: await store.editProfile(owner, body.expectedRevision, body.changes) });
      }
      if (route === 'POST /api/memory/reset') {
        const body = await readBody(request);
        fields(body, ['expectedRevision'], ['expectedRevision']);
        return json({ profile: await store.resetPreferences(owner, body.expectedRevision) });
      }
      if (route === 'POST /api/tasks/action') {
        const body = await readBody(request);
        fields(body, ['expectedStateVersion', 'actionKey', 'event'], ['expectedStateVersion', 'actionKey', 'event']);
        fields(body.event, body.event?.type === 'feedback' ? ['type', 'code'] : ['type'], body.event?.type === 'feedback' ? ['type', 'code'] : ['type']);
        return json(await store.applyTaskAction(owner, body.expectedStateVersion, body.actionKey, body.event));
      }
      if (route === 'POST /api/recommendations') {
        const body = await readBody(request);
        fields(body, ['request', 'route', 'requestId', 'expectedStateVersion'], ['request']);
        const routeType = body.route ?? 'pool';
        requireRule(['pool', 'adapt', 'auto'].includes(routeType), 'invalid_route');
        requireRule(routeType !== 'auto' || allowAutomatic, 'adaptation_disabled');
        requireRule(validRequest(body.request), 'invalid_request');
        const durable = routeType === 'auto' || (routeType === 'pool' && (requireDeliveryIds || Object.hasOwn(body, 'requestId')));
        let requestHash;
        if (durable) {
          requireRule(typeof body.requestId === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(body.requestId), 'invalid_request_id');
          requireRule(typeof body.expectedStateVersion === 'string' && /^[1-9][0-9]*$/.test(body.expectedStateVersion) &&
            Number.isSafeInteger(Number(body.expectedStateVersion)), 'invalid_state_version');
          const normalized = Object.fromEntries(Object.entries(body.request).sort(([a], [b]) => a.localeCompare(b)));
          normalized.concernIds = [...normalized.concernIds].sort();
          requestHash = hash({ request: normalized, route: routeType });
          const latest = await store.readLatestBatch(owner);
          if (latest.result?.requestId === body.requestId) {
            requireRule(latest.requestHash === requestHash, 'request_id_conflict');
            return json(latest.result);
          }
          requireRule(body.expectedStateVersion === latest.stateVersion, 'stale_state');
        }
        if (routeType === 'auto') {
          try {
            return json(await deliverAutomatic({ owner, request: body.request, requestId: body.requestId, requestHash,
              expectedStateVersion: body.expectedStateVersion, store, catalog, env, allowEditorialReview, generate }));
          } catch (error) {
            if (error instanceof FlowError && ['stale_state', 'generation_in_progress'].includes(error.code)) {
              const latest = await store.readLatestBatch(owner);
              if (latest.result?.requestId === body.requestId && latest.requestHash === requestHash) return json(latest.result);
            }
            throw error;
          }
        }
        const testMode = env.SYNTHETIC_TEST_MODE === 'true' && owner.startsWith('synthetic-');
        // This deployment only rehearses paid adaptations with synthetic identities.
        // Real-user generation needs a separate rollout with quotas and review policy.
        requireRule(routeType !== 'adapt' || testMode, 'adaptation_disabled');
        // Credentials remain server-side; they are never read from user input.
        const client = routeType === 'adapt' ? createOpenAIClient({ apiKey: env.OPENAI_API_KEY }) : undefined;
        const result = await recommend({ owner, request: body.request, store, catalog, route: routeType,
          testMode, client, model: env.OPENAI_MODEL, allowEditorialReview, useProfileDefaults: requireDeliveryIds });
        if (result.status !== 'ok') {
          if (durable && result.status === 'stale_state') {
            const latest = await store.readLatestBatch(owner);
            if (latest.result?.requestId === body.requestId && latest.requestHash === requestHash) return json(latest.result);
          }
          throw new FlowError(result.status);
        }
        if (result.source === 'ai') {
          // Adaptations remain review previews. Do not publish or mark private AI copy as shown.
          return json({ ...result, delivery: 'review_preview', reviewRequired: true });
        }
        if (durable) {
          try {
            requireRule(result.trace.stateVersion === body.expectedStateVersion, 'stale_state');
            const cleanRequest = { ...body.request };
            delete cleanRequest.note;
            const delivery = { ...result, delivery: 'shown' };
            const contents = result.batch.tasks.map(task => {
              const action = catalog.actions.find(item => item.actionKey === task.action_key);
              return { actionKey: action.actionKey, contentRef: action.contentRef, content: action.task };
            });
            const marked = await store.deliverBatch(owner, body.expectedStateVersion, {
              requestId: body.requestId, requestHash, request: cleanRequest, result: delivery, contents
            });
            return json({ ...delivery, requestId: body.requestId, request: cleanRequest, ...marked, replayed: false });
          } catch (error) {
            if (error instanceof FlowError && error.code === 'stale_state') {
              const latest = await store.readLatestBatch(owner);
              if (latest.result?.requestId === body.requestId && latest.requestHash === requestHash) return json(latest.result);
            }
            throw error;
          }
        }
        let stateVersion = result.trace.stateVersion;
        if (result.batch.tasks.length > 0) {
          const items = result.batch.tasks.map(task => ({ actionKey: task.action_key,
            contentRef: catalog.actions.find(action => action.actionKey === task.action_key).contentRef }));
          const marked = await store.markShownBatch(owner, stateVersion, items);
          stateVersion = marked.stateVersion;
        }
        return json({ ...result, delivery: 'shown', stateVersion });
      }
      const knownPath = ['/api/memory', '/api/memory/reset', '/api/tasks', '/api/tasks/action', '/api/catalog',
        '/api/recommendations', '/api/recommendations/latest'].includes(url.pathname);
      throw new FlowError(knownPath ? 'method_not_allowed' : 'route_not_found');
    } catch (error) { return safeError(error); }
  };
}
