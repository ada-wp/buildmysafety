// Only founder-approved fictional development accounts; no browser session reuse.
import assert from 'node:assert/strict';
export const origin = 'https://app-auth-staging.buildmysafety.pages.dev';
const issuer = 'https://top-eel-9210.clerk.accounts.dev';
export async function withPrivacyTestSession(privacyAccount, work) {
  const email = privacyAccount ? 'safety-privacy+clerk_test@example.com' : 'safety-b+clerk_test@example.com';
  const cookies = new Map(); let devToken; let sessionId;
  async function clerk(path, values = {}) {
    const url = new URL(path, issuer); if (devToken) url.searchParams.set('__dev_session', devToken);
    const response = await fetch(url, { method: 'POST', redirect: 'error', headers: {
      Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
    }, body: new URLSearchParams(values) });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]; const at = pair.indexOf('='); cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    const result = await response.json();
    if (!response.ok) throw new Error(`Clerk ${response.status}: ${result.errors?.map(e => e.code).join(',') || 'request_failed'}`);
    return result;
  }
  async function token() {
    const result = await clerk(`/v1/client/sessions/${sessionId}/tokens`);
    assert.ok(typeof result.jwt === 'string'); return result.jwt;
  }
  async function api(path, body, accessToken) {
    const response = await fetch(origin + path, { method: body ? 'POST' : 'GET', redirect: 'error', headers: {
      Authorization: `Bearer ${accessToken || await token()}`, Origin: origin,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  try {
    const dev = await clerk('/v1/dev_browser'); devToken = dev.token || dev.response?.token; assert.ok(devToken);
    // The disposable account must first be created through an approved Clerk test
    // setup. Do not disable signup protection or silently create replacement users.
    const login = await clerk('/v1/client/sign_ins', { strategy: 'email_code', identifier: email });
    const signIn = login.response || login;
    const verified = await clerk(`/v1/client/sign_ins/${signIn.id}/attempt_first_factor`, { strategy: 'email_code', code: '424242' });
    sessionId = (verified.response || verified).created_session_id;
    assert.ok(sessionId, 'Test authentication did not complete');
    await work({ api, token });
  } finally {
    if (sessionId) {
      try { await clerk(`/v1/client/sessions/${sessionId}/end`); }
      catch { /* Deleting a test user also ends its Clerk sessions. */ }
    }
  }
}
