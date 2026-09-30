const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
const keys = ['home', 'pet', 'coverage', 'digital'];
const planSchema = {type:'object',additionalProperties:false,properties:{version:{type:'string',enum:['seven-day-v1']},summary:{type:'string'},recommendation:{type:'string'},next_step:{type:'string'},days:{type:'array',minItems:7,maxItems:7,items:{type:'object',additionalProperties:false,properties:{day:{type:'integer'},title:{type:'string'},action:{type:'string'},minutes:{type:'integer'},done_when:{type:'string'}},required:['day','title','action','minutes','done_when']}}},required:['version','summary','recommendation','next_step','days']};
export function validPlan(r) {
  const text=(s,max)=>typeof s==='string' && s.trim().length>0 && s.length<=max;
  return r?.version==='seven-day-v1' && text(r.summary,900) && text(r.recommendation,900) && text(r.next_step,500) && Array.isArray(r.days) && r.days.length===7 && r.days.every((d,i)=>d.day===i+1 && text(d.title,120) && text(d.action,700) && Number.isInteger(d.minutes) && d.minutes>=1 && d.minutes<=15 && text(d.done_when,300));
}
const planInstructions = `Create a calm practical seven-day preparedness plan from the supplied multiple-choice answers. Return version seven-day-v1. These are self-reports, not a safety assessment. Do not claim someone is safe or that risks were ruled out. No fear, shame, diagnoses, legal or insurance determinations. Do not invent possessions, helpers, relationships, or facts. A solid answer means the person reports that area is prepared; na means skip that topic.
Choose ONE achievable outcome based on priority, unless that priority is not applicable; then choose an area marked attention. If all applicable areas are solid, suggest checking an existing arrangement. Keep the week focused on that outcome, with one low-cost action per day, 5-15 minutes, adjustable or skippable. Day 1 must match next_step. Day 7 is a gentle review, not a claim of guaranteed safety. Give a brief summary, recommendation explaining why it fits, one immediate next_step, then days 1 through 7 with title, concrete action, minutes and observable done_when. Total output under 650 words. Use simple English. No urgent tasks or reminders implied to be scheduled.
Use these content boundaries: digital recovery means choosing one important account, reviewing the provider's official recovery settings, verifying an existing recovery channel, checking available multifactor authentication, storing recovery codes privately if the provider offers them, writing a non-secret recovery checklist and reviewing it. Never ask for passwords or codes, share them with anyone, disable existing protection, sign out all devices, deliberately lock out an account, or promise a specific recovery option exists. Refer to official provider instructions rather than inventing menu paths. Home support means identifying a possible trusted helper, asking if willing, agreeing safe access privately, recording only non-secret logistics and reviewing. Pet backup means agreeing one willing helper and documenting routine care privately; no medical advice. Coverage means locating the policy and preparing questions for the insurer, not interpreting terms or deciding coverage. Never collect actual keys, door codes, account identifiers, policy numbers or health details. For lack of a trusted helper suggest considering available support options, not assuming someone exists. Do not attempt to assess My Body or If I'm Out of Action because this short form did not ask enough about them.`;
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), x => x.toString(16).padStart(2, '0')).join('');
export function validate(body) {
  if (!body || typeof body !== 'object' || !/^[a-f0-9-]{73}$/.test(body.token || '') || body.consent !== true) return false;
  if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return false;
  return keys.every(k => (['pet','coverage'].includes(k) ? ['solid','attention','na'] : ['solid','attention']).includes(body.answers?.[k])) && keys.includes(body.answers?.priority);
}
async function bodyOf(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  let size = 0; const chunks = [];
  while (true) { const {value, done} = await reader.read(); if (done) break; size += value.length; if (size > 4096) { await reader.cancel(); throw new Error('large'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({error:'Use the scan form.'},405);
    if (request.headers.get('Origin') !== url.origin || !request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Invalid request.'},403);
    if (!['/api/scans','/api/generate'].includes(url.pathname)) return json({error:'Not found.'},404);
    if (!env.DB) return json({error:'Storage is not connected yet. Please try again later.'},503);
    let body; try { body = await bodyOf(request); } catch { return json({error:'Invalid submission.'},400); }
    if (!validate(body)) return json({error:'Please check your answers, email and consent.'},400);
    const tokenHash = await hash(body.token);
    const answers = Object.fromEntries([...keys,'priority'].map(k => [k,body.answers[k]]));
    const email = body.email.trim().toLowerCase();
    const today = new Date().toISOString().slice(0,10);
    try {
      const existing = await env.DB.prepare('SELECT * FROM scans WHERE token_hash = ?').bind(tokenHash).first();
      if (existing && (existing.answers !== JSON.stringify(answers) || existing.email !== email)) return json({error:'Answers changed. Retake the scan to save a new result.'},409);
      if (existing && Date.parse(existing.created_at) < Date.now()-30*86400000) return json({error:'This result has expired. Please retake the scan.'},410);
      if (url.pathname === '/api/scans') {
        if (existing) return json({saved:true,duplicate:true});
        await env.DB.prepare('INSERT OR IGNORE INTO daily_limits(day) VALUES (?)').bind(today).run();
        const permit = await env.DB.prepare('UPDATE daily_limits SET submissions=submissions+1 WHERE day=? AND submissions<100 RETURNING submissions').bind(today).first();
        if (!permit) return json({error:'The pilot has reached its daily limit. Please try tomorrow.'},429);
        await env.DB.prepare('INSERT OR IGNORE INTO scans(token_hash,created_at,email,answers) VALUES (?,?,?,?)').bind(tokenHash,new Date().toISOString(),email,JSON.stringify(answers)).run();
        return json({saved:true},201);
      }
      if (!existing) return json({error:'Save your scan first.'},404);
      if (existing.result && validPlan(JSON.parse(existing.result))) return json({result:JSON.parse(existing.result),cached:true});
      if (!env.OPENAI_API_KEY) return json({error:'Your scan is saved. AI testing is not connected yet.'},503);
      const locked = await env.DB.prepare("UPDATE scans SET state='generating' WHERE token_hash=? AND state IN ('saved','ready') RETURNING token_hash").bind(tokenHash).first();
      if (!locked) return json({error:'This test is already running or needs review. Your saved scan is safe.'},409);
      await env.DB.prepare('INSERT OR IGNORE INTO daily_limits(day) VALUES (?)').bind(today).run();
      const permit = await env.DB.prepare('UPDATE daily_limits SET generations=generations+1 WHERE day=? AND generations<5 RETURNING generations').bind(today).first();
      if (!permit) { await env.DB.prepare("UPDATE scans SET state='saved' WHERE token_hash=?").bind(tokenHash).run(); return json({error:'The five-generation daily test limit has been reached.'},429); }
      const model = env.OPENAI_MODEL || 'gpt-5.4-mini';
      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method:'POST', headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'}, signal:AbortSignal.timeout(45000),
          body:JSON.stringify({model,store:false,max_output_tokens:2000,reasoning:{effort:'none'},
            instructions:planInstructions,
            input:JSON.stringify(answers),text:{format:{type:'json_schema',name:'seven_day_plan',strict:true,schema:planSchema}}})
        });
        if (!response.ok) {
          const detail = await response.json().catch(()=>({}));
          const providerError = new Error('provider');
          providerError.status = response.status;
          providerError.code = /^[a-z0-9_]{1,80}$/i.test(detail.error?.code || '') ? detail.error.code : 'provider_error';
          throw providerError;
        }
        const data = await response.json();
        if (data.status !== 'completed') throw new Error('incomplete');
        const text = (data.output || []).flatMap(item=>item.content || []).filter(item=>item.type==='output_text').map(item=>item.text).join('');
        const result = JSON.parse(text);
        if (!validPlan(result)) throw new Error('format');
        await env.DB.prepare("UPDATE scans SET result=?,state='ready',model=?,usage=? WHERE token_hash=?").bind(JSON.stringify(result),model,JSON.stringify(data.usage || {}),tokenHash).run();
        return json({result,cached:false});
      } catch (cause) {
        const diagnostic = {status:cause.status || null,code:cause.code || 'response_failed'};
        await env.DB.prepare("UPDATE scans SET state='failed',usage=? WHERE token_hash=?").bind(JSON.stringify(diagnostic),tokenHash).run();
        const message = diagnostic.code === 'insufficient_quota' ? 'Your scan is saved. OpenAI reports no available API quota. The project owner needs to check API credits and billing.' : 'Your scan is saved, but the AI test could not finish. No automatic retry was made.';
        return json({error:message},502);
      }
    } catch { return json({error:'We could not save or load your result. Please retry.'},503); }
  }
};
