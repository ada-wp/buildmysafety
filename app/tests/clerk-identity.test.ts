import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { createClerkIdentity, type ClerkSource } from '../src/clerk-identity.ts';
import { createProfileSession } from '../src/profile-session.ts';
import { emptyDraft } from '../src/profile-draft.ts';
import type { SafetyClient } from '../src/cloud-api.ts';
import type { MemorySnapshot } from '../src/api-contracts.ts';

type Session = NonNullable<ClerkSource['session']>;
function active(userId = 'user_a', id = 'sess_a', getToken = async () => 'token-a'): Session {
  return { id, status: 'active', user: { id: userId }, getToken };
}
function fakeClerk(initial: ClerkSource['session'] = active()) {
  const listeners = new Set<() => void>();
  let signOutCalls = 0;
  const source: ClerkSource = {
    session: initial,
    addListener(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async signOut() { signOutCalls++; source.session = null; notify(); }
  };
  const notify = () => { for (const listener of listeners) listener(); };
  const change = (session: ClerkSource['session']) => { source.session = session; notify(); };
  return { source, notify, change, listenerCount: () => listeners.size, signOutCalls: () => signOutCalls };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('SDK token refresh reads the fresh token without announcing an identity change', async () => {
  let token = 'token-first';
  let reads = 0;
  const clerk = fakeClerk(active('user_a', 'sess_a', async () => { reads++; return token; }));
  const identity = createClerkIdentity(clerk.source);
  let changes = 0;
  identity.subscribe(() => { changes++; });
  assert.equal(await identity.getAccessToken(), 'token-first');
  token = 'token-refreshed';
  clerk.notify();
  clerk.notify();
  assert.equal(changes, 0);
  assert.equal(await identity.getAccessToken(), 'token-refreshed');
  assert.equal(reads, 2);
  identity.dispose();
});

test('owner change and replacement session announce once, but repeated SDK notifications do not', () => {
  const clerk = fakeClerk();
  const identity = createClerkIdentity(clerk.source);
  let changes = 0;
  identity.subscribe(() => { changes++; });
  clerk.change(active('user_b', 'sess_b'));
  clerk.notify();
  assert.equal(changes, 1);
  clerk.change(active('user_b', 'sess_b_replacement'));
  clerk.notify();
  assert.equal(changes, 2);
  clerk.change(null);
  clerk.notify();
  assert.equal(changes, 3);
  identity.dispose();
});

test('pending/inactive sessions and missing users cannot supply tokens', async () => {
  let tokenReads = 0;
  const clerk = fakeClerk(null);
  const identity = createClerkIdentity(clerk.source);
  assert.equal(await identity.getAccessToken(), null);
  clerk.change(undefined);
  assert.equal(await identity.getAccessToken(), null);
  for (const status of ['pending', 'ended', 'revoked', 'abandoned']) {
    clerk.change({ ...active(), status, getToken: async () => { tokenReads++; return 'must-not-read'; } });
    assert.equal(await identity.getAccessToken(), null);
  }
  clerk.change({ ...active(), user: null, getToken: async () => { tokenReads++; return 'must-not-read'; } });
  assert.equal(await identity.getAccessToken(), null);
  assert.equal(tokenReads, 0);
  identity.dispose();
});

test('an active session becoming pending clears identity, and only active restoration resumes it', async () => {
  const clerk = fakeClerk();
  const identity = createClerkIdentity(clerk.source);
  let changes = 0;
  identity.subscribe(() => { changes++; });
  clerk.change({ ...active(), status: 'pending' });
  assert.equal(changes, 1);
  assert.equal(await identity.getAccessToken(), null);
  clerk.notify();
  assert.equal(changes, 1);
  clerk.change(active());
  assert.equal(changes, 2);
  assert.equal(await identity.getAccessToken(), 'token-a');
  identity.dispose();
});

test('token resolving after an owner switch is discarded even when SDK work cannot be cancelled', async () => {
  const waiting = deferred<string>();
  const clerk = fakeClerk(active('user_a', 'sess_a', () => waiting.promise));
  const identity = createClerkIdentity(clerk.source);
  const oldToken = identity.getAccessToken();
  clerk.change(active('user_b', 'sess_b', async () => 'token-b'));
  waiting.resolve('old-token-a');
  assert.equal(await oldToken, null);
  assert.equal(await identity.getAccessToken(), 'token-b');
  identity.dispose();
});

test('token resolving after sign-out is discarded and provider sign-out is actually invoked', async () => {
  const waiting = deferred<string>();
  const clerk = fakeClerk(active('user_a', 'sess_a', () => waiting.promise));
  const identity = createClerkIdentity(clerk.source);
  const oldToken = identity.getAccessToken();
  await identity.signOut();
  waiting.resolve('old-token-a');
  assert.equal(await oldToken, null);
  assert.equal(await identity.getAccessToken(), null);
  assert.equal(clerk.signOutCalls(), 1);
  identity.dispose();
});

test('disposal removes SDK listeners and suppresses late tokens and subscriber calls', async () => {
  const waiting = deferred<string>();
  const clerk = fakeClerk(active('user_a', 'sess_a', () => waiting.promise));
  const identity = createClerkIdentity(clerk.source);
  let notifications = 0;
  identity.subscribe(() => { notifications++; });
  const token = identity.getAccessToken();
  identity.dispose();
  assert.equal(clerk.listenerCount(), 0);
  clerk.change(active('user_b', 'sess_b'));
  waiting.resolve('old-token-a');
  assert.equal(await token, null);
  assert.equal(await identity.getAccessToken(), null);
  assert.equal(notifications, 0);
});

test('unsubscribe stops only that consumer without disabling the remaining subscriber', () => {
  const clerk = fakeClerk();
  const identity = createClerkIdentity(clerk.source);
  let removed = 0;
  let remaining = 0;
  const unsubscribe = identity.subscribe(() => { removed++; });
  identity.subscribe(() => { remaining++; });
  unsubscribe();
  clerk.change(active('user_b', 'sess_b'));
  assert.equal(removed, 0);
  assert.equal(remaining, 1);
  identity.dispose();
});

test('SDK token failure propagates rather than falling back to an older cached token', async () => {
  let failure = false;
  const error = new Error('SDK unavailable');
  const clerk = fakeClerk(active('user_a', 'sess_a', async () => {
    if (failure) throw error;
    return 'first-token';
  }));
  const identity = createClerkIdentity(clerk.source);
  assert.equal(await identity.getAccessToken(), 'first-token');
  failure = true;
  await assert.rejects(identity.getAccessToken(), value => value === error);
  identity.dispose();
});

test('profile controller preserves its loaded account on token refresh, but reloads after a switch', async () => {
  const clerk = fakeClerk();
  const identity = createClerkIdentity(clerk.source);
  const ownerSnapshot = (owner: string): MemorySnapshot => ({
    profile: { ...emptyDraft(), schemaVersion: 1, userId: owner, revision: 1,
      updatedAt: '2026-10-11T12:00:00.000Z', signalsResetAt: null },
    taskStates: [], stateVersion: '1'
  });
  let reads = 0;
  const unexpected = async () => { throw new Error('Unexpected mutation'); };
  const client: SafetyClient = {
    async getMemory() { reads++; return ownerSnapshot(clerk.source.session!.user!.id); },
    health: unexpected, createMemory: unexpected, updateMemory: unexpected,
    resetMemory: unexpected, taskAction: unexpected, recommendations: unexpected,
    getCatalog: unexpected, getTasks: unexpected, getLatestRecommendation: unexpected, getOnboarding: unexpected, saveOnboarding: unexpected
  };
  const session = createProfileSession(client, identity);
  await session.load();
  const original = session.getState().snapshot;
  clerk.notify();
  await nextTurn();
  assert.equal(reads, 1);
  assert.equal(session.getState().snapshot, original);
  assert.equal(session.getState().identityEpoch, 0);
  clerk.change(active('user_b', 'sess_b'));
  assert.equal(session.getState().snapshot, null);
  assert.equal(session.getState().identityEpoch, 1);
  await nextTurn();
  assert.equal(reads, 2);
  assert.equal(session.getState().snapshot?.profile.userId, 'user_b');
  session.dispose();
  identity.dispose();
});
