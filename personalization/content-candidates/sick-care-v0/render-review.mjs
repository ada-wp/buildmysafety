import fs from 'node:fs';

const root = new URL('./', import.meta.url);
const pool = JSON.parse(fs.readFileSync(new URL('pool.json', root), 'utf8'));
const ledger = fs.readFileSync(new URL(pool.source_ledger, root), 'utf8');
const sourceIds = new Set([...ledger.matchAll(/^### ([A-Z0-9_]+)$/gm)].map(match => match[1]));
const concernLabels = new Map(pool.concerns.map(c => [c.id, c.label]));
const priorityLabels = new Map([
  ['core_preparation', 'Core preparation'],
  ['make_it_reliable', 'Make it reliable'],
  ['extra_ease', 'Extra ease']
]);
const heldIds = pool.priority_review?.not_default_suggestions;
const words = text => text.trim().split(/\s+/u).length;
const errors = [];
const ids = new Set();
const outcomes = new Set();
const titles = new Set();
const counts = [];

if (pool.tasks.length < 30) errors.push('Fewer than thirty task candidates.');
if (concernLabels.size !== pool.concerns.length) errors.push('Duplicate concern IDs.');
if (pool.priority_review?.status !== 'proposed_founder_review') errors.push('Priority mapping must remain proposed for founder review.');
if (!Array.isArray(heldIds) || new Set(heldIds).size !== heldIds.length) errors.push('Invalid default-suggestion exclusions.');
for (const task of pool.tasks) {
  for (const key of ['id', 'outcome_key', 'title', 'summary', 'done_when', 'use_when', 'skip_when', 'new_value', 'cost', 'waiting']) {
    if (typeof task[key] !== 'string' || !task[key].trim()) errors.push(`${task.id}: missing ${key}`);
  }
  for (const [set, value, field] of [[ids, task.id, 'ID'], [outcomes, task.outcome_key, 'outcome'], [titles, task.title, 'title']]) {
    if (set.has(value)) errors.push(`${task.id}: repeated ${field}`);
    set.add(value);
  }
  if (task.steps.length !== 3) errors.push(`${task.id}: needs three steps`);
  if (!task.concerns.length || task.concerns.some(id => !concernLabels.has(id))) errors.push(`${task.id}: invalid concern reference`);
  if (!task.source_ids.length || task.source_ids.some(id => !sourceIds.has(id))) errors.push(`${task.id}: missing source record`);
  if (task.resource_ids.length > 2 || task.resource_ids.some(id => !task.source_ids.includes(id))) errors.push(`${task.id}: invalid resource selection`);
  if (!Number.isInteger(task.active_minutes) || task.active_minutes < 1) errors.push(`${task.id}: invalid active time`);
  if (!priorityLabels.has(task.priority?.band)) errors.push(`${task.id}: invalid priority band`);
  for (const key of ['reason', 'adjust_when']) {
    if (typeof task.priority?.[key] !== 'string' || !task.priority[key].trim()) errors.push(`${task.id}: missing priority ${key}`);
  }
  const fields = [['title', task.title, 9], ['summary', task.summary, 35], ['done_when', task.done_when, 20], ...task.steps.map((step, index) => [`step_${index + 1}`, step, 25])];
  for (const [field, text, max] of fields) if (words(text) > max) errors.push(`${task.id}: ${field} exceeds ${max} words`);
  const total = fields.reduce((sum, [, text]) => sum + words(text), 0);
  if (total > 170) errors.push(`${task.id}: entire task exceeds 170 words`);
  if (fields.some(([, text]) => /https?:\/\//u.test(text))) errors.push(`${task.id}: raw URL in task copy`);
  counts.push({ id: task.id, words: total, step_words: task.steps.map(words), active_minutes: task.active_minutes });
}
if (Array.isArray(heldIds) && heldIds.some(id => !ids.has(id))) errors.push('Default-suggestion exclusion references an unknown task.');
if (errors.length) throw new Error(errors.join('\n'));

const cell = text => text.replaceAll('|', '\\|');
const sourceLink = id => `[${id}](${pool.source_ledger}#${id.toLowerCase()})`;
const priorityGroups = [...priorityLabels].map(([band, label]) => ({band, label, tasks: pool.tasks.filter(task => task.priority.band === band)}));
const priorityLines = [
  '## Proposed priority mapping', '',
  `All ${pool.tasks.length} tasks are mapped: ${priorityGroups.map(group => `${group.tasks.length} ${group.label}`).join(', ')}. Individual assignments remain proposed for founder review; the shared three-band framework is approved.`, '',
  pool.priority_review.basis, '',
  'These are internal defaults, not user-facing levels, a fixed sequence, equal-size groups or a safety score. Eligibility and current needs come first. A dependency must exist before a follow-up is relevant; finishing earlier task IDs is not required. The older Discover / Make workable / Strengthen tags describe the type of action, not its priority.', '',
  `**Parked from default suggestions:** ${heldIds.join(', ')}. ${pool.priority_review.scope_note}`, '',
  'No within-band order is implied by task IDs. The Why column is editorial reasoning; the evidence links support the underlying need or route, not the tier itself.', ''
];
for (const group of priorityGroups) {
  priorityLines.push(`### ${group.label}`, '',
    '| Task | Why this default | Evidence |', '| --- | --- | --- |',
    ...group.tasks.map(task => `| [${task.id} — ${cell(task.title)}](#${task.id.toLowerCase()})${heldIds.includes(task.id) ? ' **(parked)**' : ''} | ${cell(task.priority.reason)} | ${task.source_ids.map(sourceLink).join(', ')} |`), '');
}
const lines = [
  '# Sick days & care — 30 tasks to review', '',
  'Authored content candidates, October 12, 2026; proposed priority mapping added October 13. Research-informed; awaiting founder review. Not published in the app or generated in a recorded API test. The pool offers different options for different lives, not thirty things one person must complete.', '',
  'Generated reading view of [pool.json](pool.json). Edit the JSON and rerun `render-review.mjs`; do not maintain a second copy here. [Selection and checkbox proposal](README.md) · [Source record](../../../research/sick-care-pool-sources.md).', '',
  '## Current concern screen', '',
  'Use the [five current concern choices and optional AI input](README.md#the-concern-screen). Work/study was removed from the menu. The six older concern tags in pool.json remain editorial metadata awaiting deliberate remapping; they are not the current screen or executable filters.', '',
  ...priorityLines,
  '## Browse the pool', '',
  'Times are active effort. Replies, shopping, travel and appointments can take longer. Do not mark a task complete just because an inquiry has been sent when its finish requires an answer.', '',
  '| Task | Time | Useful gain |', '| --- | --- | --- |',
  ...pool.tasks.map(t => `| [${t.id} — ${cell(t.title)}](#${t.id.toLowerCase()}) | ${t.active_minutes} min | ${cell(t.new_value)} |`), '',
  '## Task details', ''
];
for (const task of pool.tasks) {
  lines.push(`<a id="${task.id.toLowerCase()}"></a>`, '', `### ${task.id}. ${task.title} · ${task.active_minutes} min`, '', task.summary, '',
    ...task.steps.map((step, i) => `${i + 1}. ${step}`), '', `**Done when:** ${task.done_when}`, '',
    `**Offer when:** ${task.use_when}`, '', `**Skip when:** ${task.skip_when}`, '',
    `**Useful gain:** ${task.new_value}`, '', `**Cost and timing:** ${task.cost} ${task.waiting}`, '',
    `**Editorial mapping:** ${task.concerns.join(', ')} · ${task.stage} · ${task.outcome_key}`, '',
    `**Proposed priority:** ${priorityLabels.get(task.priority.band)}${heldIds.includes(task.id) ? ' — parked from default suggestions' : ''}. ${task.priority.reason}`, '',
    `**Context can change the order:** ${task.priority.adjust_when}`, '',
    `**Research:** ${task.source_ids.map(sourceLink).join(', ')}.`, '',
    `**Possible user links:** ${task.resource_ids.length ? task.resource_ids.map(sourceLink).join(', ') : 'None required; use her chosen provider or existing tools where specified.'}`, '');
  if (task.variants) lines.push(`**Variant note:** ${task.variants}`, '');
}
lines.push('## What this check does and does not establish', '',
  'The accompanying structural check confirms thirty unique IDs/outcome keys, one valid proposed priority with rationale and context per task, valid exclusion/concern/source references, three steps per task, copy limits and resource counts. It does not establish semantic uniqueness, appropriate ranking, clinical approval, task effectiveness, link availability in a particular region or live app compatibility. The fit rules still require implementation and the copy needs founder review.', '');
fs.writeFileSync(new URL('REVIEW.md', root), lines.join('\n'));
const report = {
  version: pool.version, status: 'structural_checks_passed', task_count: pool.tasks.length,
  concern_count: pool.concerns.length, source_count: sourceIds.size,
  unique_ids: ids.size, unique_outcome_keys: outcomes.size,
  priority_review_status: pool.priority_review.status,
  priority_counts: Object.fromEntries(priorityGroups.map(group => [group.band, group.tasks.length])),
  not_default_suggestions: heldIds,
  coverage: Object.fromEntries(pool.concerns.map(c => [c.id, pool.tasks.filter(t => t.concerns.includes(c.id)).map(t => t.id)])),
  tasks_over_current_ai_20_minute_cap: pool.tasks.filter(t => t.active_minutes > 20).map(t => t.id),
  limitations: ['Not a live backend selection test.', 'No new paid model test.', 'Proposed priority assignments are editorial judgments, not validated rankings.', 'Textual prerequisites and default exclusions are not executable filters.', 'Older concern tags are not the current five-choice menu.', 'Unique keys do not prove distinct useful outcomes.', 'No publication or professional approval.'],
  tasks: counts
};
fs.writeFileSync(new URL('checks.json', root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({task_count: report.task_count, concern_count: report.concern_count, source_count: report.source_count, status: report.status, priority_counts: report.priority_counts, not_default_suggestions: heldIds, tasks_over_current_ai_20_minute_cap: report.tasks_over_current_ai_20_minute_cap}, null, 2));
