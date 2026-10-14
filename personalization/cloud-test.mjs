// Real hosted integration checks. Synthetic records only. --ai permits ONE paid call.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { sign } from 'node:crypto';
const base = process.argv[2];
assert.match(base || '', /^https:\/\/[a-z0-9-]+\.buildmysafety\.pages\.dev$/);
const paid = process.argv.includes('--ai');
const key = await readFile(new URL('.test-secrets/private.pem', import.meta.url));
const runId = new Date().toISOString().replace(/[^0-9]/g, '');
const ownerA = `synthetic-${runId}-a`, ownerB = `synthetic-${runId}-b`;
const report = { at: new Date().toISOString(), base, runId, storage: 'remote Cloudflare D1', checks: [], requests: [], paidCalls: 0 };
function token(sub, extra = {}) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const message = `${b64({ alg: 'RS256', typ: 'JWT', kid: 'memory-synthetic-20261011' })}.${b64({
    sub, iss: 'https://buildmysafety.pages.dev/testing', aud: 'safety-memory-test',
    iat: now - 5, nbf: now - 5, exp: now + 600, ...extra
  })}`;
  return `${message}.${sign('RSA-SHA256', Buffer.from(message), key).toString('base64url')}`;
}
async function call(path, { owner = ownerA, method = 'GET', body, auth = token(owner) } = {}) {
  const response = await fetch(base + path, { method, headers: {
    ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {})
  }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  const value = await response.json();
  report.requests.push({ path, method, status: response.status, error: value.error || null });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return { status: response.status, value };
}
function check(name, condition) { assert.ok(condition, name); report.checks.push(name); console.log(`PASS ${name}`); }
if (process.argv.includes('--locked')) {
  check('health remains reachable', (await call('/health', { auth: null })).value.ok === true);
  const denied = await call('/api/memory');
  check('former test signing key no longer grants access', denied.status === 503 && denied.value.error === 'authentication_not_configured');
  report.status = 'passed';
  report.mode = 'locked';
  await writeFile(new URL('verification-lock.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  process.exit(0);
}
const profile = { answers: { home: 'alone', focus: 'sick', constraints: ['energy', 'cost'], country: 'US', style: 'one' }, interests: ['sick_care'] };
try {
  check('anonymous rejected', (await call('/api/memory', { auth: null })).status === 401);
  check('expired token rejected', (await call('/api/memory', { auth: token(ownerA, { iat: 1, nbf: 1, exp: 2 }) })).status === 401);
  const forged = token(ownerA).split('.'); forged[1] = Buffer.from(JSON.stringify({ sub: ownerB })).toString('base64url');
  check('forged identity rejected', (await call('/api/memory', { auth: forged.join('.') })).status === 401);
  check('private research is not in deployment artifact', (await call('/docs/founder-voice.md')).status === 404);
  check('create cloud profile A', (await call('/api/memory', { method: 'POST', body: profile })).status === 201);
  check('create cloud profile B', (await call('/api/memory', { owner: ownerB, method: 'POST', body: { answers: { home: 'shared' } } })).status === 201);
  const first = await call('/api/memory');
  check('fresh request retrieves persisted profile', first.value.profile.userId === ownerA && first.value.profile.answers.home === 'alone');
  const other = await call('/api/memory', { owner: ownerB });
  check('two accounts remain isolated', other.value.profile.userId === ownerB && other.value.profile.answers.home === 'shared' && other.value.taskStates.length === 0);
  check('browser cannot supply owner', (await call('/api/memory', { method: 'PATCH', body: { userId: ownerB, expectedRevision: 1, changes: { elephantName: 'test' } } })).status === 400);
  const edit = await call('/api/memory', { method: 'PATCH', body: { expectedRevision: 1, changes: { answers: { style: 'choice' } } } });
  check('profile edit persists', edit.value.profile?.revision === 2);
  check('stale edit rejected', (await call('/api/memory', { method: 'PATCH', body: { expectedRevision: 1, changes: { answers: { style: 'resources' } } } })).status === 409);
  const batch = await call('/api/recommendations', { method: 'POST', body: { request: { topicId: 'sick_care', concernIds: ['low_energy'], noSpend: true, maxMinutes: 10 } } });
  check('three pool tasks delivered without AI', batch.value.source === 'pool' && batch.value.batch.tasks.length === 3 && batch.value.delivery === 'shown');
  const actionKey = batch.value.batch.tasks[0].action_key;
  let snap = (await call('/api/memory')).value;
  check('shown outcomes saved remotely', snap.taskStates.length === 3);
  const saved = await call('/api/tasks/action', { method: 'POST', body: { expectedStateVersion: snap.stateVersion, actionKey, event: { type: 'save' } } });
  check('save choice persists', saved.value.task?.savedAt && saved.value.changed === true);
  const duplicate = await call('/api/tasks/action', { method: 'POST', body: { expectedStateVersion: saved.value.stateVersion, actionKey, event: { type: 'save' } } });
  check('repeated save is a no-op', duplicate.value.changed === false && duplicate.value.stateVersion === saved.value.stateVersion);
  const race = await Promise.all(['like', 'complete'].map(type => call('/api/tasks/action', { method: 'POST', body: { expectedStateVersion: saved.value.stateVersion, actionKey, event: { type } } })));
  check('concurrent updates cannot overwrite one another', race.filter(r => r.status === 200).length === 1 && race.filter(r => r.status === 409).length === 1);
  check('other account cannot update A task', (await call('/api/tasks/action', { owner: ownerB, method: 'POST', body: { expectedStateVersion: other.value.stateVersion, actionKey, event: { type: 'complete' } } })).status === 404);
  snap = (await call('/api/memory')).value;
  const beforeNext = snap.stateVersion;
  if (paid) {
    report.paidCalls++;
    const ai = await call('/api/recommendations', { method: 'POST', body: { route: 'adapt', request: { topicId: 'home_confidence', concernIds: ['settle_in'], maxMinutes: 5, noSpend: true, note: 'I want to become familiar with everyday essentials in my new home. Keep this small and practical.' } } });
    report.ai = ai;
    check('hosted API calls OpenAI for a NEW topic', ai.status === 200 && ai.value.status === 'ok' && ai.value.source === 'ai' && ai.value.batch.tasks.every(t => t.action_key === 'home_essentials'));
    check('unreviewed AI content is a preview only', ai.value.reviewRequired === true && ai.value.delivery === 'review_preview' && (await call('/api/memory')).value.stateVersion === beforeNext);
  }
  const home = await call('/api/recommendations', { method: 'POST', body: { request: { topicId: 'home_confidence', concernIds: ['settle_in'], maxMinutes: 5, noSpend: true } } });
  check('new topic wins over old sick-day focus', home.value.batch?.tasks.length === 1 && home.value.batch.tasks[0].action_key === 'home_essentials');
  const next = await call('/api/recommendations', { method: 'POST', body: { request: { topicId: 'sick_care', concernIds: ['low_energy'], noSpend: true, maxMinutes: 10 } } });
  const shown = new Set(batch.value.batch.tasks.map(t => t.action_key));
  check('next batch excludes earlier outcomes and meal equivalent', next.value.batch.tasks.every(t => !shown.has(t.action_key) && t.action_key !== 'food_shortcut'));
  snap = (await call('/api/memory')).value;
  const reset = await call('/api/memory/reset', { method: 'POST', body: { expectedRevision: snap.profile.revision } });
  const after = (await call('/api/memory')).value;
  check('reset clears preference signals and keeps task history', reset.status === 200 && after.profile.signalsResetAt && after.taskStates.length === snap.taskStates.length && after.taskStates.every(t => t.likedAt === null && t.feedbackCode === null) && after.taskStates.find(t => t.actionKey === actionKey).savedAt);
  check('account B still unchanged after A entire journey', JSON.stringify((await call('/api/memory', { owner: ownerB })).value) === JSON.stringify(other.value));
  report.status = 'passed';
} catch (error) { report.status = 'failed'; report.failure = error.message; throw error; }
finally {
  await writeFile(new URL('cloud-test-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, checks: report.checks.length, paidCalls: report.paidCalls, report: 'cloud-test-latest.json' }));
}
