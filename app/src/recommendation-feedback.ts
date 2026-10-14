import type { AiQuota, RecommendationResponse } from './api-contracts';

export function validAiQuota(value: unknown): value is AiQuota {
  if (!value || typeof value !== 'object') return false;
  const q = value as Partial<AiQuota>;
  return ['user', 'shared'].includes(q.scope || '') && Number.isSafeInteger(q.limit) && (q.limit || 0) > 0 &&
    typeof q.resetsAt === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(q.resetsAt) && Number.isFinite(Date.parse(q.resetsAt));
}

export function activeAiQuota(result: RecommendationResponse | null | undefined, now = Date.now()): AiQuota | null {
  const quota = result?.adaptation?.quota;
  return result?.adaptation?.status === 'limit_reached' && validAiQuota(quota) && Date.parse(quota.resetsAt) > now ? quota : null;
}

// A successful HTTP request is not necessarily a successful answer to her note.
// Keep the form/draft when the server declined or could not create a new task.
export function recommendationFeedback(result: RecommendationResponse | null | undefined, typedRequest: boolean) {
  if (typedRequest && (result?.adaptation?.status !== 'generated' || !result.batch.tasks.length)) {
    return { openIdeas: false, notice: result?.batch.message || result?.adaptation?.message ||
      'No new step was created. Your words are still here; you can edit them and try again.' };
  }
  return { openIdeas: true, notice: '' };
}
