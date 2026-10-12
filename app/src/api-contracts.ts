/** Wire types for personalization/http.mjs. These contain no storage or UI assumptions. */
export type TopicId = 'sick_care' | 'meals_one' | 'home_confidence' | 'unexpected' | 'asking_help' |
  'neighbors' | 'own_company' | 'grounded' | 'boundaries' | 'out_about' | 'digital' | 'pet_care' |
  'solo_travel' | 'life_change' | 'daily_upkeep' | 'rest';

export type ProfileAnswers = {
  why: 'ease' | 'trust' | 'change' | 'unprepared' | 'curious' | null;
  home: 'alone' | 'preparing' | 'sometimes' | 'shared' | null;
  focus: 'sick' | 'home' | 'daily' | 'people' | 'peace' | 'change' | 'unsure' | null;
  difficulty: Array<'uncertain' | 'alone' | 'support' | 'judgment' | 'too_much' | 'other'>;
  constraints: Array<'energy' | 'time' | 'cost' | 'support' | 'start' | 'none'>;
  strengths: Array<'person' | 'routine' | 'prepared' | 'experience' | 'learning' | 'discovering'>;
  hope: Array<'start' | 'prepared' | 'support' | 'trust' | 'choice'>;
  style: 'one' | 'choice' | 'understand' | 'resources' | null;
  country: string | null;
};

export type UserProfile = {
  schemaVersion: 1;
  userId: string;
  revision: number;
  updatedAt: string;
  answers: ProfileAnswers;
  interests: TopicId[];
  personalizationEnabled: boolean;
  signalsResetAt: string | null;
  elephantName: string | null;
};

/** Only these fields may be written by a client. Identity, versions and dates are server-owned. */
export type ProfileChanges = {
  answers?: Partial<ProfileAnswers>;
  interests?: TopicId[];
  personalizationEnabled?: boolean;
  elephantName?: string | null;
};
export type ProfileResponse = { profile: UserProfile };
export type ProfileUpdate = { expectedRevision: number; changes: ProfileChanges };
export type PreferenceReset = { expectedRevision: number };
export type AccountDeletion = { status: 'pending' | 'deleted'; requestedAt: string; completedAt: string | null };
export type AccountStatus = { deletion: AccountDeletion | null; deletionAvailable: boolean };
export type AccountExport = {
  schemaVersion: 1; exportedAt: string; accountId: string; scope: string;
  profile: Record<string, unknown> | null; onboarding: Record<string, unknown> | null;
  tasks: Record<string, unknown>[]; sharedTaskContent: Record<string, unknown>[];
  privateTaskContent: Record<string, unknown>[]; awards: Record<string, unknown>[];
  latestBatch: Record<string, unknown> | null; aiUsage: Record<string, unknown>[];
};

export type FeedbackCode = 'helpful' | 'too_generic' | 'too_much_effort' | 'too_expensive' |
  'already_done' | 'not_relevant_now';
export type TaskState = {
  userId: string;
  actionKey: string;
  contentRef: string;
  shownAt: string;
  savedAt: string | null;
  removedAt: string | null;
  completedAt: string | null;
  likedAt: string | null;
  feedbackCode: FeedbackCode | null;
  feedbackAt: string | null;
};
export type MemorySnapshot = { profile: UserProfile; taskStates: TaskState[]; stateVersion: string };
export type TaskActionEvent = { type: 'save' | 'remove' | 'complete' | 'undo_complete' | 'like' | 'unlike' } |
  { type: 'feedback'; code: FeedbackCode | null };
export type TaskActionInput = { expectedStateVersion: string; actionKey: string; event: TaskActionEvent };
export type TaskActionResponse = { task: TaskState; stateVersion: string; changed: boolean; earnedCount?: number; awardEarned?: boolean };

export type RecommendationRequest = {
  topicId: TopicId;
  concernIds: string[];
  note?: string;
  refineActionKey?: string;
  country?: string | null;
  maxMinutes?: number | null;
  noSpend?: boolean | null;
  localSupport?: 'available' | 'unavailable' | 'unknown';
};
export type RecommendationInput = { request: RecommendationRequest; route?: 'pool' | 'adapt' | 'auto'; requestId?: string; expectedStateVersion?: string };
export type RecommendationTask = {
  action_key: string;
  concern_ids: string[];
  title: string;
  summary: string;
  estimated_minutes: number;
  steps: string[];
  done_when: string;
  resources: Array<{ resource_id: string; why: string }>;
  purchase_checks: string[];
  no_purchase_option: string | null;
};
export type TaskBatch = {
  status: 'ready' | 'no_more_ideas' | 'needs_context' | 'safety_redirect' | 'out_of_scope';
  message: string | null;
  tasks: RecommendationTask[];
};
export type RecommendationTrace = {
  contextVersion: number;
  profileRevision: number;
  stateVersion: string;
  promptHash: string;
  candidateCount: number;
};
export type GenerationMetadata = {
  responseId: string | null;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};
export type RecommendationResponse = {
  status: 'ok';
  request?: RecommendationRequest;
  requestId?: string;
  batch: TaskBatch;
  trace: RecommendationTrace;
  adaptation?: { status: string; actionKey: string | null; message?: string | null; refinement?: boolean; newNeed?: boolean };
} & ({ source: 'pool'; delivery: 'shown'; stateVersion: string; reviewRequired: boolean; metadata: null } |
  { source: 'mixed'; delivery: 'shown'; stateVersion: string; reviewRequired: true; metadata: GenerationMetadata } |
  { source: 'ai'; delivery: 'review_preview'; reviewRequired: true; metadata: GenerationMetadata });
export type HealthResponse = { ok: true };
export type RequestOptions = { signal?: AbortSignal };

export type CatalogResponse = {
  topics: Array<{ id: TopicId; label: string; scope: string; concerns: Array<{ id: string; label: string }> }>;
  resources: Array<{ id: string; name: string; url: string; purpose: string; limits: string }>;
};
export type TaskCollection = { tasks: Array<{ state: TaskState; content: RecommendationTask }>; stateVersion: string; earnedCount: number };
export type LatestRecommendation = { result: RecommendationResponse | null; stateVersion: string };
export type OnboardingProgress = { revision: number; draft: ProfileChanges | null; checkpoint: string; completedAt: string | null; updatedAt: string };
export type OnboardingResponse = { progress: OnboardingProgress | null; legacyComplete: boolean };
export type OnboardingWrite = { expectedRevision: number; expectedProfileRevision?: number; draft: ProfileChanges; checkpoint: string };
