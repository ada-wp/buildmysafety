import { Buffer } from 'node:buffer';
import { outputSchema, hash, requireRule } from './contracts.mjs';
import { validateBatch } from './flow.mjs';
import { privatePrefix } from './private-actions.mjs';
import { feedbackGuidance } from './feedback-guidance.mjs';
import { sickCareInstructions } from './generated/contracts.mjs';

export const newNeedInstructions = `${sickCareInstructions}
${feedbackGuidance}
Mode: create ONE new task for the current request. Return only decision and task JSON using the supplied schema.
Use a short canonical lower_snake_case action_key, without personal details or random suffixes.
Estimated active time must fit the explicit maximum and be at most 30 minutes. Researching prices, paid services, prescription delivery and refill administration is allowed; do not recommend medication, treatment or purchases as a research exercise.
Do not require a payment, subscription or booking. Use purchase_checks [] and no_purchase_option null for this research-focused path. A named service must come from eligible_resources; its resource ID must be included. Do not invent providers.
Previous outcomes prevent repetition; the shared collection is inspiration, not a ceiling on genuinely useful new actions. A collection_outcomes entry with already_shown false is available inspiration, NOT something this person has already done or received. Return no_new_idea only when the same specific practical outcome is in previous_outcomes or has already_shown true. Related subjects alone are not duplicates: grocery delivery, pharmacy delivery and virtual care solve different needs. Do not invent a previous outcome. A broad supported interest is enough for a useful discovery task. Return needs_context only when one consequential fact cannot be handled conditionally.`;
export const newNeedPromptHash = hash(newNeedInstructions);
const decisions = ['generated', 'no_new_idea', 'needs_context', 'out_of_scope', 'safety_redirect'];

export function buildNewNeedRequest(prepared, catalog, history, model) {
  requireRule(model === 'gpt-6-luna', 'model_required');
  const topic = catalog.topics.find(t => t.id === prepared.request.topicId);
  const packet = {
    ...prepared.packet, candidate_solutions: undefined, adaptation_only: undefined,
    supported_concerns: topic.concerns,
    previous_outcomes: history.slice(0, 30).map(item => ({ action_key: item.state.actionKey,
      title: item.content.title, outcome: item.content.done_when })),
    collection_outcomes: catalog.actions.filter(a => a.topicIds.includes(topic.id) && !a.retired).map(a => ({
      action_key: a.actionKey, title: a.task.title, outcome: a.outcome,
      already_shown: prepared.excluded.has(a.actionKey) }))
  };
  const input = JSON.stringify(packet);
  requireRule(Buffer.byteLength(input, 'utf8') <= 24000, 'context_too_large');
  return { model, store: false, instructions: newNeedInstructions,
    input: [{ role: 'user', content: [{ type: 'input_text', text: input }] }],
    reasoning: { effort: 'low' }, max_output_tokens: 2200,
    text: { format: { type: 'json_schema', name: 'safety_new_need_v1', strict: true,
      schema: { type: 'object', additionalProperties: false, required: ['decision', 'task'], properties: {
        decision: { type: 'string', enum: decisions },
        task: { anyOf: [outputSchema.properties.tasks.items, { type: 'null' }] }
      } } } }
  };
}

const words = text => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(w =>
  !['a', 'an', 'the', 'to', 'for', 'your', 'you', 'in', 'on', 'and', 'of', 'is', 'are', 'with', 'when'].includes(w)) || []);
export function sameOutcome(a, b) {
  const overlap = (x, y) => {
    const left = words(x), right = words(y);
    return left.size && right.size ? [...left].filter(w => right.has(w)).length / Math.max(left.size, right.size) : 0;
  };
  return overlap(a.done_when, b.done_when) >= 0.8 ||
    (overlap(a.title, b.title) >= 0.8 && overlap(a.steps.join(' '), b.steps.join(' ')) >= 0.65);
}

export function acceptNewNeed(output, prepared, catalog, history, checkCopy) {
  requireRule(output && typeof output === 'object' && !Array.isArray(output) &&
    Object.keys(output).length === 2 && decisions.includes(output.decision) && Object.hasOwn(output, 'task'), 'invalid_output_shape');
  if (output.decision !== 'generated') {
    requireRule(output.task === null, 'invalid_output_shape');
    return { decision: output.decision, task: null };
  }
  const task = structuredClone(output.task);
  requireRule(task && typeof task.action_key === 'string' && /^[a-z][a-z0-9_]{2,55}$/.test(task.action_key), 'unsupported_action');
  // Namespace belongs to the server. Canonical outcome identity stays stable across retries.
  task.action_key = privatePrefix(prepared.request.topicId) + task.action_key;
  const topic = catalog.topics.find(t => t.id === prepared.request.topicId);
  const candidate = { actionKey: task.action_key, outcomeGroup: task.action_key,
    concernIds: topic.concerns.map(c => c.id), requiresSpending: false,
    requiresNearbySupport: false, task };
  // Reuse the same strict format/resource/length/constraint validation as pool tasks.
  const supplied = new Set(prepared.packet.eligible_resources.map(r => r.resource_id));
  validateBatch({ status: 'no_more_ideas', message: 'One step for your request.', tasks: [task] }, {
    ...prepared, resources: new Map([...prepared.resources].filter(([id]) => supplied.has(id))),
    candidates: [candidate], request: { ...prepared.request, concernIds: candidate.concernIds }
  });
  requireRule(task.steps.length === 3 && task.estimated_minutes <= 30 && task.purchase_checks.length === 0 &&
    task.no_purchase_option === null, 'constraint_violation');
  requireRule(!task.concern_ids.includes('pets') || prepared.request.concernIds.includes('pets') ||
    /\b(pet|cat|dog|kitten|puppy|rabbit|bird|fish)\b|宠物|猫|狗/iu.test(prepared.request.note), 'invalid_concern');
  checkCopy(task, prepared.effective);
  // Research may describe prices and collection rules. It must not make a
  // payment/account/booking an instruction to complete this generated task.
  requireRule(!task.steps.some(step => /^(?:first[, ]+)?(?:buy|purchase|pay|subscribe|book|place an order|create an account)\b/i.test(step.trim())), 'constraint_violation');
  requireRule(!history.some(item => sameOutcome(task, item.content)), 'repeated_outcome');
  return { decision: 'generated', task };
}
