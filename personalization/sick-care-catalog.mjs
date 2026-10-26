import pool from './content-candidates/sick-care-v0/pool.json' with { type: 'json' };
import { hash } from './contracts.mjs';

const review = { author: 'assistant', editorialCheckedAt: '2026-10-13', founderApproved: false,
  professionalReview: false, scope: 'Preventive preparation and resource literacy; founder preview.' };
export const sickCareConcerns = [
  { id: 'food', label: 'Food and essentials without going out' },
  { id: 'getting_care', label: 'Knowing where to get care, and what it costs' },
  { id: 'daily_tasks', label: 'Help with errands and things at home' },
  { id: 'check_in', label: 'Someone to check in with' },
  { id: 'pets', label: 'My pet being cared for' }
];

// Source descriptions and limits are from research/sick-care-pool-sources.md.
// These are reviewed research routes, never a promise of local service or coverage.
const source = (id, name, url, purpose, limits, cost = 'free') => ({ id: id.toLowerCase(), name, url,
  purpose, limits, cost, countries: ['US'], topicIds: ['sick_care'], reviewState: 'editorial_review', review,
  sourceCheckedAt: '2026-10-13', sourceUrls: [url] });
export const sickCareResources = [
  source('HHS_FIND', 'HHS — finding telehealth', 'https://telehealth.hhs.gov/patients/how-do-i-schedule-telehealth-appointment', 'Explore first-visit routes and what to check.', 'Ask the provider about new patients, location, coverage and personal cost. No appointment is arranged.'),
  source('HRSA', 'HRSA — health-center finder', 'https://findahealthcenter.hrsa.gov/', 'Find a US health center to investigate.', 'Centers serve insured and uninsured people. Ask about fees, new-patient access and whether virtual first visits are offered.'),
  source('HHS_PREP', 'HHS — preparing for telehealth', 'https://telehealth.hhs.gov/patients/what-should-i-know-before-my-telehealth-visit', 'Understand joining and accessibility options.', 'Technology, support and phone alternatives depend on the provider.'),
  source('MEDICAID_RIDES', 'Medicaid — transport information', 'https://www.medicaid.gov/medicaid/benefits/assurance-of-transportation', 'Learn about a possible nonemergency transport benefit.', 'Only for eligible beneficiaries; state and plan rules vary. Not an emergency service or a procedure escort.'),
  source('LOCAL_211', '211 — local community resources', 'https://211.org/about-us/your-local-211', 'Discover local practical support and referral routes.', 'Information and referrals do not guarantee assistance. Check local eligibility, cost and availability.'),
  source('MEDLINE_SURGERY', 'MedlinePlus — procedure preparation', 'https://www.medlineplus.gov/ency/patientinstructions/000578.htm', 'Understand why a procedure may require an escort.', 'For an explicitly planned procedure; the care team determines the actual arrangements, not this app.'),
  source('CMS_ESTIMATE_GUIDE', 'CMS — understanding care estimates', 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/guides-resources/what-good-faith-estimate', 'Learn what a written estimate may cover.', 'US nonemergency self-pay information, not individual legal advice or a guarantee of the final bill.'),
  source('CVS_DELIVERY', 'CVS — prescription delivery', 'https://www.cvshealth.com/services/pharmacy/prescription-delivery.html', 'Investigate pharmacy delivery as one possible route.', 'Check the actual pharmacy, prescription eligibility, charges and handoff. No medicine choice or delivery-time promise.', 'paid'),
  source('CVS_REFILL_HELP', 'CVS — refill and renewal help', 'https://www.cvs.com/retail/help/help-subtopic-refilling-prescriptions', 'Understand refill versus renewal administration.', 'Other pharmacies differ. Follow professional instructions; do not change medication or infer refill timing.'),
  source('HHS_PICKUP', 'HHS — collection by another person', 'https://www.hhs.gov/hipaa/for-professionals/faq/can-a-patient-have-a-friend-or-family-member-pick-up-a-prescription/index.html', 'Learn about a possible pharmacy collection route.', 'The pharmacist uses professional judgment. Check identification, payment and prescription-specific restrictions.'),
  source('FEEDING_AMERICA', 'Feeding America — local food help', 'https://www.feedingamerica.org/need-help-find-food', 'Find a local food-assistance starting point.', 'Ask the local program about eligibility, access and any delivery. A listing is not confirmed help.'),
  source('HELLOFRESH_FORMAT', 'HelloFresh — meal kits', 'https://www.hellofresh.com/about/how-it-works', 'Compare ingredients-to-cook with prepared meals.', 'Check cooking work, minimums, recurring charges and cancellation. No signup or purchase needed to research.', 'paid'),
  source('FACTOR_FORMAT', 'Factor — prepared meals', 'https://www.factor75.com/about/how-it-works', 'Explore the prepared-meal service format.', 'Check heating requirements, minimums, recurring charges and cancellation. No health or affordability claim.', 'paid'),
  source('FOODKEEPER', 'USDA FoodKeeper', 'https://www.foodsafety.gov/keep-food-safe/foodkeeper-app', 'Find product-specific food-storage guidance.', 'Match the actual food and storage conditions and follow packaging instructions. Not an AI food-safety clearance.'),
  source('POPLIN_FIRST_ORDER', 'Poplin — laundry-service terms', 'https://poplin.zendesk.com/hc/en-us/articles/53026765989275-Your-First-Order-What-to-Expect', 'Understand laundry pickup charges and conditions.', 'Check minimum charges, additional fees, item limits and local turnaround. No trial load needed.', 'paid'),
  source('TASK_CLEANING', 'Taskrabbit — cleaning services', 'https://www.taskrabbit.com/services/cleaning/house-cleaning', 'Research household cleaning scope and terms.', 'Check the actual provider, minimum booking, supplies, exclusions and total cost. Not personal or clinical care.', 'paid'),
  source('TASK_ERRANDS', 'Taskrabbit — errands and delivery', 'https://www.taskrabbit.com/services/shopping-delivery', 'Research help with a specific ordinary errand.', 'Check whether the job and area are covered, notice and total charges. No emergency, clinical-care or pharmacy-pickup promise.', 'paid'),
  source('MEDLINE_HOME_HELP', 'MedlinePlus — types of home help', 'https://www.medlineplus.gov/homecareservices.html', 'Distinguish household, personal and healthcare support.', 'Learn service vocabulary; a professional should assess personal or clinical care needs.'),
  source('CARE_BENEFITS', 'Care Benefits — employer care programs', 'https://www.care.com/benefits/backup-care/', 'Learn what to look for in an employer benefit.', 'Participation, eligible situations, pet care and fees depend on the employer. Employment alone does not establish access.'),
  source('ROVER_SERVICES', 'Rover — pet-care options', 'https://support.rover.com/hc/en-us/articles/205979666-What-services-are-offered-on-Rover', 'Compare drop-ins, sitting, boarding and walking.', 'Check species, area, fees, visit length and availability. A listing is not a vetted fit or confirmed care.', 'paid'),
  source('MEOWTEL_SERVICES', 'Meowtel — in-home cat care', 'https://meowtel.com/how-meowtel-works', 'Explore cat-specific in-home care.', 'For cats in covered areas only. Check reservation, introduction, fee and cancellation rules; no free meeting promise.', 'paid'),
  source('HUMANE_FOSTER', 'Humane World — temporary fostering', 'https://www.humaneworld.org/us/en/resources/pet-fostering-101', 'Learn about temporary care during an extended absence.', 'Local programs, eligibility and capacity vary. Not a nationwide placement guarantee or routine surrender suggestion.'),
  source('MEDLINE_DISCHARGE', 'MedlinePlus — planning to return home', 'https://www.medlineplus.gov/ency/patientinstructions/000867.htm', 'Prepare questions for a planned return from hospital.', 'The care team determines support needs. Household services are not a substitute for healthcare.')
];
const concernMap = {
  SC01: ['getting_care'], SC02: ['getting_care'], SC03: ['getting_care'], SC04: ['getting_care', 'daily_tasks'],
  SC05: ['getting_care'], SC06: ['getting_care'], SC07: ['getting_care', 'food'], SC08: ['getting_care', 'food'],
  SC09: ['getting_care', 'food'], SC10: ['food'], SC11: ['food'], SC12: ['food'], SC13: ['daily_tasks'],
  SC14: ['food', 'daily_tasks'], SC15: ['food'], SC16: ['daily_tasks'], SC17: ['daily_tasks'],
  SC18: ['daily_tasks'], SC19: ['check_in'], SC20: ['daily_tasks'], SC21: ['daily_tasks'],
  SC25: ['daily_tasks', 'pets'], SC26: ['pets'], SC27: ['pets'], SC28: ['pets'], SC29: ['pets'], SC30: ['getting_care', 'daily_tasks']
};
// Conditional openings make discovery possible without manufacturing facts. These
// are authored variants, never AI rewrites on each view. Practical dependencies
// remain visible in the copy; treatment-specific actions are request-only.
const summaries = {
  SC01: 'Explore a first-care route you could use when needed. If you already have one that works, you can choose another idea.',
  SC03: 'Curious about video visits? Learn about joining and support options, then check a provider’s instructions when you choose one.',
  SC08: 'If you use repeat prescriptions, knowing the difference between a refill and a renewal can make the next request less confusing.',
  SC11: 'If food or delivery costs become a barrier, learn where to look for local assistance before you need it.',
  SC13: 'If getting up for everyday essentials interrupts your rest, make one resting spot easier to use with things you already own.',
  SC14: 'If one ordinary essential often runs out, consider a modest spare when it fits your budget. No special sick-day shopping list needed.',
  SC18: 'If an errand would be hard to postpone, discover who might help and what you would need to check.',
  SC19: 'If there’s someone you’d feel comfortable asking, agree on a check-in that suits you both. They don’t need to live nearby.',
  SC25: 'If you have access to work benefits, there may be practical-care support worth understanding. Check the terms before counting on it.',
  SC27: 'Once you’ve chosen a possible carer, an introduction can help you decide whether the arrangement fits your pet. Confirm any meeting charge first.',
  SC28: 'Once you have a chosen carer, ask your vet what permissions or information they would need during your absence.'
};
const copyVariants = {
  SC03: { steps: [
    'Use HHS’s telehealth guide to learn about joining instructions, captions and technical support.',
    'When considering a provider, look for its browser or app requirements and how to request accessibility help.',
    'Find its help route if video fails. Ask about alternatives when needed; no practice appointment or installation is required today.'
  ] },
  SC18: { steps: [
    'Choose an ordinary errand you might need help with. Explore Taskrabbit for paid help or local 211 for community referrals.',
    'Check the exact job, area, notice and total charges. Ask about any collection permission needed; do not share home-entry details.',
    'Keep one promising contact route and any unanswered questions. If you request help later, wait for confirmation before relying on it.'
  ], done_when: 'You have a relevant help route to investigate, with its practical limits or outstanding questions understood.' },
  SC25: { steps: [
    'If you have a benefits portal, look for care support, dependent care or pet care. Care Benefits programs are an example, not coverage.',
    'Read who and which situations qualify, any registration requirement, and what you would pay. Personal sick leave may not qualify.',
    'If a benefit is listed, check its limits. Otherwise, you can finish knowing this route is unavailable or still needs confirmation.'
  ] }
};
const resourceById = new Map(sickCareResources.map(r => [r.id, r]));
export const sickCareActions = pool.tasks.filter(t => !pool.priority_review.not_default_suggestions.includes(t.id)).map(t => {
  const key = `sick_v2_${t.id.toLowerCase()}`;
  const resources = (t.id === 'SC25' ? ['CARE_BENEFITS'] : t.resource_ids).map(id => {
    const r = resourceById.get(id.toLowerCase());
    if (!r) throw new Error(`Missing reviewed source ${id}`);
    return { resource_id: r.id, why: r.purpose };
  });
  const task = { action_key: key, concern_ids: concernMap[t.id], title: t.title,
    summary: summaries[t.id] || t.summary, estimated_minutes: t.active_minutes,
    steps: t.steps, done_when: t.done_when, resources, purchase_checks: [], no_purchase_option: null,
    ...copyVariants[t.id] };
  return { actionKey: key, outcomeGroup: t.outcome_key, contentRef: `${key}@${hash(task).slice(0, 16)}`,
    reviewState: 'editorial_review', review, topicIds: ['sick_care'], concernIds: concernMap[t.id],
    outcome: task.done_when, tags: [...concernMap[t.id], t.task_kind, t.stage], taskKind: t.task_kind,
    priority: ['core_preparation', 'make_it_reliable', 'extra_ease'].indexOf(t.priority.band),
    editorialOrder: Number(t.id.slice(2)), requiresSpending: t.id === 'SC14', requiresNearbySupport: false,
    futurePaidService: ['SC10', 'SC12', 'SC16', 'SC17', 'SC26', 'SC27'].includes(t.id),
    // These contexts do not follow from an ordinary sick-day checkbox.
    requestOnly: ['SC05', 'SC27', 'SC28', 'SC29', 'SC30'].includes(t.id),
    conditional: Boolean(summaries[t.id]),
    ...(t.id === 'SC13' ? { outcomeGroup: 'sick_02_rest_shelf' } : {}),
    task };
});
