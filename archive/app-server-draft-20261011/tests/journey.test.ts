import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {SqliteDatabase} from '../scripts/sqlite';
import {handleApi} from '../server/service';
import {validateProfile} from '../server/profile';
import {chooseTasks} from '../server/recommend';
import {emptyProfile,type Profile,type TaskState} from '../src/model';
import {tasks,resources} from '../src/catalog';
import worker from '../server/worker';

const sample=JSON.parse(readFileSync(new URL('../../docs/contracts/user-profile-v0.example.json',import.meta.url),'utf8')) as Profile;
const input=(p:Profile)=>({answers:p.answers,interests:p.interests,personalizationEnabled:p.personalizationEnabled,elephantName:p.elephantName,revision:p.revision});
const now='2026-10-11T12:00:00.000Z';
async function call(db:SqliteDatabase,owner:string|null,path:string,method='GET',body?:unknown,time=now){
  const request=new Request('http://localhost:5178/api'+path,{method,...(body===undefined?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(body)})});
  const response=await handleApi(request,{db,userId:owner,mode:'local',now:()=>time});
  return {status:response.status,data:await response.json() as any};
}
const initialize=(db:SqliteDatabase,id='a')=>call(db,id,'/profile','PUT',input(sample));
const batchBody=(id:string)=>({requestId:id,profileRevision:1,topic:'sick_care',concerns:[],seen:[],note:'',profile:input(sample)});

test('profile contract accepts compact choices and rejects extra text, duplicate IDs and contradictory choices',()=>{
  assert.equal(validateProfile(sample),true);
  assert.ok(Buffer.byteLength(JSON.stringify(sample))<1000);
  for(const bad of [
    {...sample,note:'do not keep a private story'},
    {...sample,email:'not-needed@example.com'},
    {...sample,interests:['sick_care','sick_care']},
    {...sample,answers:{...sample.answers,constraints:['none','cost']}},
    {...sample,answers:{...sample.answers,strengths:['discovering','routine']}},
    {...sample,answers:{...sample.answers,hope:['start','prepared','trust']}},
    {...sample,answers:{...sample.answers,home:'private'}},
    {...sample,answers:{...sample.answers,feeling:'overwhelmed'}}
  ])assert.equal(validateProfile(bad),false);
  assert.equal(validateProfile(emptyProfile()),true);
});
test('catalog is small, distinct, short and traceable; batches respect region and link cap',()=>{
  assert.equal(tasks.length,5);
  assert.equal(new Set(tasks.map(t=>t.actionKey)).size,tasks.length);
  for(const t of tasks){assert.ok(t.steps.length>=2&&t.steps.length<=4);for(const s of t.steps)assert.ok(s.split(/\s+/).length<=25,s);assert.ok(t.doneWhen.split(/\s+/).length<=20);for(const id of t.resourceIds)assert.ok(resources.some(r=>r.id===id));}
  const first=chooseTasks(sample,[],[],[]);
  assert.equal(first.tasks.length,3);assert.ok(first.tasks.filter(t=>t.resourceIds.length).length<=1);
  const unknown={...sample,answers:{...sample.answers,country:null}};
  assert.ok(chooseTasks(unknown,[],[],[]).tasks.every(t=>!t.countries.length));
  assert.equal(chooseTasks(unknown,['help'],[],[]).status,'exhausted');
});
test('current concern wins; effort and saved choices shape relevant ordering without new model calls',()=>{
  const profile={...sample,answers:{...sample.answers,constraints:[],style:'choice'}};
  const shelf=tasks[0],state:TaskState={action_key:shelf.actionKey,content_id:shelf.id,shown_at:now,saved_at:now,removed_at:null,completed_at:null,liked_at:null,feedback_code:null,feedback_at:null};
  const before=chooseTasks(profile,[],[],[]).tasks.map(t=>t.actionKey);
  const after=chooseTasks(profile,[],[],[state]).tasks.map(t=>t.actionKey);
  assert.ok(!after.includes(shelf.actionKey));assert.notDeepEqual(before,after);
  const deliberate=chooseTasks(profile,['help'],[],[state]);assert.equal(deliberate.tasks[0].actionKey,tasks[2].actionKey);
  const brief=chooseTasks({...profile,answers:{...profile.answers,constraints:['energy']}},[],[],[]);
  assert.equal(brief.tasks[0].minutes,4);
  assert.equal(chooseTasks(profile,[],[],[],'urgent help right now').status,'unsupported');
  assert.equal(chooseTasks(profile,[],[],[],'fix my car engine').status,'unsupported');
});
test('private profiles, owner enforcement, validation and compare-and-swap edits',async()=>{
  const db=new SqliteDatabase();try{
    assert.equal((await call(db,null,'/profile','PUT',input(sample))).status,401);
    assert.equal((await call(db,'a','/profile','PUT',{...input(sample),userId:'b'})).status,400);
    assert.equal((await initialize(db)).status,200);
    assert.equal((await call(db,'b','/me')).data.profile,null);
    const saved=await call(db,'a','/profile','PUT',{...input(sample),elephantName:'Luna'});assert.equal(saved.data.profile.revision,2);
    assert.equal((await call(db,'a','/profile','PUT',input(sample))).status,409);
    assert.equal((await call(db,'a','/me')).data.profile.elephantName,'Luna');
  }finally{db.close();}
});
test('batches retry idempotently, do not repeat outcomes, expire caches and reject changed/stale requests',async()=>{
  const db=new SqliteDatabase();try{
    await initialize(db);
    const first=await call(db,'a','/recommendations','POST',batchBody('one'));assert.equal(first.status,200);assert.equal(first.data.tasks.length,3);
    const retry=await call(db,'a','/recommendations','POST',batchBody('one'));assert.deepEqual(retry.data.tasks,first.data.tasks);
    const second=await call(db,'a','/recommendations','POST',batchBody('two'));
    assert.equal(second.data.tasks.length,2);assert.ok(second.data.tasks.every((t:any)=>!first.data.tasks.some((old:any)=>old.actionKey===t.actionKey)));
    assert.equal((await call(db,'a','/recommendations','POST',batchBody('three'))).data.status,'exhausted');
    assert.equal((await call(db,'a','/recommendations','POST',{...batchBody('one'),concerns:['food']})).status,409);
    await call(db,'a','/profile','PUT',input(sample));
    assert.equal((await call(db,'a','/recommendations','POST',batchBody('old'))).status,409);
    await call(db,'a','/recommendations','POST',{...batchBody('later'),profileRevision:2},'2026-10-13T12:00:00.000Z');
    const rows=db.connection.prepare('SELECT COUNT(*) AS count FROM recommendation_batches').get()!;
    assert.equal(rows.count,1);
  }finally{db.close();}
});
test('concurrent duplicate batch and completion requests produce one result and one growth award',async()=>{
  const db=new SqliteDatabase();try{
    await initialize(db);
    const batches=await Promise.all([call(db,'a','/recommendations','POST',batchBody('parallel')),call(db,'a','/recommendations','POST',batchBody('parallel'))]);
    assert.deepEqual(batches[0].data.tasks,batches[1].data.tasks);
    const path='/tasks/'+tasks[0].actionKey;
    await call(db,'a',path,'PATCH',{operation:'save'});
    const complete=await Promise.all([1,2,3].map(()=>call(db,'a',path,'PATCH',{operation:'complete'})));
    assert.equal(complete.filter(r=>r.data.firstAward).length,1);
    assert.equal((await call(db,'a','/me')).data.awards,1);
  }finally{db.close();}
});
test('save, complete, undo, remove, restore, reset and export preserve the right data',async()=>{
  const db=new SqliteDatabase();try{
    await initialize(db);await initialize(db,'b');const key=tasks[0].actionKey,path='/tasks/'+key;
    await call(db,'a',path,'PATCH',{operation:'save'});await call(db,'a',path,'PATCH',{operation:'save'});
    assert.equal((await call(db,'a','/me')).data.tasks.length,1);
    assert.equal((await call(db,'b',path,'PATCH',{operation:'complete'})).status,404);
    assert.equal((await call(db,'a',path,'PATCH',{operation:'complete'})).data.firstAward,true);
    await call(db,'a',path,'PATCH',{operation:'undo'});
    assert.equal((await call(db,'a',path,'PATCH',{operation:'complete'})).data.firstAward,false);
    await call(db,'a',path,'PATCH',{operation:'remove'});
    let me=(await call(db,'a','/me')).data;assert.ok(me.tasks[0].removed_at);assert.equal(me.tasks[0].saved_at,null);assert.equal(me.awards,1);
    await call(db,'a',path,'PATCH',{operation:'save'});me=(await call(db,'a','/me')).data;assert.equal(me.tasks[0].removed_at,null);assert.ok(me.tasks[0].completed_at);
    await call(db,'a',path,'PATCH',{operation:'like'});await call(db,'a',path,'PATCH',{operation:'feedback',code:'helpful'});
    await call(db,'a','/preferences/reset','POST',{},'2026-10-11T13:00:00.000Z');me=(await call(db,'a','/me')).data;
    assert.equal(me.tasks[0].liked_at,null);assert.equal(me.tasks[0].feedback_code,null);assert.ok(me.tasks[0].saved_at);assert.equal(me.awards,1);
    const exported=(await call(db,'a','/export')).data;assert.equal(exported.content[0].id,tasks[0].id);assert.equal(exported.awards.length,1);
    const stored=JSON.stringify(exported);assert.ok(!stored.includes('email'));assert.ok(!stored.includes('feeling'));
    await call(db,'a','/account','DELETE',{confirm:'delete'});assert.equal((await call(db,'a','/me')).data.profile,null);assert.equal((await call(db,'a','/me')).data.awards,0);assert.ok((await call(db,'b','/me')).data.profile);
  }finally{db.close();}
});
test('anonymous seen choices transfer after sign-in; invalid resources and body sizes fail safely',async()=>{
  const db=new SqliteDatabase();try{
    await initialize(db);
    await call(db,'a','/seen','POST',{keys:[tasks[0].actionKey,tasks[1].actionKey]});
    const next=await call(db,'a','/recommendations','POST',batchBody('after-auth'));
    assert.ok(next.data.tasks.every((t:any)=>![tasks[0].actionKey,tasks[1].actionKey].includes(t.actionKey)));
    assert.equal((await call(db,'a','/seen','POST',{keys:['invented']})).status,400);
    assert.equal((await call(db,'a','/profile','PUT',{note:'x'.repeat(14000)})).status,413);
    const other=emptyProfile();other.answers.country='GB';await call(db,'b','/profile','PUT',input(other));
    assert.equal((await call(db,'b','/tasks/'+tasks[2].actionKey,'PATCH',{operation:'save'})).status,422);
  }finally{db.close();}
});
test('durable local database can be closed and reopened',async()=>{
  mkdirSync('.local',{recursive:true});const filename='.local/test-'+crypto.randomUUID()+'.sqlite';
  let db=new SqliteDatabase(filename);
  try {await initialize(db);await call(db,'a','/tasks/'+tasks[0].actionKey,'PATCH',{operation:'save'});db.close();db=new SqliteDatabase(filename);assert.equal((await call(db,'a','/me')).data.tasks.length,1);}
  finally{db.close();unlinkSync(filename);}
});
test('Worker has no local-test login and fails closed for private routes',async()=>{
  const db=new SqliteDatabase();try{
    for(const path of ['/api/local-session','/api/profile','/api/tasks/'+tasks[0].actionKey]){
      const response=await worker.fetch(new Request('https://example.invalid'+path,{method:'POST',headers:{Cookie:'safety_local=pretend'}}),{DB:db,ASSETS:{fetch:async()=>new Response('asset')}});
      assert.equal(response.status,503);
    }
    const response=await handleApi(new Request('http://localhost:5178/api/me',{headers:{Origin:'https://other.example'}}),{db,userId:'a',mode:'local'});assert.equal(response.status,403);
  }finally{db.close();}
});
