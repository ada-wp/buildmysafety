import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';
import { createClerkIdentity, type ClerkSource } from '../src/clerk-identity.ts';
import { createSafetyClient } from '../src/cloud-api.ts';
import { createProfileSession } from '../src/profile-session.ts';

// Read the actual shared UI policy from TSX without mounting React or duplicating
// its branches. Transpilation is in-memory; no browser or provider is involved.
const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const declaration = source.match(/export function accountControls\([^]*?\n\}/)?.[0];
assert.ok(declaration, 'App must expose its shared account control policy');
const compiled = await transform(declaration, { loader: 'ts', format: 'esm', target: 'es2022' });
const { accountControls } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);

test('API 401 leaves explicit provider sign-out available and blocks another sign-in until sign-out completes', async () => {
  const listeners = new Set<() => void>();
  let signOutCalls = 0;
  const clerk: ClerkSource = {
    session: { id: 'sess_a', status: 'active', user: { id: 'user_a' }, async getToken() { return 'signed-test-token'; } },
    addListener(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async signOut() {
      signOutCalls++;
      clerk.session = null;
      for (const listener of listeners) listener();
    }
  };
  let requests = 0;
  const identity = createClerkIdentity(clerk);
  const client = createSafetyClient({ baseUrl: 'https://app.example', getAccessToken: identity.getAccessToken,
    async fetchImpl() {
      requests++;
      return Response.json({ error: 'authentication_invalid' }, { status: 401 });
    }
  });
  const session = createProfileSession(client, identity);
  try {
    assert.equal(await session.load(), false);
    assert.equal(session.getState().error?.status, 401);
    assert.equal(session.getState().snapshot, null);
    assert.equal(clerk.session?.status, 'active');
    assert.deepEqual(accountControls(session.getState().status, true), {
      canSignIn: false, canSignOut: true, needsReconnection: true
    });
    assert.equal(signOutCalls, 0, 'API rejection must not silently sign out the provider');
    await session.signOut();
    await nextTurn();
    assert.equal(signOutCalls, 1);
    assert.equal(clerk.session, null);
    assert.deepEqual(accountControls(session.getState().status, false), {
      canSignIn: true, canSignOut: false, needsReconnection: false
    });
    assert.equal(requests, 1, 'no automatic replay or new login request follows rejection');
  } finally { session.dispose(); identity.dispose(); }
});

test('a configured signed-out visitor can sign in, while unconfigured/loading/connected screens cannot start a new login', () => {
  assert.equal(accountControls('signed_out', false).canSignIn, true);
  for (const status of ['unconfigured', 'loading', 'new', 'ready', 'error']) {
    assert.equal(accountControls(status, false).canSignIn, false);
    assert.equal(accountControls(status, true).canSignIn, false);
  }
  assert.equal(accountControls('unconfigured', false).canSignOut, false);
  assert.equal(accountControls('error', true).canSignOut, true);
});
