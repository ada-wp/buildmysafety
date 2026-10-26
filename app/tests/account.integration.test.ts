import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createSafetyClient, SafetyApiError } from '../src/cloud-api.ts';
import { emptyDraft } from '../src/profile-draft.ts';
const { createAppWorker } = await import(new URL('../worker.mjs', import.meta.url).href);
const { FlowError } = await import(new URL('../../personalization/contracts.mjs', import.meta.url).href);
const { deleteClerkUser, verifyClerkUser } = await import(new URL('../../personalization/account.mjs', import.meta.url).href);
const origin = 'https://account.test.invalid';
type Statement = { sql: string; values: SQLInputValue[]; bind: (...v: SQLInputValue[]) => Statement;
  first: () => Promise<Record<string, unknown> | null> };

function setup(t: TestContext) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys = ON');
  const migrations = new URL('../../personalization/migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'));
  t.after(() => sql.close());
  let failAt = -1; let checkOkay = true; let deleteOkay = true; let calls = 0; let failReceipt = false;
  const db = {
    prepare(text: string) {
      const make = (values: SQLInputValue[]): Statement => ({ sql: text, values, bind: (...v) => make(v),
        async first() { return sql.prepare(text).get(...values) || null; } });
      return make([]);
    },
    async batch(statements: Statement[]) {
      sql.exec('BEGIN');
      try {
        const result = statements.map((s, i) => {
          if (i === failAt) { failAt = -1; throw new Error('simulated storage failure'); }
          return { success: true, results: sql.prepare(s.sql).all(...s.values) };
        });
        sql.exec('COMMIT'); return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    }
  };
  const env: { MEMORY_DB: typeof db; CLERK_SECRET_KEY?: string } = { MEMORY_DB: db, CLERK_SECRET_KEY: 'sk_test_fixture' };
  const worker = createAppWorker({ verifyIdentity: async (r: Request) => {
    const token = r.headers.get('Authorization');
    if (!['Bearer alice', 'Bearer bob'].includes(token || '')) throw new FlowError('authentication_required');
    return token === 'Bearer alice' ? 'user_alice' : 'user_bob';
  }, checkIdentity: async () => checkOkay, deleteIdentity: async () => {
    calls++; if (failReceipt) { failReceipt = false; failAt = 0; } return deleteOkay;
  } });
  const client = (who = 'alice') => createSafetyClient({ baseUrl: origin, getAccessToken: async () => who,
    fetchImpl: (input, init) => worker.fetch(new Request(input, { ...init, headers: { ...init?.headers, Origin: origin } }), env) });
  const send = (path: string, method = 'GET', body?: unknown, who = 'alice', extra = {}) => worker.fetch(new Request(origin + path,
    { method, headers: { Authorization: `Bearer ${who}`, Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra },
      ...(body ? { body: JSON.stringify(body) } : {}) }), env);
  return { sql, env, client, send, calls: () => calls, fail: (i: number) => { failAt = i; },
    check: (v: boolean) => { checkOkay = v; }, remove: (v: boolean) => { deleteOkay = v; },
    failReceipt: () => { failReceipt = true; } };
}
async function seed(s: ReturnType<typeof setup>, who = 'alice') {
  const client = s.client(who); await client.createMemory(emptyDraft());
  const owner = `user_${who}`;
  s.sql.prepare(`INSERT INTO onboarding_progress VALUES (?, 1, ?, 'question/why', NULL, '2026-10-12')`).run(owner, JSON.stringify(emptyDraft()));
  s.sql.prepare(`INSERT INTO memory_task_states(user_id, action_key, content_ref, shown_at, saved_at, completed_at, liked_at, feedback_code, feedback_at)
    VALUES (?, 'one', 'shared-one', '2026-10-12', '2026-10-12', '2026-10-12', NULL, 'helpful', '2026-10-12')`).run(owner);
  s.sql.prepare(`INSERT OR IGNORE INTO memory_task_content VALUES ('shared-one', 'one', '{"title":"Shared"}', '2026-10-12')`).run();
  s.sql.prepare(`INSERT INTO memory_private_task_content VALUES (?, 'old-private', 'one', ?, '2026-10-12')`).run(owner, JSON.stringify({ title: `${who} private` }));
  s.sql.prepare(`INSERT INTO memory_completion_awards VALUES (?, 'one', '2026-10-12')`).run(owner);
  s.sql.prepare(`INSERT INTO memory_latest_batch VALUES (?, 'request1', 'hash', 'secret-commit-token', '{"batch":[]}', '2026-10-12')`).run(owner);
  s.sql.prepare(`INSERT INTO memory_ai_attempts VALUES (?, 'request1', ?, '2026-10-12', 1, 2, 1, 'adapted', 25, 20)`).run(owner, `${who}-internal-lease-token`);
  s.sql.prepare(`INSERT INTO memory_category_progress VALUES (?, 'sick_care', 1, '[1]', ?, '2026-10-14')`).run(owner,
    JSON.stringify({ feeling: who === 'alice' ? 'ready' : 'unsure', milestone: 1, answeredAt: '2026-10-14T12:00:00.000Z' }));
}

test('export is owner scoped, consistent and complete for all app tables, without internal tokens', async t => {
  const s = setup(t); await seed(s); await seed(s, 'bob');
  const output = await s.client().exportAccount();
  assert.equal(output.accountId, 'user_alice'); assert.equal(output.tasks.length, 1);
  assert.equal(output.privateTaskContent[0].task && (output.privateTaskContent[0].task as {title:string}).title, 'alice private');
  assert.equal(output.awards.length, 1); assert.equal(output.aiUsage.length, 1); assert.ok(output.onboarding); assert.ok(output.latestBatch);
  assert.equal(output.sharedTaskContent.length, 1);
  assert.equal(output.categoryProgress.length, 1);
  assert.deepEqual(output.categoryProgress[0].check_in, { feeling: 'ready', milestone: 1, answeredAt: '2026-10-14T12:00:00.000Z' });
  assert.doesNotMatch(JSON.stringify(output), /user_bob|bob private|secret-commit-token|internal-lease-token|sk_test/);
  assert.equal((await s.send('/api/account/export')).headers.get('Cache-Control'), 'no-store');
  assert.equal(s.calls(), 0);
});
test('empty accounts export without requiring a finished profile or creating data', async t => {
  const s = setup(t); const data = await s.client().exportAccount();
  assert.equal(data.profile, null); assert.equal(data.onboarding, null); assert.deepEqual(data.tasks, []);
});
test('auth, exact routes, methods, origin, query and confirmation cannot select another owner', async t => {
  const s = setup(t); await seed(s);
  for (const path of ['/api/account', '/api/account/export']) assert.equal((await s.send(path, 'GET', undefined, 'unknown')).status, 401);
  assert.equal((await s.send('/api/account/delete')).status, 405);
  assert.equal((await s.send('/api/account/export?user_id=user_bob')).status, 400);
  assert.equal((await s.send('/api/account/delete', 'POST', { confirmation: 'DELETE' }, 'alice', { Origin: 'https://evil.invalid' })).status, 403);
  for (const body of [{}, { confirmation: 'yes' }, { confirmation: 'DELETE', userId: 'user_bob' }])
    assert.equal((await s.send('/api/account/delete', 'POST', body)).status, 400);
  assert.equal(s.calls(), 0); assert.ok((await s.client().exportAccount()).profile);
});
test('missing/wrong provider connection never starts deletion', async t => {
  const s = setup(t); await seed(s); delete s.env.CLERK_SECRET_KEY;
  assert.equal((await s.client().getAccount()).deletionAvailable, false);
  assert.equal((await s.send('/api/account/delete', 'POST', { confirmation: 'DELETE' })).status, 503);
  s.env.CLERK_SECRET_KEY = 'sk_test_fixture'; s.check(false);
  assert.equal((await s.send('/api/account/delete', 'POST', { confirmation: 'DELETE' })).status, 503);
  assert.ok((await s.client().exportAccount()).profile); assert.equal(s.calls(), 0);
});
test('deletion removes all app records atomically and keeps the other user and shared library', async t => {
  const s = setup(t); await seed(s); await seed(s, 'bob');
  const beforeBob = await s.client('bob').exportAccount();
  assert.equal((await s.client().deleteAccount('DELETE')).deletion.status, 'deleted');
  for (const table of ['memory_profiles', 'onboarding_progress', 'memory_task_states', 'memory_private_task_content',
    'memory_completion_awards', 'memory_latest_batch', 'memory_ai_attempts', 'memory_category_progress'])
    assert.equal(s.sql.prepare(`SELECT COUNT(*) n FROM ${table} WHERE user_id = ?`).get('user_alice')?.n, 0, table);
  const afterBob = await s.client('bob').exportAccount();
  assert.deepEqual({ ...afterBob, exportedAt: '' }, { ...beforeBob, exportedAt: '' });
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_task_content').get()?.n, 1);
  assert.equal((await s.client().deleteAccount('DELETE')).deletion.status, 'deleted'); assert.equal(s.calls(), 1);
  for (const route of ['/api/memory', '/api/onboarding', '/api/catalog', '/api/tasks', '/api/recommendations/latest', '/api/account/export', '/api/progress'])
    assert.equal((await s.send(route)).status, 410, route);
  assert.equal((await s.client().getAccount()).deletion?.status, 'deleted');
  assert.throws(() => s.sql.prepare(`INSERT INTO memory_profiles VALUES ('user_alice','{}',1,1,'today',NULL)`).run(), /account_deleted/);
  assert.throws(() => s.sql.prepare(`INSERT INTO onboarding_progress VALUES ('user_alice',1,NULL,'welcome',NULL,'today')`).run(), /account_deleted/);
});
test('provider failure is pending, blocks resurrection, and a retry finishes without erasing another account', async t => {
  const s = setup(t); await seed(s); s.remove(false);
  assert.equal((await s.client().deleteAccount('DELETE')).deletion.status, 'pending');
  assert.equal((await s.send('/api/memory')).status, 409);
  assert.equal((await s.send('/api/progress')).status, 409);
  assert.equal((await s.client().getAccount()).deletion?.status, 'pending');
  s.remove(true); assert.equal((await s.client().deleteAccount('DELETE')).deletion.status, 'deleted');
  assert.equal(s.calls(), 2);
});
test('storage failure rolls back receipt and erasure before any provider deletion', async t => {
  const s = setup(t); await seed(s); s.fail(2);
  await assert.rejects(s.client().deleteAccount('DELETE'), (e: unknown) => e instanceof SafetyApiError && e.code === 'storage_unavailable');
  assert.equal((await s.client().getAccount()).deletion, null); assert.ok((await s.client().exportAccount()).profile);
  assert.equal(s.calls(), 0);
});
test('lost receipt write after provider deletion keeps data erased and can be reconciled', async t => {
  const s = setup(t); await seed(s); s.failReceipt();
  await assert.rejects(s.client().deleteAccount('DELETE'), (e: unknown) => e instanceof SafetyApiError && e.code === 'storage_unavailable');
  assert.equal(s.calls(), 1); assert.equal((await s.client().getAccount()).deletion?.status, 'pending');
  assert.equal(s.sql.prepare('SELECT COUNT(*) n FROM memory_profiles').get()?.n, 0);
  assert.equal((await s.send('/api/tasks')).status, 409);
  assert.equal((await s.client().deleteAccount('DELETE')).deletion.status, 'deleted');
});
test('Clerk transport pins destination/owner, rejects redirects and wrong bodies, accepts confirmed deletion/absence', async () => {
  const env = { CLERK_SECRET_KEY: 'sk_test_fixture' }; let observed: RequestInit | undefined;
  assert.equal(await deleteClerkUser('user_alice', env, async (url: string, init: RequestInit) => {
    assert.equal(url, 'https://api.clerk.com/v1/users/user_alice'); observed = init;
    return Response.json({ id: 'user_alice', object: 'user', deleted: true });
  }), true);
  assert.equal(observed?.method, 'DELETE'); assert.equal(observed?.redirect, 'manual'); assert.ok(observed?.signal);
  for (const response of [Response.json({ id: 'user_bob', object: 'user', deleted: true }), new Response('', { status: 302 }),
    new Response('missing', { status: 404 }), Response.json({ errors: [{ code: 'wrong_instance' }] }, { status: 404 }), new Response('', { status: 500 })])
    assert.equal(await deleteClerkUser('user_alice', env, async () => response), false);
  assert.equal(await deleteClerkUser('user_alice', env, async () => Response.json({ errors: [{ code: 'resource_not_found' }] }, { status: 404 })), true);
  assert.equal(await verifyClerkUser('user_alice', env, async () => Response.json({ id: 'user_alice', object: 'user' })), true);
  assert.equal(await verifyClerkUser('user_alice', env, async () => Response.json({ id: 'user_bob', object: 'user' })), false);
  assert.equal(await deleteClerkUser('user_alice', env, async () => { throw new Error('private credential'); }), false);
});
