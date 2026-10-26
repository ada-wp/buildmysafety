import {useEffect,useRef,useState} from 'react';
import {api} from './api';
import {emptyProfile,type Profile,type Task,type TaskState,type Me,type Batch} from './model';
import {tasks,resources,concerns,interestLabels} from './catalog';
import {questions} from './onboarding';

type Page='welcome'|'question'|'interests'|'recap'|'explore'|'concerns'|'ideas'|'detail'|'signin'|'list'|'celebrate'|'account';
const pages:Page[]=['welcome','question','interests','recap','explore','concerns','ideas','detail','signin','list','celebrate','account'];
const profileInput=(p:Profile)=>({answers:p.answers,interests:p.interests,personalizationEnabled:p.personalizationEnabled,elephantName:p.elephantName,revision:p.revision});
function Elephant({large=false,name}:{large?:boolean;name?:string|null}){return <img className={large?'elephant large':'elephant'} src="/elephant.svg" alt={name||'Your lavender elephant companion'}/>;}
const labelFor=(key:string,value:string)=>questions.find(q=>q.id===key)?.options?.find(o=>o[0]===value)?.[1]||value;

export default function App(){
  const [page,setPage]=useState<Page>('welcome'),[step,setStep]=useState(0),[profile,setProfile]=useState<Profile>(emptyProfile());
  const [me,setMe]=useState<Me>({profile:null,tasks:[],awards:0}),[signedIn,setSignedIn]=useState(false);
  const [mode,setMode]=useState('loading'),[selected,setSelected]=useState<string[]>([]),[note,setNote]=useState(''),[feeling,setFeeling]=useState<string|null>(null);
  const [batch,setBatch]=useState<Batch|null>(null),[seen,setSeen]=useState<string[]>([]),[showAll,setShowAll]=useState(false);
  const [taskKey,setTaskKey]=useState(tasks[0].actionKey),[detailOrigin,setDetailOrigin]=useState<Page>('ideas');
  const [pending,setPending]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [undo,setUndo]=useState<{key:string;op:string}|null>(null),[editing,setEditing]=useState(false),[deleting,setDeleting]=useState(false);
  const [highFive,setHighFive]=useState(false);
  const requestToken=useRef(0),pageRef=useRef(page),profileRef=useRef(profile),heading=useRef<HTMLHeadingElement>(null);
  pageRef.current=page;profileRef.current=profile;
  const task=tasks.find(t=>t.actionKey===taskKey)||tasks[0];
  const taskState=me.tasks.find(t=>t.action_key===taskKey);
  const saved=me.tasks.filter(t=>t.saved_at),active=saved.filter(t=>!t.completed_at),completed=saved.filter(t=>t.completed_at);
  function nav(next:Page,key?:string){setError('');setPage(next);if(key)setTaskKey(key);history.pushState({page:next,key:key||taskKey},'',`#/${next}${next==='detail'?'/'+encodeURIComponent(key||taskKey):''}`);}
  useEffect(()=>{heading.current?.focus();window.scrollTo(0,0);},[page,step]);
  useEffect(()=>{
    const pop=()=>{const [,p,key]=location.hash.split('/');if(pages.includes(p as Page)){setPage(p as Page);if(key)setTaskKey(decodeURIComponent(key));}else setPage('welcome');};
    window.addEventListener('popstate',pop);
    Promise.all([api('/config'),api('/me')]).then(([config,data])=>{
      setMode(config.mode);setMe(data);setSignedIn(data.signedIn);
      if(data.profile)setProfile(data.profile);
      if(location.hash)pop();else if(data.signedIn&&data.profile)setPage('list');
    }).catch(()=>{setMode('unavailable');setError('The app could not connect. Reload to try again.');});
    return()=>window.removeEventListener('popstate',pop);
  },[]);
  async function refresh(){const data=await api('/me');setMe(data);setSignedIn(data.signedIn);if(data.profile)setProfile(data.profile);return data as Me&{signedIn:boolean};}
  async function run(work:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await work();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  function updateAnswer(key:string,value:string[]){
    requestToken.current++;
    if(key==='note'){return;}
    if(key==='feeling'){setFeeling(value[0]||null);return;}
    const q=questions.find(q=>q.id===key)!;
    setProfile(p=>({...p,answers:{...p.answers,[key]:q.multi?value:value[0]==='private'?null:value[0]||null}}));
  }
  function answer(key:string):string[]{if(key==='feeling')return feeling?[feeling]:[];const v=profile.answers[key as keyof Profile['answers']];return Array.isArray(v)?v:v?[v]:[];}
  function choose(key:string,option:string){const q=questions.find(q=>q.id===key)!;let next=answer(key);
    if(!q.multi)next=[option];else if(next.includes(option))next=next.filter(x=>x!==option);
    else if(q.exclusive?.includes(option))next=[option];else{next=next.filter(x=>!q.exclusive?.includes(x));if(q.max&&next.length>=q.max)return;next=[...next,option];}
    updateAnswer(key,next);
  }
  async function persistProfile(){const result=await api('/profile','PUT',profileInput(profileRef.current));setProfile(result.profile);setMe(m=>({...m,profile:result.profile}));return result.profile as Profile;}
  function nextQuestion(){if(editing){setEditing(false);nav('recap');return;}if(step<questions.length-1)setStep(s=>s+1);else nav('interests');}
  async function beginIdeas(){await run(async()=>{if(signedIn)await persistProfile();nav('concerns');});}
  async function getIdeas(){await run(async()=>{
    const token=++requestToken.current,start=pageRef.current,p=profileRef.current;
    const result=await api<Batch>('/recommendations','POST',{requestId:crypto.randomUUID(),topic:'sick_care',concerns:selected,note,seen,profile:profileInput(p),profileRevision:p.revision});
    if(token!==requestToken.current||p!==profileRef.current)return;
    setBatch(result);setSeen(old=>[...new Set([...old,...result.tasks.map(t=>t.actionKey)])]);setShowAll(false);
    if(start===pageRef.current)nav('ideas');
  });}
  function openTask(t:Task,origin:Page){setDetailOrigin(origin);nav('detail',t.actionKey);}
  async function saveTask(key:string){
    if(!signedIn){setPending(key);nav('signin');return;}
    await run(async()=>{await api('/tasks/'+encodeURIComponent(key),'PATCH',{operation:'save'});await refresh();setNotice('Added to your list. One small thing, whenever you are ready.');setUndo(null);});
  }
  async function testSignIn(account:'a'|'b'){await run(async()=>{
    await api('/local-session','POST',{account});let data=await refresh();
    if(!data.profile){const result=await api('/profile','PUT',profileInput(profile));setProfile(result.profile);data={...data,profile:result.profile};}
    if(seen.length)await api('/seen','POST',{keys:seen});
    if(pending){await api('/tasks/'+encodeURIComponent(pending),'PATCH',{operation:'save'});setPending(null);}
    await refresh();setNotice('Saved in this local test account.');nav('list');
  });}
  async function taskAction(key:string,operation:string){await run(async()=>{
    const result=await api('/tasks/'+encodeURIComponent(key),'PATCH',{operation});await refresh();
    if(operation==='complete'){setUndo({key,op:'undo'});setNotice('One useful thing in place.');if(result.firstAward){setTaskKey(key);nav('celebrate');}}
    if(operation==='undo'){setUndo(null);setNotice('Marked as still to do. Your elephant keeps its growth.');}
    if(operation==='remove'){setUndo({key,op:'save'});setNotice('Removed from your list.');if(page==='detail')nav('list');}
    if(operation==='save'){setUndo(null);setNotice('Restored to your list.');}
  });}
  async function signOut(){await run(async()=>{await api('/local-session','DELETE');setSignedIn(false);setProfile(emptyProfile());setMe({profile:null,tasks:[],awards:0});setBatch(null);setSeen([]);setNote('');setFeeling(null);setPending(null);setNotice('');setUndo(null);nav('welcome');});}
  const q=questions[step];
  const backLabel=page==='detail'?(detailOrigin==='list'?'My list':'Ideas'):page==='celebrate'?'My list':'Back';
  function back(){if(page==='detail')nav(detailOrigin);else if(page==='celebrate'||page==='account')nav('list');else if(page==='question'&&step>0&&!editing)setStep(s=>s-1);else if(page==='question'&&editing){setEditing(false);nav('recap');}else if(page==='interests')nav('recap');else if(page==='signin')nav(batch?'ideas':'welcome');else if(page==='recap'){nav('interests');}else nav('explore');}
  function taskCard(t:Task){const state=me.tasks.find(s=>s.action_key===t.actionKey);return <article className="task-card" key={t.id}>
    <div className="task-card-main"><button className="task-title" onClick={()=>openTask(t,'ideas')}>{t.title}</button><button className={'add '+(state?.saved_at?'added':'')} aria-label={state?.saved_at?`${t.title} added`:`Add ${t.title}`} disabled={busy||!!state?.saved_at} onClick={()=>saveTask(t.actionKey)}>{state?.saved_at?'✓':'+'}</button></div>
    <span className="meta">{t.minutes} min</span><details className="card-peek"><summary>Take a closer look <span aria-hidden>⌄</span></summary><p>{t.summary}</p><button className="text-button" onClick={()=>openTask(t,'ideas')}>See the steps →</button></details>
  </article>;}
  return <>
    <aside className="build-status">{mode==='local'?'Local working build · sample accounts · no emails or AI calls':mode==='loading'?'Connecting…':'Early build · email sign-in not connected'}</aside>
    <div className="app-shell">
      <header className="topbar">{page==='welcome'?<span className="wordmark">my safety</span>:<button className="back" onClick={back}><span aria-hidden>‹</span> {backLabel}</button>}
        <button className="pet-button" aria-label="Your elephant and account" onClick={()=>nav('account')}><Elephant name={profile.elephantName}/></button></header>
      <main>
        {error&&<div role="alert" className="message error">{error}<button className="text-button" onClick={()=>setError('')}>Dismiss</button></div>}
        {notice&&page!=='celebrate'&&<div className="message" role="status">{notice}{undo&&<button className="text-button" disabled={busy} onClick={()=>taskAction(undo.key,undo.op)}>Undo</button>}</div>}
        {page==='welcome'&&<section className="welcome"><span className="eyebrow">A little more “I can handle this.”</span><h1 ref={heading} tabIndex={-1}>Meet your<br/>little protector.</h1><Elephant large/><p>Build a life that feels more like yours. One preparation, one choice, one small action at a time.</p><button className="primary" disabled={mode==='loading'||mode==='unavailable'} onClick={()=>{setStep(0);nav('question');}}>Let’s begin</button><button className="text-button" onClick={()=>nav(signedIn?'list':'signin')}>I already have a list</button></section>}
        {page==='question'&&<section className="onboarding">
          <div className="question-progress" aria-label={`Question ${step+1} of ${questions.length}`}>{questions.map((_,i)=><span key={i} className={i<=step?'filled':''}/>)}</div>
          <span className="eyebrow">Getting to know you · {step+1}/{questions.length}</span>
          {step===2&&profile.answers.why==='trust'&&<p className="gentle-comment">We can build from small moments of “I did that.”</p>}
          {step===4&&profile.answers.difficulty.includes('alone')&&<p className="gentle-comment">Feeling capable can include knowing where to turn. You do not have to do everything yourself.</p>}
          {step===7&&<p className="gentle-comment">Small preparations can give us more room to choose how we live.</p>}
          <h1 ref={heading} tabIndex={-1} className="question-title">{q.title}</h1>
          {q.multi&&<p className="hint">{q.max?`Choose up to ${q.max}.`:'Choose what fits.'}</p>}
          {q.kind==='country'?<><label htmlFor="country">Country or region</label><select id="country" value={profile.answers.country||''} onChange={e=>updateAnswer('country',e.target.value?[e.target.value]:[])}><option value="">Keep it general</option>{(()=>{const names=new Intl.DisplayNames(['en'],{type:'region',fallback:'none'}),result:{code:string;name:string}[]=[];for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){const code=String.fromCharCode(a,b),name=names.of(code);if(name&&!['EU','EZ','UN','QO','XA','XB','ZZ','UK','AC','CP','DG','EA','IC','TA'].includes(code))result.push({code,name});}return result.sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option value={c.code} key={c.code}>{c.name}</option>);})()}</select><p className="hint">For relevant resources. No street address needed.</p></>
          :q.kind==='text'?<><label className="sr-only" htmlFor="onboarding-note">Anything else to understand</label><textarea id="onboarding-note" maxLength={600} value={note} onChange={e=>setNote(e.target.value)} placeholder="Only if there is something you want to add…"/><p className="hint">Optional. Used for this visit; not saved to your profile.</p></>
          :<div className="choices" role="group" aria-label={q.title}>{q.options?.map(([id,label])=><button key={id} className={'choice '+(answer(q.id).includes(id)?'selected':'')} aria-pressed={answer(q.id).includes(id)} onClick={()=>choose(q.id,id)}><span>{label}</span><span className={q.multi?'check':'radio'} aria-hidden>{answer(q.id).includes(id)?'✓':''}</span></button>)}</div>}
          <button className="primary" disabled={!q.optional&&!answer(q.id).length} onClick={nextQuestion}>{editing?'Save answer':'Continue'}</button>
          {q.optional&&<button className="text-button" onClick={()=>{if(q.kind==='text')setNote('');else updateAnswer(q.id,[]);nextQuestion();}}>Skip for now</button>}
        </section>}
        {page==='interests'&&<section><span className="eyebrow">Follow your curiosity</span><h1 ref={heading} tabIndex={-1}>What would you<br/>like to build?</h1><p>Choose what would make life on your own feel a little easier.</p><div className="bubbles">{Object.entries(interestLabels).map(([id,label])=><button key={id} aria-pressed={profile.interests.includes(id)} className={profile.interests.includes(id)?'selected':''} onClick={()=>setProfile(p=>({...p,interests:p.interests.includes(id)?p.interests.filter(x=>x!==id):[...p.interests,id]}))}>{label}{profile.interests.includes(id)?' ✓':''}</button>)}</div><p className="hint">Choose any that draw you in. Our first working collection is sick-day care; more topics will come later.</p><button className="primary" onClick={()=>nav('recap')}>Continue</button><button className="text-button" onClick={()=>{setProfile(p=>({...p,interests:[]}));nav('recap');}}>I’ll explore along the way</button></section>}
        {page==='recap'&&<section><span className="eyebrow">Yours to change</span><h1 ref={heading} tabIndex={-1}>A starting point<br/>that feels like you.</h1><p>These choices add a little focus. You can always explore something different.</p>{profile.answers.hope.length>0&&<div className="hope-card"><span className="eyebrow">A feeling you’d like to build</span>{profile.answers.hope.map(id=><p key={id}>{labelFor('hope',id)}</p>)}</div>}
          <div className="recap-row"><div><small>What draws you in</small><p>{profile.interests.map(id=>interestLabels[id]).join(' · ')||'Explore along the way'}</p></div><button className="text-button" onClick={()=>nav('interests')}>Edit</button></div>
          <details className="answer-review"><summary>Review my answers</summary>{questions.filter(q=>!['note','feeling'].includes(q.id)).map((q,i)=><div className="recap-row" key={q.id}><div><small>{q.title}</small><p>{answer(q.id).map(id=>labelFor(q.id,id)).join(' · ')||'Skipped'}</p></div><button className="text-button" aria-label={`Edit ${q.title}`} onClick={()=>{setStep(questions.indexOf(q));setEditing(true);nav('question');}}>Edit</button></div>)}</details>
          <button className="primary" disabled={busy} onClick={beginIdeas}>{busy?'Saving…':'Try the sick-day collection'}</button><p className="hint">A small first collection to help you prepare for a day at home unwell.</p>
        </section>}
        {page==='explore'&&<section><span className="eyebrow">A little preparation, your way</span><h1 ref={heading} tabIndex={-1}>What would feel<br/>easier?</h1><button className="topic-card" onClick={()=>nav('concerns')}><span className="topic-icon" aria-hidden>✳</span><div><strong>Sick-day care</strong><p>Food, essentials, outside help and room to rest.</p><span className="meta">Explore this collection →</span></div></button><p className="hint">This first build has five tasks. Other topics are on the way.</p><button className="text-button" onClick={()=>nav('interests')}>My interests</button></section>}
        {page==='concerns'&&<section><span className="pill">Sick-day care</span><h1 ref={heading} tabIndex={-1}>What would help<br/>you feel ready?</h1><p>Choose what is on your mind. A small place to start is enough.</p><div className="choices">{concerns.map(([id,label])=><label className={'choice '+(selected.includes(id)?'selected':'')} key={id}><span>{label}</span><input type="checkbox" checked={selected.includes(id)} onChange={()=>setSelected(v=>v.includes(id)?v.filter(c=>c!==id):[...v,id])}/></label>)}</div><label htmlFor="concern-note">Or put it in your own words</label><textarea id="concern-note" value={note} maxLength={600} onChange={e=>setNote(e.target.value)} placeholder="For example, I want food within easy reach…"/><p className="hint">This small collection matches familiar sick-day concerns. It is preparation, not urgent or medical help.</p><button className="primary" disabled={busy} onClick={getIdeas}>{busy?'Finding your ideas…':'Find my first steps'}</button></section>}
        {page==='ideas'&&<section><span className="eyebrow">Small things, more possibilities</span><h1 ref={heading} tabIndex={-1}>A little more<br/>prepared.</h1><p>Keep what feels useful. Leave the rest.</p>{batch?.message&&<div className="message">{batch.message}</div>}{!batch&&<p>You can choose a concern to find your first ideas.</p>}
          {(profile.answers.style==='one'&&!showAll?batch?.tasks.slice(0,1):batch?.tasks)?.map(taskCard)}
          {profile.answers.style==='one'&&!showAll&&(batch?.tasks.length||0)>1&&<button className="secondary" onClick={()=>setShowAll(true)}>See the other possibilities</button>}
          <button className="primary" onClick={()=>nav('list')}>Go to my list{saved.length?` · ${saved.length}`:''}</button>
          <button className="text-button" disabled={busy} onClick={getIdeas}>{busy?'Finding your ideas…':'Find another batch'}</button><button className="text-button" onClick={()=>nav('concerns')}>Change my concerns</button>
        </section>}
        {page==='detail'&&<section className="detail"><div className="task-meta"><span className="pill">Sick days</span><span>{task.minutes} min</span></div><h1 ref={heading} tabIndex={-1}>{task.title}.</h1><p className="description">{task.summary}</p><ol className="steps">{task.steps.map((s,i)=><li key={s}><span className="step-number">{i+1}</span><p>{s}</p></li>)}</ol><div className="done-when"><strong>Done when</strong><p>{task.doneWhen}</p></div>{task.resourceIds.length>0&&<details className="optional-row"><summary>Helpful link <span>1 ⌄</span></summary>{resources.filter(r=>task.resourceIds.includes(r.id)).map(r=><div key={r.id}><p>{r.purpose}</p><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗</a><p className="hint">A starting point to research. Local availability and eligibility need checking.</p></div>)}</details>}{task.purchaseChecks&&<details className="optional-row"><summary>If you’re buying food <span>⌄</span></summary><ul>{task.purchaseChecks.map(c=><li key={c}>{c}</li>)}</ul></details>}
          {taskState?.saved_at?<><button className="primary" disabled={busy} onClick={()=>taskAction(task.actionKey,taskState.completed_at?'undo':'complete')}>{taskState.completed_at?'Mark as still to do':'Mark as done'}</button><button className="text-button" disabled={busy} onClick={()=>taskAction(task.actionKey,'remove')}>Remove from my list</button></>:<button className="primary" disabled={busy} onClick={()=>saveTask(task.actionKey)}>+ Add to my list</button>}
        </section>}
        {page==='signin'&&<section><span className="eyebrow">Keep your little wins</span><h1 ref={heading} tabIndex={-1}>A place for<br/>your progress.</h1><p>Sign in with email to keep your list and grow together.</p>{mode==='local'?<div className="test-panel"><strong>Local test sign-in</strong><p>Real email delivery is not connected yet. Choose a fictional account to try saving and returning. No email address is collected.</p><button className="primary" disabled={busy} onClick={()=>testSignIn('a')}>Continue as test account A</button><button className="secondary" disabled={busy} onClick={()=>testSignIn('b')}>Continue as test account B</button></div>:<div className="message">Email sign-in is being connected. You can still explore the task collection.</div>}<button className="text-button" onClick={()=>nav('ideas')}>Keep exploring</button></section>}
        {page==='list'&&<section><span className="eyebrow">At your own pace</span><h1 ref={heading} tabIndex={-1}>My list.</h1>{!signedIn?<><p>Keep the ideas you want to try, and come back when you are ready.</p><button className="primary" onClick={()=>nav('signin')}>Keep my list</button><button className="text-button" onClick={()=>nav('explore')}>Explore ideas</button></>:<>
          <button className="progress-card" onClick={()=>nav('account')}><Elephant name={profile.elephantName}/><div><strong>{me.awards?`${me.awards} small ${me.awards===1?'step':'steps'}, together`:'Your first little step awaits'}</strong><p>{me.awards?'A record of what you’ve put in place.':'Your elephant is here at your pace.'}</p></div></button>
          {!saved.length&&<div className="empty"><h2>Your list starts here.</h2><p>Choose one small thing you would like to make easier.</p><button className="primary" onClick={()=>nav('explore')}>Find my first task</button></div>}
          {saved.length>0&&!active.length&&<div className="empty"><h2>A little room to breathe.</h2><p>You’ve finished what you chose. It’s okay to stop here.</p></div>}
          {active.map(state=><div className="list-task" key={state.action_key}><input type="checkbox" aria-label={`Complete ${tasks.find(t=>t.id===state.content_id)?.title}`} checked={false} disabled={busy} onChange={()=>taskAction(state.action_key,'complete')}/><button className="task-title" onClick={()=>openTask(tasks.find(t=>t.id===state.content_id)!,'list')}>{tasks.find(t=>t.id===state.content_id)?.title}<small>{tasks.find(t=>t.id===state.content_id)?.minutes} min</small></button><button className="remove" aria-label={`Remove ${tasks.find(t=>t.id===state.content_id)?.title}`} disabled={busy} onClick={()=>taskAction(state.action_key,'remove')}>×</button></div>)}
          {completed.length>0&&<details className="completed-list" open><summary>Done · {completed.length}</summary>{completed.map(state=><div className="list-task completed" key={state.action_key}><input type="checkbox" aria-label={`Mark ${tasks.find(t=>t.id===state.content_id)?.title} as still to do`} checked disabled={busy} onChange={()=>taskAction(state.action_key,'undo')}/><button className="task-title" onClick={()=>openTask(tasks.find(t=>t.id===state.content_id)!,'list')}>{tasks.find(t=>t.id===state.content_id)?.title}</button></div>)}</details>}
          {me.tasks.some(s=>s.removed_at)&&<details className="completed-list"><summary>Removed tasks</summary>{me.tasks.filter(s=>s.removed_at).map(s=><div className="list-task" key={s.action_key}><span>{tasks.find(t=>t.id===s.content_id)?.title}</span><button className="text-button" disabled={busy} onClick={()=>taskAction(s.action_key,'save')}>Restore</button></div>)}</details>}
          {saved.length>0&&<button className="text-button" onClick={()=>nav('explore')}>Explore when you’re ready →</button>}
        </>}</section>}
        {page==='celebrate'&&<section className="celebration"><span className="eyebrow">One useful thing in place</span><h1 ref={heading} tabIndex={-1}>Look what<br/>you just did.</h1><div className={highFive?'high-five':''}><Elephant large name={profile.elephantName}/></div><p>{task.doneWhen}</p><div className="growth-label">{me.awards} small {me.awards===1?'step':'steps'}, together</div><p className="hint">A little more “I can handle this.”</p><button className="secondary" onClick={()=>{setHighFive(true);setTimeout(()=>setHighFive(false),600);}}>Tiny trunk high-five?</button><button className="primary" onClick={()=>nav('list')}>Back to my list</button><button className="text-button" disabled={busy} onClick={async()=>{await taskAction(task.actionKey,'undo');nav('list');}}>Not done yet? Undo</button></section>}
        {page==='account'&&<section><span className="eyebrow">Your little corner</span><h1 ref={heading} tabIndex={-1}>Growing<br/>together.</h1><div className="account-elephant"><Elephant large name={profile.elephantName}/></div>{!signedIn?<><p>Keep your list and your elephant’s progress in one place.</p><button className="primary" onClick={()=>nav('signin')}>Sign in</button></>:<>
          <p>{me.awards} distinct {me.awards===1?'action':'actions'} completed. Your elephant never loses growth when you take a break.</p><label htmlFor="pet-name">Your elephant’s name · optional</label><input id="pet-name" type="text" maxLength={24} value={profile.elephantName||''} onChange={e=>setProfile(p=>({...p,elephantName:e.target.value||null}))}/>
          <label className="setting"><span>Use my choices to personalize ideas</span><input type="checkbox" checked={profile.personalizationEnabled} onChange={e=>setProfile(p=>({...p,personalizationEnabled:e.target.checked}))}/></label><button className="primary" disabled={busy} onClick={()=>run(async()=>{await persistProfile();setNotice('Preferences saved.');})}>Save preferences</button><button className="text-button" onClick={()=>nav('recap')}>Review my starting point</button>
          <button className="text-button" disabled={busy} onClick={()=>run(async()=>{await api('/preferences/reset','POST',{});await refresh();setNotice('Preference signals reset. Your tasks and elephant progress are kept.');})}>Reset what my task choices suggest</button>
          <button className="text-button" disabled={busy} onClick={()=>run(async()=>{const data=await api('/export'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='my-safety-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);})}>Download my data</button><button className="text-button" onClick={signOut} disabled={busy}>Sign out</button>
          {!deleting?<button className="text-button danger" onClick={()=>setDeleting(true)}>Delete my app data</button>:<div className="message"><p>Delete this account’s preferences, tasks and elephant progress from this app? This cannot be undone.</p><button className="secondary danger" disabled={busy} onClick={()=>run(async()=>{await api('/account','DELETE',{confirm:'delete'});await api('/local-session','DELETE');setSignedIn(false);setMe({profile:null,tasks:[],awards:0});setProfile(emptyProfile());setBatch(null);setSeen([]);setNote('');setFeeling(null);setPending(null);setNotice('Your app data has been deleted.');setDeleting(false);nav('welcome');})}>Yes, delete my app data</button><button className="text-button" onClick={()=>setDeleting(false)}>Keep my data</button></div>}
        </>}</section>}
      </main>
      {!['welcome','question','interests','recap','signin'].includes(page)&&<nav className="bottom-nav" aria-label="Main navigation"><button aria-current={['list','celebrate','account'].includes(page)?'page':undefined} onClick={()=>nav('list')}><span aria-hidden>☷</span> My list</button><button aria-current={['explore','concerns','ideas'].includes(page)?'page':undefined} onClick={()=>nav('explore')}><span aria-hidden>✳</span> Explore</button></nav>}
    </div>
  </>;
}
