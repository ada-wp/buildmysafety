import { readFileSync, writeFileSync } from 'node:fs';
import { prepare } from '../../../../personalization/flow.mjs';
import { catalog } from '../../../../personalization/catalog.mjs';
import { acceptNewNeed } from '../../../../personalization/new-needs.mjs';
import { checkTaskCopy, requestBoundary } from '../../../../personalization/adaptation.mjs';
const inputs = JSON.parse(readFileSync(new URL('./inputs.json', import.meta.url), 'utf8'));
const outputs = JSON.parse(readFileSync(new URL('./outputs.json', import.meta.url), 'utf8'));
const checks = [];
for (const result of outputs.results) {
  const c = inputs.cases.find(c => c.id === result.id);
  const store = { readSnapshot: async () => structuredClone(c.snapshot),
    readTasks: async () => ({ stateVersion: '1', tasks: structuredClone(c.history) }) };
  const prepared = await prepare({ owner: c.snapshot.profile.userId, request: c.request,
    store, catalog, allowEditorialReview: true, useProfileDefaults: true });
  const task = result.output.task;
  const count = s => s.trim().split(/\s+/u).filter(Boolean).length;
  const check = { id: c.id, preflightDecision: requestBoundary(c.note), modelDecision: result.output.decision,
    knownPreviousOutcomes: c.history.length, eligibleUnshownPoolActions: prepared.candidates.map(a => a.actionKey),
    stepsWordCounts: task?.steps.map(count) || [],
    withinTimeLimit: !task || task.estimated_minutes <= c.minutes, resourceLinks: task?.resources.length || 0 };
  try {
    const accepted = acceptNewNeed(result.output, prepared, catalog, c.history, checkTaskCopy);
    check.validator = 'passed'; check.deliverableTask = Boolean(accepted.task);
  } catch (e) {
    check.validator = 'rejected'; check.error = e.code || e.message; check.deliverableTask = false;
    if (c.id === '10' && check.error === 'constraint_violation') {
      const diagnostic = structuredClone(result.output);
      diagnostic.task.steps = diagnostic.task.steps.map(s => s.replace('place an order', 'request the service'));
      try { check.keywordDiagnostic = { onlyChange: 'place an order → request the service',
        acceptedAfterChange: Boolean(acceptNewNeed(diagnostic, prepared, catalog, c.history, checkTaskCopy).task),
        rawOutputPreserved: true }; }
      catch { check.keywordDiagnostic = { acceptedAfterChange: false, rawOutputPreserved: true }; }
    }
  }
  checks.push(check);
}
const report = { checkedAt: new Date().toISOString(), checks, totals: {
  realModelRuns: outputs.results.length, tasksGenerated: checks.filter(c => c.modelDecision === 'generated').length,
  noIdeaDecisions: checks.filter(c => c.modelDecision === 'no_new_idea').length,
  validatorAcceptedTasks: checks.filter(c => c.deliverableTask).length,
  rejectedOutputs: checks.filter(c => c.validator === 'rejected').length,
  tasksWithLinkedResources: checks.filter(c => c.resourceLinks).length
}, note: 'Offline replay of the current application validators against genuine captured model outputs. Format acceptance is not editorial approval or a hosted delivery.' };
writeFileSync(new URL('./validation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
