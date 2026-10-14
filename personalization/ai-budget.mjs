import { requireRule, FlowError } from './contracts.mjs';

export const AI_LIMITS = Object.freeze({ perUserDaily: 3, globalDaily: 30, leaseMs: 90000, retentionDays: 7 });
export const PREVIEW_AI_LIMITS = Object.freeze({ ...AI_LIMITS, perUserDaily: 10, globalDaily: 600 });

/** D1 serializes this conditional insert. No isolate-local counters or hidden retries. */
export function createAiBudget(db, { now = () => Date.now(), limits = AI_LIMITS } = {}) {
  requireRule(limits && typeof limits === 'object' && !Array.isArray(limits) &&
    Object.keys(AI_LIMITS).every(key => Number.isSafeInteger(limits[key]) && limits[key] > 0) &&
    limits.globalDaily >= limits.perUserDaily, 'invalid_ai_limits');
  const policy = Object.freeze({ ...limits });
  const stmt = (sql, ...values) => db.prepare(sql).bind(...values);
  async function execute(fn) { try { return await fn(); } catch { throw new FlowError('storage_unavailable'); } }
  return {
    async reserve(owner, requestId, expectedStateVersion) {
      requireRule(typeof owner === 'string' && owner.length > 0, 'authentication_required');
      const at = now(); const day = new Date(at).toISOString().slice(0, 10); const token = crypto.randomUUID();
      const results = await execute(() => db.batch([
        stmt('DELETE FROM memory_ai_attempts WHERE started_at < ?', at - policy.retentionDays * 86400000),
        stmt(`INSERT INTO memory_ai_attempts(user_id, request_id, token, day, started_at, lease_until)
          SELECT ?, ?, ?, ?, ?, ? WHERE
          EXISTS (SELECT 1 FROM memory_profiles WHERE user_id = ? AND state_version = ?)
          AND (SELECT COUNT(*) FROM memory_ai_attempts WHERE day = ?) < ?
          AND (SELECT COUNT(*) FROM memory_ai_attempts WHERE day = ? AND user_id = ?) < ?
          AND NOT EXISTS (SELECT 1 FROM memory_ai_attempts WHERE user_id = ? AND finished = 0 AND lease_until > ?)
          ON CONFLICT(user_id, request_id) DO NOTHING RETURNING token`,
          owner, requestId, token, day, at, at + policy.leaseMs, owner, Number(expectedStateVersion),
          day, policy.globalDaily, day, owner, policy.perUserDaily, owner, at),
        stmt('SELECT state_version FROM memory_profiles WHERE user_id = ?', owner),
        stmt('SELECT request_id FROM memory_ai_attempts WHERE user_id = ? AND finished = 0 AND lease_until > ?', owner, at),
        stmt('SELECT request_id FROM memory_ai_attempts WHERE user_id = ? AND request_id = ?', owner, requestId),
        stmt('SELECT COUNT(*) AS user_attempts FROM memory_ai_attempts WHERE day = ? AND user_id = ?', day, owner)
      ]));
      requireRule(String(results[2].results[0]?.state_version) === expectedStateVersion, 'stale_state');
      if (results[1].results.length) return { token, reason: null };
      requireRule(results[3].results.length === 0, 'generation_in_progress');
      if (results[4].results.length) return { token: null, reason: 'already_attempted' };
      const scope = results[5].results[0].user_attempts >= policy.perUserDaily ? 'user' : 'shared';
      return { token: null, reason: 'limit_reached', quota: { scope,
        limit: scope === 'user' ? policy.perUserDaily : policy.globalDaily,
        resetsAt: new Date((Math.floor(at / 86400000) + 1) * 86400000).toISOString() } };
    },
    async finish(owner, token, outcome, metadata) {
      requireRule(/^[a-z_]{1,60}$/.test(outcome), 'invalid_ai_outcome');
      const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
      await execute(() => db.batch([stmt(`UPDATE memory_ai_attempts SET finished = 1, outcome = ?, input_tokens = ?, output_tokens = ?
        WHERE user_id = ? AND token = ? AND finished = 0`, outcome, count(metadata?.inputTokens), count(metadata?.outputTokens), owner, token)]));
    }
  };
}
