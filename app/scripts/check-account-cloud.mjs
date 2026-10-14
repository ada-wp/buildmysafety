// Read-only export by default. --delete-approved deletes only the pre-created
// safety-privacy+clerk_test@example.com. Obtain authorization for each disposable run.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
const report = { testedAt: new Date().toISOString(), host: origin, evidence: 'Actual hosted Clerk/Worker/D1 through an independent HTTP client. No user-browser submission.', aiCalls: 0 };
await withPrivacyTestSession(false, async ({ api }) => {
  const before = await api('/api/tasks'); assert.equal(before.status, 200);
  const data = await api('/api/account/export'); assert.equal(data.status, 200);
  assert.equal(data.body.tasks.length, before.body.tasks.length);
  assert.ok(data.body.profile); assert.ok(data.body.privateTaskContent.length);
  assert.equal(data.body.awards.length, before.body.earnedCount);
  assert.equal(data.body.tasks.every(row => row.user_id === data.body.accountId), true);
  assert.doesNotMatch(JSON.stringify(data.body), /sk_test_|sk-proj-|Bearer |internal-lease/);
  assert.deepEqual((await api('/api/tasks')).body, before.body);
  const status = await api('/api/account'); assert.equal(status.status, 200);
  report.export = { fictionalBOnly: true, profileTasksPrivateContentAwardsIncluded: true, taskStateUnchanged: true,
    deletionAvailable: status.body.deletionAvailable, savedExportToDisk: false };
});
if (process.argv.includes('--delete-approved')) {
  assert.equal(report.export.deletionAvailable, true, 'Finish Clerk secret configuration before creating a disposable account.');
  await withPrivacyTestSession(true, async ({ api, token }) => {
    assert.equal((await api('/api/memory', { interests: ['sick_care'] })).status, 201);
    const memory = await api('/api/memory');
    const suggestions = await api('/api/recommendations', { route: 'pool', requestId: crypto.randomUUID(),
      expectedStateVersion: memory.body.stateVersion, request: { topicId: 'sick_care', concernIds: ['food'] } });
    assert.equal(suggestions.status, 200);
    const key = suggestions.body.batch.tasks[0].action_key;
    let tasks = await api('/api/tasks');
    assert.equal((await api('/api/tasks/action', { expectedStateVersion: tasks.body.stateVersion, actionKey: key, event: { type: 'save' } })).status, 200);
    tasks = await api('/api/tasks');
    assert.equal((await api('/api/tasks/action', { expectedStateVersion: tasks.body.stateVersion, actionKey: key, event: { type: 'complete' } })).status, 200);
    const exported = await api('/api/account/export'); assert.equal(exported.status, 200); assert.equal(exported.body.awards.length, 1);
    // Hold a pre-deletion JWT in memory to prove old sessions cannot recreate data.
    const staleToken = await token();
    const erased = await api('/api/account/delete', { confirmation: 'DELETE' }, staleToken);
    assert.equal(erased.status, 200, 'Deletion did not fully finish; check the pending receipt before retrying.');
    assert.equal(erased.body.deletion.status, 'deleted');
    for (const path of ['/api/memory', '/api/tasks', '/api/onboarding', '/api/account/export'])
      assert.equal((await api(path, undefined, staleToken)).status, 410, path);
    assert.equal((await api('/api/memory', { interests: [] }, staleToken)).status, 410);
    assert.equal((await api('/api/account/delete', { confirmation: 'DELETE' }, staleToken)).status, 200);
    let refreshDenied = false; try { await token(); } catch { refreshDenied = true; }
    assert.ok(refreshDenied, 'Deleted Clerk user must not refresh its session');
    report.deletion = { account: 'only approved disposable privacy test account', providerConfirmed: true,
      oldTokenDeniedAppData: true, recreationBlocked: true, idempotentRetry: true, sessionRefreshDenied: true };
  });
}
await writeFile(new URL('../verification-account-privacy.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
