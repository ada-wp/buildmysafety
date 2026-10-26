import type { CategoryProgress, PreparednessFeeling, ProgressResponse, ProgressUpdate } from './api-contracts.ts';

export const MILESTONES = [1, 3, 6, 9, 10] as const;
export const FEELING_LABELS: Record<PreparednessFeeling, string> = {
  unsure: 'Still unsure', somewhat: 'Somewhat prepared', ready: 'Prepared enough for now'
};
export const MILESTONE_MESSAGES: Record<number, string> = {
  1: 'Your first step! I’m growing with you. Here’s a little hug.',
  3: 'I’m getting stronger with you. A big hug from your protector.',
  6: 'Look at what you’re building. I’m growing right alongside you. Come here.',
  9: 'Nine steps! I’m proud to be your protector. Here’s an extra squeeze.',
  10: 'Look how far we’ve grown together. I’m proud to be your protector. Biggest hug yet.'
};
const record = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const milestone = (v: unknown): v is number => MILESTONES.some(n => n === v);
const feeling = (v: unknown): v is PreparednessFeeling => typeof v === 'string' && Object.hasOwn(FEELING_LABELS, v);
export function isProgressResponse(v: unknown): v is ProgressResponse {
  return record(v) && typeof v.stateVersion === 'string' && /^[1-9][0-9]*$/.test(v.stateVersion) &&
    Array.isArray(v.categories) && new Set(v.categories.map(c => record(c) ? c.topicId : null)).size === v.categories.length &&
    v.categories.every(c => record(c) && typeof c.topicId === 'string' && /^[a-z_]{1,40}$/.test(c.topicId) &&
      ['completedCount', 'pendingCount', 'earnedCount', 'revision'].every(key => natural(c[key])) &&
      Array.isArray(c.seenMilestones) && c.seenMilestones.every(milestone) && new Set(c.seenMilestones).size === c.seenMilestones.length &&
      (c.latestCheckIn === null || record(c.latestCheckIn) && feeling(c.latestCheckIn.feeling) && milestone(c.latestCheckIn.milestone) &&
        typeof c.latestCheckIn.answeredAt === 'string' && Number.isFinite(Date.parse(c.latestCheckIn.answeredAt))));
}
export function validProgressUpdate(v: unknown): v is ProgressUpdate {
  return record(v) && Object.keys(v).every(key => ['topicId', 'expectedRevision', 'expectedStateVersion', 'milestone', 'feeling'].includes(key)) &&
    typeof v.topicId === 'string' && /^[a-z_]{1,40}$/.test(v.topicId) && natural(v.expectedRevision) &&
    typeof v.expectedStateVersion === 'string' && /^[1-9][0-9]*$/.test(v.expectedStateVersion) && milestone(v.milestone) &&
    (!Object.hasOwn(v, 'feeling') || feeling(v.feeling));
}
export const nextMilestone = (count: number): number | null => MILESTONES.find(n => n > count) ?? null;
export const reachedMilestone = (progress: CategoryProgress): number | null =>
  [...MILESTONES].reverse().find(n => n <= progress.completedCount) ?? null;
export const newMilestone = (progress: CategoryProgress): number | null =>
  MILESTONES.find(n => n === progress.completedCount && !progress.seenMilestones.includes(n)) ?? null;
