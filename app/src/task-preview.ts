import type { TopicId } from './api-contracts.ts';

/** Authored interaction samples, not a production recommendation catalog. */
export type PreviewTask = {
  id: string;
  title: string;
  minutes: number;
  description: string;
  steps: readonly string[];
  doneWhen: string;
};

export const sickDayConcerns = [
  ['food', 'Food & essentials when I’m unwell'],
  ['check_in', 'Someone to check in on me'],
  ['getting_care', 'Getting to care or appointments'],
  ['pets', 'Pet care while I recover'],
  ['daily_tasks', 'Daily tasks when I need to rest']
] as const;

// Adapted from the existing shelf/food design and writing-test examples.
// The shelf excludes food here so it does not repeat the separate meal outcome.
// No clinical guidance, external resource claims or paid service assumptions.
export const sampleTasks: readonly PreviewTask[] = [
  {
    id: 'sick-shelf', title: 'Set up a sick-day shelf', minutes: 10,
    description: 'A few familiar essentials within reach when you need to rest.',
    steps: [
      'Choose a reachable shelf or basket near where you usually rest.',
      'Gather tissues, a charging cable and other everyday comforts you already own.',
      'Note one missing item for your next usual shopping trip.'
    ],
    doneWhen: 'Your essentials are together, with any missing item noted.'
  },
  {
    id: 'easy-food', title: 'Choose familiar easy foods', minutes: 8,
    description: 'Give a low-energy day two familiar food options to fall back on.',
    steps: [
      'Look over food you already have or commonly keep at home.',
      'Choose two options that take little preparation and sound familiar to you.',
      'Write their names and where to find them somewhere you already use.'
    ],
    doneWhen: 'Two familiar, low-preparation food options and their locations are noted.'
  },
  {
    id: 'let-chore-wait', title: 'Let one chore wait', minutes: 4,
    description: 'Make a little room for rest by moving one nonessential job.',
    steps: [
      'Choose one nonessential chore that could wait, such as folding clean laundry.',
      'Move it to a later day that you choose.',
      'Update the reminder or note you normally use, so you do not have to keep it in mind.'
    ],
    doneWhen: 'One nonessential chore has a new day in your usual reminder or note.'
  }
];

export type PreviewRoute =
  | { page: 'explore' | 'list' }
  | { page: 'topic'; topic: TopicId }
  | { page: 'concerns' | 'ideas'; topic: 'sick_care' }
  | { page: 'task' | 'complete'; task: string };

export function previewTask(id: string): PreviewTask | undefined {
  return sampleTasks.find(task => task.id === id);
}

export function previewHash(route: PreviewRoute): string {
  return `#/app/${route.page}${'topic' in route ? `/${route.topic}` : 'task' in route ? `/${route.task}` : ''}`;
}

/** Public navigation IDs only; no answers, notes or user identifiers in URLs. */
export function parsePreviewRoute(hash: string, topics: readonly TopicId[]): PreviewRoute {
  const [root, page, id] = hash.replace(/^#\//, '').split('/');
  if (root !== 'app') return { page: 'explore' };
  if (page === 'list') return { page: 'list' };
  if (page === 'topic' && topics.includes(id as TopicId)) return { page: 'topic', topic: id as TopicId };
  if ((page === 'concerns' || page === 'ideas') && id === 'sick_care') return { page, topic: 'sick_care' };
  if ((page === 'task' || page === 'complete') && previewTask(id)) return { page, task: id };
  return { page: 'explore' };
}

export function addSampleTask(saved: readonly string[], id: string): string[] {
  return !previewTask(id) || saved.includes(id) ? [...saved] : [...saved, id];
}

export function completeSampleTask(saved: readonly string[], completed: readonly string[], id: string): string[] {
  return !saved.includes(id) || !previewTask(id) || completed.includes(id) ? [...completed] : [...completed, id];
}
