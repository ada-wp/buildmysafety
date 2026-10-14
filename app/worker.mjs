import { createHandler } from '../personalization/http.mjs';
import { createClerkIdentityVerifier } from '../personalization/clerk-identity.mjs';
import { catalog } from '../personalization/catalog.mjs';
import { createOnboardingHandler } from '../personalization/onboarding.mjs';
import { createAccountHandler, assertAccountActive } from '../personalization/account.mjs';
import { AI_LIMITS, PREVIEW_AI_LIMITS } from '../personalization/ai-budget.mjs';

const API_METHODS = new Map([
  ['/api/account', ['GET']], ['/api/account/export', ['GET']], ['/api/account/delete', ['POST']],
  ['/api/memory', ['GET', 'POST', 'PATCH']],
  ['/api/memory/reset', ['POST']],
  ['/api/catalog', ['GET']], ['/api/tasks', ['GET']], ['/api/tasks/action', ['POST']],
  ['/api/recommendations', ['POST']], ['/api/recommendations/latest', ['GET']],
  ['/api/onboarding', ['GET', 'POST']], ['/api/onboarding/complete', ['POST']]
]);
const PRIVATE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

function failure(code, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: code }), {
    status, headers: { ...PRIVATE_HEADERS, ...extraHeaders }
  });
}

function reservedApiPath(pathname) {
  // Ambiguous encoded/case variants are denied, never rewritten into an API
  // endpoint or passed to the SPA's index.html fallback.
  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch { /* Match the raw prefix. */ }
  return /^\/api(?:\/|$)/i.test(pathname) || /^\/api(?:\/|$)/i.test(decoded);
}

/** Same-origin Pages advanced-mode entry. Injection is for server-side tests;
 * browser input cannot select an identity verifier or supply a database owner.
 * Build with nodejs_compat for the shared backend's node:crypto dependency.
 */
export function createAppWorker({ verifyIdentity = createClerkIdentityVerifier(),
  contentReviewHosts = ['app-auth-staging.buildmysafety.pages.dev'], generate, deleteIdentity, checkIdentity } = {}) {
  // Editorial content can be exercised in the founder's named preview only.
  // This is real cloud persistence, with content review still pending. A main
  // website or future customer hostname does not inherit this review switch.
  const activeIdentity = async (request, env) => {
    const owner = await verifyIdentity(request, env);
    await assertAccountActive(env.MEMORY_DB, owner);
    return owner;
  };
  const standardApi = createHandler({ catalog, verifyIdentity: activeIdentity, requireDeliveryIds: true });
  const reviewApi = createHandler({ catalog, verifyIdentity: activeIdentity, requireDeliveryIds: true, allowEditorialReview: true, allowAutomatic: true, generate });
  const onboarding = createOnboardingHandler({ verifyIdentity: activeIdentity });
  const account = createAccountHandler({ verifyIdentity, deleteIdentity, checkIdentity });
  return {
    async fetch(request, env) {
      const { pathname, hostname } = new URL(request.url);
      const api = contentReviewHosts.includes(hostname) ? reviewApi : standardApi;
      if (pathname === '/health') {
        if (request.method !== 'GET') return failure('method_not_allowed', 405, { Allow: 'GET' });
        return api(request, {});
      }
      if (reservedApiPath(pathname)) {
        const methods = API_METHODS.get(pathname);
        if (!methods) return failure('route_not_found', 404);
        if (!methods.includes(request.method)) {
          return failure('method_not_allowed', 405, { Allow: methods.join(', ') });
        }
        // AI is isolated to the named preview host and an explicit server switch.
        // Credentials are lazy: pool paths never access them. Synthetic auth stays closed.
        const aiEnabled = contentReviewHosts.includes(hostname) && env?.AI_ADAPTATION_ENABLED === 'true';
        const handler = pathname.startsWith('/api/account') ? account : pathname.startsWith('/api/onboarding') ? onboarding : api;
        const response = await handler(request, {
          MEMORY_DB: env?.MEMORY_DB,
          CLERK_ISSUER: env?.CLERK_ISSUER,
          CLERK_AUTHORIZED_PARTIES: env?.CLERK_AUTHORIZED_PARTIES,
          get CLERK_SECRET_KEY() { return handler === account ? env?.CLERK_SECRET_KEY : undefined; },
          AI_ADAPTATION_ENABLED: aiEnabled ? 'true' : 'false',
          AI_NEW_NEEDS_ENABLED: aiEnabled && env?.AI_NEW_NEEDS_ENABLED === 'true' ? 'true' : 'false',
          AI_LIMITS: aiEnabled ? PREVIEW_AI_LIMITS : AI_LIMITS,
          OPENAI_MODEL: aiEnabled ? env?.OPENAI_MODEL : undefined,
          get OPENAI_API_KEY() { return aiEnabled ? env?.OPENAI_API_KEY : undefined; }
        });
        if (response.status >= 500) {
          // Only fixed operational codes. Never log credentials, profile content or email.
          const body = await response.clone().json();
          console.warn('app_api_unavailable', { code: body.error, status: response.status });
        }
        return response;
      }
      if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
        return failure('assets_unavailable', 503);
      }
      try {
        // Let Pages serve the built app, SPA routes and static cache headers.
        // Reserved API paths above can never fall through to public assets.
        return await env.ASSETS.fetch(request);
      } catch {
        return failure('assets_unavailable', 503);
      }
    }
  };
}

export default createAppWorker();
