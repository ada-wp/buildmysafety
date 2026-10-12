import assert from 'node:assert/strict';
import test from 'node:test';
import { addSampleTask, completeSampleTask, parsePreviewRoute, previewHash, sampleTasks } from '../src/task-preview.ts';
import type { TopicId } from '../src/api-contracts.ts';

test('sample add and completion are idempotent and reject unknown or unsaved tasks', () => {
  const id = sampleTasks[0].id;
  const saved = addSampleTask([], id);
  assert.deepEqual(addSampleTask(saved, id), saved);
  assert.deepEqual(addSampleTask(saved, 'invented'), saved);
  assert.deepEqual(completeSampleTask([], [], id), []);
  const done = completeSampleTask(saved, [], id);
  assert.deepEqual(completeSampleTask(saved, done, id), done);
  assert.deepEqual(completeSampleTask(saved, done, 'invented'), done);
  // Removing and re-adding a task does not earn a second completion.
  assert.deepEqual(completeSampleTask(addSampleTask([], id), done, id), [id]);
});

test('public app routes round-trip and invalid or unsupported detail routes fall back to Explore', () => {
  const topics: TopicId[] = ['sick_care', 'pet_care'];
  for (const route of [
    { page: 'explore' }, { page: 'list' }, { page: 'topic', topic: 'pet_care' },
    { page: 'concerns', topic: 'sick_care' }, { page: 'ideas', topic: 'sick_care' },
    { page: 'task', task: sampleTasks[0].id }, { page: 'complete', task: sampleTasks[0].id }
  ] as const) assert.deepEqual(parsePreviewRoute(previewHash(route), topics), route);
  for (const hash of ['#/app/ideas/pet_care', '#/app/concerns/unknown', '#/app/task/invented', '#/app/complete/invented', '#/app/bad', '#/recap']) {
    assert.deepEqual(parsePreviewRoute(hash, topics), { page: 'explore' });
  }
});
