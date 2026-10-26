// Synthetic editorial evaluation inputs. No API call, cloud user or app setting is changed.
import { readFileSync, writeFileSync } from 'node:fs';
import { prepare } from '../../../../personalization/flow.mjs';
import { catalog } from '../../../../personalization/catalog.mjs';
import { buildNewNeedRequest, newNeedInstructions, newNeedPromptHash } from '../../../../personalization/new-needs.mjs';
import { adaptationPromptHash } from '../../../../personalization/adaptation.mjs';
const base = JSON.parse(readFileSync(new URL('../../../contracts/user-profile-v0.example.json', import.meta.url), 'utf8'));
const definitions = [
  { id: '01', label: 'No nearby help; wants practical services', concerns: ['daily_tasks'], minutes: 15, support: 'unavailable', noSpend: false, style: 'resources',
    note: 'I live alone and have no one nearby. I want to find an affordable cleaner or errand helper I could use on a future sick day. Please help me find a real option, not draft a message to a friend.' },
  { id: '02', label: 'No-cook food with no microwave', concerns: ['food'], minutes: 8, noSpend: true,
    note: 'I want food ready for future sick days. I have no microwave and do not want to cook. I usually keep crackers, peanut butter and canned beans. Help me do something useful with what I already have.' },
  { id: '03', label: 'Five minutes; tired of note-making', concerns: ['daily_tasks'], minutes: 5, noSpend: true, constraints: ['energy'],
    note: 'I have five minutes to prepare for a future sick day. Please suggest something I can actually set up or test, not another list to write. I already put tissues and a charger beside my bed.' },
  { id: '04', label: 'Tiny home; no extra basket or shelf', concerns: ['food', 'daily_tasks'], minutes: 10, noSpend: true,
    note: 'My studio is tiny and I do not want to buy a basket or create another pile of stuff. How can I make everyday essentials easier to reach on a sick day without adding clutter?' },
  { id: '05', label: 'Cat care; paid help acceptable', concerns: ['pets'], minutes: 15, noSpend: false, support: 'unavailable', style: 'resources',
    note: 'I have a cat and no nearby person who can feed her if I need several days of rest. I want to research a paid drop-in sitter in advance. I already have a feeding note; the missing piece is a suitable person.' },
  { id: '06', label: 'Nonurgent appointments without a car', concerns: ['getting_care'], minutes: 15, noSpend: false, support: 'unavailable', style: 'resources',
    note: 'I do not drive and want to prepare a way to get to a future nonurgent appointment. I would like a realistic transport option I could check now, including what it costs and how far ahead to arrange it.' },
  { id: '07', label: 'Remote friend; wants an agreed check-in', concerns: ['check_in'], minutes: 10, noSpend: true, support: 'unavailable',
    note: 'My close friend lives in another city and we are happy to check in by text. I want a simple agreement for a future sick day, without expecting her to monitor me all day. What could we arrange now?' },
  { id: '08', label: 'Work messages interrupt rest', concerns: ['daily_tasks'], minutes: 10, noSpend: true,
    note: 'Work messages keep pulling me back in when I need a sick day. I use email for work. Help me prepare a simple way to make my availability clear without sharing personal health details.' },
  { id: '09', label: 'Returning user; food and shelf already done', concerns: ['daily_tasks'], minutes: 10, noSpend: true,
    shown: ['sick_01_easy_food', 'sick_02_rest_shelf', 'sick_09_pause_chore'], feedback: 'sick_09_pause_chore',
    note: 'I already sorted easy meals and a resting spot. The suggestion to postpone one chore felt too obvious. A new worry is laundry piling up when I am out of action. Give me a practical new preparation, not more meal or shelf advice.' },
  { id: '10', label: 'Canada; outside US resource coverage', concerns: ['food', 'daily_tasks'], minutes: 15, noSpend: false, support: 'unavailable', country: 'CA', style: 'resources',
    note: 'I live in Canada with no nearby help. I want to research someone who can bring groceries or run an errand on a future sick day. Please suggest a relevant place to look, not a US-only service or a generic list.' }
];
const cases = [];
for (const c of definitions) {
  const profile = structuredClone(base);
  profile.answers = { ...profile.answers, constraints: c.constraints || [], difficulty: [], strengths: [], style: c.style || 'one', country: c.country || 'US' };
  const history = (c.shown || []).map(key => {
    const content = catalog.actions.find(a => a.actionKey === key);
    return { content: content.task, state: { userId: profile.userId, actionKey: key, contentRef: content.contentRef,
      shownAt: '2026-10-11T12:00:00Z', savedAt: c.feedback === key ? null : '2026-10-11T13:00:00Z',
      removedAt: null, completedAt: c.feedback === key ? null : '2026-10-11T14:00:00Z', likedAt: null,
      feedbackCode: c.feedback === key ? 'too_generic' : null, feedbackAt: c.feedback === key ? '2026-10-11T15:00:00Z' : null } };
  });
  const snapshot = { profile, taskStates: history.map(h => h.state), stateVersion: '1' };
  const store = { readSnapshot: async () => structuredClone(snapshot), readTasks: async () => ({ stateVersion: '1', tasks: history }) };
  const request = { topicId: 'sick_care', concernIds: c.concerns, note: c.note,
    maxMinutes: c.minutes, noSpend: c.noSpend, localSupport: c.support || 'unknown', country: c.country || 'US' };
  const prepared = await prepare({ owner: profile.userId, request, store, catalog, allowEditorialReview: true, useProfileDefaults: true });
  const body = buildNewNeedRequest(prepared, catalog, history, 'gpt-6-luna');
  cases.push({ ...c, request, snapshot, history, packet: JSON.parse(body.input[0].content[0].text) });
}
writeFileSync(new URL('./inputs.json', import.meta.url), JSON.stringify({ kind: 'synthetic editorial evaluation',
  sourceCommit: '06fe7e0', model: 'gpt-6-luna', reasoning: 'low', promptHash: newNeedPromptHash,
  untouchedAdaptationPromptHash: adaptationPromptHash, cases }, null, 2) + '\n');
writeFileSync(new URL('./prompt.txt', import.meta.url), newNeedInstructions);
const format = buildNewNeedRequest(await prepare({ owner: base.userId, request: cases[0].request,
  store: { readSnapshot: async () => cases[0].snapshot }, catalog, allowEditorialReview: true }), catalog, [], 'gpt-6-luna').text.format;
const { type, ...schema } = format;
writeFileSync(new URL('./schema.json', import.meta.url), JSON.stringify(schema, null, 2) + '\n');
console.log(JSON.stringify({ count: cases.length, promptHash: newNeedPromptHash, cases: cases.map(c => ({ id: c.id, label: c.label })) }, null, 2));
