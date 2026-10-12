import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { createProfileSession } from '../src/profile-session.ts';
import { SafetyApiError, type SafetyClient } from '../src/cloud-api.ts';
import { emptyDraft } from '../src/profile-draft.ts';
import type { IdentityAdapter } from '../src/identity.ts';
import type { MemorySnapshot, ProfileResponse, RequestOptions } from '../src/api-contracts.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function snapshot(owner = 'test-owner-a', revision = 1): MemorySnapshot {
  return {
    profile: {
      ...emptyDraft(), schemaVersion: 1, userId: owner, revision,
      updatedAt: '2026-10-11T12:00:00.000Z', signalsResetAt: null
    },
    taskStates: [], stateVersion: String(revision)
  };
}

function fakeIdentity(configured = true, initialToken: string | null = 'token-a') {
  const listeners = new Set<() => void>();
  let token = initialToken;
  let tokenReads = 0;
  let signOuts = 0;
  const change = (next: string | null) => {
    token = next;
    for (const listener of listeners) listener();
  };
  const adapter: IdentityAdapter = {
    configured,
    async getAccessToken() { tokenReads++; return token; },
    async signOut() { signOuts++; change(null); },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
  };
  return { adapter, change, tokenReads: () => tokenReads, signOuts: () => signOuts,
    listenerCount: () => listeners.size };
}

function fakeClient(overrides: Partial<SafetyClient> = {}): SafetyClient {
  const unexpected = async () => { throw new Error('Unexpected API method'); };
  return {
    health: unexpected, getMemory: unexpected, createMemory: unexpected,
    updateMemory: unexpected, resetMemory: unexpected, taskAction: unexpected,
    recommendations: unexpected, ...overrides
  };
}

test('unconfigured identity makes no token/API calls and cannot save', async () => {
  const identity = fakeIdentity(false);
  const session = createProfileSession(fakeClient(), identity.adapter);
  assert.equal(session.getState().status, 'unconfigured');
  assert.equal(await session.load(), false);
  assert.equal(await session.save(emptyDraft()), false);
  assert.equal(identity.tokenReads(), 0);
  assert.deepEqual(session.getState(), {
    status: 'unconfigured', snapshot: null, busy: false, error: null, identityEpoch: 0
  });
  session.dispose();
});

test('configured but signed-out identity makes no authenticated API calls', async () => {
  const identity = fakeIdentity(true, null);
  const session = createProfileSession(fakeClient(), identity.adapter);
  assert.equal(await session.load(), false);
  assert.equal(await session.save(emptyDraft()), false);
  assert.equal(identity.tokenReads(), 1);
  assert.equal(session.getState().status, 'signed_out');
  assert.equal(session.getState().busy, false);
  session.dispose();
});

test('a silently expired identity clears private UI state even without an identity event', async () => {
  const identity = fakeIdentity();
  let credential: string | null = 'token-a';
  identity.adapter.getAccessToken = async () => credential;
  let reads = 0;
  const session = createProfileSession(fakeClient({ async getMemory() { reads++; return snapshot(); } }), identity.adapter);
  assert.equal(await session.load(), true);
  const epoch = session.getState().identityEpoch;
  credential = null;
  assert.equal(await session.load(), false);
  assert.equal(session.getState().status, 'signed_out');
  assert.equal(session.getState().snapshot, null);
  assert.equal(session.getState().identityEpoch, epoch + 1);
  assert.equal(reads, 1);
  await session.load();
  assert.equal(session.getState().identityEpoch, epoch + 1, 'rechecking a signed-out session need not discard new guest input');
  session.dispose();
});

test('profile 404 allows explicit create, never creates during repeated loads, then reads server state', async () => {
  const identity = fakeIdentity();
  const calls: string[] = [];
  const stored = snapshot();
  const draft = emptyDraft();
  draft.answers.home = 'alone';
  draft.interests = ['sick_care'];
  let created = false;
  const session = createProfileSession(fakeClient({
    async getMemory() {
      calls.push('read');
      if (!created) throw new SafetyApiError('profile_not_found', 404);
      return stored;
    },
    async createMemory(fields) {
      calls.push('create');
      assert.deepEqual(fields, draft);
      assert.equal(Object.hasOwn(fields, 'userId'), false);
      assert.equal(Object.hasOwn(fields, 'revision'), false);
      created = true;
      return { profile: stored.profile };
    }
  }), identity.adapter);
  assert.deepEqual(calls, []);
  assert.equal(await session.load(), false);
  assert.equal(await session.load(), false);
  assert.equal(session.getState().status, 'new');
  assert.deepEqual(calls, ['read', 'read']);
  assert.equal(await session.save(draft), true);
  assert.deepEqual(calls, ['read', 'read', 'create', 'read']);
  assert.equal(session.getState().snapshot, stored);
  assert.equal(session.getState().status, 'ready');
  session.dispose();
});

test('unrelated 404 is an error and cannot accidentally create a profile', async () => {
  const identity = fakeIdentity();
  const session = createProfileSession(fakeClient({
    async getMemory() { throw new SafetyApiError('route_not_found', 404); }
  }), identity.adapter);
  assert.equal(await session.load(), false);
  assert.equal(session.getState().status, 'error');
  assert.equal(await session.save(emptyDraft()), false);
  session.dispose();
});

test('save uses the loaded revision, blocks duplicate writes, and confirms by rereading', async () => {
  const identity = fakeIdentity();
  const writing = deferred<ProfileResponse>();
  const original = snapshot('test-owner-a', 4);
  const refreshed = snapshot('test-owner-a', 5);
  const draft = emptyDraft();
  draft.elephantName = 'Mimi';
  let reads = 0;
  let writes = 0;
  const session = createProfileSession(fakeClient({
    async getMemory() { reads++; return reads === 1 ? original : refreshed; },
    async updateMemory(input) {
      writes++;
      assert.deepEqual(input, { expectedRevision: 4, changes: draft });
      return writing.promise;
    }
  }), identity.adapter);
  assert.equal(await session.load(), true);
  const first = session.save(draft);
  assert.equal(session.getState().busy, true);
  assert.equal(await session.save(draft), false);
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  writing.resolve({ profile: refreshed.profile });
  assert.equal(await first, true);
  assert.equal(writes, 1);
  assert.equal(reads, 2);
  assert.equal(session.getState().snapshot, refreshed);
  assert.equal(session.getState().busy, false);
  session.dispose();
});

test('revision conflict preserves the caller draft and requires an explicit reload without retrying', async () => {
  const identity = fakeIdentity();
  const draft = emptyDraft();
  draft.answers.style = 'resources';
  const before = structuredClone(draft);
  const latest = snapshot('test-owner-a', 8);
  let reads = 0;
  let writes = 0;
  const conflict = new SafetyApiError('stale_revision', 409);
  const session = createProfileSession(fakeClient({
    async getMemory() { reads++; return reads === 1 ? snapshot('test-owner-a', 7) : latest; },
    async updateMemory() { writes++; throw conflict; }
  }), identity.adapter);
  await session.load();
  assert.equal(await session.save(draft), false);
  assert.equal(await session.save(draft), false);
  await nextTurn();
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  assert.deepEqual(draft, before);
  assert.equal(session.getState().status, 'error');
  assert.equal(session.getState().error, conflict);
  assert.equal(session.getState().snapshot, null);
  assert.equal(await session.load(), true);
  assert.equal(session.getState().snapshot, latest);
  assert.deepEqual(draft, before);
  assert.equal(writes, 1);
  session.dispose();
});

for (const settlement of ['resolve', 'reject'] as const) {
  test(`late old-account read ${settlement} cannot replace the new account`, async () => {
    const identity = fakeIdentity();
    const oldRead = deferred<MemorySnapshot>();
    const newRead = deferred<MemorySnapshot>();
    const signals: (AbortSignal | undefined)[] = [];
    let reads = 0;
    const session = createProfileSession(fakeClient({
      async getMemory(options?: RequestOptions) {
        signals.push(options?.signal);
        return ++reads === 1 ? oldRead.promise : newRead.promise;
      }
    }), identity.adapter);
    const oldLoad = session.load();
    await nextTurn();
    assert.equal(reads, 1);
    identity.change('token-b');
    assert.equal(session.getState().snapshot, null);
    assert.equal(session.getState().identityEpoch, 1);
    assert.equal(signals[0]?.aborted, true);
    await nextTurn();
    assert.equal(reads, 2);
    const secondOwner = snapshot('test-owner-b');
    newRead.resolve(secondOwner);
    await nextTurn();
    assert.equal(session.getState().snapshot, secondOwner);
    if (settlement === 'resolve') oldRead.resolve(snapshot('test-owner-a'));
    else oldRead.reject(new SafetyApiError('expired', 401));
    assert.equal(await oldLoad, false);
    assert.equal(session.getState().snapshot, secondOwner);
    assert.equal(session.getState().status, 'ready');
    assert.equal(session.getState().error, null);
    session.dispose();
  });
}

test('a pending save for the old account never triggers a reread after account change', async () => {
  const identity = fakeIdentity();
  const writing = deferred<ProfileResponse>();
  const ownerA = snapshot('test-owner-a');
  const ownerB = snapshot('test-owner-b');
  let reads = 0;
  let writes = 0;
  let writeSignal: AbortSignal | undefined;
  const session = createProfileSession(fakeClient({
    async getMemory() { return ++reads === 1 ? ownerA : ownerB; },
    async updateMemory(_input, options) {
      writes++; writeSignal = options?.signal;
      return writing.promise;
    }
  }), identity.adapter);
  await session.load();
  const save = session.save(emptyDraft());
  identity.change('token-b');
  assert.equal(writeSignal?.aborted, true);
  await nextTurn();
  assert.equal(session.getState().snapshot, ownerB);
  writing.resolve({ profile: ownerA.profile });
  assert.equal(await save, false);
  assert.equal(reads, 2);
  assert.equal(writes, 1);
  assert.equal(session.getState().snapshot, ownerB);
  session.dispose();
});

test('sign-out clears private state immediately and ignores a late read even if transport ignores abort', async () => {
  const identity = fakeIdentity();
  const reading = deferred<MemorySnapshot>();
  let signal: AbortSignal | undefined;
  const session = createProfileSession(fakeClient({
    async getMemory(options) { signal = options?.signal; return reading.promise; }
  }), identity.adapter);
  const loading = session.load();
  await nextTurn();
  const signingOut = session.signOut();
  assert.equal(session.getState().snapshot, null);
  assert.ok(session.getState().identityEpoch > 0);
  assert.equal(signal?.aborted, true);
  await signingOut;
  await nextTurn();
  reading.resolve(snapshot());
  assert.equal(await loading, false);
  assert.equal(session.getState().status, 'signed_out');
  assert.equal(session.getState().busy, false);
  assert.equal(session.getState().snapshot, null);
  assert.equal(identity.signOuts(), 1);
  assert.equal(await session.save(emptyDraft()), false);
  session.dispose();
});

test('401 during a write clears the loaded profile and invalidates private UI drafts', async () => {
  const identity = fakeIdentity();
  let writes = 0;
  const session = createProfileSession(fakeClient({
    async getMemory() { return snapshot(); },
    async updateMemory() { writes++; throw new SafetyApiError('unauthorized', 401); }
  }), identity.adapter);
  await session.load();
  const epoch = session.getState().identityEpoch;
  assert.equal(await session.save(emptyDraft()), false);
  assert.equal(session.getState().status, 'signed_out');
  assert.equal(session.getState().identityEpoch, epoch + 1);
  assert.equal(session.getState().snapshot, null);
  assert.equal(await session.save(emptyDraft()), false);
  assert.equal(writes, 1);
  session.dispose();
});

test('disposing aborts the request, removes the identity listener, and suppresses late results', async () => {
  const identity = fakeIdentity();
  const reading = deferred<MemorySnapshot>();
  let signal: AbortSignal | undefined;
  let notifications = 0;
  const session = createProfileSession(fakeClient({
    async getMemory(options) { signal = options?.signal; return reading.promise; }
  }), identity.adapter);
  session.subscribe(() => { notifications++; });
  const loading = session.load();
  await nextTurn();
  const stateBeforeDispose = session.getState();
  const notificationsBeforeDispose = notifications;
  session.dispose();
  assert.equal(identity.listenerCount(), 0);
  assert.equal(signal?.aborted, true);
  identity.change('token-b');
  reading.resolve(snapshot());
  assert.equal(await loading, false);
  assert.equal(await session.load(), false);
  assert.equal(await session.save(emptyDraft()), false);
  assert.equal(session.getState(), stateBeforeDispose);
  assert.equal(notifications, notificationsBeforeDispose);
});
