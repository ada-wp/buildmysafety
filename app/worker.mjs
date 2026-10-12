import { createHandler } from '../personalization/http.mjs';
import { createClerkIdentityVerifier } from '../personalization/clerk-identity.mjs';

// Step 2 exposes account memory only. Reviewed content and task delivery have
// their own later rollout; neither synthetic fixtures nor AI credentials enter it.
const EMPTY_CATALOG = Object.freeze({
  topics: Object.freeze([]), resources: Object.freeze([]), actions: Object.freeze([])
});
const MEMORY_METHODS = new Set(['GET', 'POST', 'PATCH']);
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
export function createAppWorker({ verifyIdentity = createClerkIdentityVerifier() } = {}) {
  const api = createHandler({ catalog: EMPTY_CATALOG, verifyIdentity });
  return {
    async fetch(request, env) {
      const { pathname } = new URL(request.url);
      if (pathname === '/health') {
        if (request.method !== 'GET') return failure('method_not_allowed', 405, { Allow: 'GET' });
        return api(request, {});
      }
      if (reservedApiPath(pathname)) {
        if (pathname !== '/api/memory') return failure('route_not_found', 404);
        if (!MEMORY_METHODS.has(request.method)) {
          return failure('method_not_allowed', 405, { Allow: 'GET, POST, PATCH' });
        }
        // Deliberately omit OpenAI credentials and all synthetic test settings.
        const response = await api(request, {
          MEMORY_DB: env?.MEMORY_DB,
          CLERK_ISSUER: env?.CLERK_ISSUER,
          CLERK_AUTHORIZED_PARTIES: env?.CLERK_AUTHORIZED_PARTIES
        });
        if (response.status >= 500) {
          // Only fixed operational codes. Never log credentials, profile content or email.
          const body = await response.clone().json();
          console.warn('memory_api_unavailable', { code: body.error, status: response.status });
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
