// Explicit hosted verification after the progress deployment. Uses only the
// previously approved fictional A/B accounts; never Ada's browser session.
// No signup, account deletion, recommendation endpoint or model call.
// From app/: node scripts/check-progress-cloud.mjs --run
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { origin, withPrivacyTestSession } from './privacy-test-session.mjs';
import { catalog } from '../../personalization/catalog.mjs';
import { privatePrefix } from '../../personalization/private-actions.mjs';

if (!process.argv.includes('--run')) throw new Error('Pass --run only after the hosted progress API and migration are deployed.');
const reportFile = new URL('../verification-progress-release.json', import.meta.url);
const report = { testedAt: new Date().toISOString(), host: origin, status: 'running',
  accounts: 'Existing approved fictional A and B; independent Clerk development sessions',
  evidence: 'Actual hosted Worker/D1/API reads and writes, not browser-button or device evidence.',
  aiCalls: 0, accountsCreated: 0, accountsDeleted: 0 };
let stage = 'starting';
const milestones = [1, 3, 6, 9, 10];
const belongs = (key, topicId) => key.startsWith(privatePrefix(topicId)) ||
  catalog.actions.some(action => action.actionKey === key && action.topicIds.includes(topicId));

function wrapped(session) {
  return async (path, body, method = body ? 'POST' : 'GET') => {
    let result;
    if (method === 'PATCH') {
      const response = await fetch(origin + path, { method, redirect: 'error',
        signal: AbortSignal.timeout(45000), headers: { Origin: origin,
          Authorization: `Bearer ${await session.token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body) });
      result = { status: response.status, body: await response.json() };
    } else result = await session.api(path, body);
    return result;
  };
}
async function okay(call, path, body, method) {
  const result = await call(path, body, method);
  assert.equal(result.status, 200, `Unexpected status at ${path.split('?')[0]}`);
  return result.body;
}
function verifyCounts(tasks, progress, exported) {
  assert.equal(tasks.stateVersion, progress.stateVersion);
  assert.equal(tasks.earnedCount, exported.awards.length);
  for (const category of progress.categories) {
    const owned = tasks.tasks.filter(item => belongs(item.state.actionKey, category.topicId));
    assert.equal(category.completedCount, owned.filter(item => item.state.completedAt).length);
    assert.equal(category.pendingCount, owned.filter(item => item.state.savedAt && !item.state.removedAt && !item.state.completedAt).length);
    assert.equal(category.earnedCount, exported.awards.filter(item => belongs(item.action_key, category.topicId)).length);
  }
  for (const row of exported.categoryProgress) assert.equal(row.user_id, exported.accountId);
}
function withoutExportTime(value) { const copy = structuredClone(value); delete copy.exportedAt; return copy; }
function withoutTaskVersion(value) { const copy = structuredClone(value); delete copy.state_version; return copy; }

try {
  stage = 'unauthenticated progress boundary';
  const anonymous = await fetch(origin + '/api/progress', { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.equal(anonymous.status, 401);
  report.unauthenticatedDenied = true;

  await withPrivacyTestSession(false, async sessionA => {
    const a = wrapped(sessionA);
    await withPrivacyTestSession(false, async sessionB => {
      const b = wrapped(sessionB);
      stage = 'reading existing fictional accounts';
      const [beforeA, progressA, exportA, beforeB, progressB, exportB] = await Promise.all([
        okay(a, '/api/tasks'), okay(a, '/api/progress'), okay(a, '/api/account/export'),
        okay(b, '/api/tasks'), okay(b, '/api/progress'), okay(b, '/api/account/export')
      ]);
      assert.notEqual(exportA.accountId, exportB.accountId);
      assert.ok(beforeA.tasks.every(item => item.state.userId === exportA.accountId));
      assert.ok(beforeB.tasks.every(item => item.state.userId === exportB.accountId));
      verifyCounts(beforeA, progressA, exportA); verifyCounts(beforeB, progressB, exportB);
      report.initialCountsMatchOwnedTaskState = true;
      report.accountCounts = { a: { tasks: beforeA.tasks.length, awards: beforeA.earnedCount },
        b: { tasks: beforeB.tasks.length, awards: beforeB.earnedCount } };

      // Reuse an already-awarded, currently saved task so this check never adds
      // a permanent completion award. Prefer an incomplete one for exact reset.
      const awarded = new Set(exportB.awards.map(item => item.action_key));
      const eligible = beforeB.tasks.filter(item => belongs(item.state.actionKey, 'sick_care') &&
        awarded.has(item.state.actionKey) && item.state.savedAt && !item.state.removedAt);
      const target = eligible.find(item => !item.state.completedAt) || eligible[0];
      assert.ok(target, 'An existing saved, previously awarded fictional task is required; no task was changed.');
      const key = target.state.actionKey;
      const wasCompleted = Boolean(target.state.completedAt);
      let touched = false;

      async function act(type) {
        const fresh = await okay(b, '/api/tasks');
        touched = true;
        const result = await okay(b, '/api/tasks/action', {
          actionKey: key, expectedStateVersion: fresh.stateVersion, event: { type }
        });
        assert.equal(result.earnedCount, beforeB.earnedCount);
        if (type === 'complete') assert.equal(result.awardEarned, false);
        return result;
      }
      async function restoreTask() {
        if (!touched) return;
        const fresh = await okay(b, '/api/tasks');
        const current = fresh.tasks.find(item => item.state.actionKey === key);
        assert.ok(current);
        if (Boolean(current.state.completedAt) !== wasCompleted) await act(wasCompleted ? 'complete' : 'undo_complete');
      }

      try {
        stage = 'owner override boundaries';
        const categoryBefore = progressB.categories.find(item => item.topicId === 'sick_care');
        const rejected = await b('/api/progress', { topicId: 'sick_care', milestone: 1,
          expectedRevision: categoryBefore.revision, expectedStateVersion: progressB.stateVersion,
          userId: exportA.accountId }, 'PATCH');
        assert.equal(rejected.status, 400);
        const queried = await b(`/api/progress?user_id=${encodeURIComponent(exportA.accountId)}`);
        assert.equal(queried.status, 400);
        assert.deepEqual(await okay(b, '/api/progress'), progressB);
        report.ownerOverrideDenied = true;

        stage = 'preparing existing awarded task';
        if (!wasCompleted) await act('complete');
        let progress = await okay(b, '/api/progress');
        let category = progress.categories.find(item => item.topicId === 'sick_care');
        const milestone = milestones.filter(value => value <= category.completedCount).at(-1);
        assert.ok(milestone);

        stage = 'milestone acknowledgement and replay';
        const acknowledgment = { topicId: 'sick_care', milestone,
          expectedRevision: category.revision, expectedStateVersion: progress.stateVersion };
        progress = await okay(b, '/api/progress', acknowledgment, 'PATCH');
        category = progress.categories.find(item => item.topicId === 'sick_care');
        assert.ok(category.seenMilestones.includes(milestone));
        assert.deepEqual(await okay(b, '/api/progress', acknowledgment, 'PATCH'), progress);
        report.milestoneAcknowledgementPersists = true;
        report.acknowledgementReplayIsIdempotent = true;

        stage = 'optional check-in readback and export';
        const checkIn = { topicId: 'sick_care', milestone, feeling: 'somewhat',
          expectedRevision: category.revision, expectedStateVersion: progress.stateVersion };
        const answered = await okay(b, '/api/progress', checkIn, 'PATCH');
        assert.deepEqual(await okay(b, '/api/progress', checkIn, 'PATCH'), answered);
        const returned = await okay(b, '/api/progress');
        assert.deepEqual(returned, answered);
        assert.equal(returned.categories.find(item => item.topicId === 'sick_care').latestCheckIn.feeling, 'somewhat');
        const exported = await okay(b, '/api/account/export');
        const row = exported.categoryProgress.find(item => item.topic_id === 'sick_care');
        assert.ok(row.seen_milestones.includes(milestone));
        assert.equal(row.check_in.feeling, 'somewhat');
        assert.equal(row.user_id, exportB.accountId);
        report.optionalCheckInPersists = true;
        report.checkInReplayIsIdempotent = true;
        report.ownerExportIncludesProgress = true;

        stage = 'undo and re-completion';
        const beforeUndo = returned.categories.find(item => item.topicId === 'sick_care');
        await act('undo_complete');
        const undone = (await okay(b, '/api/progress')).categories.find(item => item.topicId === 'sick_care');
        assert.equal(undone.completedCount, beforeUndo.completedCount - 1);
        assert.equal(undone.earnedCount, beforeUndo.earnedCount);
        assert.deepEqual(undone.seenMilestones, beforeUndo.seenMilestones);
        await act('complete');
        const completed = (await okay(b, '/api/progress')).categories.find(item => item.topicId === 'sick_care');
        assert.equal(completed.completedCount, beforeUndo.completedCount);
        assert.equal(completed.earnedCount, beforeUndo.earnedCount);
        assert.deepEqual(completed.seenMilestones, beforeUndo.seenMilestones);
        report.undoRecompletionDoesNotRepeatAwards = true;
        report.seenMilestonesSurviveUndo = true;
      } finally {
        const previousStage = stage;
        stage = 'restoring fictional task completion';
        await restoreTask();
        report.taskCompletionRestorationConfirmed = true;
        stage = previousStage;
      }

      stage = 'final preservation and isolation';
      const [afterB, afterProgressB, afterExportB, afterA, afterProgressA, afterExportA] = await Promise.all([
        okay(b, '/api/tasks'), okay(b, '/api/progress'), okay(b, '/api/account/export'),
        okay(a, '/api/tasks'), okay(a, '/api/progress'), okay(a, '/api/account/export')
      ]);
      assert.equal(afterB.tasks.length, beforeB.tasks.length);
      for (const original of beforeB.tasks) {
        const current = afterB.tasks.find(item => item.state.actionKey === original.state.actionKey);
        assert.ok(current); assert.deepEqual(current.content, original.content);
        if (original.state.actionKey !== key) assert.deepEqual(current.state, original.state);
        else {
          assert.equal(Boolean(current.state.completedAt), wasCompleted);
          assert.deepEqual({ ...current.state, completedAt: null }, { ...original.state, completedAt: null });
        }
      }
      assert.equal(afterB.earnedCount, beforeB.earnedCount);
      assert.deepEqual(afterExportB.aiUsage, exportB.aiUsage);
      assert.deepEqual(withoutTaskVersion(afterExportB.profile), withoutTaskVersion(exportB.profile));
      assert.deepEqual(afterExportB.onboarding, exportB.onboarding);
      assert.deepEqual(afterExportB.latestBatch, exportB.latestBatch);
      assert.deepEqual(afterA, beforeA); assert.deepEqual(afterProgressA, progressA);
      assert.deepEqual(withoutExportTime(afterExportA), withoutExportTime(exportA));
      verifyCounts(afterB, afterProgressB, afterExportB);
      report.otherAccountUnchanged = true;
      report.taskMembershipAndCompletionRestored = true;
      report.taskInstructionsAndOtherTaskStatesUnchanged = true;
      report.earnedAwardsUnchanged = true;
      report.aiAttemptHistoryUnchanged = true;
      report.profileAndLatestSuggestionsUnchanged = true;
      report.finalCountsMatchOwnedTaskState = true;
      report.completionTimestampMayHaveChanged = wasCompleted;
      report.syntheticProgressRecordRetained = true;
    }, { account: 'b' });
  }, { account: 'a' });
  report.status = 'passed';
} catch (error) {
  // Never print assertion diffs: exports and account IDs remain memory-only.
  report.status = 'failed';
  report.failedStage = stage;
  report.errorType = error instanceof assert.AssertionError ? 'assertion' : 'request_or_setup';
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
