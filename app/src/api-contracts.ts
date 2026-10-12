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
export type TaskActionEvent = { type: 'save' | 'remove' | 'complete' | 'like' | 'unlike' } |
  { type: 'feedback'; code: FeedbackCode | null };
export type TaskActionInput = { expectedStateVersion: string; actionKey: string; event: TaskActionEvent };
export type TaskActionResponse = { task: TaskState; stateVersion: string; changed: boolean };

export type RecommendationRequest = {
  topicId: TopicId;
  concernIds: string[];
  note?: string;
  country?: string | null;
  maxMinutes?: number | null;
  noSpend?: boolean | null;
  localSupport?: 'available' | 'unavailable' | 'unknown';
};
export type RecommendationInput = { request: RecommendationRequest; route?: 'pool' | 'adapt' };
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
  batch: TaskBatch;
  trace: RecommendationTrace;
} & ({ source: 'pool'; delivery: 'shown'; stateVersion: string; reviewRequired: boolean; metadata: null } |
  { source: 'ai'; delivery: 'review_preview'; reviewRequired: true; metadata: GenerationMetadata });
export type HealthResponse = { ok: true };
export type RequestOptions = { signal?: AbortSignal };
