import { SafetyApiError, type SafetyClient } from './cloud-api.ts';
import type { MemorySnapshot } from './api-contracts.ts';
import type { ProfileDraft } from './profile-draft.ts';
import type { IdentityAdapter } from './identity.ts';

export type ProfileSessionState = {
  status: 'unconfigured' | 'signed_out' | 'loading' | 'new' | 'ready' | 'error';
  snapshot: MemorySnapshot | null;
  busy: boolean;
  error: SafetyApiError | null;
  /** Changes before an account switch can complete, so the UI clears private drafts too. */
  identityEpoch: number;
};

/** Framework-independent lifecycle; no browser database, cookies or model calls. */
export function createProfileSession(client: SafetyClient, identity: IdentityAdapter) {
  let state: ProfileSessionState = { status: identity.configured ? 'signed_out' : 'unconfigured',
    snapshot: null, busy: false, error: null, identityEpoch: 0 };
  const listeners = new Set<() => void>();
  let generation = 0;
  let disposed = false;
  let observedIdentity = false;
  let pending: AbortController | null = null;
  const emit = (next: ProfileSessionState) => {
    if (disposed) return;
    state = next;
    listeners.forEach(listener => listener());
  };
  const invalidate = () => { generation++; pending?.abort(); pending = null; };
  const current = (ticket: number) => !disposed && ticket === generation;
  const errorOf = (error: unknown) => error instanceof SafetyApiError ? error : new SafetyApiError('request_failed');
  const failure = (error: unknown) => {
    const safe = errorOf(error);
    if (safe.status === 401) observedIdentity = false;
    emit({ ...state, status: safe.status === 401 ? 'signed_out' : 'error', snapshot: null, busy: false, error: safe,
      identityEpoch: state.identityEpoch + (safe.status === 401 ? 1 : 0) });
  };

  async function load(): Promise<boolean> {
    if (disposed) return false;
    invalidate();
    const ticket = generation;
    emit({ ...state, status: identity.configured ? 'loading' : 'unconfigured', snapshot: null, busy: identity.configured, error: null });
    if (!identity.configured) return false;
    const controller = new AbortController();
    pending = controller;
    try {
      const token = await identity.getAccessToken();
      if (!current(ticket)) return false;
      if (!token) {
        const identityEpoch = state.identityEpoch + (observedIdentity ? 1 : 0);
        observedIdentity = false;
        emit({ ...state, status: 'signed_out', busy: false, identityEpoch });
        return false;
      }
      observedIdentity = true;
      const snapshot = await client.getMemory({ signal: controller.signal });
      if (!current(ticket)) return false;
      emit({ ...state, status: 'ready', snapshot, busy: false });
      return true;
    } catch (error) {
      if (!current(ticket)) return false;
      if (error instanceof SafetyApiError && error.status === 404 && error.code === 'profile_not_found') {
        emit({ ...state, status: 'new', busy: false, error: null });
      } else failure(error);
      return false;
    } finally { if (current(ticket)) pending = null; }
  }

  async function writeProfile(write: (snapshot: MemorySnapshot | null, signal: AbortSignal) => Promise<unknown>): Promise<boolean> {
    if (disposed || state.busy || !['new', 'ready'].includes(state.status)) return false;
    const snapshot = state.snapshot;
    const ticket = generation;
    const controller = new AbortController();
    pending = controller;
    emit({ ...state, busy: true, error: null });
    try {
      // No owner ID comes from an editable draft. Do not replay an interrupted write.
      await write(snapshot, controller.signal);
      if (!current(ticket)) return false;
      const fresh = await client.getMemory({ signal: controller.signal });
      if (!current(ticket)) return false;
      emit({ ...state, status: 'ready', snapshot: fresh, busy: false });
      return true;
    } catch (error) {
      if (current(ticket)) failure(error);
      return false;
    } finally { if (current(ticket)) pending = null; }
  }

  const save = (draft: ProfileDraft) => writeProfile((snapshot, signal) => snapshot
    ? client.updateMemory({ expectedRevision: snapshot.profile.revision, changes: draft }, { signal })
    : client.createMemory(draft, { signal }));
  const setPersonalization = (enabled: boolean) => state.status !== 'ready' ? Promise.resolve(false)
    : writeProfile((snapshot, signal) => client.updateMemory({ expectedRevision: snapshot!.profile.revision,
      changes: { personalizationEnabled: enabled } }, { signal }));
  const resetLearning = () => state.status !== 'ready' ? Promise.resolve(false)
    : writeProfile((snapshot, signal) => client.resetMemory({ expectedRevision: snapshot!.profile.revision }, { signal }));

  async function signOut(): Promise<void> {
    if (disposed) return;
    invalidate();
    observedIdentity = false;
    const ticket = generation;
    emit({ status: 'signed_out', snapshot: null, busy: true, error: null, identityEpoch: state.identityEpoch + 1 });
    try { await identity.signOut(); }
    catch (error) { if (current(ticket)) { failure(error); return; } }
    if (current(ticket)) emit({ ...state, busy: false });
  }

  const unsubscribeIdentity = identity.subscribe(() => {
    invalidate();
    observedIdentity = false;
    emit({ status: identity.configured ? 'signed_out' : 'unconfigured', snapshot: null, busy: false, error: null,
      identityEpoch: state.identityEpoch + 1 });
    void load();
  });

  return {
    getState: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load, save, setPersonalization, resetLearning, signOut,
    dispose() { disposed = true; invalidate(); unsubscribeIdentity(); listeners.clear(); }
  };
}

export type ProfileSession = ReturnType<typeof createProfileSession>;
