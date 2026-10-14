/** HISTORICAL strict rehearsal; founder rejected its excessive exclusions.
 * Retained for reproduction only. Not a test of current priority-first policy.
 * Candidate-content rehearsal ONLY; not imported by the app or a production matcher.
 * The facts, needs and fit annotations below are authored synthetic review inputs.
 * No free-text understanding, AI generation, user storage or live API is tested here.
 * Run from any directory: node <path>/selection-rehearsal.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const folder = new URL('./', import.meta.url);
const source = readFileSync(new URL('pool.json', folder), 'utf8');
const pool = JSON.parse(source);
const byId = new Map(pool.tasks.map(t => [t.id, t]));
const parked = new Set(pool.priority_review.not_default_suggestions);
const bands = { core_preparation: 0, make_it_reliable: 1, extra_ease: 2 };
const labels = {
  getting_care: 'Knowing where to get care, and what it costs',
  food: 'Food and essentials without going out',
  daily_tasks: 'Help with errands and things at home',
  check_in: 'Someone to check in with',
  pets: 'My pet being cared for'
};

// Deliberate review mapping to the current five choices, not the six old pool tags.
// A need is present only when explicitly supplied in the synthetic case, never
// inferred from a broad checkbox, limited budget, living alone or another task.
const rule = (concerns, need, requires = {}, paidResearch = false) => ({ concerns, need, requires, paidResearch });
const fit = {
  SC01: rule(['getting_care'], 'first_care_route'),
  SC02: rule(['getting_care'], 'in_person_route'),
  SC03: rule(['getting_care'], 'video_visit_setup', { chosenVirtualProvider: true }),
  SC04: rule(['getting_care', 'daily_tasks'], 'appointment_transport'),
  SC05: rule(['getting_care'], 'procedure_escort', { plannedProcedure: true }),
  SC06: rule(['getting_care'], 'care_estimate', { selfPayVisit: true }),
  SC07: rule(['getting_care', 'food'], 'prescription_delivery'),
  SC08: rule(['getting_care', 'food'], 'refill_process', { ongoingPrescription: true }),
  SC09: rule(['getting_care', 'food'], 'pharmacy_collection_rules'),
  SC10: rule(['food'], 'grocery_delivery', {}, true),
  SC11: rule(['food'], 'food_assistance', { foodAffordabilityGap: true }),
  SC12: rule(['food'], 'meal_service_formats', {}, true),
  SC13: rule(['daily_tasks'], 'resting_space'),
  SC14: rule(['food', 'daily_tasks'], 'recurring_supply_shortage', { purchaseFeasible: true }),
  SC15: rule(['food'], 'food_storage_reference'),
  SC16: rule(['daily_tasks'], 'laundry_service_terms', {}, true),
  SC17: rule(['daily_tasks'], 'cleaning_service_scope', {}, true),
  SC18: rule(['daily_tasks'], 'specific_errand', { identifiedNonmedicalErrand: true }),
  SC19: rule(['check_in'], 'wanted_check_in', { trustedWillingContact: true }),
  SC20: rule(['daily_tasks'], 'home_help_types'),
  SC21: rule(['daily_tasks'], 'local_resource_discovery'),
  SC22: rule([], 'absence_process'),
  SC23: rule([], 'work_handoff'),
  SC24: rule([], 'business_pause'),
  SC25: rule(['daily_tasks', 'pets'], 'care_benefits', { benefitAccess: true }),
  SC26: rule(['pets'], 'pet_service_options', { hasPet: true }, true),
  SC27: rule(['pets'], 'pet_carer_introduction', { hasPet: true, chosenCarer: true }),
  SC28: rule(['pets'], 'vet_permission', { hasPet: true, chosenCarer: true }),
  SC29: rule(['pets'], 'extended_pet_care', { hasPet: true, extendedAbsence: true, affordablePetCareGap: true }),
  SC30: rule(['getting_care', 'daily_tasks'], 'planned_return_home', { plannedProcedureOrStay: true })
};

const cases = [
  {
    id: 'care_and_outside_help', title: 'No care route, limited budget, no nearby help',
    description: 'A fictional US user selects care and practical help. She has no workable first-care route and wants to discover local support outside her social circle. Insurance, employment benefits, food affordability and specific errands are unknown.',
    concerns: ['getting_care', 'daily_tasks'], country: 'US',
    needs: ['first_care_route', 'local_resource_discovery'], primaryNeed: 'first_care_route',
    facts: { limitedBudget: true, nearbyHelp: false }, mode: 'any',
    unknown: ['insurance', 'foodAffordabilityGap', 'benefitAccess', 'trustedWillingContact'],
    handled: [], history: [],
    explanation: 'Start with an actual route to care. Keep the insured/other-route wording conditional. Local 211 discovery fits next, but would be a second resource task in this batch.',
    importantSkips: ['SC06', 'SC11', 'SC18', 'SC19', 'SC25'],
    gap: 'The care and local-support tasks both need resources, so the first batch contains one. Limited budget must not silently become uninsured, food insecurity or a permanent ban on researching paid services.'
  },
  {
    id: 'pet_care_after_basics', title: 'Food and care handled; pet care is the missing piece',
    description: 'A fictional US cat owner has workable care and grocery routes. She wants to understand pet-care services, is open to researching future paid care, and has not chosen a carer. There is no planned extended absence or urgent event.',
    concerns: ['food', 'getting_care', 'pets'], country: 'US',
    needs: ['pet_service_options'], primaryNeed: 'pet_service_options',
    facts: { hasPet: true, petSpecies: 'cat', futurePaidResearch: true, chosenCarer: false, extendedAbsence: false },
    mode: 'any', unknown: ['benefitAccess'],
    handled: ['SC01', 'SC10'], history: [],
    explanation: 'Offer pet-service discovery, with Rover and the conditional cat-specific Meowtel example. Do not repeat care or groceries, assume a selected sitter, or suggest extended-absence foster care.',
    importantSkips: ['SC01', 'SC10', 'SC25', 'SC27', 'SC28', 'SC29'],
    gap: 'After service discovery, the pool lacks a strong standalone bridge to choosing one suitable sitter candidate. SC27 needs an actual candidate, not merely a completed learning task. Do not offer a handoff or vet permissions prematurely.'
  },
  {
    id: 'learn_before_arranging', title: 'Discover help first, without arranging anything',
    description: 'A fictional US user wants to learn where local support exists, how household help differs from personal care, and what laundry services involve. She is open to researching future paid options but wants no contact, booking or trial now.',
    concerns: ['daily_tasks'], country: 'US',
    needs: ['local_resource_discovery', 'home_help_types', 'laundry_service_terms'],
    primaryNeed: 'local_resource_discovery', facts: { futurePaidResearch: true }, mode: 'learning',
    unknown: ['benefitAccess', 'trustedWillingContact'], handled: [], history: [],
    explanation: 'Start with local resource discovery. Service-type knowledge and laundry terms are useful alternatives for later batches, not instructions to arrange help now.',
    importantSkips: ['SC13', 'SC18', 'SC19', 'SC25'],
    gap: 'All three fitting learning tasks use a resource. The existing limit yields one per batch; do not strip the useful source, add a trivial chore, or enforce the 40% pool ratio on this person.'
  }
];

// SC25 names Care.com despite having no resource_ids. Naming a provider is not
// a loophole in the founder's resource allowance.
const usesResource = task => task.resource_ids.length > 0 || task.id === 'SC25';

function rehearse(input) {
  const assessments = pool.tasks.map(task => {
    const r = fit[task.id];
    const reasons = [];
    if (input.country !== 'US') reasons.push('This rehearsal has reviewed US fixtures only; local routes need a separate review.');
    if (input.mode === 'urgent') reasons.push('An urgent case needs a separate response, not this preventive selection rehearsal.');
    if (parked.has(task.id)) reasons.push('Parked outside default checkbox suggestions.');
    if (input.handled.includes(task.id)) reasons.push('The synthetic user explicitly says this outcome is already handled.');
    if (input.history.includes(task.outcome_key)) reasons.push('Outcome already shown, saved or completed in this rehearsal history.');
    if (!r.concerns.some(c => input.concerns.includes(c))) reasons.push('Does not match a selected current concern.');
    if (!input.needs.includes(r.need)) reasons.push(`No stated need for ${r.need}; a checkbox alone does not establish it.`);
    for (const [fact, value] of Object.entries(r.requires)) {
      if (input.facts[fact] !== value) reasons.push(`Prerequisite ${fact}=${value} is not confirmed.`);
    }
    if (r.paidResearch && input.facts.futurePaidResearch !== true) reasons.push('Openness to researching future paid services is not confirmed.');
    if (input.mode === 'learning' && task.task_kind !== 'learning') reasons.push('She currently wants learning, not arranging or physical preparation.');
    if (input.maxMinutes !== undefined && task.active_minutes > input.maxMinutes) reasons.push('Exceeds her explicit active-time limit; do not silently shorten the task.');
    return { id: task.id, eligible: reasons.length === 0, reasons, fit: r.need === input.primaryNeed ? 2 : 1,
      band: task.priority.band, resourceTask: usesResource(task) };
  });
  const pending = assessments.filter(a => a.eligible);
  const selected = [], covered = new Set(), deferred = [];
  while (pending.length && selected.length < 3) {
    const uncovered = a => fit[a.id].concerns.filter(c => input.concerns.includes(c) && !covered.has(c)).length;
    pending.sort((a, b) => b.fit - a.fit || bands[a.band] - bands[b.band] || uncovered(b) - uncovered(a) || a.id.localeCompare(b.id));
    const item = pending.shift();
    if (item.resourceTask && selected.some(id => usesResource(byId.get(id)))) {
      deferred.push({ id: item.id, reason: 'One resource task is already selected; still eligible for a later batch.' });
      continue;
    }
    const task = byId.get(item.id);
    if (selected.some(id => byId.get(id).outcome_key === task.outcome_key)) {
      deferred.push({ id: item.id, reason: 'Same outcome is already represented in this batch.' });
      continue;
    }
    selected.push(item.id);
    fit[item.id].concerns.forEach(c => covered.add(c));
  }
  deferred.push(...pending.map(a => ({ id: a.id, reason: 'Batch is full.' })));
  return { selected, deferred, assessments };
}

assert.deepEqual(Object.keys(fit).sort(), [...byId.keys()].sort(), 'Every candidate must have a reviewed test annotation.');
const checks = [];
function check(name, fn) { fn(); checks.push({ name, passed: true }); }
function variant(base, change) { return { ...structuredClone(base), ...change }; }
const first = cases.map(input => rehearse(input));

check('All 30 candidates assessed in each case; at most 3 distinct outcomes and one resource task', () => {
  first.forEach(result => {
    assert.equal(result.assessments.length, 30);
    assert.ok(result.selected.length <= 3);
    assert.equal(new Set(result.selected.map(id => byId.get(id).outcome_key)).size, result.selected.length);
    assert.ok(result.selected.filter(id => usesResource(byId.get(id))).length <= 1);
    result.selected.forEach(id => assert.ok(byId.get(id).resource_ids.length <= 2));
  });
});
check('Care gap leads; limited budget alone does not create insurance, food or benefits facts', () => {
  assert.deepEqual(first[0].selected, ['SC01']);
  assert.equal(cases[0].facts.selfPayVisit, undefined);
  for (const id of ['SC06', 'SC11', 'SC25']) assert.equal(first[0].assessments.find(a => a.id === id).eligible, false);
  assert.deepEqual(rehearse(variant(cases[0], { facts: { ...cases[0].facts, limitedBudget: false } })).selected, first[0].selected);
});
check('Handled care and food stay excluded; one fitting pet task is not padded to three', () => {
  assert.deepEqual(first[1].selected, ['SC26']);
  for (const id of ['SC01', 'SC10', 'SC27', 'SC28', 'SC29']) assert.equal(first[1].assessments.find(a => a.id === id).eligible, false);
});
check('Learning preference can produce a 100% learning batch; pool ratio is not a per-batch quota', () => {
  assert.deepEqual(first[2].selected, ['SC21']);
  assert.deepEqual(first[2].deferred.map(a => a.id), ['SC20', 'SC16']);
  assert.ok(first[2].selected.every(id => byId.get(id).task_kind === 'learning'));
});
check('More ideas uses remaining fits without repeating earlier shown outcomes', () => {
  const input = structuredClone(cases[2]);
  const batches = [];
  for (let i = 0; i < 4; i++) {
    const result = rehearse(input);
    batches.push(result.selected);
    input.history.push(...result.selected.map(id => byId.get(id).outcome_key));
  }
  assert.deepEqual(batches, [['SC21'], ['SC20'], ['SC16'], []]);
});
check('Completing pet learning does not establish a selected carer or unlock a handoff', () => {
  const input = variant(cases[1], { needs: ['pet_service_options', 'pet_carer_introduction'], history: [byId.get('SC26').outcome_key] });
  assert.deepEqual(rehearse(input).selected, []);
  assert.deepEqual(rehearse(variant(input, { facts: { ...input.facts, chosenCarer: true } })).selected, ['SC27']);
});
check('An explicit paid-services exclusion removes pet-marketplace research', () => {
  assert.deepEqual(rehearse(variant(cases[1], { facts: { ...cases[1].facts, futurePaidResearch: false } })).selected, []);
});
check('Exact current interest can promote an Extra ease task ahead of a higher default band', () => {
  const input = variant(cases[2], { primaryNeed: 'laundry_service_terms' });
  assert.deepEqual(rehearse(input).selected, ['SC16']);
});
check('Check-in choice does not infer a willing contact or route to household services', () => {
  const input = variant(cases[0], { concerns: ['check_in'], needs: ['wanted_check_in'], primaryNeed: 'wanted_check_in' });
  assert.deepEqual(rehearse(input).selected, []);
  // A remote willing contact can fit: no nearby help does not mean no relationships.
  assert.deepEqual(rehearse(variant(input, { facts: { ...input.facts, trustedWillingContact: true } })).selected, ['SC19']);
});
check('Unknown benefit access differs from a confirmed route; named service still consumes allowance', () => {
  const input = variant(cases[2], { needs: [...cases[2].needs, 'care_benefits'] });
  assert.equal(rehearse(input).assessments.find(a => a.id === 'SC25').eligible, false);
  const known = variant(input, { primaryNeed: 'care_benefits', facts: { ...input.facts, benefitAccess: true } });
  assert.deepEqual(rehearse(known).selected, ['SC25']);
});
check('Time limits filter tasks rather than fabricating shorter instructions', () => {
  assert.deepEqual(rehearse(variant(cases[0], { maxMinutes: 10 })).selected, ['SC21']);
  assert.equal(byId.get('SC01').active_minutes, 20);
});
check('Unsupported geography and urgent mode do not reuse this US preventive rehearsal', () => {
  assert.deepEqual(rehearse(variant(cases[0], { country: 'CA' })).selected, []);
  assert.deepEqual(rehearse(variant(cases[0], { mode: 'urgent' })).selected, []);
});
check('A broad checkbox without a known gap is insufficient for these strict fit annotations', () => {
  assert.deepEqual(rehearse(variant(cases[0], { needs: [], primaryNeed: null })).selected, []);
});
check('Rehearsal preserves source input and user-case fixtures', () => {
  const before = JSON.stringify(cases);
  cases.forEach(rehearse);
  assert.equal(JSON.stringify(cases), before);
  assert.equal(readFileSync(new URL('pool.json', folder), 'utf8'), source);
});

const results = cases.map((input, index) => {
  const result = first[index];
  const nextInput = variant(input, { history: [...input.history, ...result.selected.map(id => byId.get(id).outcome_key)] });
  return { input, ...result, nextBatch: rehearse(nextInput).selected,
    tasks: result.selected.map(id => structuredClone(byId.get(id))) };
});
const evidence = {
  date: '2026-10-13', status: 'superseded_strict_candidate_rehearsal', poolVersion: pool.version,
  supersededBy: 'Founder requested priority-first selection after this rehearsal. See docs/personalization-plan-v0.md, Shared ranking rules. These historical checks do not validate that correction.',
  poolSha256: createHash('sha256').update(source).digest('hex'),
  limitations: 'Synthetic authored inputs and eligibility annotations. Executes filtering/ranking checks for the candidate review only. Does not test production matching, text interpretation, AI, authentication, D1, UI or deployment. No source re-verification or quality/market-effectiveness claim.',
  checks, results
};
writeFileSync(new URL('selection-results.json', folder), JSON.stringify(evidence, null, 2) + '\n');

const lines = [
  '# Sick-day selection rehearsal', '',
  '> Historical result: Ada subsequently rejected this rehearsal\'s excessive exclusions. Use the [current priority-first rules](../../../docs/personalization-plan-v0.md#shared-ranking-rules--all-categories). Unknown context and unstated specific gaps should not automatically remove useful suggestions. The checks below preserve the former behavior; revised selection has not been tested here.', '',
  'October 13, 2026. Three fictional situations reviewed against the 30-task learning draft. **This is a candidate-content rehearsal, not a live app test or AI output.** No user accounts, API calls or deployment were involved.', '',
  `Pool: \`${pool.version}\`. SHA-256: \`${evidence.poolSha256}\`.`, '',
  '## What ran', '',
  'The script assesses all thirty candidates using manually authored test annotations drawn from their fit notes, then applies current need, default priority, concern coverage, duplicate exclusions and the existing resource allowance. These annotations are not an automatic interpretation of onboarding or free text and are not a new production recommendation engine. Ties use task ID for repeatability, not a proven quality ranking.', '',
  'The extra facts in these fictional cases are known for testing. The app does not currently collect every fact as a structured field. Do not add all of them to onboarding: use relevant existing answers, a concise conditional task, or one consequential clarification. A submitted free-text request takes the separate one-task AI route, which was not exercised here.', '',
  '## Results', '',
  '| Situation | First batch | Next batch, if she asks for more |',
  '| --- | --- | --- |',
  ...results.map(r => `| ${r.input.title} | ${r.selected.join(', ') || 'None'} | ${r.nextBatch.join(', ') || 'No further fit with the same context'} |`), '',
  'All three first batches contain one task. This is not a target: the pet case has only one eligible starting task, while the other cases are limited by one resource task per batch. There is no filler and no requirement to make 40% of each batch learning.', ''
];
for (const r of results) {
  lines.push(`### ${r.input.title}`, '', r.input.description, '',
    `**Checkboxes:** ${r.input.concerns.map(c => labels[c]).join('; ')}.`, '',
    `**Why this selection:** ${r.input.explanation}`, '');
  for (const task of r.tasks) {
    lines.push(`**${task.title} · ${task.active_minutes} min**`, '', task.summary, '',
      ...task.steps.map((s, i) => `${i + 1}. ${s}`), '', `**Done when:** ${task.done_when}`, '',
      `Resources: ${task.resource_ids.join(', ') || 'None'}. Exact current pool copy; no AI rewrite.`, '');
  }
  lines.push('**Important exclusions:**', '');
  for (const id of r.input.importantSkips) {
    const a = r.assessments.find(item => item.id === id);
    lines.push(`- ${id}, ${byId.get(id).title}: ${a.reasons.join(' ')}`);
  }
  lines.push('', `**What needs attention:** ${r.input.gap}`, '');
}
lines.push('## Original findings — read with the correction above', '',
  '1. Keep the current checkbox → suggestions → inspect → add flow. Do not make every checkbox imply an unconfirmed deficiency. A broad selection may need a conditional starting task or one optional clarification; the strict rehearsal returns no result without a stated need.',
  '2. Preserve one resource task per batch and up to two resources within it. More ideas can return the next distinct fit. Do not remove valuable links, add filler, or use provider names to evade the allowance.',
  '3. Improve the pet-care bridge before release: learning what services exist is useful, but does not choose a carer. Craft a genuinely useful candidate-selection step or revise the intended transition; no change to the pool was made in this rehearsal.',
  '4. Implement the approved priority and eligibility rules deliberately. The current runtime ranks soft tag signals and uses a lexical tie-break; its batch coverage pass can also take precedence. It does not yet enforce this draft\'s textual prerequisites or priority bands.',
  '5. Map the five current concerns without conflating wanted check-ins with paid/community household help. Retain saved task versions and do not translate completion of a learning outcome into a practical arrangement.',
  '6. After content corrections, run the same cases against the actual matcher, then test the signed-in preview flow. The existing AI route needs a separate real-generation test using the category prompt and allowed resources.', '',
  '## Executed checks', '',
  ...checks.map(c => `- PASS — ${c.name}.`), '',
  `${checks.length} checks passed. These establish behavior of this small rehearsal only, not recommendation usefulness, production readiness or the app\'s account/data controls.`, '',
  'Rerun: `node personalization/content-candidates/sick-care-v0/selection-rehearsal.mjs` from the repository root. [Machine-readable inputs, assessments and snapshots](selection-results.json). [Source ledger](../../../research/sick-care-pool-sources.md).', ''
);
writeFileSync(new URL('SELECTION-REVIEW.md', folder), lines.join('\n'));
console.log(JSON.stringify({ checksPassed: checks.length, pool: pool.version,
  batches: results.map(r => ({ case: r.input.id, selected: r.selected, next: r.nextBatch })) }, null, 2));
