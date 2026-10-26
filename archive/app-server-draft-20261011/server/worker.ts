import {handleApi} from './service';
import type {Database} from './database';
type Env={DB:Database;ASSETS:{fetch(request:Request):Promise<Response>}};
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const path=new URL(request.url).pathname;
    if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
    // Fail closed until an established email identity provider is selected and verified.
    // Never import the local synthetic-session adapter into this entry point.
    if(!['/api/config','/api/catalog','/api/me','/api/recommendations'].includes(path))
      return Response.json({error:'Email sign-in is not connected yet.'},{status:503,headers:{'Cache-Control':'no-store'}});
    return handleApi(request,{db:env.DB,userId:null,mode:'setup'});
  }
};
