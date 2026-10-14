// Local-only synthetic authentication. This module is never imported by the Worker or client build.
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {createServer as createViteServer} from 'vite';
import {SqliteDatabase} from './sqlite';
import {handleApi} from '../server/service';

const port=Number(process.env.SAFETY_LOCAL_PORT||5178);
mkdirSync('.local',{recursive:true});
const db=new SqliteDatabase(process.env.SAFETY_LOCAL_DATABASE||'.local/safety.sqlite');
const sessions=new Map<string,string>();
const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
const server=createServer(async(req,res)=>{
  if(!['localhost:'+port,'127.0.0.1:'+port].includes(req.headers.host||'')){res.writeHead(403).end();return;}
  if(!req.url?.startsWith('/api/')){vite.middlewares(req,res);return;}
  try {
    const origin=`http://${req.headers.host}`;
    if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403).end();return;}
    const cookie=req.headers.cookie?.match(/(?:^|; )safety_local=([^;]+)/)?.[1];
    const chunks:Buffer[]=[];let length=0;
    for await(const chunk of req){length+=chunk.length;if(length>12288){res.writeHead(413).end();return;}chunks.push(Buffer.from(chunk));}
    const body=Buffer.concat(chunks);
    if(req.url==='/api/local-session'&&req.method==='POST'){
      const account=JSON.parse(body.toString()).account;
      if(!['a','b'].includes(account)){res.writeHead(400).end();return;}
      if(cookie)sessions.delete(cookie);
      const token=randomBytes(32).toString('hex');sessions.set(token,`local-test-${account}`);
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':`safety_local=${token}; HttpOnly; SameSite=Strict; Path=/`});
      res.end(JSON.stringify({ok:true,mode:'local'}));return;
    }
    if(req.url==='/api/local-session'&&req.method==='DELETE'){
      if(cookie)sessions.delete(cookie);
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':'safety_local=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});res.end('{}');return;
    }
    const request=new Request(origin+req.url,{method:req.method,headers:req.headers as Record<string,string>,...(body.length?{body}: {})});
    const response=await handleApi(request,{db,userId:cookie?sessions.get(cookie)||null:null,mode:'local'});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local request failed. Try again.'}));}
});
server.listen(port,'127.0.0.1',()=>console.log(`My Safety local build: http://localhost:${port} (synthetic accounts; no email or AI calls)`));
async function stop(){server.close();await vite.close();db.close();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
