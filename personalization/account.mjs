import { FlowError, requireRule } from './contracts.mjs';
import { readBody, safeError } from './http.mjs';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
const validOwner = owner => requireRule(typeof owner === 'string' && /^user_[A-Za-z0-9_-]{1,123}$/.test(owner), 'authentication_invalid');
const configured = env => typeof env.CLERK_SECRET_KEY === 'string' && /^sk_(?:test|live)_[A-Za-z0-9_-]+$/.test(env.CLERK_SECRET_KEY);
const receipt = row => row ? { status: row.status, requestedAt: row.requested_at, completedAt: row.completed_at } : null;

export async function deletionRecord(db, owner) {
  requireRule(db && typeof db.batch === 'function', 'd1_binding_required');
  try { return await db.prepare('SELECT * FROM account_deletions WHERE user_id = ?').bind(owner).first(); }
  catch { throw new FlowError('storage_unavailable'); }
}
export async function assertAccountActive(db, owner) {
  const row = await deletionRecord(db, owner);
  requireRule(!row, row?.status === 'deleted' ? 'account_deleted' : 'account_deletion_pending');
}

// Fixed destination and server-verified owner. No SDK/admin secret reaches the browser.
export async function deleteClerkUser(owner, env, fetchImpl = (...args) => globalThis.fetch(...args)) {
  validOwner(owner); requireRule(configured(env), 'account_deletion_not_configured');
  try {
    const response = await fetchImpl(`https://api.clerk.com/v1/users/${encodeURIComponent(owner)}`, {
      method: 'DELETE', redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, Accept: 'application/json' }
    });
    // A generic 404/HTML page is not evidence that this account was deleted.
    if (response.redirected || ![200, 404].includes(response.status)) return false;
    const text = await response.text(); if (text.length > 16384) return false;
    const body = JSON.parse(text);
    return response.status === 200 ? body.id === owner && body.deleted === true && body.object === 'user'
      : Array.isArray(body.errors) && body.errors.some(error => error.code === 'resource_not_found');
  } catch { return false; }
}

export async function verifyClerkUser(owner, env, fetchImpl = (...args) => globalThis.fetch(...args)) {
  validOwner(owner); requireRule(configured(env), 'account_deletion_not_configured');
  try {
    const response = await fetchImpl(`https://api.clerk.com/v1/users/${encodeURIComponent(owner)}`, {
      method: 'GET', redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, Accept: 'application/json' }
    });
    if (response.status !== 200 || response.redirected) return false;
    const text = await response.text(); if (text.length > 32768) return false;
    const body = JSON.parse(text); return body.id === owner && body.object === 'user';
  } catch { return false; }
}

export function createAccountHandler({ verifyIdentity, deleteIdentity = deleteClerkUser, checkIdentity = verifyClerkUser }) {
  return async (request, env) => {
    try {
      const url = new URL(request.url);
      requireRule(!url.search, 'invalid_request');
      requireRule(!request.headers.get('Origin') || request.headers.get('Origin') === url.origin, 'origin_not_allowed');
      const owner = await verifyIdentity(request, env); validOwner(owner);
      const db = env.MEMORY_DB;
      requireRule(db && typeof db.batch === 'function', 'd1_binding_required');
      const stmt = (sql, ...args) => db.prepare(sql).bind(...args);
      let deletion = await deletionRecord(db, owner);
      if (request.method === 'GET' && url.pathname === '/api/account') {
        return json({ deletion: receipt(deletion), deletionAvailable: configured(env) });
      }
      if (request.method === 'GET' && url.pathname === '/api/account/export') {
        requireRule(!deletion, 'account_deleted');
        // One consistent snapshot, including old private revisions and removed tasks.
        // Shared task text is included only if it is referenced by this account.
        const results = await db.batch([
          stmt('SELECT * FROM memory_profiles WHERE user_id = ?', owner),
          stmt('SELECT * FROM onboarding_progress WHERE user_id = ?', owner),
          stmt('SELECT * FROM memory_task_states WHERE user_id = ? ORDER BY action_key', owner),
          stmt(`SELECT c.* FROM memory_task_content c WHERE EXISTS
            (SELECT 1 FROM memory_task_states t WHERE t.user_id = ? AND t.content_ref = c.content_ref AND t.action_key = c.action_key)`, owner),
          stmt('SELECT * FROM memory_private_task_content WHERE user_id = ? ORDER BY content_ref', owner),
          stmt('SELECT * FROM memory_completion_awards WHERE user_id = ? ORDER BY action_key', owner),
          stmt('SELECT request_id, payload_json, created_at FROM memory_latest_batch WHERE user_id = ?', owner),
          stmt(`SELECT request_id, day, started_at, finished, outcome, input_tokens, output_tokens
            FROM memory_ai_attempts WHERE user_id = ? ORDER BY started_at`, owner),
          stmt('SELECT * FROM account_deletions WHERE user_id = ?', owner),
          stmt('SELECT * FROM memory_category_progress WHERE user_id = ? ORDER BY topic_id', owner)
        ]);
        requireRule(!results[8].results.length, 'account_deleted');
        const unpack = row => Object.fromEntries(Object.entries(row).map(([key, value]) =>
          key.endsWith('_json') ? [key.slice(0, -5), value === null ? null : JSON.parse(value)] : [key, value]));
        return json({ schemaVersion: 1, exportedAt: new Date().toISOString(), accountId: owner,
          profile: results[0].results[0] ? unpack(results[0].results[0]) : null,
          onboarding: results[1].results[0] ? unpack(results[1].results[0]) : null,
          tasks: results[2].results, sharedTaskContent: results[3].results.map(unpack),
          privateTaskContent: results[4].results.map(unpack), awards: results[5].results,
          latestBatch: results[6].results[0] ? unpack(results[6].results[0]) : null,
          aiUsage: results[7].results, categoryProgress: results[9].results.map(unpack),
          scope: 'My Safety app data. Clerk holds email/sign-in records separately. No credentials, login tokens or temporary typed notes are included.' });
      }
      requireRule(request.method === 'POST' && url.pathname === '/api/account/delete', 'method_not_allowed');
      const body = await readBody(request);
      requireRule(body && !Array.isArray(body) && Object.keys(body).length === 1 && body.confirmation === 'DELETE', 'invalid_confirmation');
      if (deletion?.status === 'deleted') return json({ deletion: receipt(deletion) });
      // Missing setup never erases a working account.
      requireRule(configured(env), 'account_deletion_not_configured');
      if (!deletion) {
        // Check that the configured secret belongs to this user's Clerk instance
        // before touching data. A wrong key/instance must not look like deletion.
        requireRule(await checkIdentity(owner, env), 'account_identity_unavailable');
        const at = new Date().toISOString();
        await db.batch([
          stmt(`INSERT OR IGNORE INTO account_deletions (user_id, requested_at, status) VALUES (?, ?, 'pending')`, owner, at),
          stmt('DELETE FROM onboarding_progress WHERE user_id = ?', owner),
          // Cascades to task states, awards, private content, batches and AI usage.
          stmt('DELETE FROM memory_profiles WHERE user_id = ?', owner)
        ]);
        deletion = await deletionRecord(db, owner);
      }
      if (await deleteIdentity(owner, env)) {
        await db.batch([stmt(`UPDATE account_deletions SET status = 'deleted', completed_at = COALESCE(completed_at, ?) WHERE user_id = ?`, new Date().toISOString(), owner)]);
        deletion = await deletionRecord(db, owner);
      }
      // Retry is idempotent, including a provider success followed by a lost response.
      return json({ deletion: receipt(deletion) }, deletion.status === 'deleted' ? 200 : 202);
    } catch (error) { return safeError(error instanceof FlowError ? error : new FlowError('storage_unavailable')); }
  };
}
