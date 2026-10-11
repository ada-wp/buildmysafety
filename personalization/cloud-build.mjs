// Creates an allowlisted Pages artifact. Never deploy the repository root.
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { generateKeyPairSync } from 'node:crypto';
import { makeCatalog } from './test/fixtures.mjs';

const dir = new URL('./', import.meta.url);
await mkdir(new URL('dist/', dir), { recursive: true });
const publicFiles = new Set(['_worker.js', 'index.html', '_routes.json']);
if ((await readdir(new URL('dist/', dir))).some(name => !publicFiles.has(name))) {
  throw new Error('Unexpected file in dist. Inspect and remove it before building a public artifact.');
}
await mkdir(new URL('.test-secrets/', dir), { recursive: true });
const keyPath = new URL('.test-secrets/private.pem', dir);
const enabled = process.argv.includes('--enable-synthetic-test');
let publicKey;
if (enabled) try {
  const { createPublicKey } = await import('node:crypto');
  publicKey = createPublicKey(await readFile(keyPath));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  publicKey = pair.publicKey;
  await writeFile(keyPath, pair.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
}
const jwk = enabled ? { ...publicKey.export({ format: 'jwk' }), kid: 'memory-synthetic-20261011', use: 'sig', alg: 'RS256' } : null;
const config = {
  name: 'buildmysafety',
  pages_build_output_dir: './dist',
  compatibility_date: '2026-09-18',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: [{ binding: 'MEMORY_DB', database_name: 'buildmysafety-memory-staging', database_id: '0c4fb649-fb6a-4a8e-9a02-9f9c76ece796', migrations_dir: './migrations' }],
  vars: {
    AUTH_JWKS_JSON: JSON.stringify({ keys: enabled ? [jwk] : [] }),
    AUTH_ISSUER: 'https://buildmysafety.pages.dev/testing',
    AUTH_AUDIENCE: 'safety-memory-test',
    SYNTHETIC_TEST_MODE: enabled ? 'true' : 'false',
    OPENAI_MODEL: 'gpt-6-luna'
  }
};
await writeFile(new URL('wrangler.jsonc', dir), JSON.stringify(config, null, 2) + '\n');
await writeFile(new URL('dist/_worker.js', dir), `import { createHandler } from '../http.mjs';\nconst catalog = ${JSON.stringify(makeCatalog())};\nexport default { fetch: createHandler({ catalog }) };\n`);
await writeFile(new URL('dist/index.html', dir), '<!doctype html><meta charset="utf-8"><title>My Safety — API staging</title><p>Private API test environment. The customer app is not connected yet.</p>');
await writeFile(new URL('dist/_routes.json', dir), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
console.log(JSON.stringify({ artifact: 'personalization/dist', syntheticTestingEnabled: enabled, privateKeyPrinted: false }));
