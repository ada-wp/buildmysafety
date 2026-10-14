// Authorized founder preview only. Fictional B; no personal browser session or keys.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
if (!process.argv.includes('--paid')) throw new Error('This hosted check includes one explicitly authorized paid call. Pass --paid.');
const report = { testedAt: new Date().toISOString(), host: origin,
  evidence: 'Actual Clerk/Worker/D1 and one OpenAI request through independent fictional B HTTP session; not browser-button evidence.' };
await withPrivacyTestSession(false, async ({ api }) => {
  async function ok(path, body) {
    const r = await api(path, body);
    assert.equal(r.status, 200, `${path}: ${r.status} ${r.body.error || ''}`);
    return r.body;
  }
  const catalog = await ok('/api/catalog');
  const concerns = catalog.topics.find(t => t.id === 'sick_care').concerns;
  assert.equal(concerns.length, 5);
  assert.ok(concerns.some(c => c.label === 'Knowing where to get care, and what it costs'));
  assert.ok(catalog.resources.some(r => r.id === 'hhs_find'));
  report.concerns = concerns;
  const before = await ok('/api/tasks');
  let version = before.stateVersion;
  const shown = new Set(before.tasks.map(t => t.state.actionKey));
  report.poolBatches = [];
  for (const ids of [['getting_care'], ['food', 'daily_tasks'], ['pets']]) {
    const input = { route: 'pool', requestId: crypto.randomUUID(), expectedStateVersion: version,
      request: { topicId: 'sick_care', concernIds: ids, country: 'US' } };
    const result = await ok('/api/recommendations', input);
    assert.equal(result.source, 'pool');
    assert.ok(result.batch.tasks.length >= 1 && result.batch.tasks.length <= 3);
    assert.ok(result.batch.tasks.filter(t => t.resources.length).length <= 1);
    for (const task of result.batch.tasks) { assert.ok(!shown.has(task.action_key)); shown.add(task.action_key); }
    const replay = await ok('/api/recommendations', input);
    assert.equal(replay.replayed, true); assert.deepEqual(replay.batch, result.batch);
    assert.deepEqual((await ok('/api/recommendations/latest')).result.batch, result.batch);
    report.poolBatches.push({ selected: ids, tasks: result.batch.tasks.map(t => ({ key: t.action_key, title: t.title })) });
    version = result.stateVersion;
  }
  const target = report.poolBatches[0].tasks[0].key;
  async function act(type) {
    const result = await ok('/api/tasks/action', { actionKey: target, expectedStateVersion: version, event: { type } });
    version = result.stateVersion; return result;
  }
  await act('save'); const complete = await act('complete'); assert.equal(complete.awardEarned, true);
  assert.ok((await ok('/api/tasks')).tasks.find(t => t.state.actionKey === target).state.completedAt);
  await act('undo_complete'); const again = await act('complete');
  assert.equal(again.awardEarned, false); assert.equal(again.earnedCount, complete.earnedCount);
  // Leave the new authored task saved but incomplete for inspection in the test account.
  await act('undo_complete');
  report.tasks = { saveReturn: true, completionReturn: true, noExtraAwardAfterUndo: true };
  const scenario = 'I am uninsured and do not have a regular doctor. Prescription delivery is already arranged. Before a future sick day, I want to understand the total cost of a virtual first visit, including possible follow-up or lab fees, without signing up or booking.';
  const input = { route: 'auto', requestId: crypto.randomUUID(), expectedStateVersion: version,
    request: { topicId: 'sick_care', concernIds: ['getting_care'], country: 'US', note: scenario } };
  const result = await ok('/api/recommendations', input);
  report.ai = { scenario, status: result.adaptation?.status, metadata: result.metadata, batch: result.batch };
  // Save even a failed delivery as evidence; never automatically retry a charged call.
  await writeFile(new URL('../verification-sick-care-release.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  assert.equal(result.adaptation?.status, 'generated', JSON.stringify(result.adaptation));
  assert.equal(result.batch.tasks.length, 1); assert.equal(result.request.note, undefined);
  const replay = await ok('/api/recommendations', input);
  assert.equal(replay.replayed, true); assert.deepEqual(replay.batch, result.batch);
  const task = result.batch.tasks[0];
  await ok('/api/tasks/action', { actionKey: task.action_key, expectedStateVersion: result.stateVersion, event: { type: 'save' } });
  const returned = await ok('/api/tasks');
  const owned = returned.tasks.find(t => t.state.actionKey === task.action_key);
  assert.ok(owned.state.savedAt); assert.deepEqual(owned.content, task);
  for (const old of before.tasks) assert.deepEqual(returned.tasks.find(t => t.state.actionKey === old.state.actionKey), old);
  assert.deepEqual((await ok('/api/recommendations/latest')).result.batch, result.batch);
  report.ai.replayedWithoutNewCall = true; report.ai.savedAndReturnedUnchanged = true;
  report.oldTasksUnchanged = true; report.rawRequestAbsentFromLatest = true;
  report.completedOnboardingStillPresent = Boolean((await ok('/api/onboarding')).progress?.completedAt);
});
await writeFile(new URL('../verification-sick-care-release.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
