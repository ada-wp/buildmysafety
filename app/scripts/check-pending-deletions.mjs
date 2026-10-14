// Read-only operator check. Exit 2 means a human must follow the recovery runbook.
// Uses existing Wrangler authentication; never requests or copies a Clerk secret.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const wrangler = process.argv[2];
if (!wrangler) throw new Error('Pass the path to an installed Wrangler bin/wrangler.js');
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const database = config.d1_databases.find(binding => binding.binding === 'MEMORY_DB')?.database_name;
if (database !== 'buildmysafety-memory-staging') throw new Error('This check is scoped to the staging database. Review production separately.');
const query = `SELECT COUNT(*) AS pending_count, MIN(requested_at) AS oldest_request_at
  FROM account_deletions WHERE status = 'pending'`;
const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', database,
  '--remote', '--command', query, '--json'], { cwd: root, encoding: 'utf8', timeout: 30000,
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
if (result.status !== 0) { console.error('Deletion status could not be checked. This is not evidence of zero pending requests.'); process.exit(1); }
const data = JSON.parse(result.stdout); const row = data[0]?.results?.[0];
if (!data[0]?.success || !Number.isSafeInteger(row?.pending_count)) throw new Error('Unexpected deletion status response');
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), database, pendingCount: row.pending_count,
  oldestRequestAt: row.oldest_request_at, action: row.pending_count ? 'Follow the pending-deletion runbook in docs/technical-status.md.' : 'No pending deletions.' }, null, 2));
if (row.pending_count) process.exitCode = 2;
