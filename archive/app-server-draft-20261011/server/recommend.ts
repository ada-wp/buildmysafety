import {concerns, tasks, resources} from '../src/catalog';
import type {Batch, Profile, TaskState} from '../src/model';

export function chooseTasks(profile:Profile, selected:string[], seen:string[], states:TaskState[], note=''): Omit<Batch,'requestId'> {
  const base={source:'reviewed_pool' as const, resources:[]};
  if(selected.some(id=>!concerns.some(([known])=>known===id))) throw new Error('Unknown concern.');
  if(/\b(urgent|emergency|right now|overdose|suicid|suicide|cannot breathe|can.t breathe)\b/i.test(note))
    return {...base,status:'unsupported',tasks:[],message:'This collection is for preparing ahead. It cannot assess an urgent situation. Contact appropriate local professional or emergency support if help is needed now.'};
  const inferred:string[]=[];
  if(/food|meal|groc|eat/i.test(note)) inferred.push('food');
  if(/help|support|errand/i.test(note)) inferred.push('help');
  if(/shelf|suppl|essential/i.test(note)) inferred.push('essentials');
  if(/chore|laundry|housework/i.test(note)) inferred.push('chores');
  if(/plan|commitment|cancel|reschedul|rest/i.test(note)) inferred.push('commitments');
  if(note.trim() && !selected.length && !inferred.length && !/sick|unwell|illness/i.test(note))
    return {...base,status:'unsupported',tasks:[],message:'I do not have a reviewed task for that request yet. Try one of the sick-day concerns or change your note.'};
  const scope=[...new Set([...selected,...inferred])];
  const excluded=new Set([...seen,...states.map(s=>s.action_key)]);
  const positive=profile.personalizationEnabled?states.filter(s=>{
    const date=s.liked_at || s.saved_at;
    return date && (!profile.signalsResetAt || date>profile.signalsResetAt);
  }).map(s=>tasks.find(t=>t.id===s.content_id)).filter(t=>!!t):[];
  const eligible=tasks.filter(t=>!excluded.has(t.actionKey)
    && (!scope.length||t.concerns.some(c=>scope.includes(c)))
    && (!t.countries.length||!!profile.answers.country&&t.countries.includes(profile.answers.country)));
  function score(task:(typeof tasks)[number]) {
    let score=0;
    if(profile.personalizationEnabled){
      score+=positive.filter(p=>p.tags.some(tag=>task.tags.includes(tag))).length;
      if(profile.answers.style==='resources'&&task.resourceIds.length) score+=3;
    }
    if(profile.answers.constraints.some(c=>['energy','time'].includes(c))) score+=(15-task.minutes)/4;
    if(profile.answers.constraints.includes('support')&&task.tags.includes('outside_help')) score+=3;
    return score;
  }
  eligible.sort((a,b)=>score(b)-score(a)||tasks.indexOf(a)-tasks.indexOf(b));
  let linked=false;
  const chosen=eligible.filter(t=>{if(t.resourceIds.length){if(linked)return false;linked=true;}return true;}).slice(0,3);
  return {source:'reviewed_pool',status:chosen.length?'ready':'exhausted',tasks:chosen,
    resources:resources.filter(r=>chosen.some(t=>t.resourceIds.includes(r.id))),
    ...(chosen.length?{}:{message:'No new ideas for these choices right now. Your saved tasks are still here. Try another concern when you feel like it.'})};
}
