// Explicit paid smoke test, restricted to the founder-approved fictional account
// and named development host. No browser cookies, secret keys or tokens on disk.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
if (!process.argv.includes('--paid')) throw new Error('Pass --paid only for an authorized paid staging test.');
const origin = 'https://app-auth-staging.buildmysafety.pages.dev';
const issuer = 'https://top-eel-9210.clerk.accounts.dev';
const cookieJar = new Map(); let devToken; let sessionId;
async function clerk(path, values = {}) {
  const url = new URL(path, issuer);
  if (devToken) url.searchParams.set('__dev_session', devToken);
  const response = await fetch(url, { method: 'POST', redirect: 'error', headers: {
    Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: [...cookieJar].map(([key, value]) => `${key}=${value}`).join('; ')
  }, body: new URLSearchParams(values) });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0]; const at = pair.indexOf('=');
    cookieJar.set(pair.slice(0, at), pair.slice(at + 1));
  }
  const json = await response.json();
  if (!response.ok) throw new Error(`Clerk ${response.status}: ${json.errors?.map(e => e.code).join(',') || 'request_failed'}`);
  return json;
}
async function api(path, body) {
  const token = await clerk(`/v1/client/sessions/${sessionId}/tokens`);
  assert.ok(typeof token.jwt === 'string', 'No session token');
  const response = await fetch(origin + path, { method: body ? 'POST' : 'GET', redirect: 'error',
    headers: { Authorization: `Bearer ${token.jwt}`, Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(`App ${response.status}: ${result.error || 'request_failed'}`);
  return result;
}
try {
  const dev = await clerk('/v1/dev_browser');
  devToken = dev.token || dev.response?.token;
  assert.ok(devToken, `Missing dev token; fields: ${Object.keys(dev).join(',')}`);
  const login = await clerk('/v1/client/sign_ins', { strategy: 'email_code', identifier: 'safety-b+clerk_test@example.com' });
  const signIn = login.response || login;
  assert.ok(signIn.id, 'No sign-in ID');
  const verified = await clerk(`/v1/client/sign_ins/${signIn.id}/attempt_first_factor`, { strategy: 'email_code', code: '424242' });
  sessionId = (verified.response || verified).created_session_id;
  assert.ok(sessionId, 'Test sign-in did not complete');
  console.log('Independent fictional test-account sign-in succeeded. User browser session untouched.');
  const before = await api('/api/tasks');
  let version = before.stateVersion; let exhausted = false;
  const request = { topicId: 'sick_care', concernIds: ['food', 'check_in', 'getting_care', 'pets', 'daily_tasks'],
    maxMinutes: 10, noSpend: true, localSupport: 'unavailable' };
  for (let i = 0; i < 5; i++) {
    const result = await api('/api/recommendations', { route: 'pool', requestId: crypto.randomUUID(), expectedStateVersion: version, request });
    version = result.stateVersion;
    if (result.batch.tasks.length === 0) { exhausted = true; break; }
  }
  assert.ok(exhausted, 'Pool was not exhausted');
  const body = { route: 'auto', requestId: crypto.randomUUID(), expectedStateVersion: version,
    request: { ...request, concernIds: ['food'], note: 'I want to prepare my phone for quiet rest breaks on future sick days, while still allowing important contacts to reach me.' } };
  const result = await api('/api/recommendations', body);
  assert.equal(result.adaptation?.status, 'generated', `Generation status: ${result.adaptation?.status}; ${result.batch.message}`);
  assert.equal(result.batch.tasks.length, 1);
  assert.ok(result.batch.tasks[0].action_key.startsWith('custom_sick_care_'));
  assert.equal(result.request.note, undefined);
  const replay = await api('/api/recommendations', body); assert.deepEqual(replay.batch, result.batch); assert.equal(replay.replayed, true);
  const key = result.batch.tasks[0].action_key;
  const saved = await api('/api/tasks/action', { actionKey: key, expectedStateVersion: result.stateVersion, event: { type: 'save' } });
  const tasks = await api('/api/tasks');
  assert.deepEqual(tasks.tasks.find(t => t.state.actionKey === key)?.content, result.batch.tasks[0]);
  assert.ok(tasks.tasks.find(t => t.state.actionKey === key)?.state.savedAt);
  for (const old of before.tasks.filter(t => t.state.savedAt || t.state.completedAt)) {
    assert.deepEqual(tasks.tasks.find(t => t.state.actionKey === old.state.actionKey), old);
  }
  const latest = await api('/api/recommendations/latest'); assert.deepEqual(latest.result.batch, result.batch);
  const report = { testedAt: new Date().toISOString(), host: origin, account: 'approved fictional B',
    evidence: 'Actual Clerk sign-in + hosted Worker/OpenAI/D1. Separate HTTP client; not a browser submission.',
    poolExhaustedBeforeRequest: exhausted, generatedBeyondPool: true, replayedWithoutRegeneration: true,
    savedAndReadBack: true, oldSavedTasksUnchanged: true, rawNoteAbsent: true,
    stateVersion: saved.stateVersion, metadata: result.metadata, task: result.batch.tasks[0] };
  await writeFile(new URL('../verification-new-needs.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (sessionId) {
    try { await clerk(`/v1/client/sessions/${sessionId}/end`); console.log('Isolated test session ended.'); }
    catch { console.warn('Test session could not be ended; it expires normally.'); }
  }
}
