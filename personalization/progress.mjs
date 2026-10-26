import { FlowError, requireRule } from './contracts.mjs';
import { readBody, safeError } from './http.mjs';
import { privatePrefix } from './private-actions.mjs';

export const MILESTONES = Object.freeze([1, 3, 6, 9, 10]);
const FEELINGS = new Set(['unsure', 'somewhat', 'ready']);
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = value => new Response(JSON.stringify(value), { headers });
const record = value => value && typeof value === 'object' && !Array.isArray(value);

/** Counts come from immutable action identities, never from client-supplied totals.
 * Removing a completed item from the active list retains its completion/history;
 * undo removes its completion count but never its existing one-time award. */
export function createProgressStore(db, catalog, { now = () => new Date().toISOString() } = {}) {
  const stmt = (sql, ...values) => db.prepare(sql).bind(...values);
  const belongs = (key, topicId) => key.startsWith(privatePrefix(topicId)) ||
    catalog.actions.some(action => action.actionKey === key && action.topicIds.includes(topicId));
  async function read(owner) {
    const results = await db.batch([
      stmt('SELECT state_version FROM memory_profiles WHERE user_id = ?', owner),
      stmt('SELECT action_key, saved_at, removed_at, completed_at FROM memory_task_states WHERE user_id = ?', owner),
      stmt('SELECT action_key FROM memory_completion_awards WHERE user_id = ?', owner),
      stmt('SELECT * FROM memory_category_progress WHERE user_id = ?', owner)
    ]);
    requireRule(results[0].results[0], 'profile_not_found');
    return { stateVersion: String(results[0].results[0].state_version), categories: catalog.topics.map(topic => {
      const tasks = results[1].results.filter(task => belongs(task.action_key, topic.id));
      const saved = results[3].results.find(row => row.topic_id === topic.id);
      return { topicId: topic.id, completedCount: tasks.filter(task => task.completed_at).length,
        pendingCount: tasks.filter(task => task.saved_at && !task.removed_at && !task.completed_at).length,
        earnedCount: results[2].results.filter(task => belongs(task.action_key, topic.id)).length,
        revision: saved?.revision || 0,
        seenMilestones: saved ? JSON.parse(saved.seen_milestones_json) : [],
        latestCheckIn: saved?.check_in_json ? JSON.parse(saved.check_in_json) : null };
    }) };
  }
  async function update(owner, body) {
    requireRule(record(body) && Object.keys(body).every(key =>
      ['topicId', 'expectedRevision', 'expectedStateVersion', 'milestone', 'feeling'].includes(key)), 'invalid_body');
    requireRule(catalog.topics.some(topic => topic.id === body.topicId), 'unsupported_topic');
    requireRule(Number.isSafeInteger(body.expectedRevision) && body.expectedRevision >= 0, 'invalid_revision');
    requireRule(typeof body.expectedStateVersion === 'string' && /^[1-9][0-9]*$/.test(body.expectedStateVersion) &&
      Number.isSafeInteger(Number(body.expectedStateVersion)), 'invalid_state_version');
    requireRule(MILESTONES.includes(body.milestone), 'invalid_milestone');
    requireRule(!Object.hasOwn(body, 'feeling') || FEELINGS.has(body.feeling), 'invalid_feeling');
    const snapshot = await read(owner);
    const current = snapshot.categories.find(item => item.topicId === body.topicId);
    const seen = current.seenMilestones.includes(body.milestone);
    // Repeating the exact acknowledgement is harmless, including after a lost response.
    const same = seen && (!Object.hasOwn(body, 'feeling') ||
      (current.latestCheckIn?.milestone === body.milestone && current.latestCheckIn?.feeling === body.feeling));
    if (same) return snapshot;
    requireRule(current.revision === body.expectedRevision && snapshot.stateVersion === body.expectedStateVersion, 'stale_state');
    requireRule(seen || current.completedCount >= body.milestone, 'invalid_milestone');
    const at = now();
    requireRule(typeof at === 'string' && Number.isFinite(Date.parse(at)), 'invalid_server_time');
    // Catch-up/replay acknowledges earlier reached moments together, rather than
    // interrupting a returning person with a backlog of old celebrations.
    const milestones = [...new Set([...current.seenMilestones, ...MILESTONES.filter(n => n <= body.milestone)])].sort((a, b) => a - b);
    const checkIn = Object.hasOwn(body, 'feeling') ? { feeling: body.feeling, milestone: body.milestone, answeredAt: at } : current.latestCheckIn;
    const result = await db.batch([stmt(`INSERT INTO memory_category_progress
      (user_id, topic_id, revision, seen_milestones_json, check_in_json, updated_at)
      SELECT ?, ?, 1, ?, ?, ? WHERE EXISTS (SELECT 1 FROM memory_profiles WHERE user_id = ? AND state_version = ?)
      AND COALESCE((SELECT revision FROM memory_category_progress WHERE user_id = ? AND topic_id = ?), 0) = ?
      ON CONFLICT(user_id, topic_id) DO UPDATE SET revision = revision + 1,
      seen_milestones_json = excluded.seen_milestones_json, check_in_json = excluded.check_in_json,
      updated_at = excluded.updated_at RETURNING revision`, owner, body.topicId, JSON.stringify(milestones),
      checkIn ? JSON.stringify(checkIn) : null, at, owner, Number(body.expectedStateVersion), owner, body.topicId, body.expectedRevision)]);
    requireRule(result[0].results[0], 'stale_state');
    return read(owner);
  }
  return { read, update };
}

export function createProgressHandler({ verifyIdentity, catalog }) {
  return async (request, env) => {
    try {
      const url = new URL(request.url);
      requireRule(!url.search, 'invalid_request');
      requireRule(!request.headers.get('Origin') || request.headers.get('Origin') === url.origin, 'origin_not_allowed');
      const owner = await verifyIdentity(request, env);
      requireRule(typeof owner === 'string' && owner.trim() === owner && owner.length > 0 && owner.length <= 128, 'authentication_invalid');
      requireRule(env.MEMORY_DB && typeof env.MEMORY_DB.batch === 'function', 'd1_binding_required');
      const store = createProgressStore(env.MEMORY_DB, catalog);
      if (request.method === 'GET' && url.pathname === '/api/progress') return json(await store.read(owner));
      requireRule(request.method === 'PATCH' && url.pathname === '/api/progress', 'method_not_allowed');
      return json(await store.update(owner, await readBody(request)));
    } catch (error) { return safeError(error instanceof FlowError ? error : new FlowError('storage_unavailable')); }
  };
}
