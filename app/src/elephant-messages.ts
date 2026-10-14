import type { ProfileAnswers, TopicId } from './api-contracts.ts';
import type { ProfileDraft } from './profile-draft.ts';

export type ElephantMessage = { title: string; body: string };
export type AcknowledgementInput = {
  why: ProfileAnswers['why'];
  difficulty: readonly ProfileAnswers['difficulty'][number][];
  /** A temporary answer, including null when skipped. Never added to the profile. */
  feeling: string | null;
};

/** Authored acknowledgments only; an answer never becomes a diagnosis or a risk score. */
export function acknowledgementMessage({ why, difficulty, feeling }: AcknowledgementInput): ElephantMessage {
  if (feeling === 'overwhelmed') return {
    title: 'There’s room to start small.',
    body: 'We can take this slowly. You don’t need to figure everything out today—there’s room to start small.'
  };
  if (difficulty.includes('alone') || difficulty.includes('support')) return {
    title: 'Support can be part of this.',
    body: 'That can be a lot to carry. You can be capable and still want support. We’ll look for small ways to make things feel more manageable.'
  };
  if (why === 'curious' || feeling === 'okay') return {
    title: 'A little preparation, a little more room.',
    body: 'You don’t need a big worry to begin. A little preparation can leave more room for enjoying life on your own.'
  };
  return {
    title: 'Let’s find your starting point.',
    body: 'We can start wherever feels useful to you, and build from there. You get to choose the pace and what you take on.'
  };
}

// Sentence fragments, not category labels: choosing an interest does not establish a problem.
const interestPhrases: Record<TopicId, string> = {
  sick_care: 'sick days', meals_one: 'meals for one', home_confidence: 'everyday home repairs',
  unexpected: 'power-cut preparation', asking_help: 'people and services to turn to',
  neighbors: 'getting to know your neighbors', own_company: 'enjoying time on your own',
  grounded: 'more settled evenings', boundaries: 'boundaries for visitors',
  out_about: 'going out on your own', digital: 'your privacy online', pet_care: 'pet-care plans',
  solo_travel: 'solo travel', life_change: 'a new home and routines',
  daily_upkeep: 'everyday chores', rest: 'low-energy days'
};
const focusPhrases: Partial<Record<NonNullable<ProfileAnswers['focus']>, string>> = {
  sick: 'sick days', home: 'feeling prepared at home', daily: 'everyday responsibilities',
  people: 'finding support', peace: 'finding your footing', change: 'navigating a change'
};

function practicalApproach(constraints: ProfileAnswers['constraints']): string {
  if (constraints.includes('cost') && constraints.includes('energy')) {
    return 'We’ll look for something manageable, using what you already have.';
  }
  if (constraints.includes('cost') && constraints.includes('time')) {
    return 'We’ll look for quick ideas using what you already have.';
  }
  if (constraints.includes('cost')) return 'We’ll favor ideas using what you already have.';
  if (constraints.includes('energy') && constraints.includes('time')) return 'We’ll look for short, manageable actions.';
  if (constraints.includes('energy')) return 'We’ll look for something manageable.';
  if (constraints.includes('time')) return 'We’ll look for something that fits a little time.';
  if (constraints.includes('support')) return 'We’ll explore options that don’t depend on nearby help.';
  if (constraints.includes('start')) return 'We’ll keep the starting point clear.';
  return '';
}

/** A preview of how explicit preferences guide the established flow, without generating tasks. */
export function startingPointMessage(draft: ProfileDraft): ElephantMessage {
  if (!draft.personalizationEnabled) return {
    title: 'Explore at your own pace.',
    body: 'You can explore at your own pace. You choose what feels useful enough to add to your list.'
  };
  const { answers, interests } = draft;
  // Several interests express breadth, not a ranking. Never promote whichever came first.
  const area = interests.length === 1 ? interestPhrases[interests[0]] :
    interests.length === 0 && answers.focus ? focusPhrases[answers.focus] : undefined;
  const intro = interests.length > 1 ?
    `${answers.style === 'one' ? 'Let’s start small with' : 'Let’s start with'} what you’d like to explore.` : area ?
    `${answers.style === 'one' ? 'Let’s start small with' : 'Let’s explore'} ${area}.` :
    answers.style === 'one' ? 'Let’s start small with what feels useful to you.' :
      'Let’s find a starting point that suits you.';
  const ending = answers.style === 'understand' ? 'You can see what’s involved before choosing what to add.' :
    answers.style === 'resources' ? 'We’ll include useful resources where they help. You choose what to add.' :
    'You choose what feels useful enough to add to your list.';
  return {
    title: answers.style === 'one' ? 'A small place to begin.' : 'A starting point for you.',
    body: [intro, practicalApproach(answers.constraints), ending].filter(Boolean).join(' ')
  };
}
