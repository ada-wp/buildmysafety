// Temporary loopback-only text bridge for pasting frozen inputs into Playground.
// Exposes only two non-secret editorial test files. No writes or API proxy.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const files = new Map([
  ['/prompt.txt',readFileSync(new URL('prompt.txt',import.meta.url))],
  ['/input.json',readFileSync(new URL('input.json',import.meta.url))],
  ['/schema.json',readFileSync(new URL('schema.json',import.meta.url))]
]);
const server = createServer((req,res)=>{
  const body = files.get(req.url);
  if(req.method!=='GET'||!body){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
});
server.listen(4197,'127.0.0.1',()=>console.log('Editorial input bridge: http://127.0.0.1:4197/prompt.txt'));
