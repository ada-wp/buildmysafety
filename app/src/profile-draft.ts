import type { ProfileAnswers, TopicId, UserProfile } from './api-contracts.ts';

/** Editable information only. The server creates identity, revision and dates after saving. */
export type ProfileDraft = {
  answers: ProfileAnswers;
  interests: TopicId[];
  personalizationEnabled: boolean;
  elephantName: string | null;
};

export function emptyDraft(): ProfileDraft {
  return {
    answers: { why: null, home: null, focus: null, difficulty: [], constraints: [], strengths: [], hope: [], style: null, country: null },
    interests: [], personalizationEnabled: true, elephantName: null
  };
}

export function editableProfile(profile: UserProfile): ProfileDraft {
  return structuredClone({ answers: profile.answers, interests: profile.interests,
    personalizationEnabled: profile.personalizationEnabled, elephantName: profile.elephantName });
}
