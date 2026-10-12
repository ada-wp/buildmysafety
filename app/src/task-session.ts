import { SafetyApiError, type SafetyClient } from './cloud-api.ts';
import type { CatalogResponse, LatestRecommendation, RecommendationRequest, TaskActionEvent, TaskCollection } from './api-contracts.ts';

type TaskClient = Pick<SafetyClient, 'getCatalog' | 'getTasks' | 'getLatestRecommendation' | 'recommendations' | 'taskAction'>;
export type TaskSessionState = { catalog: CatalogResponse | null; collection: TaskCollection | null;
  latest: LatestRecommendation | null; busy: boolean; error: SafetyApiError | null; loaded: boolean };

/** Portable account-scoped controller. Cloud state is authoritative; no browser persistence. */
export function createTaskSession(client: TaskClient, makeId: () => string = () => crypto.randomUUID()) {
  let state: TaskSessionState = { catalog: null, collection: null, latest: null, busy: false, error: null, loaded: false };
  let disposed = false;
  let ticket = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<TaskSessionState>) => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const valid = (id: number) => !disposed && id === ticket;
  async function read(signal: AbortSignal) {
    const catalog = state.catalog ?? await client.getCatalog({ signal });
    // Latest includes the committed batch. Read tasks afterwards so it contains that delivery.
    const latest = await client.getLatestRecommendation({ signal });
    const collection = await client.getTasks({ signal });
    return { catalog, latest, collection, loaded: true };
  }
  async function run(action?: (signal: AbortSignal) => Promise<unknown>) {
    if (disposed || state.busy) return false;
    const id = ++ticket;
    controller = new AbortController();
    publish({ busy: true, error: null });
    try {
      if (action) await action(controller.signal);
      if (!valid(id)) return false;
      const data = await read(controller.signal);
      if (!valid(id)) return false;
      publish({ ...data, busy: false });
      return true;
    } catch (error) {
      if (!valid(id)) return false;
      const safe = error instanceof SafetyApiError ? error : new SafetyApiError('request_failed');
      publish({ busy: false, error: safe, ...(safe.status === 401 ? { collection: null, latest: null, loaded: false } : {}) });
      return false;
    }
  }
  return {
    connect() { disposed = false; publish({ busy: false }); },
    getState: () => state,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    load: () => run(),
    recommend(request: RecommendationRequest) {
      if (!state.collection || state.error) return Promise.resolve(false);
      const expectedStateVersion = state.collection.stateVersion;
      const requestId = makeId();
      return run(signal => client.recommendations({ request: structuredClone(request), requestId, expectedStateVersion, route: 'auto' }, { signal }));
    },
    act(actionKey: string, event: TaskActionEvent) {
      if (!state.collection || state.error) return Promise.resolve(false);
      const expectedStateVersion = state.collection.stateVersion;
      return run(signal => client.taskAction({ actionKey, event, expectedStateVersion }, { signal }));
    },
    dispose() { disposed = true; ticket++; controller?.abort(); listeners.clear(); }
  };
}
