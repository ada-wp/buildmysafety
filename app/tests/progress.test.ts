import test from 'node:test';
import assert from 'node:assert/strict';
import { isProgressResponse, validProgressUpdate, newMilestone, nextMilestone, MILESTONES } from '../src/progress.ts';
import { createProgressSession } from '../src/progress-session.ts';
import { createSafetyClient, SafetyApiError } from '../src/cloud-api.ts';
import type { ProgressResponse, ProgressUpdate } from '../src/api-contracts.ts';

const snapshot = (count = 1): ProgressResponse => ({ stateVersion: '2', categories: [{ topicId: 'sick_care', completedCount: count,
  pendingCount: 2, earnedCount: count, revision: 0, seenMilestones: [], latestCheckIn: null }] });
const write: ProgressUpdate = { topicId: 'sick_care', expectedRevision: 0, expectedStateVersion: '2', milestone: 1 };

test('each approved milestone can appear once; ordinary completion and undo do not create new milestones', () => {
  for (const count of MILESTONES) {
    const progress = snapshot(count).categories[0];
    assert.equal(newMilestone(progress), count);
    assert.equal(newMilestone({ ...progress, seenMilestones: [count] }), null);
  }
  assert.equal(newMilestone(snapshot(2).categories[0]), null);
  assert.equal(newMilestone(snapshot(11).categories[0]), null);
  assert.equal(newMilestone({ ...snapshot(1).categories[0], earnedCount: 10, seenMilestones: [1, 3, 6, 9, 10] }), null);
  assert.equal(nextMilestone(3), 6); assert.equal(nextMilestone(10), null);
});
test('progress wire validation rejects malformed counts, repeated categories and inferred feeling values', () => {
  assert.equal(isProgressResponse(snapshot()), true); assert.equal(validProgressUpdate(write), true);
  const base = snapshot();
  for (const categories of [[{ ...base.categories[0], completedCount: -1 }], [base.categories[0], base.categories[0]],
    [{ ...base.categories[0], seenMilestones: [1, 1] }], [{ ...base.categories[0], latestCheckIn: { feeling: 'safe', milestone: 1, answeredAt: 'today' } }]])
    assert.equal(isProgressResponse({ ...base, categories }), false);
  assert.equal(validProgressUpdate({ ...write, userId: 'other' }), false);
  assert.equal(validProgressUpdate({ ...write, milestone: 5 }), false);
});
test('progress client uses authenticated ownerless GET/PATCH and validates returned shapes', async () => {
  const calls: RequestInit[] = [];
  const client = createSafetyClient({ baseUrl: 'https://app.invalid', getAccessToken: async () => 'test-token',
    fetchImpl: async (url, init) => { assert.equal(String(url), 'https://app.invalid/api/progress'); calls.push(init!); return Response.json(snapshot()); } });
  assert.deepEqual(await client.getProgress(), snapshot());
  await client.updateProgress({ ...write, feeling: 'ready' });
  assert.deepEqual(calls.map(c => c.method), ['GET', 'PATCH']);
  assert.equal(new Headers(calls[1].headers).get('Authorization'), 'Bearer test-token');
  assert.deepEqual(JSON.parse(String(calls[1].body)), { ...write, feeling: 'ready' });
  assert.throws(() => client.updateProgress({ ...write, userId: 'other' } as ProgressUpdate));
  assert.equal(calls.length, 2);
  const bad = createSafetyClient({ baseUrl: 'https://app.invalid', getAccessToken: async () => 'token',
    fetchImpl: async () => Response.json({ categories: [], stateVersion: 'not-a-version' }) });
  await assert.rejects(bad.getProgress(), (e: unknown) => e instanceof SafetyApiError && e.code === 'invalid_response');
});
test('progress session saves acknowledgements and latest feeling with returned revisions; does not call AI/task APIs', async () => {
  let current = snapshot(); const writes: ProgressUpdate[] = [];
  const session = createProgressSession({ getProgress: async () => structuredClone(current), updateProgress: async update => {
    writes.push(update); current = { ...current, categories: [{ ...current.categories[0], revision: current.categories[0].revision + 1,
      seenMilestones: [1], latestCheckIn: update.feeling ? { feeling: update.feeling, milestone: 1, answeredAt: '2026-10-14T12:00:00Z' } : null }] };
    return structuredClone(current);
  } });
  assert.equal(await session.acknowledge('sick_care', 1), false);
  await session.reload(); assert.equal(await session.acknowledge('sick_care', 1), true);
  assert.equal(await session.checkIn('sick_care', 1, 'ready'), true);
  assert.equal(writes[0].expectedRevision, 0); assert.equal(writes[1].expectedRevision, 1);
  assert.equal(session.getState().data?.categories[0].latestCheckIn?.feeling, 'ready');
  session.dispose(); assert.equal(await session.reload(), null);
});
test('failed or stale progress writes preserve confirmed data and are never retried automatically', async () => {
  let writes = 0;
  const session = createProgressSession({ getProgress: async () => snapshot(), updateProgress: async () => { writes++; throw new SafetyApiError('stale_state', 409); } });
  await session.reload(); const before = session.getState().data;
  assert.equal(await session.checkIn('sick_care', 1, 'ready'), false);
  assert.equal(writes, 1); assert.deepEqual(session.getState().data, before); assert.equal(session.getState().error?.conflict, true);
});
test('lost authentication or a deleted account clears private progress instead of retaining another session’s view', async () => {
  for (const [code, status] of [['authentication_required', 401], ['account_deleted', 410], ['account_deletion_pending', 409]] as const) {
    let failed = false;
    const session = createProgressSession({ getProgress: async () => { if (failed) throw new SafetyApiError(code, status); return snapshot(); },
      updateProgress: async () => { throw new Error('not used'); } });
    await session.reload(); assert.ok(session.getState().data);
    failed = true; await session.reload(); assert.equal(session.getState().data, null);
    assert.equal(session.getState().error?.code, code);
  }
});
test('a person’s explicit check-in retry refreshes a stale revision before writing their answer', async () => {
  let revision = 0; let writes = 0; let reads = 0;
  const session = createProgressSession({ getProgress: async () => { reads++; const data = snapshot(); data.categories[0].revision = revision; return data; },
    updateProgress: async update => {
      writes++; if (writes === 1) { revision = 1; throw new SafetyApiError('stale_state', 409); }
      assert.equal(update.expectedRevision, 1); return snapshot();
    } });
  await session.reload(); assert.equal(await session.checkIn('sick_care', 1, 'ready'), false);
  assert.equal(reads, 1); assert.equal(writes, 1);
  assert.equal(await session.checkIn('sick_care', 1, 'ready'), true);
  assert.equal(reads, 2); assert.equal(writes, 2);
});
