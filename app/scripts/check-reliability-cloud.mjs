// Approved fictional B fixture only. No AI calls, real-user edits or account deletion.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
const report = { testedAt: new Date().toISOString(), host: origin, aiCalls: 0,
  evidence: 'Hosted Clerk, Worker and D1 through an independent fictional-B HTTP session; not browser-button evidence.' };
await withPrivacyTestSession(false, async ({ api }) => {
  const start = await api('/api/memory'); assert.equal(start.status, 200);
  const p = start.body.profile;
  const draft = { answers: p.answers, interests: p.interests, elephantName: p.elephantName,
    personalizationEnabled: p.personalizationEnabled };
  let onboarding = await api('/api/onboarding'); assert.equal(onboarding.status, 200);
  const saved = await api('/api/onboarding', { expectedRevision: onboarding.body.progress?.revision ?? 0,
    draft, checkpoint: 'interests' }); assert.equal(saved.status, 200);
  onboarding = await api('/api/onboarding'); assert.deepEqual(onboarding.body.progress.draft, draft);
  const finished = await api('/api/onboarding/complete', {
    expectedRevision: onboarding.body.progress.revision, expectedProfileRevision: p.revision,
    draft, checkpoint: 'complete' }); assert.equal(finished.status, 200);
  assert.ok((await api('/api/onboarding')).body.progress.completedAt);
  const memory = (await api('/api/memory')).body;
  assert.deepEqual(memory.profile.answers, p.answers); assert.deepEqual(memory.profile.interests, p.interests);
  report.onboarding = { draftResumed: true, completedInCloud: true, priorAnswersPreserved: true };

  const before = (await api('/api/tasks')).body;
  const input = { route: 'pool', requestId: crypto.randomUUID(), expectedStateVersion: before.stateVersion,
    request: { topicId: 'sick_care', concernIds: ['food', 'daily_tasks'] } };
  const batch = await api('/api/recommendations', input); assert.equal(batch.status, 200); assert.equal(batch.body.source, 'pool');
  const replay = await api('/api/recommendations', input); assert.equal(replay.status, 200);
  assert.deepEqual(replay.body.batch, batch.body.batch);
  const latest = await api('/api/recommendations/latest'); assert.equal(latest.body.result.requestId, input.requestId);
  let collection = (await api('/api/tasks')).body;
  const target = collection.tasks.find(row => row.state.savedAt) || collection.tasks[0]; assert.ok(target);
  const original = structuredClone(target.state);
  async function act(type, expected = collection.stateVersion) {
    const result = await api('/api/tasks/action', { actionKey: target.state.actionKey, expectedStateVersion: expected, event: { type } });
    if (result.status === 200) collection = (await api('/api/tasks')).body;
    return result;
  }
  try {
    assert.equal((await act('save')).status, 200);
    assert.equal((await act('undo_complete')).status, 200);
    const oldVersion = collection.stateVersion;
    // Deliberately discard a successful completion response and recover with a read.
    assert.equal((await api('/api/tasks/action', { actionKey: target.state.actionKey,
      expectedStateVersion: oldVersion, event: { type: 'complete' } })).status, 200);
    collection = (await api('/api/tasks')).body;
    assert.ok(collection.tasks.find(row => row.state.actionKey === target.state.actionKey).state.completedAt);
    const earned = collection.earnedCount;
    assert.equal((await act('remove', oldVersion)).status, 409, 'Old tab must not overwrite newer progress');
    assert.equal((await act('undo_complete')).status, 200);
    assert.equal((await act('complete')).status, 200); assert.equal(collection.earnedCount, earned);
    assert.equal((await act('remove')).status, 200);
    assert.ok(collection.tasks.find(row => row.state.actionKey === target.state.actionKey).state.removedAt);
    assert.equal((await act('save')).status, 200); assert.equal(collection.earnedCount, earned);
    for (const row of before.tasks)
      assert.deepEqual(collection.tasks.find(next => next.state.actionKey === row.state.actionKey).content, row.content);
    report.tasks = { poolAndReplay: true, latestRecovered: true, batchCount: batch.body.batch.tasks.length,
      lostResponseReadback: true, staleTabRejected: true, removeRestore: true,
      oneAwardAcrossUndoRecompletion: true, existingInstructionsUnchanged: true };
  } finally {
    // Restore visible membership/completion. Test-fixture timestamps and one-time awards may advance.
    collection = (await api('/api/tasks')).body;
    assert.equal((await act('save')).status, 200);
    assert.equal((await act(original.completedAt ? 'complete' : 'undo_complete')).status, 200);
    if (!original.savedAt) assert.equal((await act('remove')).status, 200);
  }
  const final = await api('/api/tasks'); assert.equal(final.status, 200);
  report.returningRead = { completedOnboarding: Boolean((await api('/api/onboarding')).body.progress.completedAt),
    sameInstructions: final.body.tasks.every(row => !before.tasks.some(old => old.state.actionKey === row.state.actionKey) ||
      JSON.stringify(row.content) === JSON.stringify(before.tasks.find(old => old.state.actionKey === row.state.actionKey).content)) };
});
await writeFile(new URL('../verification-reliability.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
