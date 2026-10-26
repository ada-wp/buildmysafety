// Isolated content evaluation. Imports real app logic; never deploys or writes user data.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {catalog} from '../../../../personalization/catalog.mjs';
import {prepare} from '../../../../personalization/flow.mjs';
import {buildNewNeedRequest,acceptNewNeedBatch} from '../../../../personalization/new-needs.mjs';
import {requestBoundary,checkTaskCopy} from '../../../../personalization/adaptation.mjs';
import {sickCareInstructions} from '../../../../personalization/generated/contracts.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const save=(name,value)=>writeFileSync(new URL(name,import.meta.url),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const owner='fictional-medical-system-review';
const note='i want to udnerstand US medical system';
const snapshot={profile:{schemaVersion:1,userId:owner,revision:1,updatedAt:'2026-10-14T12:00:00Z',
  answers:{why:null,home:null,focus:null,difficulty:[],constraints:[],strengths:[],hope:[],style:null,country:null},
  interests:[],personalizationEnabled:true,elephantName:null,signalsResetAt:null},taskStates:[],stateVersion:'1'};
const store={readSnapshot:async()=>structuredClone(snapshot),readTasks:async()=>({stateVersion:'1',tasks:[]})};
const request={topicId:'sick_care',concernIds:[],note,country:'US'};
if(requestBoundary(note))throw Error('App request boundary rejected this request');
const prepared=await prepare({owner,request,store,catalog,allowEditorialReview:true,useProfileDefaults:true});
const wc=s=>s.trim().split(/\s+/u).length;

if(!process.argv.includes('--review')){
  const body=buildNewNeedRequest(prepared,catalog,[],'gpt-6-luna');
  const fence=String.fromCharCode(96).repeat(3);
  const master=read('../../sick-care-discovery-draft.md');
  const full=master.split(fence+'text')[1].split(fence)[0].trim().replace(/\r\n/g,'\n');
  const selected=full.slice(0,full.indexOf('EXAMPLE B —'))+'\n'+full.slice(full.indexOf('FINAL CALIBRATION CHECK:'));
  if(!body.instructions.startsWith(sickCareInstructions))throw Error('Unexpected app prompt assembly');
  body.instructions=selected+body.instructions.slice(sickCareInstructions.length)+
    '\n\nOUTPUT CONTRACT FOR THIS CANDIDATE TEST: Preserve the app task fields and add search_prompt. Return a concise search_prompt string for each research/learning card, null for preparation-only cards. It supplements the three practical steps; never put questions or a search brief in their place. Title at most 9 words; summary at most 35; exactly three steps, each at most 25 words; Done when at most 20; core task at most 170 words. Search prompt at most 60 words, counted separately. No URLs or HTML in task copy or search_prompt; use eligible resource IDs and brief reasons in resources. Return only the supplied decision/tasks JSON.';
  const taskSchema=body.text.format.schema.properties.tasks.items;
  taskSchema.properties.search_prompt={anyOf:[{type:'string',minLength:1,maxLength:600},{type:'null'}]};
  taskSchema.required.push('search_prompt');
  body.text.format.name='safety_three_ideas_search_candidate';
  const input=body.input[0].content[0].text;
  if(input!==read('../2026-10-14-us-medical-system/input.json'))throw Error('Comparison input changed');
  const hash=s=>createHash('sha256').update(s).digest('hex');
  const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');};
  save('prompt.txt',body.instructions);save('input.json',input);save('schema.json',body.text.format);save('request.json',body);
  save('manifest.json',{status:'prepared_not_run',exact_user_request:note,model:body.model,reasoning:body.reasoning,store:false,
    max_output_tokens:body.max_output_tokens,context:'Same blank new-user context and input as the previous trial; no invented profile, additional facts or history.',
    method:'One intended real Playground Responses generation with the actual prepare/buildNewNeedRequest packet and existing catalog. Revised writer, relevant Example A and one supplemental schema field.',
    changes:['Updated writer and relevant Example A','Candidate nullable search_prompt field, limited to 60 words/600 characters in the test'],
    selected_examples:['A'],prompt_sha256:hash(body.instructions),input_sha256:hash(input),prompt_checksum:checksum(body.instructions),input_checksum:checksum(input),
    prompt_chars:body.instructions.length,input_chars:input.length,
    limitations:'Not deployed. Candidate search_prompt is not supported by the live schema/UI. Record unchanged-live acceptance separately from a base-task check without the new field. Playground transport, token cap and timeout may differ from the Worker. No user-data writes.'});
  console.log(read('manifest.json'));
}else{
  const output=JSON.parse(read('raw-output.txt'));
  const schema=JSON.parse(read('schema.json'));
  const require=createRequire(new URL('../../../../personalization/package.json',import.meta.url));
  const Ajv=require('ajv');const ajv=new Ajv({strict:false,allErrors:true});
  const valid=ajv.compile(schema.schema);const schemaPassed=valid(output);
  const check=body=>{try{const result=acceptNewNeedBatch(body,prepared,catalog,[],checkTaskCopy);return {passed:result.decision==='generated'&&result.tasks.length===3,decision:result.decision,taskCount:result.tasks.length};}catch(error){return {passed:false,error:error.code||error.message};}};
  const live=check(output);
  const base=structuredClone(output);for(const task of base.tasks||[])delete task.search_prompt;
  const baseCheck=check(base);
  const searchChecks=(output.tasks||[]).map(task=>{
    if(task.search_prompt===null)return {title:task.title,passed:true,searchPrompt:null};
    const text=task.search_prompt;let passed=typeof text==='string'&&wc(text)<=60&&text.length<=600&&!/https?:|www\.|[<>]/iu.test(text);let error=null;
    try{checkTaskCopy({title:'Search prompt',summary:'',steps:[text],done_when:'',resources:[],purchase_checks:[],no_purchase_option:null},prepared.effective);}catch(e){passed=false;error=e.code||e.message;}
    return {title:task.title,passed,wordCount:wc(text),error};
  });
  const report={candidateSchema:{passed:schemaPassed,errors:valid.errors},unchangedLiveAcceptance:live,baseTasksWithoutNewField:baseCheck,searchPromptChecks:searchChecks,
    candidatePassed:schemaPassed&&baseCheck.passed&&searchChecks.every(x=>x.passed),
    caveat:'A candidate pass is not a deployed-app pass. The original output is preserved unchanged; removal of search_prompt is diagnostic only.',
    copy:(output.tasks||[]).map(t=>({title:t.title,titleWords:wc(t.title),summaryWords:wc(t.summary),stepWords:t.steps.map(wc),doneWords:wc(t.done_when)}))};
  report.individualCoreCopyChecks=(output.tasks||[]).map(task=>{try{checkTaskCopy(task,prepared.effective);return {title:task.title,passed:true};}catch(error){return {title:task.title,passed:false,error:error.code||error.message};}});
  report.observedFailure='Card 2 step 2 says an estimate is not a guaranteed final bill. The current blanket guarantee-word regex rejects this negation. The live schema also lacks search_prompt. No checks were bypassed for acceptance, and later batch checks may remain unexercised.';
  save('validation.json',report);
  const manifest=JSON.parse(read('manifest.json'));manifest.status=report.candidatePassed?'generated_candidate_passed':'generated_candidate_rejected';manifest.deployed=false;save('manifest.json',manifest);
  const cards=(output.tasks||[]).map((t,i)=>`## ${i+1}. ${t.title} · ${t.estimated_minutes} min\n\n${t.summary}\n\n${t.steps.map((s,j)=>`${j+1}. ${s}`).join('\n')}\n\n**Done when:** ${t.done_when}${t.search_prompt?`\n\n**Search prompt:**\n> ${t.search_prompt}`:''}${t.resources.map(r=>{const ref=catalog.resources.find(x=>x.id===r.resource_id);return `\n\n**Helpful link:** [${ref?.name||r.resource_id}](${ref?.url||''}) — ${r.why}`;}).join('')}`).join('\n\n');
  save('review.md',`# US medical system — updated-format API rerun\n\nExact request: ${note}\n\nReal API generation, with the same app input and catalog as the earlier trial. Updated writer, relevant Example A and a candidate search_prompt field. No manual rewriting of the output. No additional factual research was supplied. No deployment, authentication test or cloud persistence test.\n\nCandidate validation: ${report.candidatePassed?'passed':'failed'}. Unchanged live acceptance: ${live.passed?'passed':`failed (${live.error||live.decision})`}. Base tasks without the supplemental field: ${baseCheck.passed?'passed':`failed (${baseCheck.error||baseCheck.decision})`}. The new field needs app integration; these checks do not establish that the live app can display this result.\n\n${report.observedFailure}\n\n## Editorial review\n\nThe requested presentation is present: three tasks, three instructional steps per task, a supplemental search prompt on each learning card, and two eligible links on one card. The model still narrows a broad healthcare-system learning request to care routes, self-pay estimates and video-visit mechanics. It does not give a beginner's map of insurance, provider roles and paying for care; the final card overlaps the first card's telehealth focus. The app packet's care-access scope, limited resource summaries and selected care-access example may be anchoring the result, but one test does not establish causality. It also exposes internal-sounding copy in card 2: "without sharing personal details in this task." Further content work is needed; format compliance is not quality approval.\n\nThe UI reported 11.8s and 1,067t. These observations are not verified billed usage. All three search-prompt texts passed the isolated copy/length checks; the core card remains rejected as recorded above.\n\n## Unedited model cards\n\nThe following wording is the model output. Resource names and URLs are resolved from the supplied app catalog.\n\n${cards}\n`);
  console.log(JSON.stringify(report,null,2));
}
