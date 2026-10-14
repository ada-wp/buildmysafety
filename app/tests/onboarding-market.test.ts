import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, questionStep } from '../src/onboarding.ts';
import { emptyDraft, editableProfile } from '../src/profile-draft.ts';
import { SERVICE_COUNTRY } from '../src/service-market.ts';

test('US coverage removes the country question; older checkpoints continue to the optional note', () => {
  assert.equal(questions.some(q => q.id === 'country'), false);
  assert.equal(questions[questionStep('country')].id, 'note');
  assert.equal(questions[questionStep('style') + 1].id, 'note');
  assert.equal(questionStep('unknown'), 0);
});

test('US service coverage does not invent or overwrite a personal location', () => {
  assert.equal(SERVICE_COUNTRY, 'US');
  assert.equal(emptyDraft().answers.country, null);
  const draft = emptyDraft(); draft.answers.country = 'CA';
  // Stored location is independent of the current app market.
  assert.equal(editableProfile({ ...draft, userId: 'test', revision: 1,
    updatedAt: '2026-10-14T00:00:00Z', schemaVersion: 1, signalsResetAt: null }).answers.country, 'CA');
});
