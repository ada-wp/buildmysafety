import type { ProfileDraft } from './profile-draft.ts';

/** An intentional guest-to-account handoff lives only in this page's memory. */
export function createSignInHandoff(now = () => Date.now()) {
  let pending: { draft: ProfileDraft; nextEpoch: number; expiresAt: number } | null = null;
  return {
    begin(draft: ProfileDraft, currentEpoch: number) {
      pending = { draft: structuredClone(draft), nextEpoch: currentEpoch + 1, expiresAt: now() + 15 * 60_000 };
    },
    peek(epoch: number): ProfileDraft | null {
      if (!pending) return null;
      if (now() >= pending.expiresAt || epoch > pending.nextEpoch) { pending = null; return null; }
      return epoch === pending.nextEpoch ? structuredClone(pending.draft) : null;
    },
    clear() { pending = null; }
  };
}
