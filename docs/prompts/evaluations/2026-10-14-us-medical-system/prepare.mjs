// Freeze an app-equivalent content test. No model calls and no user-data writes.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '../../../../personalization/catalog.mjs';
import {prepare} from '../../../../personalization/flow.mjs';
import {buildNewNeedRequest,acceptNewNeedBatch} from '../../../../personalization/new-needs.mjs';
import {requestBoundary,checkTaskCopy} from '../../../../personalization/adaptation.mjs';
import {sickCareInstructions} from '../../../../personalization/generated/contracts.mjs';

const note = 'i want to udnerstand US medical system';
const owner = 'fictional-medical-system-review';
const snapshot = {profile:{schemaVersion:1,userId:owner,revision:1,updatedAt:'2026-10-14T12:00:00Z',
  answers:{why:null,home:null,focus:null,difficulty:[],constraints:[],strengths:[],hope:[],style:null,country:null},
  interests:[],personalizationEnabled:true,elephantName:null,signalsResetAt:null},taskStates:[],stateVersion:'1'};
const store = {readSnapshot:async()=>structuredClone(snapshot),readTasks:async()=>({stateVersion:'1',tasks:[]})};
const request = {topicId:'sick_care',concernIds:[],note,country:'US'};
const boundary = requestBoundary(note);
if(boundary)throw Error('App preflight rejected: '+boundary);
const prepared = await prepare({owner,request,store,catalog,allowEditorialReview:true,useProfileDefaults:true});
const body = buildNewNeedRequest(prepared,catalog,[],'gpt-6-luna');

if(process.argv.includes('--review')) {
  const raw = readFileSync(new URL('raw-output.txt',import.meta.url),'utf8').trim();
  const report = {method:'Unchanged app acceptNewNeedBatch/checkTaskCopy validation against the frozen first-user context.',passed:false};
  let output;
  try {output=JSON.parse(raw);const result=acceptNewNeedBatch(output,prepared,catalog,[],checkTaskCopy);
    report.decision=result.decision;report.taskCount=result.tasks.length;report.passed=result.decision==='generated'&&result.tasks.length===3;
    writeFileSync(new URL('accepted.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
  } catch(error) { report.error=error.code||error.message; }
  const wc=s=>s.trim().split(/\s+/u).length;
  report.copy=output?.tasks?.map(t=>({title:t.title,titleWords:wc(t.title),summaryWords:wc(t.summary),stepWords:t.steps.map(wc),doneWords:wc(t.done_when)}));
  report.individualCopyChecks=output?.tasks?.map(task=>{
    try {checkTaskCopy(task,prepared.effective);return {title:task.title,passed:true};}
    catch(error){return {title:task.title,passed:false,error:error.code||error.message};}
  });
  report.diagnosis='The first summary says "none is guaranteed to fit". The existing copyRisk regex rejects guarantee\\w* even when it negates a guarantee. This is a false positive. Batch acceptance is atomic, so no task is accepted. Other checks after this failure have not all been exercised.';
  writeFileSync(new URL('validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  const manifest=JSON.parse(readFileSync(new URL('manifest.json',import.meta.url),'utf8'));
  manifest.status='generated_validation_rejected';
  manifest.validation_file='validation.json';
  manifest.raw_output_file='raw-output.txt';
  manifest.observation_file='observation.json';
  writeFileSync(new URL('manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
  const cards=output.tasks.map((t,i)=>`## ${i+1}. ${t.title} · ${t.estimated_minutes} min\n\n${t.summary}\n\n${t.steps.map((s,j)=>`${j+1}. ${s}`).join('\n')}\n\n**Done when:** ${t.done_when}${t.resources.map(r=>{const ref=catalog.resources.find(x=>x.id===r.resource_id);return `\n\n**Helpful resource:** [${ref.name}](${ref.url}) — ${r.why}`;}).join('')}`).join('\n\n');
  const review=`# Real API trial: understanding the US medical system\n\n**Request:** ${note}\n\n**Outcome:** One real GPT-6 Luna Playground Responses generation returned three tasks. The unchanged app acceptance code rejected the batch with unsupported_task_copy. Nothing was deployed or saved to a user account.\n\nThe existing app prepare/buildNewNeedRequest code supplied the fresh-user context, catalog/resources and strict output schema. The candidate writer replaced the old core prompt and included its relevant Example A. No handpicked healthcare facts were added. Model reasoning was low; tools and stored logs were off. This tests the content path, not the deployed Worker, authentication, quotas or D1 persistence. Playground token cap and timeout parity were not verified. The UI showed 11.5s and 897t; these are UI observations, not verified billed usage.\n\n## Acceptance finding\n\n${report.diagnosis}\n\nThe writer revision is still a candidate. The rejection is preserved rather than bypassed or hidden with a rewritten answer.\n\n## Editorial findings\n\n- The model understood the request as research and produced three distinct cards with one resource-bearing card.\n- The first card introduces several care routes, but emphasizes virtual visits more than a beginner's wider healthcare map.\n- The estimate card has a concrete official starting point, but is narrow for someone seeking an introduction to the entire system.\n- The cost-terms card promises to explain terminology but mostly gives questions to investigate. It should contribute more knowledge, and its questions about "my plan" need a clear conditional branch when coverage is unknown.\n- A further revision should better distinguish learning the system from shopping for one visit, while preserving the concise presentation. These are review proposals, not implemented or approved content changes.\n\n## Unedited model wording\n\nThe resource display name and URL below resolve from the app catalog; all task wording is unchanged. These are rejected candidate cards, not successfully published app output.\n\n${cards}\n`;
  writeFileSync(new URL('review.md',import.meta.url),review);
  console.log(JSON.stringify(report,null,2));
} else {
  const master=readFileSync(new URL('../../sick-care-discovery-draft.md',import.meta.url),'utf8');
  const fence=String.fromCharCode(96).repeat(3);
  const full=master.split(fence+'text')[1].split(fence)[0].trim().replace(/\r\n/g,'\n');
  const selected=full.slice(0,full.indexOf('EXAMPLE B —'))+'\n'+full.slice(full.indexOf('FINAL CALIBRATION CHECK:'));
  if(!body.instructions.startsWith(sickCareInstructions))throw Error('Unexpected live prompt composition');
  body.instructions=selected+body.instructions.slice(sickCareInstructions.length)+
    '\n\nEXISTING APP OUTPUT CONTRACT: Title at most 9 words; summary at most 35; exactly three steps strings, each at most 25 words including its label; Done when at most 20 words; whole task at most 170 words. A research card places its three labeled copyable questions in steps. Preserve that research format within these current app limits. No URLs or HTML in copy; supply only eligible resource IDs in resources. Return the supplied decision/tasks JSON schema. These mechanical bounds do not change the useful-writing principles.';
  const input=body.input[0].content[0].text;
  const hash=s=>createHash('sha256').update(s).digest('hex');
  const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');};
  const manifest={status:'prepared_not_run',method:'One intended paid Playground Responses generation using the actual app prepare/buildNewNeedRequest pipeline, catalog, schema and acceptance checks. Revised draft writer replaces the old core for this test only.',
    model:body.model,reasoning:body.reasoning,store:false,max_output_tokens:body.max_output_tokens,
    exact_user_request:note,profile:'Empty new-user context; no invented insurance, doctor, budget or saved-task history. Not the founder account.',
    selected_examples:['A'],prompt_source:'docs/prompts/sick-care-discovery-draft.md',
    prompt_sha256:hash(body.instructions),input_sha256:hash(input),prompt_checksum:checksum(body.instructions),input_checksum:checksum(input),
    prompt_chars:body.instructions.length,input_chars:input.length,
    resource_ids:JSON.parse(input).eligible_resources.map(r=>r.resource_id),
    limitations:'Content-path test, not a cloud transport/persistence test. No handpicked sources or newly researched facts added. No live deployment or user data writes. Playground token cap/timeout parity must be reported separately.'};
  for(const [name,value] of Object.entries({'prompt.txt':body.instructions,'input.json':input,'schema.json':JSON.stringify(body.text.format,null,2),'request.json':JSON.stringify(body,null,2),'manifest.json':JSON.stringify(manifest,null,2)}))writeFileSync(new URL(name,import.meta.url),value);
  console.log(JSON.stringify(manifest,null,2));
}
