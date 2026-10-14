import { validProfile, validCountry, requireRule, FlowError } from './contracts.mjs';
import { readBody, safeError } from './http.mjs';

const checkpoints = new Set(['welcome', 'question/why', 'question/home', 'question/focus', 'question/difficulty',
  'question/feeling', 'pause', 'question/constraints', 'question/strengths', 'question/hope', 'question/style',
  'question/country', 'question/note', 'interests', 'recap', 'complete']);
const fields = ['answers', 'interests', 'personalizationEnabled', 'elephantName'];
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
const json = value => new Response(JSON.stringify(value), { headers });
const record = v => v && typeof v === 'object' && !Array.isArray(v);
const view = row => row ? { revision: row.revision, draft: row.draft_json ? JSON.parse(row.draft_json) : null,
  checkpoint: row.checkpoint, completedAt: row.completed_at, updatedAt: row.updated_at } : null;

/** Isolated cloud checkpoint. Completion and canonical profile promotion are one D1 transaction. */
export function createOnboardingHandler({ verifyIdentity }) {
  return async (request, env) => {
    try {
      const url = new URL(request.url);
      requireRule(!url.search, 'invalid_request');
      requireRule(!request.headers.get('Origin') || request.headers.get('Origin') === url.origin, 'origin_not_allowed');
      const owner = await verifyIdentity(request, env);
      requireRule(typeof owner === 'string' && owner.trim() === owner && owner.length > 0 && owner.length <= 128, 'authentication_invalid');
      const db = env.MEMORY_DB;
      requireRule(db && typeof db.batch === 'function', 'd1_binding_required');
      const stmt = (sql, ...values) => db.prepare(sql).bind(...values);
      const rows = await db.batch([
        stmt('SELECT * FROM onboarding_progress WHERE user_id = ?', owner),
        stmt('SELECT revision FROM memory_profiles WHERE user_id = ?', owner)
      ]);
      const current = rows[0].results[0];
      const profileRevision = rows[1].results[0]?.revision ?? 0;
      if (request.method === 'GET' && url.pathname === '/api/onboarding') {
        // Before checkpoints existed, profiles were saved only at final Continue.
        return json({ progress: view(current), legacyComplete: !current && profileRevision > 0 });
      }
      requireRule(request.method === 'POST' && ['/api/onboarding', '/api/onboarding/complete'].includes(url.pathname), 'method_not_allowed');
      const body = await readBody(request);
      const complete = url.pathname.endsWith('/complete');
      requireRule(record(body) && Object.keys(body).every(k => ['expectedRevision', 'expectedProfileRevision', 'draft', 'checkpoint'].includes(k)), 'invalid_body');
      requireRule(Number.isSafeInteger(body.expectedRevision) && body.expectedRevision >= 0, 'invalid_revision');
      requireRule(body.expectedRevision === (current?.revision ?? 0), 'stale_profile');
      requireRule(record(body.draft) && Object.keys(body.draft).length === fields.length && fields.every(k => Object.hasOwn(body.draft, k)), 'invalid_profile_changes');
      const now = new Date().toISOString();
      const candidate = { ...body.draft, schemaVersion: 1, userId: owner, revision: 1, updatedAt: now, signalsResetAt: null };
      requireRule(validProfile(candidate) && validCountry(candidate.answers.country), 'invalid_profile');
      requireRule(typeof body.checkpoint === 'string' && checkpoints.has(body.checkpoint) && (complete ? body.checkpoint === 'complete' : body.checkpoint !== 'complete'), 'invalid_request');
      if (complete) requireRule(Number.isSafeInteger(body.expectedProfileRevision) && body.expectedProfileRevision === profileRevision, 'stale_profile');
      const conditions = complete ? ' AND COALESCE((SELECT revision FROM memory_profiles WHERE user_id = ?), 0) = ?' : '';
      const values = [owner, JSON.stringify(body.draft), body.checkpoint, complete ? now : null, now,
        owner, body.expectedRevision, ...(complete ? [owner, profileRevision] : [])];
      const statements = [stmt(`INSERT INTO onboarding_progress (user_id, revision, draft_json, checkpoint, completed_at, updated_at)
        SELECT ?, 1, ?, ?, ?, ? WHERE COALESCE((SELECT revision FROM onboarding_progress WHERE user_id = ?), 0) = ?${conditions}
        ON CONFLICT(user_id) DO UPDATE SET revision = revision + 1, draft_json = excluded.draft_json,
        checkpoint = excluded.checkpoint, completed_at = excluded.completed_at, updated_at = excluded.updated_at
        RETURNING *`, ...values)];
      if (complete) {
        statements.push(stmt(`INSERT INTO memory_profiles (user_id, profile_json, revision, state_version, updated_at, signals_reset_at)
          SELECT ?, ?, 1, 1, ?, NULL WHERE changes() > 0
          ON CONFLICT(user_id) DO UPDATE SET profile_json = excluded.profile_json, revision = revision + 1,
          state_version = state_version + 1, updated_at = excluded.updated_at`, owner, JSON.stringify(body.draft), now));
        // The final profile is canonical; don't keep a duplicate completed draft.
        statements.push(stmt('UPDATE onboarding_progress SET draft_json = NULL WHERE user_id = ? AND changes() > 0', owner));
      }
      const result = await db.batch(statements);
      requireRule(result[0].results[0], 'stale_profile');
      return json({ progress: view({ ...result[0].results[0], ...(complete ? { draft_json: null } : {}) }), legacyComplete: false });
    } catch (error) { return safeError(error instanceof FlowError ? error : new FlowError('storage_unavailable')); }
  };
}
