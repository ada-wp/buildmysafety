import { readFileSync } from 'node:fs';

export const OWNER = 'fictional-user-001';
export const T0 = '2026-10-11T12:00:00Z';
export const T1 = '2026-10-11T13:00:00Z';
export const T2 = '2026-10-11T14:00:00Z';
const example = JSON.parse(readFileSync(new URL('../../docs/contracts/user-profile-v0.example.json', import.meta.url), 'utf8'));

export function makeStore() {
  let snapshot = { profile: structuredClone(example), taskStates: [], stateVersion: '1' };
  return {
    reads: 0,
    async readSnapshot(owner) { this.reads++; return structuredClone(snapshot); },
    // Test-only mutation. A future DB implementation must authenticate and transact writes.
    change(fn) { fn(snapshot); snapshot.stateVersion = String(Number(snapshot.stateVersion) + 1); },
    inspect() { return structuredClone(snapshot); }
  };
}

export function taskState(actionKey, overrides = {}) {
  return { userId: OWNER, actionKey, contentRef: `${actionKey}@1`, shownAt: T0,
    savedAt: null, removedAt: null, completedAt: null, likedAt: null,
    feedbackCode: null, feedbackAt: null, ...overrides };
}

function action(key, title, tags, minutes, steps, done, overrides = {}) {
  const resources = overrides.resources || [];
  const topic = overrides.topic || 'sick_care';
  const concerns = topic === 'sick_care' ? ['low_energy'] : ['settle_in'];
  return {
    actionKey: key, outcomeGroup: ['easy_meals', 'food_shortcut'].includes(key) ? 'easy_food_ready' : key,
    contentRef: `${key}@1`, reviewState: 'test_fixture',
    topicIds: [topic], concernIds: concerns, outcome: done, tags,
    requiresSpending: false, requiresNearbySupport: false,
    task: { action_key: key, concern_ids: concerns, title,
      summary: 'Put one useful option within reach for a quieter day.', estimated_minutes: minutes,
      steps, done_when: done, resources, purchase_checks: [], no_purchase_option: null },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !['resources', 'topic'].includes(key)))
  };
}

// Synthetic technical fixtures, NOT founder-approved recommendations or checked providers.
// testMode must be explicitly enabled; normal mode excludes every fixture record.
export function makeCatalog() {
  const steps = ['Choose one option you already use.', 'Keep the details somewhere you can find again.'];
  return {
    topics: [
      { id: 'sick_care', reviewState: 'test_fixture', relatedTopicIds: ['meals_one', 'rest'],
        onboardingFocus: ['sick'], scope: 'Everyday preparation for a lower-energy day at home; no treatment advice.',
        concerns: [{ id: 'low_energy', label: 'Make an ordinary rest day easier' }],
        guidance: ['Use familiar items and ordinary routines. Do not suggest medication or medical treatment.'] },
      { id: 'home_confidence', reviewState: 'test_fixture', relatedTopicIds: ['neighbors'],
        onboardingFocus: ['home'], scope: 'Everyday familiarity with home, excluding repair and security advice.',
        concerns: [{ id: 'settle_in', label: 'Know where everyday essentials are' }], guidance: ['Use familiar, nonhazardous household items.'] }
    ],
    resources: [
      { id: 'fixture_free_directory', name: 'Synthetic free directory', url: 'https://example.org/free-help',
        reviewState: 'test_fixture', topicIds: ['sick_care'], countries: ['US'], cost: 'free',
        purpose: 'Test a free-help research option.', limits: 'Fictional test resource. No real availability or endorsement.' },
      { id: 'fixture_canada_directory', name: 'Synthetic Canada directory', url: 'https://example.org/ca-help',
        reviewState: 'test_fixture', topicIds: ['sick_care'], countries: ['CA'], cost: 'free',
        purpose: 'Country-filter test.', limits: 'Fictional.' },
      { id: 'fixture_paid_directory', name: 'Synthetic paid directory', url: 'https://example.org/paid-help',
        reviewState: 'test_fixture', topicIds: ['sick_care'], countries: ['US'], cost: 'paid',
        purpose: 'Cost-filter test.', limits: 'Fictional.' }
    ],
    actions: [
      action('easy_meals', 'Choose two easy meals', ['food'], 8,
        ['Look at familiar food you have at home.', 'Choose two low-preparation options.', 'Keep them easy to find.'],
        'Two familiar food options are ready to find.'),
      action('rest_station', 'Set up a sick-day shelf', ['supplies'], 10,
        ['Choose a reachable shelf near your usual resting place.', 'Gather tissues and a charging cable you already own.', 'Note anything missing for your usual shopping trip.'],
        'Essentials are together, with any missing item noted.'),
      action('outside_help', 'Find a place to turn', ['services'], 12,
        ['Open the supplied directory.', 'Check whether relevant practical help covers your area.', 'Save an option or note that none currently fits.'],
        'One possible option is saved, or no suitable option is recorded.',
        { resources: [{ resource_id: 'fixture_free_directory', why: 'A fictional source for testing the connection.' }] }),
      action('defer_chore', 'Let one chore wait', ['effort'], 4,
        ['Choose a nonessential chore that can wait.', 'Move it to a day you choose.'],
        'One nonessential chore has a new day.'),
      action('food_shortcut', 'Keep a familiar meal shortcut', ['food'], 5,
        ['Choose a familiar meal you can assemble simply.', 'Keep its short ingredient list with your usual shopping note.'],
        'A familiar meal shortcut is ready to reuse.'),
      action('usual_delivery', 'Find your usual delivery details', ['services'], 5, steps,
        'Details for an existing option are easy to find.'),
      action('ask_available_person', 'Arrange a check-in', ['people'], 5, steps,
        'An inquiry is ready to send.', { requiresNearbySupport: true }),
      action('buy_item', 'Choose a useful missing item', ['supplies'], 5, steps,
        'A relevant purchase has been chosen.', { requiresSpending: true }),
      action('home_essentials', 'Find everyday essentials', ['supplies'], 5, steps,
        'An everyday essential has a familiar place.', { topic: 'home_confidence' })
    ]
  };
}

export function options(overrides = {}) {
  return { owner: OWNER, request: { topicId: 'sick_care', concernIds: ['low_energy'] },
    store: makeStore(), catalog: makeCatalog(), testMode: true, ...overrides };
}

export function sampleBatch(prepared) {
  const tasks = [];
  for (const candidate of prepared.candidates) {
    if (tasks.length === 3) break;
    if (candidate.task.resources.length && tasks.some(t => t.resources.length)) continue;
    const task = structuredClone(candidate.task);
    task.concern_ids = task.concern_ids.filter(id => prepared.request.concernIds.includes(id));
    tasks.push(task);
  }
  return { status: tasks.length === 3 ? 'ready' : 'no_more_ideas', message: tasks.length === 3 ? null : 'No other fitting tasks in this test.', tasks };
}

export function apiResponse(batch, overrides = {}) {
  return { status: 'completed', id: 'resp_fixture_only', model: 'test-model', usage: { input_tokens: 10, output_tokens: 20 },
    output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(batch) }] }], ...overrides };
}
