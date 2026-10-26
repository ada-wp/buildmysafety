import type { TopicId } from './api-contracts.ts';

// Interest choices express curiosity; they do not claim these task collections are available.
export const interestLabels: Record<TopicId, string> = {
  sick_care: 'Sick-day care', meals_one: 'Meals for one', home_confidence: 'Home repairs', unexpected: 'Power-cut prep',
  asking_help: 'People to call', neighbors: 'Knowing neighbors', own_company: 'Enjoying time alone', grounded: 'Settled evenings',
  boundaries: 'Visitor boundaries', out_about: 'Going out solo', digital: 'Privacy online', pet_care: 'Pet-care plans',
  solo_travel: 'Solo travel', life_change: 'New home & routines', daily_upkeep: 'Everyday chores', rest: 'Low-energy days'
};

export const interestEntries = Object.entries(interestLabels) as Array<[TopicId, string]>;
