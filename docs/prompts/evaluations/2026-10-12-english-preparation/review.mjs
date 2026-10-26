// Offline checks and human-readable rendering. No model or cloud calls.
import {readFileSync, writeFileSync} from 'node:fs';
import {prepare} from '../../../../personalization/flow.mjs';
import {catalog as liveCatalog} from '../../../../personalization/catalog.mjs';
import {acceptNewNeed} from '../../../../personalization/new-needs.mjs';
import {checkTaskCopy, requestBoundary} from '../../../../personalization/adaptation.mjs';
const read = name => JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const inputs=read('inputs.json'), outputs=read('outputs.json'), candidate=read('candidate-catalog.json');
for (const result of outputs.results) result.output = JSON.parse(result.rawText);
const notes=read('review-notes.json');
const checks=[];
for(const result of outputs.results) {
  const c=inputs.cases.find(c=>c.id===result.id);
  const entry={id:c.id,decision:result.output.decision,preflight:requestBoundary(c.note),resourceCount:result.output.task?.resources.length||0};
  for(const [name,catalog] of [['candidateResources',candidate],['unchangedApp',liveCatalog]]) {
    const store={readSnapshot:async()=>structuredClone(c.snapshot),readTasks:async()=>({stateVersion:'1',tasks:structuredClone(c.history)})};
    const prepared=await prepare({owner:c.snapshot.profile.userId, request:c.request,store,catalog,allowEditorialReview:true,useProfileDefaults:true});
    try {const accepted=acceptNewNeed(result.output,prepared,catalog,c.history,checkTaskCopy);entry[name]={passes:true,hasTask:Boolean(accepted.task)};}
    catch(e) {entry[name]={passes:false,error:e.code||e.message};}
  }
  checks.push(entry);
}
writeFileSync(new URL('validation.json',import.meta.url),JSON.stringify({method:'Offline replay; no hosted app delivery',checks},null,2)+'\n');
const lines=['# English preparation — three real writing tests','',
  '12 October 2026. Three paid GPT-6 Luna Playground Responses runs, low reasoning, one independent synthetic case per conversation. The English writing core and the existing one-task JSON schema were used. These are genuine unedited model outputs, separate from the ten authored English candidates.','',
  'This trial changes both instructions and supplied resource coverage. Cases A and B reuse earlier requests; C is a new returning-user memo request. It is not a controlled prompt-only comparison or evidence of stable quality across all users. No authored examples were supplied to the model in these three runs.','',
  'Store logs was off; no tools were enabled. The Playground UI did not expose a configured 2,200-token cap or the app transport timeout. Displayed token badges are not billing totals; exact cost was not retrieved. The prompt and all input packets matched source-to-browser checksums. No live app prompt, catalog, quota or user data changed.',''];
for(const r of outputs.results) {
  const c=inputs.cases.find(c=>c.id===r.id), t=r.output.task, check=checks.find(x=>x.id===r.id);
  lines.push(`## ${r.id}. ${c.label}`,'',`**User request:** ${c.note}`,'',`**Observed response:** ${r.uiBadge}`,'');
  if(t) {
    lines.push(`**${t.title} · ${t.estimated_minutes} min**`,'',t.summary,'');
    t.steps.forEach((s,i)=>lines.push(`${i+1}. ${s}`));
    lines.push('',`**Done when:** ${t.done_when}`,'');
    for(const link of t.resources) {const source=candidate.resources.find(s=>s.id===link.resource_id);lines.push(`[${source.name}](${source.url}) — ${link.why}`,'');}
  } else lines.push(`No task returned: ${r.output.decision}.`,'');
  lines.push(`**Checks:** candidate-resource validator ${check.candidateResources.passes?'passed':`rejected (${check.candidateResources.error})`}; unchanged app ${check.unchangedApp.passes?'accepts the output':`rejects (${check.unchangedApp.error})`}.`,'',`**Our review:** ${notes[c.id]}`,'');
}
lines.push('## What this tells us','',notes.conclusion,'',
  'Links are attached from checked resource records, not invented URLs. These are three separate one-task requests, not one batch with links on two suggestions. A future mixed three-card batch still permits links in at most one suggestion.','',
  'The current app cannot use new resource IDs until its resource collection and matching/validation changes are connected and tested. Do not deploy this writing draft merely because the text looks better.','',
  'Artifacts: [English authored content](../../sick-day-content-en.md), [exact test prompt](prompt.txt), [inputs](inputs.json), [original responses](outputs.json), [offline checks](validation.json). `prepare.mjs` freezes synthetic inputs; `review.mjs` validates and renders captured outputs. Neither script makes paid calls.','',
  'Test format reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), checked October 12. Schema conformance does not establish editorial usefulness.');
writeFileSync(new URL('review.md',import.meta.url),lines.join('\n')+'\n');
console.log(JSON.stringify({checks,report:'review.md'},null,2));
