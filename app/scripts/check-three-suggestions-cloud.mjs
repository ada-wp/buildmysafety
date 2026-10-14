// Hosted regression using only the already approved fictional development accounts.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
import { prepare } from '../../personalization/flow.mjs';
import { catalog } from '../../personalization/catalog.mjs';
const inspectOnly = process.argv.includes('--inspect');
if (!inspectOnly && !process.argv.includes('--paid')) throw new Error('Use --inspect for read-only selection or --paid for one real AI call.');
const account = process.argv.includes('--account-b') ? 'b' : 'a';
const request = { topicId: 'sick_care', concernIds: ['food', 'daily_tasks', 'getting_care'], country: 'US',
  note: 'I want to prepare a quiet phone setting for resting on a sick day, while still allowing calls I choose.' };
const report = { testedAt: new Date().toISOString(), host: origin, account,
  evidence: 'Existing fictional Clerk session; no history resets. UI checks are separate.' };
const file = new URL('../verification-three-suggestions.json', import.meta.url);
try {
  await withPrivacyTestSession(false, async ({ api }) => {
    const before = await api('/api/tasks'); assert.equal(before.status, 200);
    const memory = await api('/api/memory'); assert.equal(memory.status, 200);
    const prepared = await prepare({ owner: memory.body.profile.userId, request, catalog,
      store: { readSnapshot: async () => memory.body, readTasks: async () => before.body },
      allowEditorialReview: true, useProfileDefaults: true });
    if (inspectOnly) {
      console.log(JSON.stringify({ account, unseen: prepared.candidates.map(a => ({ key: a.actionKey,
        title: a.task.title, concerns: a.concernIds, linked: Boolean(a.task.resources.length) })),
        previous: before.body.tasks.filter(t => t.state.actionKey.startsWith('custom_')).map(t => t.content.title) }, null, 2));
      return;
    }
    assert.ok(prepared.candidates.filter(a => !a.task.resources.length).length >= 2, 'Need two unseen unlinked companions for this check.');
    const input = { request, route: 'auto', requestId: crypto.randomUUID(), expectedStateVersion: before.body.stateVersion };
    const response = await api('/api/recommendations', input);
    report.request = request; report.httpStatus = response.status; report.result = response.body;
    await writeFile(file, JSON.stringify(report, null, 2) + '\n');
    assert.equal(response.status, 200);
    const result = response.body;
    assert.equal(result.adaptation?.status, 'generated');
    assert.equal(result.batch.tasks.length, 3);
    assert.equal(result.batch.status, 'ready');
    assert.equal(result.batch.tasks.filter(t => t.action_key.startsWith('custom_')).length, 1);
    assert.ok(result.batch.tasks[0].action_key.startsWith('custom_'));
    assert.ok(result.batch.tasks.filter(t => t.resources.length).length <= 1);
    const priorKeys = new Set(before.body.tasks.map(t => t.state.actionKey));
    assert.ok(result.batch.tasks.every(t => !priorKeys.has(t.action_key)));
    const replay = await api('/api/recommendations', input);
    assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true);
    assert.deepEqual(replay.body.batch, result.batch);
    const after = await api('/api/tasks'); assert.equal(after.status, 200);
    for (const old of before.body.tasks) assert.deepEqual(after.body.tasks.find(t => t.state.actionKey === old.state.actionKey), old);
    for (const task of result.batch.tasks) assert.deepEqual(after.body.tasks.find(t => t.state.actionKey === task.action_key)?.content, task);
    const latest = await api('/api/recommendations/latest'); assert.equal(latest.status, 200);
    assert.deepEqual(latest.body.result.batch, result.batch); assert.equal(latest.body.result.request.note, undefined);
    report.checks = { threeDistinctNewTasks: true, oneAiTwoReviewed: true, resourceLimit: true,
      allThreePersisted: true, replayStable: true, priorTasksUnchanged: true, rawNoteNotInLatest: true };
  }, { account, traceTag: 'three-suggestions' });
} finally { if (!inspectOnly) await writeFile(file, JSON.stringify(report, null, 2) + '\n'); }
if (!inspectOnly) console.log(JSON.stringify(report, null, 2));
