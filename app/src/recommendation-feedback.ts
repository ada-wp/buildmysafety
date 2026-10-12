import type { RecommendationResponse } from './api-contracts';

// A successful HTTP request is not necessarily a successful answer to her note.
// Keep the form/draft when the server declined or could not create a new task.
export function recommendationFeedback(result: RecommendationResponse | null | undefined, typedRequest: boolean) {
  if (typedRequest && (result?.adaptation?.status !== 'generated' || !result.batch.tasks.length)) {
    return { openIdeas: false, notice: result?.batch.message || result?.adaptation?.message ||
      'No new step was created. Your words are still here; you can edit them and try again.' };
  }
  return { openIdeas: true, notice: '' };
}
