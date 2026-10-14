import { validProfile, validTaskState, validOutput, validCountry, requireRule, FlowError } from './contracts.mjs';

const EDITABLE = new Set(['answers', 'interests', 'personalizationEnabled', 'elephantName']);
const PROFILE_COLUMNS = 'user_id, profile_json, revision, state_version, updated_at, signals_reset_at';
const TASK_COLUMNS = `user_id AS userId, action_key AS actionKey, content_ref AS contentRef,
  shown_at AS shownAt, saved_at AS savedAt, removed_at AS removedAt,
  completed_at AS completedAt, liked_at AS likedAt, feedback_code AS feedbackCode, feedback_at AS feedbackAt`;
const OWNED_CONTENT_SQL = `SELECT c.content_ref, c.action_key, c.task_json FROM memory_task_content c
  JOIN memory_task_states t ON t.content_ref = c.content_ref AND t.action_key = c.action_key WHERE t.user_id = ?
  UNION ALL SELECT c.content_ref, c.action_key, c.task_json FROM memory_private_task_content c
  JOIN memory_task_states t ON t.user_id = c.user_id AND t.content_ref = c.content_ref AND t.action_key = c.action_key
  WHERE t.user_id = ?`;
const emptyAnswers = () => ({ why: null, home: null, focus: null, difficulty: [], constraints: [],
  strengths: [], hope: [], style: null, country: null });
const checkOwner = owner => requireRule(typeof owner === 'string' && owner.trim().length > 0 && owner.length <= 128, 'authentication_required');
const checkRevision = revision => requireRule(Number.isSafeInteger(revision) && revision >= 1, 'invalid_revision');
const FEEDBACK = new Set([null, 'helpful', 'too_generic', 'too_much_effort', 'too_expensive', 'already_done', 'not_relevant_now']);
function checkStateVersion(version) {
  requireRule(typeof version === 'string' && /^[1-9][0-9]*$/.test(version) && Number.isSafeInteger(Number(version)), 'invalid_state_version');
}
function checkEvent(event) {
  requireRule(event && typeof event === 'object' && !Array.isArray(event), 'invalid_event');
  const feedback = event.type === 'feedback';
  requireRule(Object.keys(event).every(key => key === 'type' || (feedback && key === 'code')), 'invalid_event');
  requireRule(feedback ? FEEDBACK.has(event.code) : ['save', 'remove', 'complete', 'undo_complete', 'like', 'unlike'].includes(event.type), 'invalid_event');
}

function checkContent(content, actionKey) {
  requireRule(validOutput({ status: 'no_more_ideas', message: 'Stored task.', tasks: [content] }) &&
    content.action_key === actionKey, 'invalid_task_content');
  return content;
}

function parsed(value, code) {
  try { return JSON.parse(value); } catch { throw new FlowError(code); }
}

function checkRequestId(value) {
  requireRule(typeof value === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(value), 'invalid_request_id');
}

function checkFields(fields) {
  requireRule(fields && typeof fields === 'object' && !Array.isArray(fields), 'invalid_profile_changes');
  requireRule(Object.keys(fields).every(key => EDITABLE.has(key)), 'invalid_profile_changes');
  if (Object.hasOwn(fields, 'answers')) {
    requireRule(fields.answers && typeof fields.answers === 'object' && !Array.isArray(fields.answers), 'invalid_profile_changes');
  }
}

function checkProfile(profile) {
  requireRule(validProfile(profile), 'invalid_profile');
  requireRule(validCountry(profile.answers.country), 'invalid_country');
  return profile;
}

function checkTask(state, owner) {
  requireRule(validTaskState(state), 'invalid_task_state');
  requireRule(state.userId === owner, 'owner_mismatch');
  requireRule(!(state.savedAt && state.removedAt), 'invalid_task_state');
  requireRule(Boolean(state.feedbackCode) === Boolean(state.feedbackAt), 'invalid_task_state');
  return state;
}

function fromRow(row) {
  requireRule(row, 'profile_not_found');
  let fields;
  try { fields = JSON.parse(row.profile_json); } catch { throw new FlowError('invalid_stored_profile'); }
  checkFields(fields);
  requireRule(Number.isSafeInteger(row.state_version) && row.state_version >= 1, 'invalid_state_version');
  return checkProfile({ schemaVersion: 1, ...fields, userId: row.user_id, revision: row.revision,
    updatedAt: row.updated_at, signalsResetAt: row.signals_reset_at });
}

function fieldsOf(profile) {
  return { answers: profile.answers, interests: profile.interests,
    personalizationEnabled: profile.personalizationEnabled, elephantName: profile.elephantName };
}

/** Cloud D1 adapter for a trusted server. owner MUST come from verified identity.
 * This is not an authentication API: never expose owner/state arguments directly as HTTP input.
 * Task timestamps are current state produced by the trusted action handler, not browser timestamps.
 * Catalog/content ownership validation belongs to that handler; this adapter pins contentRef.
 * Plain D1 binding queries use the primary. Do not pass an unconstrained replica session.
 */
export function createD1Store(db, { now = () => new Date().toISOString() } = {}) {
  requireRule(db && typeof db.prepare === 'function' && typeof db.batch === 'function', 'd1_binding_required');
  const stmt = (sql, ...values) => db.prepare(sql).bind(...values);
  async function execute(fn) {
    try { return await fn(); }
    catch (error) { if (error instanceof FlowError) throw error; throw new FlowError('storage_unavailable'); }
  }
  function timestamp(previous = null) {
    const value = now();
    requireRule(typeof value === 'string' && Number.isFinite(Date.parse(value)), 'invalid_server_time');
    const millis = Math.max(Date.parse(value), previous ? Date.parse(previous) + 1 : -Infinity);
    return new Date(millis).toISOString();
  }
  const getRow = owner => execute(() => stmt(`SELECT ${PROFILE_COLUMNS} FROM memory_profiles WHERE user_id = ?`, owner).first());
  const newest = values => values.filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;

  return {
    async readSnapshot(owner) {
      checkOwner(owner);
      // D1 batch is a transaction: both reads observe the same committed state.
      const results = await execute(() => db.batch([
        stmt(`SELECT ${PROFILE_COLUMNS} FROM memory_profiles WHERE user_id = ?`, owner),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? ORDER BY action_key`, owner)
      ]));
      const row = results[0].results[0];
      const profile = fromRow(row);
      requireRule(profile.userId === owner, 'owner_mismatch');
      const taskStates = results[1].results.map(state => checkTask(state, owner));
      return { profile, taskStates, stateVersion: String(row.state_version) };
    },

    async readTasks(owner) {
      checkOwner(owner);
      const results = await execute(() => db.batch([
        stmt(`SELECT ${PROFILE_COLUMNS} FROM memory_profiles WHERE user_id = ?`, owner),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? ORDER BY action_key`, owner),
        stmt(OWNED_CONTENT_SQL, owner, owner),
        stmt('SELECT COUNT(*) AS total FROM memory_completion_awards WHERE user_id = ?', owner)
      ]));
      fromRow(results[0].results[0]);
      const content = new Map(results[2].results.map(row => [row.content_ref,
        checkContent(parsed(row.task_json, 'invalid_stored_content'), row.action_key)]));
      return {
        tasks: results[1].results.map(state => {
          checkTask(state, owner);
          requireRule(content.has(state.contentRef), 'task_content_unavailable');
          return { state, content: content.get(state.contentRef) };
        }),
        stateVersion: String(results[0].results[0].state_version),
        earnedCount: results[3].results[0].total
      };
    },

    async readLatestBatch(owner) {
      checkOwner(owner);
      const results = await execute(() => db.batch([
        stmt(`SELECT ${PROFILE_COLUMNS} FROM memory_profiles WHERE user_id = ?`, owner),
        stmt('SELECT request_id, request_hash, payload_json FROM memory_latest_batch WHERE user_id = ?', owner),
        stmt(OWNED_CONTENT_SQL, owner, owner)
      ]));
      fromRow(results[0].results[0]);
      const row = results[1].results[0];
      const stateVersion = String(results[0].results[0].state_version);
      if (!row) return { result: null, stateVersion };
      const payload = parsed(row.payload_json, 'invalid_stored_batch');
      const content = new Map(results[2].results.map(value => [value.content_ref,
        checkContent(parsed(value.task_json, 'invalid_stored_content'), value.action_key)]));
      const tasks = payload.contentRefs.map(ref => {
        requireRule(content.has(ref), 'task_content_unavailable');
        const task = structuredClone(content.get(ref));
        if (payload.result.trace?.concernPolicy !== 'category')
          task.concern_ids = task.concern_ids.filter(id => payload.request.concernIds.includes(id));
        return task;
      });
      const result = { ...payload.result, requestId: row.request_id, request: payload.request,
        batch: { ...payload.result.batch, tasks }, stateVersion, replayed: true };
      return { result, stateVersion, requestHash: row.request_hash };
    },

    async deliverBatch(owner, expectedStateVersion, { requestId, requestHash, request, result, contents, replace = null }) {
      checkOwner(owner);
      checkStateVersion(expectedStateVersion);
      checkRequestId(requestId);
      requireRule(typeof requestHash === 'string' && /^[a-f0-9]{64}$/.test(requestHash), 'invalid_request_hash');
      requireRule(Array.isArray(contents) && contents.length <= 3 &&
        new Set(contents.map(item => item.actionKey)).size === contents.length, 'invalid_shown_batch');
      requireRule(!replace || (contents.length === 1 && contents[0].private === true &&
        contents[0].actionKey === replace.actionKey && typeof replace.contentRef === 'string' &&
        contents[0].contentRef !== replace.contentRef), 'invalid_refinement');
      const profileRow = await getRow(owner);
      const profile = fromRow(profileRow);
      requireRule(String(profileRow.state_version) === expectedStateVersion, 'stale_state');
      const at = timestamp(newest([profile.updatedAt, profile.signalsResetAt]));
      for (const item of contents) {
        checkTask({ userId: owner, actionKey: item.actionKey, contentRef: item.contentRef,
          shownAt: at, savedAt: null, removedAt: null, completedAt: null, likedAt: null, feedbackCode: null, feedbackAt: null }, owner);
        checkContent(item.content, item.actionKey);
        requireRule(Boolean(item.private) === item.contentRef.startsWith('ai_'), 'invalid_content_scope');
        const existing = await execute(() => item.private
          ? stmt('SELECT action_key, task_json FROM memory_private_task_content WHERE user_id = ? AND content_ref = ?', owner, item.contentRef).first()
          : stmt('SELECT action_key, task_json FROM memory_task_content WHERE content_ref = ?', item.contentRef).first());
        requireRule(!existing || (existing.action_key === item.actionKey && existing.task_json === JSON.stringify(item.content)), 'immutable_content_ref');
      }
      // Store only the current small request and references. Text and steps live
      // once in the shared immutable content table; raw notes are never stored.
      requireRule(request && !Object.hasOwn(request, 'note'), 'invalid_stored_request');
      const payload = { request, contentRefs: contents.map(item => item.contentRef),
        result: { ...result, batch: { ...result.batch, tasks: [] } } };
      const commitToken = crypto.randomUUID();
      const guard = 'EXISTS (SELECT 1 FROM memory_latest_batch WHERE user_id = ? AND commit_token = ?)';
      const eligibility = replace
        ? `AND EXISTS (SELECT 1 FROM memory_task_states WHERE user_id = ? AND action_key = ? AND content_ref = ?
          AND saved_at IS NULL AND completed_at IS NULL AND removed_at IS NULL)
          AND NOT EXISTS (SELECT 1 FROM memory_completion_awards WHERE user_id = ? AND action_key = ?)`
        : contents.length ? `AND NOT EXISTS (SELECT 1 FROM memory_task_states WHERE user_id = ? AND action_key IN (${contents.map(() => '?').join(',')}))` : '';
      const eligibilityValues = replace ? [owner, replace.actionKey, replace.contentRef, owner, replace.actionKey]
        : contents.length ? [owner, ...contents.map(item => item.actionKey)] : [];
      const statements = [
        stmt(`UPDATE memory_profiles SET state_version = state_version + 1 WHERE user_id = ? AND state_version = ? ${eligibility} RETURNING state_version`,
          owner, Number(expectedStateVersion), ...eligibilityValues),
        stmt(`INSERT INTO memory_latest_batch (user_id, request_id, request_hash, commit_token, payload_json, created_at)
          SELECT ?, ?, ?, ?, ?, ? WHERE changes() > 0
          ON CONFLICT(user_id) DO UPDATE SET request_id = excluded.request_id, request_hash = excluded.request_hash,
            commit_token = excluded.commit_token, payload_json = excluded.payload_json, created_at = excluded.created_at`,
          owner, requestId, requestHash, commitToken, JSON.stringify(payload), at),
        ...contents.flatMap(item => [
          item.private ? stmt(`INSERT INTO memory_private_task_content (user_id, content_ref, action_key, task_json, created_at)
            SELECT ?, ?, ?, ?, ? WHERE ${guard}
            ON CONFLICT(user_id, content_ref) DO UPDATE SET task_json = CASE
              WHEN memory_private_task_content.action_key = excluded.action_key AND memory_private_task_content.task_json = excluded.task_json
              THEN memory_private_task_content.task_json ELSE NULL END`, owner, item.contentRef, item.actionKey, JSON.stringify(item.content), at, owner, commitToken)
          : stmt(`INSERT INTO memory_task_content (content_ref, action_key, task_json, created_at)
            SELECT ?, ?, ?, ? WHERE ${guard}
            ON CONFLICT(content_ref) DO UPDATE SET task_json = CASE
              WHEN memory_task_content.action_key = excluded.action_key AND memory_task_content.task_json = excluded.task_json
              THEN memory_task_content.task_json ELSE NULL END`, item.contentRef, item.actionKey, JSON.stringify(item.content), at, owner, commitToken),
          replace ? stmt(`UPDATE memory_task_states SET content_ref = ? WHERE user_id = ? AND action_key = ? AND content_ref = ? AND ${guard}`,
            item.contentRef, owner, replace.actionKey, replace.contentRef, owner, commitToken)
          : stmt(`INSERT INTO memory_task_states (user_id, action_key, content_ref, shown_at)
            SELECT ?, ?, ?, ? WHERE ${guard}`, owner, item.actionKey, item.contentRef, at, owner, commitToken)
        ])
      ];
      const results = await execute(() => db.batch(statements));
      requireRule(results[0].results[0], 'stale_state');
      return { stateVersion: String(results[0].results[0].state_version) };
    },

    async createProfile(owner, fields = {}) {
      checkOwner(owner);
      checkFields(fields);
      const input = structuredClone(fields);
      const profile = checkProfile({ schemaVersion: 1, userId: owner, revision: 1, updatedAt: timestamp(),
        answers: { ...emptyAnswers(), ...input.answers }, interests: Object.hasOwn(input, 'interests') ? input.interests : [],
        personalizationEnabled: Object.hasOwn(input, 'personalizationEnabled') ? input.personalizationEnabled : true,
        elephantName: input.elephantName ?? null, signalsResetAt: null });
      const row = await execute(() => stmt(`INSERT INTO memory_profiles
        (user_id, profile_json, revision, state_version, updated_at, signals_reset_at)
        VALUES (?, ?, 1, 1, ?, NULL) ON CONFLICT(user_id) DO NOTHING RETURNING ${PROFILE_COLUMNS}`,
      owner, JSON.stringify(fieldsOf(profile)), profile.updatedAt).first());
      requireRule(row, 'profile_exists');
      return fromRow(row);
    },

    async editProfile(owner, expectedRevision, changes) {
      checkOwner(owner);
      checkRevision(expectedRevision);
      checkFields(changes);
      const current = fromRow(await getRow(owner));
      requireRule(current.revision === expectedRevision, 'stale_profile');
      const input = structuredClone(changes);
      const updated = checkProfile({ ...current, ...input,
        answers: { ...current.answers, ...input.answers }, revision: expectedRevision + 1,
        updatedAt: timestamp(current.updatedAt) });
      const row = await execute(() => stmt(`UPDATE memory_profiles
        SET profile_json = ?, revision = revision + 1, state_version = state_version + 1, updated_at = ?
        WHERE user_id = ? AND revision = ? RETURNING ${PROFILE_COLUMNS}`,
      JSON.stringify(fieldsOf(updated)), updated.updatedAt, owner, expectedRevision).first());
      requireRule(row, 'stale_profile');
      return fromRow(row);
    },

    async saveTaskState(owner, state) {
      checkOwner(owner);
      checkTask(state, owner);
      const s = structuredClone(state);
      // The first shownAt and contentRef are immutable. Identical writes are no-ops.
      // changes() refers to the immediately preceding upsert in this transaction.
      const results = await execute(() => db.batch([
        stmt(`INSERT INTO memory_task_states
          (user_id, action_key, content_ref, shown_at, saved_at, removed_at, completed_at, liked_at, feedback_code, feedback_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM memory_profiles WHERE user_id = ?)
          ON CONFLICT(user_id, action_key) DO UPDATE SET
            saved_at = excluded.saved_at, removed_at = excluded.removed_at,
            completed_at = excluded.completed_at, liked_at = excluded.liked_at,
            feedback_code = excluded.feedback_code, feedback_at = excluded.feedback_at
          WHERE memory_task_states.content_ref = excluded.content_ref AND (
            memory_task_states.saved_at IS NOT excluded.saved_at OR memory_task_states.removed_at IS NOT excluded.removed_at OR
            memory_task_states.completed_at IS NOT excluded.completed_at OR memory_task_states.liked_at IS NOT excluded.liked_at OR
            memory_task_states.feedback_code IS NOT excluded.feedback_code OR memory_task_states.feedback_at IS NOT excluded.feedback_at
          )`, owner, s.actionKey, s.contentRef, s.shownAt, s.savedAt, s.removedAt, s.completedAt, s.likedAt, s.feedbackCode, s.feedbackAt, owner),
        stmt('UPDATE memory_profiles SET state_version = state_version + 1 WHERE user_id = ? AND changes() > 0', owner),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? AND action_key = ?`, owner, s.actionKey)
      ]));
      const persisted = results[2].results[0];
      requireRule(persisted, 'profile_not_found');
      requireRule(persisted.contentRef === s.contentRef, 'immutable_content_ref');
      return checkTask(persisted, owner);
    },

    async applyTaskAction(owner, expectedStateVersion, actionKey, event) {
      checkOwner(owner);
      checkStateVersion(expectedStateVersion);
      checkEvent(event);
      requireRule(typeof actionKey === 'string' && /^[a-z0-9][a-z0-9_-]{0,99}$/.test(actionKey), 'invalid_action_key');
      const currentRows = await execute(() => db.batch([
        stmt(`SELECT ${PROFILE_COLUMNS} FROM memory_profiles WHERE user_id = ?`, owner),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? AND action_key = ?`, owner, actionKey)
      ]));
      const profileRow = currentRows[0].results[0];
      const profile = fromRow(profileRow);
      requireRule(String(profileRow.state_version) === expectedStateVersion, 'stale_state');
      const current = currentRows[1].results[0];
      requireRule(current, 'task_not_found');
      checkTask(current, owner);
      if (event.type === 'complete') requireRule(current.savedAt || current.completedAt, 'task_not_saved');
      if (event.type === 'undo_complete') requireRule(current.savedAt, 'task_not_saved');
      const at = timestamp(newest([profile.updatedAt, profile.signalsResetAt,
        current.shownAt, current.savedAt, current.removedAt, current.completedAt, current.likedAt, current.feedbackAt]));
      const next = { ...current };
      switch (event.type) {
        case 'save':
          if (!next.savedAt || next.removedAt) { next.savedAt = at; next.removedAt = null; }
          break;
        case 'remove':
          if (next.savedAt || !next.removedAt) { next.savedAt = null; next.removedAt = at; }
          break;
        case 'complete': if (!next.completedAt) next.completedAt = at; break;
        case 'undo_complete': next.completedAt = null; break;
        case 'like':
          if (!next.likedAt) next.likedAt = at;
          next.feedbackCode = null; next.feedbackAt = null;
          break;
        case 'unlike': next.likedAt = null; break;
        case 'feedback':
          if (next.feedbackCode !== event.code) { next.feedbackCode = event.code; next.feedbackAt = event.code === null ? null : at; }
          if (event.code && event.code !== 'helpful') next.likedAt = null;
          break;
      }
      checkTask(next, owner);
      const changed = JSON.stringify(next) !== JSON.stringify(current);
      const results = await execute(() => db.batch([
        stmt(`UPDATE memory_profiles SET state_version = state_version + ?
          WHERE user_id = ? AND state_version = ?
          AND EXISTS (SELECT 1 FROM memory_task_states WHERE user_id = ? AND action_key = ?)
          RETURNING state_version`, changed ? 1 : 0, owner, Number(expectedStateVersion), owner, actionKey),
        stmt(`UPDATE memory_task_states SET saved_at = ?, removed_at = ?, completed_at = ?,
          liked_at = ?, feedback_code = ?, feedback_at = ?
          WHERE user_id = ? AND action_key = ? AND changes() > 0 AND ? = 1`,
        next.savedAt, next.removedAt, next.completedAt, next.likedAt, next.feedbackCode, next.feedbackAt,
        owner, actionKey, changed ? 1 : 0),
        stmt(`INSERT INTO memory_completion_awards (user_id, action_key, awarded_at)
          SELECT ?, ?, ? WHERE changes() > 0 AND ? = 1
          ON CONFLICT(user_id, action_key) DO NOTHING RETURNING action_key`, owner, actionKey, at, event.type === 'complete' ? 1 : 0),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? AND action_key = ?`, owner, actionKey),
        stmt('SELECT COUNT(*) AS total FROM memory_completion_awards WHERE user_id = ?', owner)
      ]));
      requireRule(results[0].results[0], 'stale_state');
      return { task: checkTask(results[3].results[0], owner), stateVersion: String(results[0].results[0].state_version), changed,
        earnedCount: results[4].results[0].total, awardEarned: results[2].results.length > 0 };
    },

    async markShownBatch(owner, expectedStateVersion, items) {
      checkOwner(owner);
      checkStateVersion(expectedStateVersion);
      requireRule(Array.isArray(items) && items.length >= 1 && items.length <= 3, 'invalid_shown_batch');
      requireRule(items.every(item => item && typeof item === 'object' && !Array.isArray(item) &&
        Object.keys(item).length === 2 && Object.hasOwn(item, 'actionKey') && Object.hasOwn(item, 'contentRef')), 'invalid_shown_batch');
      requireRule(new Set(items.map(item => item.actionKey)).size === items.length, 'duplicate_action');
      const profileRow = await getRow(owner);
      const profile = fromRow(profileRow);
      requireRule(String(profileRow.state_version) === expectedStateVersion, 'stale_state');
      const at = timestamp(newest([profile.updatedAt, profile.signalsResetAt]));
      const states = items.map(item => checkTask({ userId: owner, actionKey: item.actionKey, contentRef: item.contentRef,
        shownAt: at, savedAt: null, removedAt: null, completedAt: null, likedAt: null, feedbackCode: null, feedbackAt: null }, owner));
      const placeholders = states.map(() => '?').join(', ');
      const keys = states.map(state => state.actionKey);
      const results = await execute(() => db.batch([
        stmt(`UPDATE memory_profiles SET state_version = state_version + 1
          WHERE user_id = ? AND state_version = ? AND NOT EXISTS
          (SELECT 1 FROM memory_task_states WHERE user_id = ? AND action_key IN (${placeholders}))
          RETURNING state_version`, owner, Number(expectedStateVersion), owner, ...keys),
        ...states.map(state => stmt(`INSERT INTO memory_task_states
          (user_id, action_key, content_ref, shown_at) SELECT ?, ?, ?, ? WHERE changes() > 0`,
        owner, state.actionKey, state.contentRef, state.shownAt)),
        stmt(`SELECT ${TASK_COLUMNS} FROM memory_task_states WHERE user_id = ? AND action_key IN (${placeholders}) ORDER BY action_key`, owner, ...keys)
      ]));
      if (!results[0].results[0]) {
        const existing = results.at(-1).results;
        requireRule(existing.length === 0, 'task_already_shown');
        throw new FlowError('stale_state');
      }
      return { taskStates: results.at(-1).results.map(state => checkTask(state, owner)),
        stateVersion: String(results[0].results[0].state_version) };
    },

    async resetPreferences(owner, expectedRevision) {
      checkOwner(owner);
      checkRevision(expectedRevision);
      const currentRow = await getRow(owner);
      const current = fromRow(currentRow);
      requireRule(current.revision === expectedRevision, 'stale_profile');
      // Keep saved tasks, but ensure every existing signal is before the cutoff.
      // julianday compares valid ISO timestamps correctly even with differing offsets.
      const latest = await execute(() => stmt(`SELECT MAX(MAX(julianday(shown_at),
        COALESCE(julianday(saved_at), 0), COALESCE(julianday(removed_at), 0),
        COALESCE(julianday(completed_at), 0), COALESCE(julianday(liked_at), 0),
        COALESCE(julianday(feedback_at), 0))) AS latest_task_time
        FROM memory_task_states WHERE user_id = ?`, owner).first());
      const latestTaskAt = latest?.latest_task_time === null || latest?.latest_task_time === undefined ? null :
        new Date(Math.round((latest.latest_task_time - 2440587.5) * 86400000)).toISOString();
      const at = timestamp(newest([current.updatedAt, current.signalsResetAt, latestTaskAt]));
      const results = await execute(() => db.batch([
        stmt(`UPDATE memory_profiles SET revision = revision + 1, state_version = state_version + 1,
          updated_at = ?, signals_reset_at = ? WHERE user_id = ? AND revision = ? AND state_version = ? RETURNING ${PROFILE_COLUMNS}`,
        at, at, owner, expectedRevision, currentRow.state_version),
        stmt(`UPDATE memory_task_states SET liked_at = NULL, feedback_code = NULL, feedback_at = NULL
          WHERE user_id = ? AND changes() > 0`, owner)
      ]));
      // If CAS failed, changes() was zero and task state was left untouched too.
      const row = results[0].results[0];
      requireRule(row, 'stale_profile');
      return fromRow(row);
    }
  };
}
