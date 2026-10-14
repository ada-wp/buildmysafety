import type { IdentityAdapter } from './identity.ts';

/** Narrow SDK boundary, shared with tests. Clerk owns token refresh and credential storage. */
export type ClerkSource = {
  session: { id: string; status: string; user: { id: string } | null; getToken(): Promise<string | null> } | null | undefined;
  addListener(listener: () => void): () => void;
  signOut(): Promise<void>;
};

export function createClerkIdentity(source: ClerkSource): IdentityAdapter & { dispose(): void } {
  const listeners = new Set<() => void>();
  const sessionKey = () => source.session?.status === 'active' && source.session.user
    ? `${source.session.user.id}:${source.session.id}` : null;
  let previous = sessionKey();
  let disposed = false;
  const unsubscribe = source.addListener(() => {
    const next = sessionKey();
    // A refreshed token or updated Clerk UI is not an account change.
    if (next === previous || disposed) return;
    previous = next;
    listeners.forEach(listener => listener());
  });
  return {
    configured: true,
    async getAccessToken() {
      if (disposed || !sessionKey()) return null;
      const session = source.session!;
      const expected = sessionKey();
      const token = await session.getToken();
      return !disposed && expected === sessionKey() ? token : null;
    },
    async signOut() { await source.signOut(); },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { disposed = true; unsubscribe(); listeners.clear(); }
  };
}
