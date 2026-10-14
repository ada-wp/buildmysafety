// Bounded architecture check, not a hosted load test or a latency promise.
// Runs the actual app Worker against disposable SQLite with injected identities.
// No credentials, persistent data, Clerk requests or paid model calls are used.
// From app/: node scripts/check-pilot-scale-local.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { createAppWorker } from '../worker.mjs';

const USERS = 200;
const GROUP_SIZE = 20;
const ORIGIN = 'https://pilot-scale.invalid';
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON');
const migrations = new URL('../../personalization/migrations/', import.meta.url);
for (const file of readdirSync(migrations).filter(file => file.endsWith('.sql')).sort()) {
  sqlite.exec(readFileSync(new URL(file, migrations), 'utf8'));
}

let queries = 0;
let batches = 0;
const db = {
  prepare(sql) {
    const statement = values => ({ sql, values,
      bind: (...next) => statement(next),
      async first() {
        queries++;
        const row = sqlite.prepare(sql).get(...values);
        return row ? { ...row } : null;
      }
    });
    return statement([]);
  },
  async batch(statements) {
    batches++;
    sqlite.exec('BEGIN');
    try {
      const result = statements.map(statement => {
        queries++;
        return { success: true,
          results: sqlite.prepare(statement.sql).all(...statement.values).map(row => ({ ...row })) };
      });
      sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  }
};
const worker = createAppWorker({
  contentReviewHosts: ['pilot-scale.invalid'],
  verifyIdentity: async request => {
    const owner = request.headers.get('Authorization')?.slice(7);
    assert.match(owner, /^user_scale_[0-9]{4}$/);
    return owner;
  },
  generate: async () => { throw new Error('This check must never call a model'); }
});
const env = {
  MEMORY_DB: db,
  AI_ADAPTATION_ENABLED: 'false',
  get OPENAI_API_KEY() { throw new Error('This check must never read a credential'); }
};
const timings = new Map();
let largestResponseBytes = 0;

async function call(owner, path, method = 'GET', body) {
  const started = performance.now();
  const response = await worker.fetch(new Request(`${ORIGIN}${path}`, {
    method,
    headers: { Authorization: `Bearer ${owner}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  }), env);
  const text = await response.text();
  largestResponseBytes = Math.max(largestResponseBytes, Buffer.byteLength(text));
  const value = JSON.parse(text);
  assert.ok(response.ok, `${method} ${path}: ${JSON.stringify(value)}`);
  const key = `${method} ${path}`;
  if (!timings.has(key)) timings.set(key, []);
  timings.get(key).push(performance.now() - started);
  return value;
}

async function journey(index) {
  const owner = `user_scale_${String(index).padStart(4, '0')}`;
  await call(owner, '/api/memory', 'POST', {
    answers: { home: 'alone', country: 'US' }, interests: ['sick_care']
  });
  const ideas = await call(owner, '/api/recommendations', 'POST', {
    route: 'pool', request: { topicId: 'sick_care', concernIds: ['food', 'getting_care', 'daily_tasks'], country: 'US' },
    requestId: `scale_request_${String(index).padStart(4, '0')}`, expectedStateVersion: '1'
  });
  assert.equal(ideas.batch.tasks.length, 3);
  const actionKey = ideas.batch.tasks[0].action_key;
  let collection = await call(owner, '/api/tasks');
  assert.ok(collection.tasks.every(task => task.state.userId === owner));
  let stateVersion = collection.stateVersion;
  for (const type of ['save', 'complete', 'undo_complete', 'complete']) {
    const result = await call(owner, '/api/tasks/action', 'POST', { expectedStateVersion: stateVersion, actionKey, event: { type } });
    stateVersion = result.stateVersion;
    if (type !== 'save') assert.equal(result.earnedCount, 1);
  }
  collection = await call(owner, '/api/tasks');
  assert.equal(collection.earnedCount, 1);
  assert.ok(collection.tasks.find(task => task.state.actionKey === actionKey).state.completedAt);
  assert.ok(collection.tasks.every(task => task.state.userId === owner));
  const progress = await call(owner, '/api/progress');
  const category = progress.categories.find(item => item.topicId === 'sick_care');
  assert.equal(category.completedCount, 1);
  await call(owner, '/api/progress', 'PATCH', { topicId: 'sick_care', milestone: 1, feeling: 'ready',
    expectedRevision: category.revision, expectedStateVersion: progress.stateVersion });
  const returned = (await call(owner, '/api/progress')).categories.find(item => item.topicId === 'sick_care');
  assert.deepEqual(returned.seenMilestones, [1]);
  assert.equal(returned.latestCheckIn.feeling, 'ready');
}

try {
  const started = performance.now();
  for (let offset = 0; offset < USERS; offset += GROUP_SIZE) {
    await Promise.all(Array.from({ length: Math.min(GROUP_SIZE, USERS - offset) }, (_, i) => journey(offset + i)));
  }
  const elapsedMs = performance.now() - started;
  const rowCount = table => sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  const rows = {
    profiles: rowCount('memory_profiles'), tasks: rowCount('memory_task_states'),
    sharedContent: rowCount('memory_task_content'), awards: rowCount('memory_completion_awards'),
    categoryProgress: rowCount('memory_category_progress'), aiAttempts: rowCount('memory_ai_attempts')
  };
  assert.equal(rows.profiles, USERS);
  assert.equal(rows.tasks, USERS * 3);
  assert.equal(rows.awards, USERS);
  assert.equal(rows.sharedContent, 3);
  assert.equal(rows.categoryProgress, USERS);
  assert.equal(rows.aiAttempts, 0);
  const summary = Object.fromEntries([...timings].map(([route, values]) => {
    values.sort((a, b) => a - b);
    const rounded = value => Number(value.toFixed(2));
    return [route, { requests: values.length, localP50Ms: rounded(values[Math.floor(values.length * 0.5)]),
      localP95Ms: rounded(values[Math.floor(values.length * 0.95)]), localMaxMs: rounded(values.at(-1)) }];
  }));
  console.log(JSON.stringify({ status: 'passed', users: USERS, inFlightJourneys: GROUP_SIZE,
    localElapsedMs: Number(elapsedMs.toFixed(2)), queries, batches, largestResponseBytes, rows, routes: summary,
    verifies: ['200 separate owners', 'three prepared suggestions', 'save and completion persistence',
      'one award across undo and re-completion', 'milestone and optional check-in persistence',
      'shared content stored once', 'no model calls'],
    limits: ['Disposable synchronous SQLite, not remote D1', 'Injected identities, not real Clerk/email sign-in',
      'No network latency, mobile rendering, edge limits or distributed contention',
      'Does not prove readiness for 200 simultaneous hosted users or AI requests']
  }, null, 2));
} finally {
  sqlite.close();
}
