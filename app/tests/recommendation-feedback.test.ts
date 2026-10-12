import test from 'node:test';
import assert from 'node:assert/strict';
import type { RecommendationResponse } from '../src/api-contracts.ts';
import { recommendationFeedback } from '../src/recommendation-feedback.ts';

test('typed request keeps its form on decline, failure, quota and empty-success responses', () => {
  for (const status of ['unavailable', 'limit_reached', 'out_of_scope', 'safety_redirect', 'no_new_idea', 'needs_context', 'generated']) {
    const result = { batch: { tasks: [], message: 'A clear explanation.' }, adaptation: { status } } as unknown as RecommendationResponse;
    assert.deepEqual(recommendationFeedback(result, true), { openIdeas: false, notice: 'A clear explanation.' });
  }
  assert.equal(recommendationFeedback(null, true).openIdeas, false);
});
test('a typed need must receive a generated task; a generic pool fallback cannot erase the draft', () => {
  const result = { batch: { tasks: [{}], message: null }, adaptation: { status: 'unavailable', message: 'Try later.' } } as unknown as RecommendationResponse;
  assert.deepEqual(recommendationFeedback(result, true), { openIdeas: false, notice: 'Try later.' });
  result.adaptation!.status = 'generated';
  assert.equal(recommendationFeedback(result, true).openIdeas, true);
  assert.equal(recommendationFeedback(result, false).openIdeas, true);
});
test('ordinary selection can open an exhausted collection with its next-action explanation', () => {
  const result = { batch: { tasks: [], message: 'Tell us what you need.' }, adaptation: { status: 'not_needed' } } as unknown as RecommendationResponse;
  assert.equal(recommendationFeedback(result, false).openIdeas, true);
});
