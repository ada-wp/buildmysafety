import { prepare, buildRequest, recommend } from './flow.mjs';
import { options, taskState, T1, T2 } from './test/fixtures.mjs';

// No API request. All inputs and sources are explicitly synthetic test fixtures.
const o = options();
const before = await prepare(o);
o.store.change(s => {
  s.profile.revision++;
  s.profile.updatedAt = T1;
  s.taskStates.push(taskState('easy_meals', { savedAt: T1, completedAt: T2 }), taskState('outside_help', { likedAt: T1, savedAt: T1 }));
});
const after = await prepare({ ...o, request: { ...o.request, maxMinutes: 5, noSpend: true } });
const firstRequest = buildRequest(before, 'MODEL_CHOSEN_AT_CONNECTION');
const secondRequest = buildRequest(after, 'MODEL_CHOSEN_AT_CONNECTION');
const pool = await recommend(o);
console.log(JSON.stringify({
  demonstration: 'Fictional memory-to-request rehearsal; zero real model calls',
  before: {
    limits: before.packet.user_context.explicit_limits,
    signals: before.packet.user_memory.preference_signals,
    eligibleActions: before.candidates.map(a => a.actionKey)
  },
  after: {
    limits: after.packet.user_context.explicit_limits,
    signals: after.packet.user_memory.preference_signals,
    eligibleActions: after.candidates.map(a => a.actionKey),
    excluded: [...after.excluded]
  },
  fixedInstructionsUnchanged: firstRequest.instructions === secondRequest.instructions,
  modelInputChanged: firstRequest.input[0].content[0].text !== secondRequest.input[0].content[0].text,
  poolPath: { source: pool.source, status: pool.batch.status },
  limitations: 'No durable database, sign-in, production connection, or model-quality claim.'
}, null, 2));
