import { Buffer } from 'node:buffer';
import {
  validProfile, validTaskState, validRequest, validOutput, validCountry,
  outputSchema, instructions, promptHash, hash, requireRule, FlowError
} from './contracts.mjs';

const LIMITS = { signals: 8, previous: 30, candidates: 12, resources: 8, contextBytes: 24000 };
const activeAfter = (date, reset) => date !== null && Date.parse(date) > (reset ? Date.parse(reset) : -Infinity);
const approved = (item, testMode, editorialReview = false) => item.reviewState === 'approved' ||
  (testMode && item.reviewState === 'test_fixture') || (editorialReview && item.reviewState === 'editorial_review');
const same = (a, b) => a === b;
const outcomeGroup = action => action.outcomeGroup || action.actionKey;
const wordCount = text => text.trim().split(/\s+/u).filter(Boolean).length;
const hasLink = text => /(?:[a-z][a-z0-9+.-]*:\/\/|https?:|mailto:|www\.|\b[\p{L}\p{N}-]+\.(?:[\p{L}]{2,}|xn--[a-z0-9-]+)\b|<[^>]+>)/iu.test(text);

function validateSnapshot(snapshot, owner) {
  requireRule(typeof owner === 'string' && owner.length > 0, 'authentication_required');
  requireRule(snapshot && validProfile(snapshot.profile), 'invalid_profile');
  requireRule(snapshot.profile.userId === owner, 'owner_mismatch');
  requireRule(validCountry(snapshot.profile.answers.country), 'invalid_country');
  requireRule(typeof snapshot.stateVersion === 'string' && snapshot.stateVersion.length > 0, 'state_version_required');
  requireRule(Array.isArray(snapshot.taskStates), 'invalid_task_state');
  const seen = new Set();
  for (const state of snapshot.taskStates) {
    requireRule(validTaskState(state), 'invalid_task_state');
    requireRule(state.userId === owner, 'owner_mismatch');
    requireRule(!seen.has(state.actionKey), 'duplicate_task_state');
    requireRule(!(state.savedAt && state.removedAt), 'invalid_task_state');
    requireRule(Boolean(state.feedbackCode) === Boolean(state.feedbackAt), 'invalid_task_state');
    seen.add(state.actionKey);
  }
}

function memoryFor(profile, states, catalog, topic, effective) {
  const a = profile.answers;
  const enabled = profile.personalizationEnabled;
  const relevantTopics = new Set([topic.id, ...topic.relatedTopicIds]);
  const byRef = new Map(catalog.actions.map(action => [action.contentRef, action]));
  const signals = enabled ? states.flatMap(state => {
    const action = byRef.get(state.contentRef);
    if (!action || action.actionKey !== state.actionKey || !action.topicIds.includes(topic.id)) return [];
    const liked = activeAfter(state.likedAt, profile.signalsResetAt);
    const saved = activeAfter(state.savedAt, profile.signalsResetAt) && !state.removedAt;
    const feedback = activeAfter(state.feedbackAt, profile.signalsResetAt) ? state.feedbackCode : null;
    if (!liked && !saved && !feedback) return [];
    const recent = Math.max(...[liked && state.likedAt, saved && state.savedAt, feedback && state.feedbackAt].filter(Boolean).map(Date.parse));
    return [{ action_key: state.actionKey, tags: action.tags, liked, saved, feedback, recent }];
  }).sort((a, b) => b.recent - a.recent || a.action_key.localeCompare(b.action_key))
    .slice(0, LIMITS.signals).map(({ recent, ...signal }) => signal) : [];
  // Only relevant explicit facts. Prior focus, identity, feelings and raw notes are omitted.
  return {
    personalization_enabled: enabled,
    explicit_preferences: {
      household: a.home,
      constraints: a.constraints.filter(value => value !== 'none' &&
        !(value === 'support' && effective.localSupport !== 'unknown') &&
        !(value === 'cost' && effective.noSpend !== null) &&
        !(value === 'time' && effective.maxMinutes !== null)),
      difficulty: enabled && topic.onboardingFocus.includes(a.focus) ? a.difficulty : [],
      strengths: enabled ? a.strengths : [],
      goals: enabled ? a.hope : [],
      preferred_help: enabled ? a.style : null,
      interests: enabled ? profile.interests.filter(value => relevantTopics.has(value)) : []
    },
    preference_signals: signals
  };
}

function matchesConstraints(action, effective) {
  return (effective.maxMinutes === null || action.task.estimated_minutes <= effective.maxMinutes) &&
    (effective.noSpend !== true || action.requiresSpending === false) &&
    (!action.requiresNearbySupport || effective.localSupport === 'available');
}

/** Server-only: owner comes from verified authentication, never the browser request body.
 * store.readSnapshot(owner) must return an atomic profile/task snapshot; this module has no DB.
 */
export async function prepare({ owner, request, store, catalog, testMode = false, allowEditorialReview = false, useProfileDefaults = false }) {
  requireRule(typeof owner === 'string' && owner.length > 0, 'authentication_required');
  requireRule(validRequest(request), 'invalid_request');
  const snapshot = structuredClone(await store.readSnapshot(owner));
  validateSnapshot(snapshot, owner);
  const { profile, taskStates } = snapshot;
  const constraints = useProfileDefaults && profile.personalizationEnabled ? profile.answers.constraints : [];
  const effective = {
    country: Object.hasOwn(request, 'country') ? request.country : profile.answers.country,
    maxMinutes: Object.hasOwn(request, 'maxMinutes') ? request.maxMinutes :
      (constraints.includes('time') || constraints.includes('energy') ? 10 : null),
    noSpend: Object.hasOwn(request, 'noSpend') ? request.noSpend : (constraints.includes('cost') ? true : null),
    localSupport: Object.hasOwn(request, 'localSupport') ? request.localSupport :
      (constraints.includes('support') ? 'unavailable' : 'unknown')
  };
  requireRule(validCountry(effective.country), 'invalid_country');
  const topic = catalog.topics.find(item => item.id === request.topicId && approved(item, testMode, allowEditorialReview));
  requireRule(topic, 'unsupported_topic');
  requireRule(request.concernIds.every(id => topic.concerns.some(concern => concern.id === id)), 'unknown_concern');
  requireRule(new Set(catalog.actions.map(a => a.actionKey)).size === catalog.actions.length, 'duplicate_catalog_key');
  requireRule(new Set(catalog.actions.map(a => a.contentRef)).size === catalog.actions.length, 'duplicate_content_ref');
  const excluded = new Set(taskStates.map(state => state.actionKey));
  // Reviewed alternatives can have different keys but still accomplish the same thing.
  // Keep this grouping in shared content, not another per-user memory field.
  const excludedGroups = new Set(catalog.actions.filter(action => excluded.has(action.actionKey)).map(outcomeGroup));
  const memory = memoryFor(profile, taskStates, catalog, topic, effective);
  const resourceCandidates = catalog.resources.filter(resource => approved(resource, testMode, allowEditorialReview) &&
    resource.topicIds.includes(topic.id) &&
    (resource.countries.includes('*') || (effective.country && resource.countries.includes(effective.country))) &&
    (effective.noSpend !== true || resource.cost === 'free'));
  requireRule(resourceCandidates.length <= LIMITS.resources, 'resource_context_too_large');
  for (const resource of resourceCandidates) {
    requireRule(/^https:\/\//.test(resource.url), 'invalid_resource_url');
  }
  const resources = new Map(resourceCandidates.map(resource => [resource.id, resource]));
  requireRule(resources.size === resourceCandidates.length, 'duplicate_resource_id');
  const positives = memory.preference_signals.filter(signal => signal.liked || signal.saved);
  const negativeKeys = new Set(memory.preference_signals.filter(signal => signal.feedback && signal.feedback !== 'helpful').map(s => s.action_key));
  const rank = action => {
    if (!profile.personalizationEnabled) return 0;
    // At most one vote per action, even when both liked and saved. Feedback is not a diagnosis.
    return positives.filter(signal => !negativeKeys.has(signal.action_key) && signal.tags.some(tag => action.tags.includes(tag))).length;
  };
  const candidates = catalog.actions.filter(action => approved(action, testMode, allowEditorialReview) &&
    action.topicIds.includes(topic.id) && !excluded.has(action.actionKey) && !excludedGroups.has(outcomeGroup(action)) &&
    (action.requiresConcernIds || []).every(id => request.concernIds.includes(id)) &&
    (!request.concernIds.length || action.concernIds.some(id => request.concernIds.includes(id))) &&
    matchesConstraints(action, effective) && action.task.resources.every(r => resources.has(r.resource_id)))
    .sort((a, b) => rank(b) - rank(a) || a.actionKey.localeCompare(b.actionKey)).slice(0, LIMITS.candidates);
  const packet = {
    context_version: 1,
    current_topic: { id: topic.id, scope: topic.scope },
    selected_concerns: topic.concerns.filter(concern => request.concernIds.includes(concern.id)),
    user_context: { current_request: request.note || null, explicit_limits: {
      max_minutes: effective.maxMinutes, no_spend: effective.noSpend,
      nearby_support: effective.localSupport, country: effective.country
    } },
    user_memory: memory,
    previous_actions: taskStates.filter(state => catalog.actions.some(a => a.actionKey === state.actionKey && a.topicIds.includes(topic.id)))
      .slice(-LIMITS.previous).map(state => ({ action_key: state.actionKey, completed: Boolean(state.completedAt), saved: Boolean(state.savedAt) })),
    reviewed_guidance: topic.guidance,
    eligible_resources: [...resources.values()].map(({ id, name, purpose, countries, cost, limits }) => ({ resource_id: id, name, purpose, countries, cost, limits })),
    candidate_solutions: candidates.map(action => ({ action_key: action.actionKey, outcome_group: outcomeGroup(action), concern_ids: action.concernIds,
      outcome: action.outcome, tags: action.tags, requires_spending: action.requiresSpending,
      requires_nearby_support: action.requiresNearbySupport, task: action.task })),
    adaptation_only: true
  };
  requireRule(Buffer.byteLength(JSON.stringify(packet), 'utf8') <= LIMITS.contextBytes, 'context_too_large');
  return { packet, candidates, resources, excluded, excludedGroups, effective, snapshot, request: structuredClone(request), promptHash };
}

export function buildRequest(prepared, model) {
  requireRule(typeof model === 'string' && /^[a-zA-Z0-9._:-]{1,100}$/.test(model), 'model_required');
  return {
    model, store: false, instructions,
    input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(prepared.packet) }] }],
    max_output_tokens: 5000,
    text: { format: { type: 'json_schema', name: 'safety_task_batch_v11', strict: true, schema: outputSchema } }
  };
}

export function validateBatch(batch, prepared) {
  requireRule(validOutput(batch), 'invalid_output_shape');
  const { tasks, status, message } = batch;
  requireRule(status === 'ready' ? tasks.length === 3 && message === null :
    typeof message === 'string' && message.trim().length > 0 && (status === 'no_more_ideas' ? tasks.length <= 2 : tasks.length === 0), 'invalid_output_status');
  requireRule(!message || (message.length <= 500 && !hasLink(message)), 'invalid_message');
  requireRule(new Set(tasks.map(task => task.action_key)).size === tasks.length, 'duplicate_action');
  requireRule(tasks.filter(task => task.resources.length > 0).length <= 1, 'too_many_linked_tasks');
  const batchGroups = new Set();
  for (const task of tasks) {
    requireRule(!prepared.excluded.has(task.action_key), 'repeated_action');
    const candidate = prepared.candidates.find(action => action.actionKey === task.action_key);
    requireRule(candidate, 'unsupported_action');
    const group = outcomeGroup(candidate);
    requireRule(!prepared.excludedGroups.has(group) && !batchGroups.has(group), 'repeated_outcome');
    batchGroups.add(group);
    requireRule(matchesConstraints({ ...candidate, task }, prepared.effective), 'constraint_violation');
    requireRule(task.concern_ids.every(id => prepared.request.concernIds.includes(id) && candidate.concernIds.includes(id)), 'invalid_concern');
    requireRule(new Set(task.concern_ids).size === task.concern_ids.length, 'invalid_concern');
    requireRule(prepared.request.concernIds.length === 0 || task.concern_ids.length > 0, 'missing_concern');
    requireRule(task.resources.every(r => prepared.resources.has(r.resource_id) && candidate.task.resources.some(cr => cr.resource_id === r.resource_id)), 'invalid_resource');
    requireRule(new Set(task.resources.map(r => r.resource_id)).size === task.resources.length, 'invalid_resource');
    // Narrow adaptation mode keeps the source support of the reviewed candidate intact.
    requireRule(candidate.task.resources.every(r => task.resources.some(tr => tr.resource_id === r.resource_id)), 'missing_required_resource');
    const strings = [task.title, task.summary, ...task.steps, task.done_when, ...task.resources.map(r => r.why), ...task.purchase_checks, task.no_purchase_option || ''];
    requireRule(strings.every(s => !hasLink(s)), 'unexpected_link_or_html');
    requireRule(task.title.trim() && task.summary.trim() && task.done_when.trim() && task.steps.every(s => s.trim()), 'empty_task_copy');
    requireRule(wordCount(task.title) <= 9 && wordCount(task.summary) <= 35 && wordCount(task.done_when) <= 20 &&
      task.steps.every(s => wordCount(s) <= 25) && wordCount(strings.join(' ')) <= 170, 'copy_too_long');
    requireRule(task.purchase_checks.length === 0 || (task.purchase_checks.length >= 2 && task.purchase_checks.every(s => wordCount(s) <= 15)), 'invalid_purchase_checks');
    requireRule(prepared.effective.noSpend !== true || (task.purchase_checks.length === 0 && task.no_purchase_option === null), 'constraint_violation');
  }
  return structuredClone(batch);
}

function poolBatch(prepared) {
  const tasks = [];
  const groups = new Set();
  const covered = new Set();
  while (tasks.length < 3) {
    const eligible = prepared.candidates.filter(candidate => !groups.has(outcomeGroup(candidate)) &&
      !(candidate.task.resources.length && tasks.some(task => task.resources.length)));
    // Cover selected concerns before giving a second action for the same one.
    // Stable sorting preserves personal signal/editorial order for equal fits.
    const uncovered = candidate => candidate.concernIds.filter(id => prepared.request.concernIds.includes(id) && !covered.has(id)).length;
    eligible.sort((a, b) => uncovered(b) - uncovered(a));
    const candidate = eligible[0];
    if (!candidate) break;
    const task = structuredClone(candidate.task);
    task.concern_ids = task.concern_ids.filter(id => prepared.request.concernIds.includes(id));
    tasks.push(task);
    groups.add(outcomeGroup(candidate));
    task.concern_ids.forEach(id => covered.add(id));
  }
  return { status: tasks.length === 3 ? 'ready' : 'no_more_ideas',
    message: tasks.length === 3 ? null : 'These are the useful new options available for this topic right now.', tasks };
}

/** No calls unless route is explicitly 'adapt' and reviewed candidates exist.
 * This rehearsal deliberately does not write task state, content, emails or awards.
 */
export async function recommend(options) {
  const { store, owner, route = 'pool', client, model } = options;
  requireRule(route === 'pool' || route === 'adapt', 'invalid_route');
  let prepared;
  try { prepared = await prepare(options); }
  catch (error) {
    if (error.code === 'unsupported_topic') return { status: 'unsupported_topic', batch: null, source: null };
    throw error;
  }
  if (route === 'pool' && options.request.note?.trim()) return { status: 'adaptation_needed', batch: null, source: null };
  let source = 'pool';
  let metadata = null;
  let batch;
  try {
    if (route === 'adapt' && prepared.candidates.length > 0) {
      requireRule(client && typeof client.generate === 'function', 'client_required');
      const result = await client.generate(buildRequest(prepared, model));
      batch = validateBatch(result.batch, prepared);
      source = 'ai';
      metadata = result.metadata;
    } else batch = validateBatch(poolBatch(prepared), prepared);
  } catch (error) {
    if (error instanceof FlowError) return { status: error.code, batch: null, source: null };
    throw error;
  }
  // Detect changes while a paid call was in flight. Production delivery still needs an
  // atomic compare-and-save transaction to close the race after this final read.
  const latest = await store.readSnapshot(owner);
  validateSnapshot(latest, owner);
  if (!same(hash(latest), hash(prepared.snapshot))) return { status: 'stale_state', batch: null, source: null };
  return { status: 'ok', source, batch, metadata,
    reviewRequired: source === 'ai' || Boolean(options.testMode) || Boolean(options.allowEditorialReview),
    trace: { contextVersion: 1, profileRevision: prepared.snapshot.profile.revision,
      stateVersion: prepared.snapshot.stateVersion, promptHash, candidateCount: prepared.candidates.length } };
}
