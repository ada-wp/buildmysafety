/**
 * Real, authored content for the founder's connected development preview.
 * This is not synthetic test data or a professionally/founder-approved catalog.
 * Public delivery must continue to exclude editorial_review records.
 * Never change a published contentRef's body; add a new version instead.
 */
const review = {
  author: 'assistant', editorialCheckedAt: '2026-10-12',
  founderApproved: false, professionalReview: false,
  scope: 'Preventive everyday preparation; no clinical or emergency guidance.'
};

export const sickCareConcerns = [
  { id: 'food', label: 'Food & essentials when I’m unwell' },
  { id: 'check_in', label: 'Someone to check in on me' },
  { id: 'getting_care', label: 'Getting to care or appointments' },
  { id: 'pets', label: 'Pet care while I recover' },
  { id: 'daily_tasks', label: 'Daily tasks when I need to rest' }
];

function task({ key, concerns, title, summary, minutes, steps, done, tags,
  resources = [], purchaseChecks = [], noPurchaseOption = null, ...metadata }) {
  return {
    actionKey: key, outcomeGroup: key, contentRef: `${key}@1`,
    reviewState: 'editorial_review', review: { ...review },
    topicIds: ['sick_care'], concernIds: concerns, outcome: done, tags,
    requiresSpending: false, requiresNearbySupport: false,
    ...metadata,
    task: {
      action_key: key, concern_ids: [...concerns], title, summary,
      estimated_minutes: minutes, steps, done_when: done, resources,
      purchase_checks: purchaseChecks, no_purchase_option: noPurchaseOption
    }
  };
}

export const catalog = {
  version: 'sick-care-editorial-1',
  topics: [{
    id: 'sick_care', label: 'Sick-day care', reviewState: 'editorial_review',
    review: { ...review }, relatedTopicIds: ['meals_one', 'rest', 'asking_help'],
    onboardingFocus: ['sick'],
    scope: 'Prepare for ordinary sick days at home: food, everyday comforts, contact, appointment logistics and pet care. No treatment, symptom assessment or urgent response.',
    concerns: sickCareConcerns,
    guidance: [
      'Prepare useful options in advance. Do not assess symptoms or suggest medication, remedies or delaying care.',
      'Use ordinary items the person already owns. No task requires a purchase or an available nearby helper.',
      'A directory result is only a research lead. Check eligibility, costs and availability directly; do not promise help.',
      'Care-contact and travel tasks are administrative preparation for nonurgent appointments, not decisions about when or where to seek urgent care.',
      'Only suggest pet tasks when the person selects the pet concern. Never assume a pet from living alone.',
      'Keep chosen concerns in charge. Return fewer useful actions when the library cannot support three distinct fits.'
    ]
  }],
  resources: [
    {
      id: 'us_211_local', name: '211 — local community resources',
      url: 'https://211.org/about-us/your-local-211',
      reviewState: 'editorial_review', review: { ...review },
      topicIds: ['sick_care'], countries: ['US'], cost: 'free',
      purpose: 'Find your local US 211 to research practical community support, including food and transportation assistance.',
      limits: '211 provides information and referrals, not a booked service. Eligibility, prices and availability of referred programs vary. No check-in or emergency response is promised.',
      sourceCheckedAt: '2026-10-12',
      sourceUrls: ['https://211.org/about-us/your-local-211', 'https://211.org/about-us', 'https://211.org/get-help/food-programs-food-benefits']
    },
    {
      id: 'us_rover_sitting', name: 'Rover — pet sitter research',
      url: 'https://www.rover.com/pet-sitting/',
      reviewState: 'editorial_review', review: { ...review },
      topicIds: ['sick_care'], countries: ['US'], cost: 'paid',
      purpose: 'Compare potential paid drop-in sitters for cats or dogs in your area before you need one.',
      limits: 'Research is free; bookings cost money. Coverage, prices, pet types, experience and dates vary. A listing is not a confirmed booking or guarantee of suitability.',
      sourceCheckedAt: '2026-10-12', sourceUrls: ['https://www.rover.com/pet-sitting/']
    }
  ],
  actions: [
    task({
      key: 'sick_01_easy_food', concerns: ['food'],
      title: 'Give tomorrow-you two easy food options',
      summary: 'Pick familiar food you’d actually want, so a low-energy day involves one less decision.',
      minutes: 8, tags: ['food', 'prepare', 'low_effort'],
      steps: [
        'Look over food you already have or usually keep at home.',
        'Choose two familiar options that take little preparation; note any ingredient missing from what you have.',
        'Save their names and locations in your usual note, with missing ingredients on your next shopping list.'
      ],
      done: 'Two easy food options are noted, including what you have and anything missing.'
    }),
    task({
      key: 'sick_02_rest_shelf', concerns: ['food', 'daily_tasks'],
      title: 'Give your resting spot a little setup',
      summary: 'Keep everyday comforts close, using a shelf or basket and things you already own.',
      minutes: 10, tags: ['supplies', 'prepare', 'low_effort'],
      steps: [
        'Choose a reachable shelf or basket near where you like to rest.',
        'Gather tissues, a charging cable and another everyday comfort you already use; keep the cable out of walking paths.',
        'Put them together and note any missing item for your next usual shopping trip.'
      ],
      done: 'Your everyday comforts are together, with missing items noted.'
    }),
    task({
      key: 'sick_03_local_help', concerns: ['food', 'check_in', 'getting_care', 'daily_tasks'],
      title: 'Find one local place to ask for help',
      summary: 'You don’t need a nearby friend to start looking for support. Find a real contact and learn what they can offer.',
      minutes: 10, tags: ['services', 'discover', 'no_nearby_support'],
      steps: [
        'Use the linked 211 finder to open your local directory or find its contact details.',
        'Look for your chosen need: food, a check-in, or practical help. Check eligibility, coverage, costs and how to request it.',
        'Save one relevant contact and your next question. If none fits, save the local 211 contact to ask about alternatives.'
      ],
      done: 'A relevant service contact, or your local 211 contact, is saved with a specific question.',
      resources: [{ resource_id: 'us_211_local', why: 'Find your local directory or referral team; ask what practical help matches your need and eligibility.' }]
    }),
    task({
      key: 'sick_04_remote_check_in', concerns: ['check_in'],
      title: 'Make a check-in feel easy to ask for',
      summary: 'If there’s someone you’d like to hear from, a simple agreement can make staying in touch easier—even from far away.',
      minutes: 5, tags: ['people', 'arrange', 'remote_support'],
      steps: [
        'Choose someone you already know and feel comfortable asking; they don’t need to live nearby.',
        'Ask whether a short text or call at a time you choose would work on a future sick day.',
        'Save their reply and the agreed time, or mark the plan as waiting for a reply. No automatic monitoring is involved.'
      ],
      done: 'Your request is sent and clearly marked as agreed or awaiting a reply.',
      prerequisites: ['A person the user already knows and feels comfortable contacting; no nearby helper is required.']
    }),
    task({
      key: 'sick_05_care_contact', concerns: ['getting_care'],
      title: 'Put appointment details where you’ll find them',
      summary: 'A little admin now can spare you a search later. Keep a nonurgent appointment contact easy to reach.',
      minutes: 5, tags: ['care_admin', 'prepare', 'low_effort'],
      steps: [
        'Open the official website of a clinic you use or would consider for a future nonurgent appointment.',
        'Find its appointment phone number or booking page, opening hours, and any new-patient or payment information you need.',
        'Save those details in your usual contacts or note; mark anything you still need to confirm with the clinic.'
      ],
      done: 'One clinic’s appointment contact and any unanswered practical questions are saved.'
    }),
    task({
      key: 'sick_06_appointment_trip', concerns: ['getting_care'],
      title: 'Work out a future appointment trip',
      summary: 'Map one realistic way to get to a nonurgent appointment, without assuming a car or someone available to drive.',
      minutes: 8, tags: ['transport', 'understand', 'no_nearby_support'],
      steps: [
        'Choose a clinic you use or would consider, and look up one travel option you could realistically use.',
        'Check the provider’s own information for cost, booking notice, accessibility and how you would get home.',
        'Save the route or booking contact and any unanswered question. If nothing fits, note the gap to ask the clinic about.'
      ],
      done: 'A possible round trip is saved, or a specific transport question is ready for the clinic.'
    }),
    task({
      key: 'sick_07_pet_care_note', concerns: ['pets'],
      title: 'Leave your pet’s routine ready to share',
      summary: 'Make it easier for a future helper to follow the ordinary routine your pet already knows.',
      minutes: 8, tags: ['pets', 'prepare'], requiresConcernIds: ['pets'],
      steps: [
        'Write your pet’s usual food, feeding times, water routine and everyday needs without changing their existing care.',
        'Note where the everyday supplies are and add your usual vet’s contact details.',
        'Save the note privately where you can share it with an agreed helper; leave keys, codes and home-entry details out.'
      ],
      done: 'A private everyday-care note is ready to share with a helper you choose.'
    }),
    task({
      key: 'sick_08_pet_sitter', concerns: ['pets'],
      title: 'Find a pet sitter worth contacting',
      summary: 'For a cat or dog, compare one possible paid helper now. You’re researching a future option, not booking care today.',
      minutes: 12, tags: ['pets', 'services', 'discover', 'no_nearby_support'], requiresConcernIds: ['pets'],
      steps: [
        'Open the linked sitter search and look for drop-in visits in your area for your cat or dog.',
        'Compare relevant pet experience, recent reviews, total fees and cancellation terms; treat calendar availability as something to confirm.',
        'Save one profile and a question to ask before a meet-and-greet. If none fits, note that care is still unarranged.'
      ],
      done: 'One potential sitter and a question are saved, or the care gap is clearly noted.',
      resources: [{ resource_id: 'us_rover_sitting', why: 'Research paid drop-in sitters, compare fit and fees, then confirm availability directly before arranging care.' }],
      purchaseChecks: ['Confirm experience with your pet and its routine.', 'Check total fees, cancellation terms and confirmed dates.'],
      noPurchaseOption: 'You can prepare the pet-care note without booking or paying anyone.',
      prerequisites: ['Research applies to cats or dogs; another pet type needs a suitable specialist.']
    }),
    task({
      key: 'sick_09_pause_chore', concerns: ['daily_tasks'],
      title: 'Give one nonessential chore a day off',
      summary: 'Make a little room for rest. Choose one ordinary job that can wait without creating another problem.',
      minutes: 4, tags: ['effort', 'arrange', 'low_effort'],
      steps: [
        'Choose one nonessential chore, such as folding clean laundry. Leave care duties and time-sensitive responsibilities out.',
        'Move it to a later day you choose, or remove it if it no longer matters.',
        'Update your usual reminder or note so you don’t need to keep it in mind.'
      ],
      done: 'One nonessential chore is rescheduled or removed from your usual reminder.'
    })
  ]
};
