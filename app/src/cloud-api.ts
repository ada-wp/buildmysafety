import type {
  HealthResponse, MemorySnapshot, PreferenceReset, ProfileChanges, ProfileResponse, ProfileUpdate,
  RecommendationInput, RecommendationResponse, RequestOptions, TaskActionInput, TaskActionResponse,
  CatalogResponse, TaskCollection, LatestRecommendation, OnboardingResponse, OnboardingWrite
} from './api-contracts.ts';

export type SafetyClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/** retryable never authorizes automatic replay. Unknown writes require a fresh read first. */
export class SafetyApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly retryable: boolean;
  readonly conflict: boolean;
  readonly outcomeUnknown: boolean;

  constructor(code: string, status: number | null = null, outcomeUnknown = false) {
    super(outcomeUnknown ? 'The result is not confirmed. Refresh your data before trying again.' :
      status === 409 ? 'Your information changed. Refresh it before trying again.' :
      code === 'authentication_required' ? 'Sign in to continue.' :
      code === 'request_aborted' ? 'The request was cancelled.' : 'The request could not be completed.');
    this.name = 'SafetyApiError';
    this.code = code;
    this.status = status;
    this.outcomeUnknown = outcomeUnknown;
    this.conflict = status === 409;
    this.retryable = !outcomeUnknown && (['network_error', 'request_timeout', 'authentication_unavailable'].includes(code) ||
      status === 408 || status === 429 || (status !== null && status >= 500));
  }
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string';
const nullableText = (value: unknown) => value === null || text(value);
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const positiveInt = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 1;
const version = (value: unknown) => text(value) && /^[1-9]\d*$/.test(value);
const answerKeys = ['why', 'home', 'focus', 'difficulty', 'constraints', 'strengths', 'hope', 'style', 'country'];
const profileKeys = ['answers', 'interests', 'personalizationEnabled', 'elephantName'];
const validFields = (value: unknown, keys: string[], required: string[] = []): value is Record<string, unknown> =>
  record(value) && Object.keys(value).every(key => keys.includes(key)) && required.every(key => Object.hasOwn(value, key));

function input(condition: unknown): asserts condition {
  if (!condition) throw new SafetyApiError('invalid_request');
}
function profileBody(value: ProfileChanges): ProfileChanges {
  input(validFields(value, profileKeys));
  const copy: Record<string, unknown> = {};
  if (Object.hasOwn(value, 'answers')) {
    input(validFields(value.answers, answerKeys));
    const answers: Record<string, unknown> = {};
    for (const [key, answer] of Object.entries(value.answers)) {
      if (['difficulty', 'constraints', 'strengths', 'hope'].includes(key)) {
        input(texts(answer)); answers[key] = [...answer];
      } else { input(nullableText(answer)); answers[key] = answer; }
    }
    copy.answers = answers;
  }
  if (Object.hasOwn(value, 'interests')) { input(texts(value.interests)); copy.interests = [...value.interests]; }
  if (Object.hasOwn(value, 'personalizationEnabled')) { input(typeof value.personalizationEnabled === 'boolean'); copy.personalizationEnabled = value.personalizationEnabled; }
  if (Object.hasOwn(value, 'elephantName')) { input(nullableText(value.elephantName)); copy.elephantName = value.elephantName; }
  return copy as ProfileChanges;
}

function isProfile(value: unknown) {
  if (!record(value) || !record(value.answers)) return false;
  const answers = value.answers;
  return value.schemaVersion === 1 && text(value.userId) && value.userId.length > 0 && positiveInt(value.revision) && text(value.updatedAt) &&
    texts(value.interests) && typeof value.personalizationEnabled === 'boolean' && nullableText(value.signalsResetAt) && nullableText(value.elephantName) &&
    answerKeys.every(key => ['difficulty', 'constraints', 'strengths', 'hope'].includes(key) ? texts(answers[key]) : nullableText(answers[key]));
}
function isTaskState(value: unknown) {
  return record(value) && ['userId', 'actionKey', 'contentRef', 'shownAt'].every(key => text(value[key]) && value[key].length > 0) &&
    ['savedAt', 'removedAt', 'completedAt', 'likedAt', 'feedbackCode', 'feedbackAt'].every(key => nullableText(value[key]));
}
const isProfileResponse = (value: unknown) => record(value) && isProfile(value.profile);
const isMemory = (value: unknown) => record(value) && isProfile(value.profile) && version(value.stateVersion) &&
  Array.isArray(value.taskStates) && value.taskStates.every(isTaskState);
const isTaskAction = (value: unknown) => record(value) && isTaskState(value.task) && version(value.stateVersion) && typeof value.changed === 'boolean';
const isOnboarding = (v: unknown) => record(v) && typeof v.legacyComplete === 'boolean' && (v.progress === null ||
  (record(v.progress) && positiveInt(v.progress.revision) && nullableText(v.progress.completedAt) && text(v.progress.checkpoint) &&
    text(v.progress.updatedAt) && (v.progress.draft === null || record(v.progress.draft))));
function isRecommendation(value: unknown) {
  if (!record(value) || value.status !== 'ok' || !record(value.batch) || !record(value.trace)) return false;
  const { batch, trace } = value;
  if (!['ready', 'no_more_ideas', 'needs_context', 'safety_redirect', 'out_of_scope'].includes(batch.status as string) ||
    !nullableText(batch.message) || !Array.isArray(batch.tasks) || batch.tasks.length > 3 || !batch.tasks.every(task =>
      record(task) && ['action_key', 'title', 'summary', 'done_when'].every(key => text(task[key])) &&
      positiveInt(task.estimated_minutes) && texts(task.concern_ids) && texts(task.steps) && texts(task.purchase_checks) &&
      nullableText(task.no_purchase_option) && Array.isArray(task.resources) && task.resources.every(resource =>
        record(resource) && text(resource.resource_id) && text(resource.why)))) return false;
  if (!positiveInt(trace.contextVersion) || !positiveInt(trace.profileRevision) || !version(trace.stateVersion) ||
    !text(trace.promptHash) || !Number.isSafeInteger(trace.candidateCount) || (trace.candidateCount as number) < 0) return false;
  if (value.source === 'pool') return value.delivery === 'shown' && version(value.stateVersion) &&
    typeof value.reviewRequired === 'boolean' && value.metadata === null;
  const metadata = value.metadata;
  return value.source === 'ai' && value.delivery === 'review_preview' && value.reviewRequired === true && record(metadata) &&
    nullableText(metadata.responseId) && text(metadata.model) &&
    ['inputTokens', 'outputTokens'].every(key => metadata[key] === null ||
      (Number.isSafeInteger(metadata[key]) && (metadata[key] as number) >= 0));
}

// Known machine codes only. Never surface arbitrary server error text or HTML to the UI.
const serverCodes = new Set([
  'task_not_saved', 'request_id_conflict', 'invalid_request_id', 'task_content_unavailable',
  'authentication_required', 'authentication_invalid', 'authentication_unavailable', 'origin_not_allowed', 'adaptation_disabled', 'authentication_not_configured',
  'd1_binding_required', 'storage_unavailable', 'api_key_required', 'model_required', 'profile_not_found', 'task_not_found',
  'route_not_found', 'method_not_allowed', 'profile_exists', 'stale_profile', 'stale_state', 'immutable_content_ref', 'task_already_shown',
  'body_too_large', 'json_required', 'unsupported_topic', 'adaptation_needed', 'rate_limited', 'request_timeout', 'upstream_error',
  'network_or_response_error', 'model_refusal', 'incomplete_output', 'invalid_api_response', 'invalid_output_json', 'internal_error',
  'invalid_body', 'invalid_json', 'invalid_request', 'invalid_profile_changes', 'invalid_profile', 'invalid_country', 'invalid_revision',
  'invalid_state_version', 'invalid_event', 'invalid_action_key', 'invalid_route', 'invalid_task_state', 'invalid_output_shape',
  'invalid_output_status', 'invalid_message', 'invalid_concern', 'missing_concern', 'invalid_resource', 'missing_required_resource',
  'invalid_purchase_checks', 'constraint_violation', 'too_many_linked_tasks', 'repeated_action', 'repeated_outcome', 'unsupported_action',
  'unexpected_link_or_html', 'empty_task_copy', 'copy_too_long', 'context_too_large', 'unknown_concern'
]);

export function createSafetyClient({ baseUrl, getAccessToken, fetchImpl = globalThis.fetch, timeoutMs = 45000 }: SafetyClientOptions) {
  let base: URL;
  try { base = new URL(baseUrl); } catch { throw new SafetyApiError('invalid_client_configuration'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(base.protocol === 'http:' && local)) || base.username || base.password ||
    base.search || base.hash || base.pathname !== '/' || typeof getAccessToken !== 'function' || typeof fetchImpl !== 'function' ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new SafetyApiError('invalid_client_configuration');

  async function call<T>(path: string, method: 'GET' | 'POST' | 'PATCH', body: unknown, check: (data: unknown) => boolean,
    options: RequestOptions = {}, authenticated = true): Promise<T> {
    const caller = options.signal;
    if (caller?.aborted) throw new SafetyApiError('request_aborted');
    let accessToken: string | null | undefined;
    if (authenticated) {
      try { accessToken = await getAccessToken(); }
      catch { throw new SafetyApiError(caller?.aborted ? 'request_aborted' : 'authentication_unavailable'); }
      if (caller?.aborted) throw new SafetyApiError('request_aborted');
      if (accessToken === null || accessToken === undefined || (typeof accessToken === 'string' && !accessToken.trim())) {
        throw new SafetyApiError('authentication_required', 401);
      }
      if (typeof accessToken !== 'string' || accessToken.length > 8192 || !/^[A-Za-z0-9._~+/-]+=*$/.test(accessToken)) {
        throw new SafetyApiError('authentication_invalid', 401);
      }
    }
    const controller = new AbortController();
    let timedOut = false;
    let started = false;
    const abort = () => controller.abort(caller?.reason);
    caller?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(new Error('Request timeout')); }, timeoutMs);
    try {
      if (caller?.aborted) { abort(); throw new SafetyApiError('request_aborted'); }
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const serialized = body === undefined ? undefined : JSON.stringify(body);
      started = true;
      const response = await fetchImpl(new URL(path, base.origin).toString(), {
        method, headers, ...(serialized === undefined ? {} : { body: serialized }),
        signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store'
      });
      if (controller.signal.aborted) throw new Error('Request interrupted');
      let data: unknown;
      try { data = await response.json(); }
      catch {
        if (controller.signal.aborted) throw new Error('Request interrupted');
        throw new SafetyApiError(response.ok ? 'invalid_response' : 'request_failed', response.status, method !== 'GET');
      }
      if (controller.signal.aborted) throw new Error('Request interrupted');
      if (!response.ok) {
        const code = record(data) && text(data.error) && serverCodes.has(data.error) ? data.error : 'request_failed';
        throw new SafetyApiError(code, response.status, method !== 'GET' && response.status >= 500);
      }
      if (!check(data)) throw new SafetyApiError('invalid_response', response.status, method !== 'GET');
      return data as T;
    } catch (error) {
      if (error instanceof SafetyApiError) throw error;
      const unknown = started && method !== 'GET';
      if (caller?.aborted) throw new SafetyApiError('request_aborted', null, unknown);
      if (timedOut) throw new SafetyApiError('request_timeout', null, unknown);
      throw new SafetyApiError(error instanceof SyntaxError ? 'invalid_response' : 'network_error', null, unknown);
    } finally {
      clearTimeout(timer);
      caller?.removeEventListener('abort', abort);
    }
  }

  return {
    health: (options?: RequestOptions) => call<HealthResponse>('/health', 'GET', undefined, v => record(v) && v.ok === true, options, false),
    getMemory: (options?: RequestOptions) => call<MemorySnapshot>('/api/memory', 'GET', undefined, isMemory, options),
    createMemory: (fields: ProfileChanges = {}, options?: RequestOptions) => call<ProfileResponse>('/api/memory', 'POST', profileBody(fields), isProfileResponse, options),
    updateMemory: (update: ProfileUpdate, options?: RequestOptions) => {
      input(validFields(update, ['expectedRevision', 'changes'], ['expectedRevision', 'changes']) && positiveInt(update.expectedRevision));
      return call<ProfileResponse>('/api/memory', 'PATCH', { expectedRevision: update.expectedRevision, changes: profileBody(update.changes) }, isProfileResponse, options);
    },
    resetMemory: (reset: PreferenceReset, options?: RequestOptions) => {
      input(validFields(reset, ['expectedRevision'], ['expectedRevision']) && positiveInt(reset.expectedRevision));
      return call<ProfileResponse>('/api/memory/reset', 'POST', { expectedRevision: reset.expectedRevision }, isProfileResponse, options);
    },
    taskAction: (action: TaskActionInput, options?: RequestOptions) => {
      input(validFields(action, ['expectedStateVersion', 'actionKey', 'event'], ['expectedStateVersion', 'actionKey', 'event']) &&
        version(action.expectedStateVersion) && text(action.actionKey));
      input(validFields(action.event, action.event?.type === 'feedback' ? ['type', 'code'] : ['type'],
        action.event?.type === 'feedback' ? ['type', 'code'] : ['type']));
      input(['save', 'remove', 'complete', 'undo_complete', 'like', 'unlike', 'feedback'].includes(action.event.type));
      const event = action.event.type === 'feedback' ? { type: action.event.type, code: action.event.code } : { type: action.event.type };
      if (event.type === 'feedback') input(nullableText(event.code));
      return call<TaskActionResponse>('/api/tasks/action', 'POST', { expectedStateVersion: action.expectedStateVersion,
        actionKey: action.actionKey, event }, isTaskAction, options);
    },
    recommendations: (selection: RecommendationInput, options?: RequestOptions) => {
      input(validFields(selection, ['request', 'route', 'requestId', 'expectedStateVersion'], ['request']) &&
        (selection.route === undefined || selection.route === 'pool' || selection.route === 'adapt'));
      const r = selection.request;
      input(validFields(r, ['topicId', 'concernIds', 'note', 'country', 'maxMinutes', 'noSpend', 'localSupport'], ['topicId', 'concernIds']) &&
        text(r.topicId) && texts(r.concernIds));
      const request: Record<string, unknown> = { topicId: r.topicId, concernIds: [...r.concernIds] };
      for (const key of ['note', 'country', 'maxMinutes', 'noSpend', 'localSupport'] as const) {
        if (!Object.hasOwn(r, key)) continue;
        const v = r[key];
        input(key === 'note' || key === 'localSupport' ? text(v) : key === 'country' ? nullableText(v) :
          key === 'noSpend' ? v === null || typeof v === 'boolean' : v === null || positiveInt(v));
        request[key] = v;
      }
      if (selection.requestId !== undefined) input(text(selection.requestId));
      if (selection.expectedStateVersion !== undefined) input(version(selection.expectedStateVersion));
      return call<RecommendationResponse>('/api/recommendations', 'POST', { request, ...(selection.route === undefined ? {} : { route: selection.route }),
        ...(selection.requestId ? { requestId: selection.requestId } : {}),
        ...(selection.expectedStateVersion ? { expectedStateVersion: selection.expectedStateVersion } : {}) }, isRecommendation, options);
    },
    getCatalog: (options?: RequestOptions) => call<CatalogResponse>('/api/catalog', 'GET', undefined, v => record(v) &&
      Array.isArray(v.topics) && v.topics.every(t => record(t) && text(t.id) && text(t.label) && Array.isArray(t.concerns) &&
        t.concerns.every(c => record(c) && text(c.id) && text(c.label))) && Array.isArray(v.resources) &&
      v.resources.every(r => record(r) && text(r.id) && text(r.name) && text(r.url) && r.url.startsWith('https://')), options),
    getTasks: (options?: RequestOptions) => call<TaskCollection>('/api/tasks', 'GET', undefined, v => record(v) && version(v.stateVersion) &&
      Number.isSafeInteger(v.earnedCount) && (v.earnedCount as number) >= 0 && Array.isArray(v.tasks) && v.tasks.every(t =>
        record(t) && isTaskState(t.state) && record(t.content) && text(t.content.action_key) && text(t.content.title) && texts(t.content.steps)), options),
    getLatestRecommendation: (options?: RequestOptions) => call<LatestRecommendation>('/api/recommendations/latest', 'GET', undefined,
      v => record(v) && version(v.stateVersion) && (v.result === null || isRecommendation(v.result)), options),
    getOnboarding: (options?: RequestOptions) => call<OnboardingResponse>('/api/onboarding', 'GET', undefined, isOnboarding, options),
    saveOnboarding: (write: OnboardingWrite, complete = false, options?: RequestOptions) => {
      input(Number.isSafeInteger(write.expectedRevision) && write.expectedRevision >= 0 && text(write.checkpoint));
      return call<OnboardingResponse>(complete ? '/api/onboarding/complete' : '/api/onboarding', 'POST', {
        expectedRevision: write.expectedRevision, ...(write.expectedProfileRevision === undefined ? {} : { expectedProfileRevision: write.expectedProfileRevision }),
        draft: profileBody(write.draft), checkpoint: write.checkpoint
      }, isOnboarding, options);
    }
  };
}

export type SafetyClient = ReturnType<typeof createSafetyClient>;
