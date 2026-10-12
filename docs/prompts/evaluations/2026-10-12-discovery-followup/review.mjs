// Offline replay and readable report. No model, browser or cloud calls.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepare} from '../../../../personalization/flow.mjs';
import {catalog as liveCatalog} from '../../../../personalization/catalog.mjs';
import {acceptNewNeed} from '../../../../personalization/new-needs.mjs';
import {checkTaskCopy,requestBoundary} from '../../../../personalization/adaptation.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const inputs=read('inputs.json'),outputs=read('outputs.json'),candidate=read('candidate-catalog.json'),notes=read('review-notes.json');
const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');};
const prompt=readFileSync(new URL('prompt.txt',import.meta.url),'utf8');
if(createHash('sha256').update(prompt).digest('hex')!==inputs.promptHash||checksum(prompt)!==outputs.transferChecks.prompt)throw Error('prompt mismatch');
const checks=[];
for(const r of outputs.results) {
 const c=inputs.cases.find(c=>c.id===r.id),o=JSON.parse(r.rawText);
 if(checksum(JSON.stringify(c.packet))!==outputs.transferChecks[c.id])throw Error('packet mismatch '+c.id);
 const count=s=>s.trim().split(/\s+/).length;
 const entry={id:c.id,decision:o.decision,preflight:requestBoundary(c.note),resourceCount:o.task?.resources.length||0,
  suppliedResourceIdsOnly:o.task?.resources.every(r=>c.packet.eligible_resources.some(e=>e.resource_id===r.resource_id))??true,
  stepWords:o.task?.steps.map(count)||[],spendingKeywordMatches:o.task?[o.task.title,o.task.summary,...o.task.steps,o.task.done_when].join(' ').match(/\b(buy|purchase|order|pay|subscribe)\b/gi)||[]:[]};
 if(c.id==='C') entry.preflightDiagnostic={change:'Replace only prescription delivery with pharmacy delivery; diagnostic input, not another model call',result:requestBoundary(c.note.replace('prescription delivery','pharmacy delivery'))};
 for(const [name,catalog] of [['candidateResources',candidate],['unchangedApp',liveCatalog]]) {
  const store={readSnapshot:async()=>structuredClone(c.snapshot),readTasks:async()=>({stateVersion:'1',tasks:structuredClone(c.history)})};
  const prepared=await prepare({owner:c.snapshot.profile.userId,request:c.request,store,catalog,allowEditorialReview:true,useProfileDefaults:true});
  try {const accepted=acceptNewNeed(o,prepared,catalog,c.history,checkTaskCopy);entry[name]={passes:true,hasTask:Boolean(accepted.task)};}
  catch(e){entry[name]={passes:false,error:e.code||e.message};}
 }
 checks.push(entry);
}
writeFileSync(new URL('validation.json',import.meta.url),JSON.stringify({method:'Offline replay of unedited outputs; current validators; no hosted delivery',checks},null,2)+'\n');
const lines=['# Discovery follow-up — three real AI answers','',
 '12 October 2026. Three independent paid GPT-6 Luna Playground Responses calls, low reasoning. Each received the revised English writing core, the same one-task schema/adapter and a manually selected resource packet. No authored task examples were supplied. Exactly one call per scenario; no retries or selected best-of runs.','',
 'All three returned a task. These are original model answers, followed by separately labeled editorial review. The visible prompt and each input matched the frozen source checksums. Store logs and tools were off. The app output cap and timeout were not configured in this Playground test; UI latency/token badges are observations, not billing totals. Exact cost was not retrieved.',''];
for(const r of outputs.results) {
 const c=inputs.cases.find(c=>c.id===r.id),o=JSON.parse(r.rawText),t=o.task,v=checks.find(x=>x.id===r.id);
 lines.push(`## ${c.id}. ${c.label}`,'',`**Synthetic request:** ${c.note}`,'',`**Observed response:** ${r.uiBadge}`,'');
 if(t){lines.push(`**${t.title} · ${t.estimated_minutes} min**`,'',t.summary,'');t.steps.forEach((s,i)=>lines.push(`${i+1}. ${s}`));lines.push('',`**Done when:** ${t.done_when}`,'');
 for(const link of t.resources){const s=candidate.resources.find(s=>s.id===link.resource_id);lines.push(`[${s.name}](${s.url}) — ${link.why}`,'');}}
 else lines.push(`No task: ${o.decision}.`,'');
 lines.push(`**Technical replay:** request preflight ${v.preflight?`would stop before calling the model (${v.preflight})`:'allows the request'}. Separately, candidate-resource output validation ${v.candidateResources.passes?'passed':`rejected (${v.candidateResources.error})`}; unchanged-app output validation ${v.unchangedApp.passes?'passed':`rejected (${v.unchangedApp.error})`}. Steps contain ${v.stepWords.join(', ')} whitespace-separated words. All resource IDs supplied: ${v.suppliedResourceIdsOnly}.`,'',`**Editorial review — not model output:** ${notes[c.id]}`,'');
 if(v.preflightDiagnostic)lines.push('**Preflight finding:** the current clinical-keyword pattern matches "prescription" even though this request describes an already-arranged delivery and asks for advance cat care. Replacing only "prescription delivery" with "pharmacy delivery" makes preflight allow the input in an offline diagnostic. No model call was repeated and the original input remains unchanged. This semantic false positive needs a bounded fix and safety regression checks before integration.','');
}
lines.push('## What we learned','',notes.conclusion,'',
 'The current word limit and blanket spending-keyword rules are separate from content quality. Preserve the failures; do not alter original answers to make the report pass. New care-resource IDs still need to be connected before the app can use them. The source catalog remains unchanged.','',
 'Case C includes synthetic completed care-contact and pet-note records. Prescription delivery is stated in the current request; this test does not claim a new durable prescription-memory field. No real account data, user tasks, quotas, runtime prompts or deployment were changed.','',
 'These are separate one-task calls, not one three-task batch. The rule of at most one linked task per delivered batch still applies. Sources were checked in the preceding editorial research; the model did not browse during generation.','',
 'Artifacts: [exact prompt](prompt.txt), [synthetic inputs](inputs.json), [original output text](outputs.json), [candidate source catalog](candidate-catalog.json), [offline replay](validation.json), [editorial notes](review-notes.json). `prepare.mjs` and `review.mjs` make no paid calls.','',
 'Format reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), checked October 12. Schema conformance does not establish usefulness or satisfy every application rule.');
writeFileSync(new URL('review.md',import.meta.url),lines.join('\n')+'\n');
console.log(JSON.stringify({checks,report:'review.md'},null,2));
