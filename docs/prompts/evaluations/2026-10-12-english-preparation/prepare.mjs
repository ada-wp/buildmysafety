// Freeze synthetic writing inputs only. This script makes no paid calls.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { catalog } from '../../../../personalization/catalog.mjs';
import { prepare } from '../../../../personalization/flow.mjs';
import { buildNewNeedRequest } from '../../../../personalization/new-needs.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const previous = read('../2026-10-12-ten-answer-review/inputs.json');
const english = readFileSync(new URL('../../sick-day-content-en.md', import.meta.url), 'utf8');
const core = english.match(/```text\r?\n([\s\S]*?)\r?\n```/)[1].replace(/\r\n/g, '\n');
const adapter = `For this direct-request test, return exactly one complete task using the supplied JSON schema, or an appropriate no-task decision. Output English only. Return generated and a task when a supported useful action fits; use a short canonical lower_snake_case action_key and supplied supported_concerns IDs. Return no_new_idea only when prior personal outcomes leave no distinct useful action, needs_context when an essential fact is missing, out_of_scope outside the topic, or safety_redirect for current urgency or clinical advice; each no-task decision has task null. An unshown collection outcome may be reused or adapted. Keep title at most 9 words, summary at most 35, exactly three steps of at most 25 words each, and done_when at most 20 words. For these test cases keep active effort within the explicit limit and at most 20 minutes. Return eligible resource IDs with a brief purpose, not URLs in copy. Do not require a purchase or assume a nearby helper. Researching an eligible paid option is allowed when no_spend is false. Set purchase_checks to [] and no_purchase_option to null. Return only decision and task JSON.`;
const prompt = core + '\n\n' + adapter;
const candidateCatalog = structuredClone(catalog);
candidateCatalog.version = 'english-preparation-evaluation-only';
candidateCatalog.topics[0].guidance[1] = 'Prepare before a future sick day. Start with existing supplies; service research is allowed without booking or payment. Respect explicit budget and support limits.';
candidateCatalog.resources.push({
  id: 'us_taskrabbit_errands_candidate', name: 'Taskrabbit — shopping and errands',
  url: 'https://www.taskrabbit.com/services/shopping-delivery',
  reviewState: 'editorial_review', topicIds: ['sick_care'], countries: ['US'], cost: 'paid',
  purpose: 'Research paid practical help such as collecting dry cleaning or getting everyday supplies in supported locations.',
  limits: 'Check coverage, included work, total charges and booking notice. No availability or suitability guarantee. Research does not book a service.',
  sourceCheckedAt: '2026-10-12', sourceUrls: ['https://www.taskrabbit.com/services/shopping-delivery']
}, {
  id: 'us_psi_sitter_candidate', name: 'Pet Sitters International — sitter finder',
  url: 'https://www.petsit.com/locate/', reviewState: 'editorial_review', topicIds: ['sick_care'], countries: ['US'], cost: 'paid',
  purpose: 'Find member pet-care businesses to contact about future drop-in care, experience with the pet, notice and an introductory meeting.',
  limits: 'PSI does not inspect or endorse listed businesses. Ask the provider about fees, visit notice, meeting first, and what happens if they cannot attend. A lead or inquiry is not agreed care.',
  sourceCheckedAt: '2026-10-12', sourceUrls: ['https://www.petsit.com/locate/', 'https://www.petsit.com/standards']
});
const cases = ['01', '05', '09'].map(id => structuredClone(previous.cases.find(c => c.id === id)));
cases[0].id = 'A'; cases[0].baselineCase = '01';
cases[1].id = 'B'; cases[1].baselineCase = '05';
const c = cases[2]; c.id = 'C'; c.baselineCase = null; c.label = 'Returning user wants a useful preparation memo';
c.minutes = 8; c.request.maxMinutes = 8;
c.note = 'I have already sorted easy meals and my resting spot. I also checked my pharmacy delivery process and have its number saved. The information is scattered. Help me prepare one short private sick-day note I can actually use later, with useful headings. Please do not give me another food or shelf task.';
c.request.note = c.note;
c.history = c.history.filter(h => h.state.actionKey !== 'sick_09_pause_chore');
c.snapshot.taskStates = c.history.map(h => h.state);
delete c.feedback; c.shown = c.history.map(h => h.state.actionKey);
for (const item of cases) {
  const store = { readSnapshot: async () => structuredClone(item.snapshot), readTasks: async () => ({stateVersion:'1', tasks: structuredClone(item.history)}) };
  const prepared = await prepare({owner:item.snapshot.profile.userId, request:item.request, store, catalog:candidateCatalog, allowEditorialReview:true, useProfileDefaults:true});
  item.packet = JSON.parse(buildNewNeedRequest(prepared, candidateCatalog, item.history, 'gpt-6-luna').input[0].content[0].text);
}
const inputs = {kind:'Synthetic English writing trial; revised instructions and resource coverage, not a prompt-only comparison', sourceCommit:'b6ba22f', model:'gpt-6-luna', reasoning:'low', promptHash:createHash('sha256').update(prompt).digest('hex'), cases};
const save = (name, value) => writeFileSync(new URL(name, import.meta.url), typeof value === 'string' ? value : JSON.stringify(value,null,2)+'\n');
save('prompt.txt', prompt); save('inputs.json', inputs); save('candidate-catalog.json', candidateCatalog);
save('schema.json', read('../2026-10-12-ten-answer-review/schema.json'));
const checksum = s => {let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619); return (h>>>0).toString(16).padStart(8,'0');};
console.log(JSON.stringify({promptHash:inputs.promptHash, promptChars:prompt.length, promptChecksum:checksum(prompt), cases:cases.map(c=>({id:c.id,chars:JSON.stringify(c.packet).length,checksum:checksum(JSON.stringify(c.packet))}))},null,2));
