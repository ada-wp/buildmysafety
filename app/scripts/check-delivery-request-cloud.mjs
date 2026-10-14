// One authorized paid regression using the existing fictional B account.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
if (!process.argv.includes('--paid')) throw new Error('Pass --paid for one real model attempt. No automatic retries.');
const account = process.argv.includes('--account-a') ? 'a' : 'b';
const file = new URL(process.argv.includes('--quota-release') ? '../verification-quota-release.json' : process.argv.includes('--fixed') ? '../verification-delivery-request-fixed.json' : account === 'a' ? '../verification-delivery-request-account-a.json' : process.argv.includes('--follow-up') ? '../verification-delivery-request-followup.json' : '../verification-delivery-request.json', import.meta.url);
const report = { testedAt: new Date().toISOString(), host: origin,
  account, evidence: 'Independent approved fictional Clerk session, hosted Worker/D1 and one real OpenAI attempt; separate from UI checks.' };
try {
  await withPrivacyTestSession(false, async ({ api }) => {
    const before = await api('/api/tasks'); assert.equal(before.status, 200);
    const input = { route: 'auto', requestId: crypto.randomUUID(), expectedStateVersion: before.body.stateVersion,
      request: { topicId: 'sick_care', concernIds: [], country: 'US',
        note: 'I want to understand how to have medicine delivered to my home without going out.' } };
    const result = await api('/api/recommendations', input);
    report.input = input.request; report.httpStatus = result.status; report.result = result.body;
    await writeFile(file, JSON.stringify(report, null, 2) + '\n');
    assert.equal(result.status, 200);
    assert.equal(result.body.adaptation?.status, 'generated', JSON.stringify(result.body.adaptation));
    assert.equal(result.body.batch.tasks.length, 1);
    assert.equal(result.body.request.note, undefined);
    const replay = await api('/api/recommendations', input);
    assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true);
    assert.deepEqual(replay.body.batch, result.body.batch);
    const after = await api('/api/tasks'); assert.equal(after.status, 200);
    for (const old of before.body.tasks) assert.deepEqual(after.body.tasks.find(t => t.state.actionKey === old.state.actionKey), old);
    const task = result.body.batch.tasks[0];
    assert.deepEqual(after.body.tasks.find(t => t.state.actionKey === task.action_key)?.content, task);
    const latest = await api('/api/recommendations/latest'); assert.equal(latest.status, 200);
    assert.deepEqual(latest.body.result.batch, result.body.batch); assert.equal(latest.body.result.request.note, undefined);
    report.checks = { persisted: true, replayedWithoutNewAttempt: true, priorTasksUnchanged: true, rawNoteNotInLatest: true };
  }, { account, traceTag: 'delivery-request' });
} finally { await writeFile(file, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
