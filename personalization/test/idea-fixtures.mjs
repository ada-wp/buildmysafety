// Fictional model responses for transport/storage tests, never product content.
const task = (key, title, steps, done) => ({ action_key: key, concern_ids: ['daily_tasks'], title,
  summary: 'An optional preparation for a quieter rest day.', estimated_minutes: 5,
  steps, done_when: done, resources: [], purchase_checks: [], no_purchase_option: null });
export const extraIdeas = () => [
  task('offline_entertainment', 'Keep something enjoyable available offline',
    ['Choose an audio episode you already have access to.', 'Find its download setting and save it over Wi-Fi.', 'Check that the episode appears in your downloads.'],
    'One audio episode is available without an internet connection.'),
  task('dim_room_light', 'Make room lighting easier to control',
    ['Find a lamp you can switch off from where you rest.', 'Move its control within comfortable reach without trailing cables.', 'Keep a clear path between your bed and the bathroom.'],
    'A reachable light control is ready beside a clear walking route.')
];
export const petIdeas = () => [
  { ...task('pet_food_portions', 'Make usual pet feeding easier to explain',
    ['Check the portion guidance you already follow for your pet.', 'Put the matching scoop beside the usual food container.', 'Label the scoop with the usual serving amount for a future carer.'],
    'The usual food scoop is labeled with its familiar serving amount.'), concern_ids: ['pets'] },
  { ...task('carrier_ready', 'Make the pet carrier easy to find',
    ['Locate the carrier you already use for your pet.', 'Check that the door closes and remove stored objects from inside.', 'Keep it accessible without blocking a walkway.'],
    'The existing carrier is accessible, empty and closes properly.'), concern_ids: ['pets'] }
];
export const generatedIdeas = first => ({ decision: 'generated', tasks: [first, ...extraIdeas()] });
