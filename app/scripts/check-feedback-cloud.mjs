// No model calls. Only the already-authorized fictional B development account.
// Session tokens and cookies stay in memory; Ada's browser/account is untouched.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { prepare } from '../../personalization/flow.mjs';
import { catalog } from '../../personalization/catalog.mjs';

const origin = 'https://app-auth-staging.buildmysafety.pages.dev';
const issuer = 'https://top-eel-9210.clerk.accounts.dev';
const cookies = new Map(); let devToken; let sessionId;
async function clerk(path, values = {}) {
  const url = new URL(path, issuer);
  if (devToken) url.searchParams.set('__dev_session', devToken);
  const response = await fetch(url, { method: 'POST', redirect: 'error', headers: {
    Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
  }, body: new URLSearchParams(values) });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0]; const at = pair.indexOf('=');
    cookies.set(pair.slice(0, at), pair.slice(at + 1));
  }
  const result = await response.json();
  assert.ok(response.ok, `Clerk ${response.status}: request_failed`);
  return result;
}
async function api(path, body, method = body ? 'POST' : 'GET') {
  const token = await clerk(`/v1/client/sessions/${sessionId}/tokens`);
  assert.ok(typeof token.jwt === 'string');
  const response = await fetch(origin + path, { method, redirect: 'error', headers: {
    Authorization: `Bearer ${token.jwt}`, Origin: origin,
    ...(body ? { 'Content-Type': 'application/json' } : {})
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.ok(response.ok, `App ${response.status}: ${result.error || 'request_failed'}`);
  return result;
}
async function preparedFromCloud() {
  const snapshot = await api('/api/memory');
  const tasks = await api('/api/tasks');
  return prepare({ owner: snapshot.profile.userId, catalog, allowEditorialReview: true,
    request: { topicId: 'sick_care', concernIds: ['daily_tasks'], note: 'Make the next sick-day preparation task more specific.' },
    store: { readSnapshot: async () => snapshot, readTasks: async () => tasks } });
}
try {
  const dev = await clerk('/v1/dev_browser'); devToken = dev.token || dev.response?.token;
  assert.ok(devToken);
  const login = await clerk('/v1/client/sign_ins', { strategy: 'email_code', identifier: 'safety-b+clerk_test@example.com' });
  const signIn = login.response || login;
  const verified = await clerk(`/v1/client/sign_ins/${signIn.id}/attempt_first_factor`, { strategy: 'email_code', code: '424242' });
  sessionId = (verified.response || verified).created_session_id; assert.ok(sessionId);
  const before = await api('/api/tasks');
  const original = await api('/api/memory');
  const target = before.tasks.find(item => item.state.actionKey.startsWith('custom_sick_care_'));
  assert.ok(target, 'Run the separate approved new-needs test first.');
  const key = target.state.actionKey;
  async function react(event) {
    const fresh = await api('/api/tasks');
    await api('/api/tasks/action', { actionKey: key, expectedStateVersion: fresh.stateVersion, event });
    return (await api('/api/tasks')).tasks.find(item => item.state.actionKey === key).state;
  }
  async function enabled(value) {
    const memory = await api('/api/memory');
    await api('/api/memory', { expectedRevision: memory.profile.revision, changes: { personalizationEnabled: value } }, 'PATCH');
  }
  await enabled(true);
  assert.ok((await react({ type: 'like' })).likedAt);
  let prepared = await preparedFromCloud();
  assert.ok(prepared.packet.user_memory.preference_signals.find(item => item.action_key === key)?.liked);
  const negative = await react({ type: 'feedback', code: 'too_generic' });
  assert.equal(negative.likedAt, null); assert.equal(negative.feedbackCode, 'too_generic');
  prepared = await preparedFromCloud();
  const signal = prepared.packet.user_memory.preference_signals.find(item => item.action_key === key);
  assert.equal(signal.feedback, 'too_generic'); assert.equal(signal.title, target.content.title);
  assert.equal(prepared.packet.selected_concerns[0].id, 'daily_tasks');
  assert.ok(prepared.excluded.has(key));
  const again = await react({ type: 'like' }); assert.equal(again.feedbackCode, null); assert.ok(again.likedAt);
  assert.equal((await react({ type: 'unlike' })).likedAt, null);
  await react({ type: 'feedback', code: 'too_much_effort' });
  assert.equal((await react({ type: 'feedback', code: null })).feedbackCode, null);
  await enabled(false);
  prepared = await preparedFromCloud(); assert.deepEqual(prepared.packet.user_memory.preference_signals, []); assert.ok(prepared.excluded.has(key));
  await enabled(true);
  assert.ok((await preparedFromCloud()).packet.user_memory.preference_signals.length > 0);
  const memory = await api('/api/memory');
  await api('/api/memory/reset', { expectedRevision: memory.profile.revision });
  prepared = await preparedFromCloud(); assert.deepEqual(prepared.packet.user_memory.preference_signals, []); assert.ok(prepared.excluded.has(key));
  const after = await api('/api/tasks');
  const stable = item => ({ content: item.content, state: Object.fromEntries(Object.entries(item.state)
    .filter(([field]) => !['likedAt', 'feedbackCode', 'feedbackAt'].includes(field))) });
  assert.deepEqual(after.tasks.map(stable), before.tasks.map(stable));
  assert.equal(after.earnedCount, before.earnedCount);
  assert.deepEqual(prepared.snapshot.profile.answers, original.profile.answers);
  assert.deepEqual(prepared.snapshot.profile.interests, original.profile.interests);
  await enabled(original.profile.personalizationEnabled);
  const report = { testedAt: new Date().toISOString(), host: origin, account: 'approved fictional B',
    evidence: 'Real hosted Clerk/Worker/D1 writes and reads; canonical next-request builder run locally on fresh remote records. No model call or browser-button submission.',
    likePersisted: true, latestFeedbackWins: true, undoPersisted: true, nextQuestionContainsRelevantFeedback: true,
    currentConcernPreserved: true, optOutHidesSignals: true, resetHidesOldSignals: true,
    savedInstructionsAndProgressUnchanged: true, duplicatePreventionPreserved: true,
    originalPersonalizationSettingRestored: true, aiCalls: 0, suggestionQuality: 'Still awaiting founder approval' };
  await writeFile(new URL('../verification-feedback.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (sessionId) {
    try { await clerk(`/v1/client/sessions/${sessionId}/end`); console.log('Isolated fictional session ended.'); }
    catch { console.warn('Test session could not be ended; it expires normally.'); }
  }
}
