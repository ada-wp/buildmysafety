export type Answers = {
  why: string | null; home: string | null; focus: string | null;
  difficulty: string[]; constraints: string[]; strengths: string[];
  hope: string[]; style: string | null; country: string | null;
};
export type Profile = {
  schemaVersion: 1; userId: string; revision: number; updatedAt: string;
  answers: Answers; interests: string[]; personalizationEnabled: boolean;
  signalsResetAt: string | null; elephantName: string | null;
};
export const emptyProfile = (userId = 'anonymous'): Profile => ({
  schemaVersion: 1, userId, revision: 1, updatedAt: new Date().toISOString(),
  answers: {why:null, home:null, focus:null, difficulty:[], constraints:[], strengths:[], hope:[], style:null, country:null},
  interests: [], personalizationEnabled: true, signalsResetAt: null, elephantName: null
});
export type Resource = {id: string; title: string; url: string; purpose: string; checkedOn: string};
export type Task = {
  id: string; actionKey: string; version: 1; topic: 'sick_care'; title: string;
  minutes: number; summary: string; steps: string[]; doneWhen: string;
  concerns: string[]; angle: string; tags: string[]; countries: string[];
  resourceIds: string[]; purchaseChecks?: string[];
  review: {kind: 'founder_reference' | 'editorial'; note: string};
};
export type TaskState = {
  action_key: string; content_id: string; shown_at: string;
  saved_at: string | null; removed_at: string | null; completed_at: string | null; liked_at: string | null;
  feedback_code: string | null; feedback_at: string | null;
};
export type Me = {profile: Profile | null; tasks: TaskState[]; awards: number};
export type Batch = {requestId: string; tasks: Task[]; resources: Resource[]; status: 'ready'|'exhausted'|'unsupported'; message?: string; source: 'reviewed_pool'};
