import type {Database} from './database';
import {profileFromInput} from './profile';
import {chooseTasks} from './recommend';
import {tasks, taskByKey, resources} from '../src/catalog';
import type {Profile, TaskState, Batch} from '../src/model';

export type Context={db:Database; userId:string|null; mode:'local'|'configured'|'setup'; now?:()=>string};
class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readBody(req:Request):Promise<Record<string,any>> {
  if(!req.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Use a JSON request.');
  const reader=req.body?.getReader(); let length=0; const chunks:Uint8Array[]=[];
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>12288){await reader.cancel();throw new HttpError(413,'This request is too large.');}chunks.push(value);}
  const buffer=new Uint8Array(length);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
  try {const body=JSON.parse(new TextDecoder().decode(buffer));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}
  catch{throw new HttpError(400,'Please check your request.');}
}
async function getProfile(ctx:Context):Promise<Profile|null>{
  if(!ctx.userId)return null;
  const row=await ctx.db.prepare('SELECT profile_json FROM profiles WHERE user_id=?').bind(ctx.userId).first<{profile_json:string}>();
  return row?JSON.parse(row.profile_json):null;
}
async function getStates(ctx:Context):Promise<TaskState[]>{
  if(!ctx.userId)return [];
  return (await ctx.db.prepare('SELECT action_key, content_id, shown_at, saved_at, removed_at, completed_at, liked_at, feedback_code, feedback_at FROM user_tasks WHERE user_id=?').bind(ctx.userId).all<TaskState>()).results;
}
function signed(ctx:Context):string {if(!ctx.userId)throw new HttpError(401,'Sign in to keep your list.');return ctx.userId;}
function checkedProfile(input:unknown,userId:string,previous:Profile|null,now:string){
  try{return profileFromInput(input,userId,previous,now);}catch(error){throw new HttpError(400,(error as Error).message);}
}
export async function handleApi(req:Request,ctx:Context):Promise<Response> {
  try {
    const url=new URL(req.url), path=url.pathname, now=ctx.now?.()||new Date().toISOString();
    if(req.headers.get('origin')&&req.headers.get('origin')!==url.origin)throw new HttpError(403,'Use the app to make this request.');
    if(path==='/api/config'&&req.method==='GET')return json({mode:ctx.mode,authConfigured:ctx.mode==='configured',supportedTopics:['sick_care']});
    if(path==='/api/catalog'&&req.method==='GET')return json({tasks,resources});
    if(path==='/api/me'&&req.method==='GET'){
      if(!ctx.userId)return json({signedIn:false,profile:null,tasks:[],awards:0});
      const count=await ctx.db.prepare('SELECT COUNT(*) AS total FROM completion_awards WHERE user_id=?').bind(ctx.userId).first<{total:number}>();
      return json({signedIn:true,profile:await getProfile(ctx),tasks:await getStates(ctx),awards:count?.total||0});
    }
    if(path==='/api/profile'&&req.method==='PUT'){
      const owner=signed(ctx), body=await readBody(req), previous=await getProfile(ctx);
      if(previous && body.revision!==previous.revision)throw new HttpError(409,'Your preferences changed elsewhere. Refresh before saving again.');
      const profile=checkedProfile(body,owner,previous,now);
      // Compare-and-swap prevents a slower edit from overwriting a newer one.
      const result=previous
        ?await ctx.db.prepare('UPDATE profiles SET profile_json=? WHERE user_id=? AND json_extract(profile_json,\'$.revision\')=?').bind(JSON.stringify(profile),owner,previous.revision).run()
        :await ctx.db.prepare('INSERT OR IGNORE INTO profiles(user_id,profile_json) VALUES (?,?)').bind(owner,JSON.stringify(profile)).run();
      if(!result.meta.changes)throw new HttpError(409,'Your preferences changed elsewhere. Refresh before saving again.');
      return json({profile});
    }
    if(path==='/api/recommendations'&&req.method==='POST'){
      const body=await readBody(req);
      if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(body.requestId))throw new HttpError(400,'Missing request ID.');
      if(body.topic!=='sick_care')throw new HttpError(422,'This first collection covers sick-day preparation.');
      if(!Array.isArray(body.concerns)||body.concerns.length>5||body.concerns.some((c:unknown)=>typeof c!=='string'))throw new HttpError(400,'Choose valid concerns.');
      if(typeof body.note!=='string'||body.note.length>600)throw new HttpError(400,'Keep your note under 600 characters.');
      if(!Array.isArray(body.seen)||body.seen.length>100||body.seen.some((s:unknown)=>typeof s!=='string'))throw new HttpError(400,'Invalid seen tasks.');
      const previous=await getProfile(ctx);
      if(ctx.userId&&!previous)throw new HttpError(409,'Save your starting preferences first.');
      const profile=previous||checkedProfile(body.profile,'anonymous',null,now);
      if(previous&&body.profileRevision!==previous.revision)throw new HttpError(409,'Your preferences changed. Refresh and try again.');
      // Cache only a digest of transient text, never the note itself.
      const rawSignature=JSON.stringify({concerns:body.concerns,topic:body.topic,note:body.note,seen:body.seen});
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(rawSignature));
      const signature=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      if(ctx.userId){
        await ctx.db.prepare('DELETE FROM recommendation_batches WHERE expires_at<=?').bind(now).run();
        const cached=await ctx.db.prepare('SELECT profile_revision,request_signature,action_keys FROM recommendation_batches WHERE user_id=? AND request_id=?').bind(ctx.userId,body.requestId).first<{profile_revision:number;request_signature:string;action_keys:string}>();
        if(cached){
          if(cached.profile_revision!==profile.revision||cached.request_signature!==signature)throw new HttpError(409,'That request has changed. Please start a new batch.');
          const keys=JSON.parse(cached.action_keys) as string[], selected=keys.map(key=>taskByKey(key)).filter(t=>!!t);
          return json({requestId:body.requestId,source:'reviewed_pool',status:selected.length?'ready':'exhausted',tasks:selected,resources:resources.filter(r=>selected.some(t=>t.resourceIds.includes(r.id)))});
        }
      }
      let batch:Batch;
      try{batch={requestId:body.requestId,...chooseTasks(profile,body.concerns,body.seen,await getStates(ctx),body.note)};}
      catch{throw new HttpError(400,'Choose valid concerns.');}
      if(ctx.userId&&batch.status!=='unsupported'){
        const expires=new Date(Date.parse(now)+86400000).toISOString();
        await ctx.db.batch([
          ctx.db.prepare('INSERT OR IGNORE INTO recommendation_batches(user_id,request_id,profile_revision,request_signature,action_keys,expires_at) VALUES (?,?,?,?,?,?)').bind(ctx.userId,body.requestId,profile.revision,signature,JSON.stringify(batch.tasks.map(t=>t.actionKey)),expires),
          ...batch.tasks.map(t=>ctx.db.prepare('INSERT OR IGNORE INTO user_tasks(user_id,action_key,content_id,shown_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM recommendation_batches WHERE user_id=? AND request_id=? AND action_keys=? AND request_signature=?)').bind(ctx.userId!,t.actionKey,t.id,now,ctx.userId!,body.requestId,JSON.stringify(batch.tasks.map(t=>t.actionKey)),signature))
        ]);
        const winner=await ctx.db.prepare('SELECT action_keys,profile_revision,request_signature FROM recommendation_batches WHERE user_id=? AND request_id=?').bind(ctx.userId,body.requestId).first<{action_keys:string;profile_revision:number;request_signature:string}>();
        if(!winner||winner.profile_revision!==profile.revision||winner.request_signature!==signature)throw new HttpError(409,'That request changed. Please start a new batch.');
        const keys=JSON.parse(winner.action_keys) as string[];
        batch.tasks=keys.map(k=>taskByKey(k)).filter(t=>!!t);
        batch.status=batch.tasks.length?'ready':'exhausted';
        batch.resources=resources.filter(r=>batch.tasks.some(t=>t.resourceIds.includes(r.id)));
      }
      return json(batch);
    }
    if(path==='/api/seen'&&req.method==='POST'){
      const owner=signed(ctx),profile=await getProfile(ctx),body=await readBody(req);
      if(!profile)throw new HttpError(409,'Save your starting preferences first.');
      if(!Array.isArray(body.keys)||body.keys.length>100||body.keys.some((k:unknown)=>typeof k!=='string'||!taskByKey(k)))throw new HttpError(400,'Unknown task.');
      const eligible=tasks.filter(t=>body.keys.includes(t.actionKey)&&(!t.countries.length||t.countries.includes(profile.answers.country||'')));
      if(eligible.length)await ctx.db.batch(eligible.map(t=>ctx.db.prepare('INSERT OR IGNORE INTO user_tasks(user_id,action_key,content_id,shown_at) VALUES (?,?,?,?)').bind(owner,t.actionKey,t.id,now)));
      return json({ok:true});
    }
    if(path.startsWith('/api/tasks/')&&req.method==='PATCH'){
      const owner=signed(ctx), key=decodeURIComponent(path.slice('/api/tasks/'.length)),task=taskByKey(key);
      if(!task)throw new HttpError(404,'Task not found.');
      if(!await getProfile(ctx))throw new HttpError(409,'Save your starting preferences first.');
      const body=await readBody(req),existing=(await getStates(ctx)).find(t=>t.action_key===key);
      if(body.operation==='save'){
        const profile=await getProfile(ctx);
        if(task.countries.length&&!task.countries.includes(profile!.answers.country||''))throw new HttpError(422,'This resource is not matched to your country.');
        await ctx.db.prepare('INSERT INTO user_tasks(user_id,action_key,content_id,shown_at,saved_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,action_key) DO UPDATE SET saved_at=COALESCE(user_tasks.saved_at,excluded.saved_at),removed_at=NULL').bind(owner,key,task.id,now,now).run();
      }else{
        if(!existing)throw new HttpError(404,'Task not found in your list.');
        if(body.operation==='complete'){
          if(!existing.saved_at)throw new HttpError(409,'Add this task before completing it.');
          const result=await ctx.db.batch([
            ctx.db.prepare('UPDATE user_tasks SET completed_at=COALESCE(completed_at,?) WHERE user_id=? AND action_key=? AND saved_at IS NOT NULL').bind(now,owner,key),
            ctx.db.prepare('INSERT OR IGNORE INTO completion_awards(user_id,action_key,awarded_at) SELECT user_id,action_key,? FROM user_tasks WHERE user_id=? AND action_key=? AND saved_at IS NOT NULL AND completed_at IS NOT NULL').bind(now,owner,key)
          ]);
          return json({firstAward:result[1].meta.changes===1});
        }
        const updates:Record<string,string>={undo:'completed_at=NULL',unlike:'liked_at=NULL'};
        if(body.operation==='remove')await ctx.db.prepare('UPDATE user_tasks SET saved_at=NULL,removed_at=? WHERE user_id=? AND action_key=?').bind(now,owner,key).run();
        else if(Object.hasOwn(updates,body.operation))await ctx.db.prepare(`UPDATE user_tasks SET ${updates[body.operation]} WHERE user_id=? AND action_key=?`).bind(owner,key).run();
        else if(body.operation==='like')await ctx.db.prepare('UPDATE user_tasks SET liked_at=COALESCE(liked_at,?) WHERE user_id=? AND action_key=?').bind(now,owner,key).run();
        else if(body.operation==='feedback'){
          if(!['helpful','too_generic','too_much_effort','too_expensive','already_done','not_relevant_now',null].includes(body.code))throw new HttpError(400,'Unknown feedback.');
          await ctx.db.prepare('UPDATE user_tasks SET feedback_code=?,feedback_at=? WHERE user_id=? AND action_key=?').bind(body.code,body.code?now:null,owner,key).run();
        }else throw new HttpError(400,'Unknown task action.');
      }
      return json({ok:true});
    }
    if(path==='/api/preferences/reset'&&req.method==='POST'){
      const owner=signed(ctx),profile=await getProfile(ctx);if(!profile)throw new HttpError(404,'Profile not found.');
      profile.signalsResetAt=now;profile.revision++;profile.updatedAt=now;
      await ctx.db.batch([
        ctx.db.prepare('UPDATE profiles SET profile_json=? WHERE user_id=?').bind(JSON.stringify(profile),owner),
        ctx.db.prepare('UPDATE user_tasks SET liked_at=NULL,feedback_code=NULL,feedback_at=NULL WHERE user_id=?').bind(owner),
        ctx.db.prepare('DELETE FROM recommendation_batches WHERE user_id=?').bind(owner)
      ]);return json({profile});
    }
    if(path==='/api/export'&&req.method==='GET'){
      signed(ctx);const states=await getStates(ctx);
      return json({profile:await getProfile(ctx),tasks:states,content:tasks.filter(t=>states.some(s=>s.content_id===t.id)),awards:(await ctx.db.prepare('SELECT action_key,awarded_at FROM completion_awards WHERE user_id=?').bind(ctx.userId!).all()).results});
    }
    if(path==='/api/account'&&req.method==='DELETE'){
      const owner=signed(ctx);const body=await readBody(req);if(body.confirm!=='delete')throw new HttpError(400,'Confirm deletion first.');
      await ctx.db.prepare('DELETE FROM profiles WHERE user_id=?').bind(owner).run();return json({ok:true});
    }
    return json({error:'Not found.'},404);
  }catch(error){
    if(error instanceof HttpError)return json({error:error.message},error.status);
    console.error('API operation failed:',error instanceof Error?error.name:'unknown');
    return json({error:'We could not finish that request. Your previous choices are still available.'},500);
  }
}
