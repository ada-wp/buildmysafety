// Freeze synthetic inputs for three independent writing calls. No paid calls.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepare } from '../../../../personalization/flow.mjs';
import { buildNewNeedRequest } from '../../../../personalization/new-needs.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const previous = read('../2026-10-12-english-preparation/inputs.json');
const candidate = read('../2026-10-12-english-preparation/candidate-catalog.json');
candidate.version = 'discovery-followup-evaluation-only';
const resource = (id, name, url, purpose, limits, cost='free') => ({id,name,url,purpose,limits,cost,
  reviewState:'editorial_review',topicIds:['sick_care'],countries:['US'],sourceCheckedAt:'2026-10-12',sourceUrls:[url]});
candidate.resources.push(
  resource('us_hhs_telehealth_candidate','HHS — finding telehealth','https://telehealth.hhs.gov/patients/how-do-i-schedule-telehealth-appointment',
    'Find routes to virtual care through an insurer or a health center without assuming an existing doctor.',
    'Information guide, not a care provider. Confirm eligible services, first-patient access, regional availability and personal cost with the plan or provider. Insurance coverage does not mean a visit is free.'),
  resource('us_teladoc_benefits_candidate','Teladoc — benefits and access FAQ','https://www.teladochealth.com/helpcenter/article/general-faqs',
    'Understand how an employer or health plan may provide virtual care and how to check eligibility.',
    'Teladoc is an example, not known to be in this user\'s plan. Use the service actually named by her benefits. Service eligibility and fees vary. Do not promise free care or copy a headline price.'),
  resource('us_hrsa_health_centers_candidate','HRSA — Find a Health Center','https://findahealthcenter.hrsa.gov/',
    'Find community health centers serving people with or without health insurance or ability to pay.',
    'Directory, not a confirmed appointment or free-care guarantee. Ask the center about new patients, current fees or reduced-fee eligibility, and whether a first visit can be virtual.'),
  resource('us_one_medical_ondemand_candidate','One Medical — On-Demand Care','https://health.amazon.com/onemedical',
    'Research a self-pay one-time virtual-care option when there is no applicable insurance benefit.',
    'On-Demand Care does not accept insurance; scheduled visits have different billing. Confirm current price, state eligibility, scope and any additional charges directly. Do not promise a prescription, suitability, a lowest price or that a membership covers all care.','paid')
);
candidate.resources.find(r=>r.id==='us_hrsa_health_centers_candidate').sourceUrls.push('https://www.hrsa.gov/get-health-care/affordable');
const english = readFileSync(new URL('../../sick-day-content-en.md',import.meta.url),'utf8');
const core = english.match(/```text\r?\n([\s\S]*?)\r?\n```/)[1].replace(/\r\n/g,'\n');
// Keep the same formatting adapter used in the earlier three-call trial.
const previousPrompt = readFileSync(new URL('../2026-10-12-english-preparation/prompt.txt',import.meta.url),'utf8');
const adapter = previousPrompt.slice(previousPrompt.indexOf('For this direct-request test,'));
const prompt = core+'\n\n'+adapter;
const definitions = [
  {id:'A',label:'Insured through work, no regular doctor',concerns:['getting_care'],support:'unknown',
   note:"I live alone in the US and have health insurance through work, but I don't have a regular doctor. I don't know where I would start if I wanted a virtual visit on a future sick day. I'd like to prepare while I'm well. I have 15 minutes to look into this, but I'm not booking a visit today.",
   resources:['us_hhs_telehealth_candidate','us_teladoc_benefits_candidate']},
  {id:'B',label:'Uninsured, limited budget, no established clinic',concerns:['getting_care'],support:'unknown',
   note:"I live alone in the US, don't have health insurance or a regular clinic, and money is tight. Before a future sick day, I want to find out whether there is an affordable way to talk to a clinician online. I'm well now and have 15 minutes to research; I'm not booking or paying for care today.",
   resources:['us_hrsa_health_centers_candidate','us_one_medical_ondemand_candidate']},
  {id:'C',label:'Care and delivery sorted; new need is cat care',concerns:['pets'],support:'unavailable',
   note:"I live alone in the US. I already have a doctor I can contact and have sorted prescription delivery. My cat's feeding instructions are also written down. What I haven't sorted is someone to visit my cat if I get sick; I have no one nearby who can do it. I'm well now, have 15 minutes, and can consider paid help. How can I prepare?",
   resources:['us_rover_sitting','us_psi_sitter_candidate']}
];
const cases=[];
for(const d of definitions) {
  const c=structuredClone(previous.cases[0]);
  c.id=d.id;c.label=d.label;c.baselineCase=null;c.note=d.note;c.concerns=d.concerns;c.support=d.support;
  c.request={...c.request,concernIds:d.concerns,note:d.note,localSupport:d.support};
  c.snapshot.profile.userId='fictional-discovery-'+d.id.toLowerCase();
  c.snapshot.profile.interests=['sick_care'];
  c.history=[];
  if(d.id==='C') {
    for(const key of ['sick_05_care_contact','sick_07_pet_care_note']) {
      const a=candidate.actions.find(a=>a.actionKey===key);
      const state={...previous.cases[2].history[0].state,userId:c.snapshot.profile.userId,actionKey:key,contentRef:key+'@1'};
      c.history.push({state,content:structuredClone(a.task)});
    }
  }
  c.snapshot.taskStates=c.history.map(h=>h.state);
  const store={readSnapshot:async()=>structuredClone(c.snapshot),readTasks:async()=>({stateVersion:'1',tasks:structuredClone(c.history)})};
  const prepared=await prepare({owner:c.snapshot.profile.userId,request:c.request,store,catalog:candidate,allowEditorialReview:true,useProfileDefaults:true});
  c.packet=JSON.parse(buildNewNeedRequest(prepared,candidate,c.history,'gpt-6-luna').input[0].content[0].text);
  // Human-selected knowledge for these editorial tests, not a new live retrieval implementation.
  c.packet.eligible_resources=c.packet.eligible_resources.filter(r=>d.resources.includes(r.resource_id));
  c.resourceSelection=d.resources;
  cases.push(c);
}
const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');};
const inputs={kind:'Three synthetic discovery-writing tests; no real user data',sourceCommit:'d9cc911',model:'gpt-6-luna',reasoning:'low',promptHash:createHash('sha256').update(prompt).digest('hex'),method:'Revised English core, unchanged one-task adapter/schema, manually scoped reviewed resources. No authored task examples. Not a controlled prompt-only comparison or deployed retrieval test.',cases};
const save=(name,value)=>writeFileSync(new URL(name,import.meta.url),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
save('inputs.json',inputs);save('candidate-catalog.json',candidate);save('prompt.txt',prompt);save('schema.json',read('../2026-10-12-english-preparation/schema.json'));
console.log(JSON.stringify({promptHash:inputs.promptHash,promptChars:prompt.length,promptChecksum:checksum(prompt),cases:cases.map(c=>({id:c.id,chars:JSON.stringify(c.packet).length,checksum:checksum(JSON.stringify(c.packet))}))},null,2));
