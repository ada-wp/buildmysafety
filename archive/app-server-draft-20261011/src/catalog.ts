import type {Resource, Task} from './model';

// These IDs/versions are immutable: add a new version when changing saved instructions.
export const resources: Resource[] = [{
  id:'211_local_us', title:'Find your local 211', url:'https://211.org/about-us/your-local-211',
  purpose:'Use your ZIP code on 211 to find a local contact. Ask about relevant food or practical-help referrals; check eligibility and availability.',
  checkedOn:'2026-10-11'
}];
export const concerns = [
  ['essentials','Having what I need within reach'], ['food','Eating without much effort'],
  ['help','Finding help beyond people I know'], ['chores','Keeping everyday chores manageable'],
  ['commitments','Making room to rest']
] as const;
const base = {version:1, topic:'sick_care', countries:[], resourceIds:[]} as const;
export const tasks: Task[] = [
  {
    ...base, countries:[], resourceIds:[], id:'sick-shelf-v1', actionKey:'sick.reachable_essentials',
    title:'Set up a sick-day shelf', minutes:10,
    summary:'A few essentials within reach when you need to rest. Start with things you already own.',
    steps:[
      'Choose a reachable shelf or basket near where you usually rest.',
      'Gather familiar easy-to-prepare food, tissues and a charging cable you already own.',
      'Note one missing item for your next usual shopping trip.'
    ],
    doneWhen:'Your essentials are together, with any missing item noted.',
    concerns:['essentials'], angle:'prepare', tags:['hands_on','no_purchase'],
    purchaseChecks:['Choose foods you normally eat and can prepare easily.','Check storage instructions and dates before buying.'],
    review:{kind:'founder_reference',note:'Based on the task-detail screenshot Ada explicitly approved; no medical claims.'}
  },
  {
    ...base, countries:[], resourceIds:[], id:'sick-food-v1', actionKey:'sick.available_meal_choices',
    title:'Choose two easy food options', minutes:8,
    summary:'Give your tired future self two familiar choices. No new recipe or special shopping trip needed.',
    steps:[
      'Look at food you actually have at home now.',
      'Choose two familiar options that take little preparation. If you only have one, start with that.',
      'Note your choices and where to find them in a place you already use.'
    ], doneWhen:'Your available easy food choices and their locations are noted.',
    concerns:['food'], angle:'decide', tags:['no_purchase','low_effort'],
    review:{kind:'editorial',note:'Corrects the tested wording that assumed food commonly kept was actually available. Founder review pending.'}
  },
  {
    ...base, countries:['US'], resourceIds:['211_local_us'], id:'sick-local-help-v1', actionKey:'sick.local_help_starting_point',
    title:'Find a local place to ask', minutes:12,
    summary:'You can have somewhere to start even without a nearby helper. Find one local contact to ask about practical support.',
    steps:[
      'Open the local 211 finder and use your ZIP code to find the service for your area.',
      'Choose one question to ask, such as help accessing food. Note any listed eligibility, cost and availability details.',
      'Save the local contact and your question. Mark anything you still need to confirm.'
    ], doneWhen:'You have a local contact, a specific question and any details still to confirm.',
    concerns:['help'], angle:'discover', tags:['outside_help','research'],
    review:{kind:'editorial',note:'Official directory opened October 11. No local provider, eligibility or availability has been verified. Founder review pending.'}
  },
  {
    ...base, countries:[], resourceIds:[], id:'sick-chore-v1', actionKey:'sick.smaller_household_task',
    title:'Give one chore a smaller version', minutes:4,
    summary:'A low-energy day can have a smaller plan. Decide what is enough for one ordinary household chore.',
    steps:[
      'Choose one nonurgent chore, such as folding laundry or tidying a shelf.',
      'Write a smaller version you could manage, or decide it can wait until you feel up to it.',
      'Put that choice on your usual list so you do not have to decide again while resting.'
    ], doneWhen:'One nonurgent chore has a smaller version or a clear decision to wait.',
    concerns:['chores'], angle:'simplify', tags:['no_purchase','low_effort'],
    review:{kind:'editorial',note:'Limited to explicitly nonurgent chores. Does not suggest postponing dependent care or necessary treatment. Founder review pending.'}
  },
  {
    ...base, countries:[], resourceIds:[], id:'sick-reschedule-v1', actionKey:'sick.reschedule_message',
    title:'Make a “not today” message ready', minutes:5,
    summary:'Give yourself a ready sentence for an ordinary commitment that can wait. You can leave it as a draft.',
    steps:[
      'Think of a flexible plan you might postpone, such as a casual catch-up. A future example is fine.',
      'Draft: “I am not feeling well and need to rest. Could we find another day?” Adjust it to sound like you.',
      'Save the sentence in a note. If needed later, check the arrangement before sending.'
    ], doneWhen:'You have a short rescheduling message ready to adapt.',
    concerns:['commitments'], angle:'practice', tags:['no_purchase','low_effort','boundaries'],
    review:{kind:'editorial',note:'A preparation for optional commitments, not a generic request for unavailable support. Founder review pending.'}
  }
];
export const taskByKey = (key:string) => tasks.find(task=>task.actionKey===key);

export const interestLabels: Record<string,string> = {
  sick_care:'Sick-day care', meals_one:'Meals for one', home_confidence:'Home repairs', unexpected:'Power-cut prep',
  asking_help:'People to call', neighbors:'Knowing neighbors', own_company:'Enjoying time alone', grounded:'Settled evenings',
  boundaries:'Visitor boundaries', out_about:'Going out solo', digital:'Privacy online', pet_care:'Pet-care plans',
  solo_travel:'Solo travel', life_change:'New home & routines', daily_upkeep:'Everyday chores', rest:'Low-energy days'
};
