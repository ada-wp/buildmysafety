// Run after the Vite build. Only this output folder may be deployed.
import { build } from 'esbuild';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('dist/client/', root);
const config = JSON.parse(await readFile(new URL('wrangler.jsonc', root), 'utf8'));
const issuer = new URL(config.vars.CLERK_ISSUER).origin;
if (!issuer.startsWith('https://') || issuer !== config.vars.CLERK_ISSUER) throw new Error('Canonical HTTPS Clerk issuer required');
const allowed = new Set(['index.html', 'elephant.svg', 'assets']);
for (const file of await readdir(output)) if (!allowed.has(file)) throw new Error(`Unexpected public file: ${file}. Rebuild first.`);
for (const file of await readdir(new URL('assets/', output))) {
  if (!/\.(js|css|woff2?)$/.test(file)) throw new Error('Unexpected asset type');
  if (file.endsWith('.js')) {
    const js = await readFile(new URL(`assets/${file}`, output), 'utf8');
    if (/sk_(?:live|test)_|OPENAI_API_KEY|You are the My Safety|AUTH_JWKS_JSON|synthetic-user/.test(js)) throw new Error('Private content in browser artifact');
  }
}
await build({ entryPoints: [fileURLToPath(new URL('worker.mjs', root))],
  outfile: fileURLToPath(new URL('_worker.js', output)),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', external: ['node:crypto', 'node:buffer'], sourcemap: false });
await writeFile(new URL('_routes.json', output), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
// Clerk's prebuilt UI uses inline styles; scripts remain restricted to its pinned issuer.
const csp = `default-src 'self'; script-src 'self' ${issuer} https://challenges.cloudflare.com https://*.protect.clerk.com; connect-src 'self' ${issuer} https://*.protect.clerk.com:*; img-src 'self' data: https://img.clerk.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src ${issuer} https://challenges.cloudflare.com https://*.protect.clerk.com; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`;
await writeFile(new URL('_headers', output), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: ${csp}\n  Cache-Control: no-store\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
console.log('Pages artifact ready: app/dist/client (owned onboarding/tasks; AI disabled).');
