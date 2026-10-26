import { SafetyApiError, type SafetyClient } from './cloud-api.ts';
import type { PreparednessFeeling, ProgressResponse, TopicId } from './api-contracts.ts';
import { accountIsLeaving } from './navigation.ts';
type ProgressClient = Pick<SafetyClient, 'getProgress' | 'updateProgress'>;
type State = { data: ProgressResponse | null; busy: boolean; error: SafetyApiError | null };

/** A separate compact record; these writes never generate tasks or award growth. */
export function createProgressSession(client: ProgressClient) {
  let state: State = { data: null, busy: false, error: null };
  let alive = true;
  let serial = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<State>) => { if (alive) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function run(topicId?: TopicId, milestone?: number, feeling?: PreparednessFeeling): Promise<ProgressResponse | null> {
    if (!alive) return null;
    // A new read supersedes an old read; writes are never replayed automatically.
    if (state.busy && topicId) return null;
    const id = ++serial;
    controller?.abort(); controller = new AbortController();
    publish({ busy: true, error: null });
    try {
      const category = topicId ? state.data?.categories.find(c => c.topicId === topicId) : null;
      if (topicId && (!state.data || !category)) throw new SafetyApiError('invalid_input');
      const data = topicId && category && state.data ? await client.updateProgress({ topicId,
        expectedRevision: category.revision, expectedStateVersion: state.data.stateVersion, milestone: milestone!,
        ...(feeling ? { feeling } : {}) }, { signal: controller.signal }) : await client.getProgress({ signal: controller.signal });
      if (!alive || id !== serial) return null;
      publish({ data, busy: false }); return data;
    } catch (error) {
      if (alive && id === serial) {
        const safe = error instanceof SafetyApiError ? error : new SafetyApiError('request_failed');
        publish({ busy: false, error: safe, ...(safe.status === 401 || accountIsLeaving(safe.code) ? { data: null } : {}) });
      }
      return null;
    }
  }
  return { getState: () => state,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    connect() { alive = true; }, reload: () => run(),
    acknowledge: async (topic: TopicId, milestone: number) => Boolean(await run(topic, milestone)),
    checkIn: async (topic: TopicId, milestone: number, feeling: PreparednessFeeling) => {
      // This is a new explicit user answer, not an automatic write retry. Read
      // first after an uncertain/stale response so an old revision cannot loop.
      if (state.error && !await run()) return false;
      return Boolean(await run(topic, milestone, feeling));
    },
    dispose() { alive = false; serial++; controller?.abort(); listeners.clear(); } };
}
