import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const pool = JSON.parse(read('personalization/content-candidates/my-home-v0/pool.json'));
const tasks = ['HM27', 'HM17', 'HM23'].map(id => pool.tasks.find(task => task.id === id));
const task = tasks[0];
const elephant = `data:image/svg+xml;base64,${Buffer.from(read('app/public/elephant.svg')).toString('base64')}`;
const pet = (large = false) => `<img class="elephant${large ? ' large' : ''}" src="${elephant}" alt="Your lavender elephant" />`;
const fonts = [400, 500, 600, 700].map(weight => {
  const data = fs.readFileSync(path.join(root, `app/node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff2`));
  return `@font-face{font-family:Inter;font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2')}`;
}).join('\n');
// Frozen October 15 type trial; the app changes were withdrawn for mockup-first review.
const css = ['style.snapshot.css', 'category-progress.snapshot.css'].map(name => fs.readFileSync(path.join(here, name), 'utf8')).join('\n');
const track = `<div class="category-progress-track" role="progressbar" aria-label="Example category progress" aria-valuemin="0" aria-valuemax="10" aria-valuenow="3"><span style="width:30%"></span></div>`;
const nav = current => `<nav class="bottom-nav" aria-label="Preview app navigation">${[['list','My list'],['ideas','Explore'],['progress','My progress']].map(([id,label]) => `<button data-screen="${id}"${id === current ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav>`;
const view = (id, body, current = id) => `<section class="app-shell type-screen" id="${id}"${id === 'list' ? '' : ' hidden'}><header class="topbar"><span class="wordmark">My Safety</span>${pet()}</header><main><div class="task-journey">${body}${nav(current)}</div></main></section>`;
const list = view('list', `<header class="list-top"><h1>My list</h1><span class="pill">My home</span></header>
  <div class="list-progress"><p class="progress-hello">Here with you, one step at a time.</p>${pet(true)}<div class="category-progress-count"><strong>Your first block</strong><span>3 / 10 steps</span></div>${track}<div class="category-progress-markers">${[1,3,6,9,10].map(n=>`<span class="${n<=3?'earned':''}" style="left:${n*10}%">${n}</span>`).join('')}</div><p class="hint">Next milestone: 6 steps</p></div>
  <p>3 steps, at your pace.</p>${tasks.map(t=>`<div class="list-task"><input type="checkbox" aria-label="Preview completion: ${escape(t.title)}" /><button class="task-title" data-screen="task">${escape(t.title)}<small>${t.minutes} min</small></button></div>`).join('')}<button class="secondary" data-screen="ideas">Find more ideas</button>`);
const ideas = view('ideas', `<span class="pill">My home</span><h1>A few small<br />places to start.</h1>${tasks.map(t=>`<article class="task-card"><div class="task-card-main"><button class="task-title" data-screen="task">${escape(t.title)}</button><button class="add" data-screen="list" aria-label="Preview ${escape(t.title)} in My list">+</button></div><span class="meta">${t.minutes} min</span><p class="description">${escape(t.summary)}</p></article>`).join('')}`);
const detail = view('task', `<button class="back" data-screen="list"><span aria-hidden="true">‹</span> My list</button><section class="detail"><div class="task-meta"><span class="pill">My home</span><span>${task.minutes} min</span></div><h1>${escape(task.title)}</h1><p class="description">${escape(task.summary)}</p><ol class="steps">${task.steps.map((step,i)=>`<li><span class="step-number" aria-hidden="true">${i+1}</span><p>${escape(step)}</p></li>`).join('')}</ol><div class="done-when"><strong>Done when</strong><p>${escape(task.done_when)}</p></div><details class="optional-row"><summary>Helpful link <span>1</span></summary><p>Frontdoor · Video advice for nonurgent home-repair questions.</p></details><button class="primary" data-screen="list">Mark as done</button></section>`, 'list');
const progress = view('progress', `<header class="progress-top"><div><h1>My progress</h1><p>Look at what you’re building.</p></div>${pet()}</header><button class="category-overview-card" data-screen="list"><strong>My home</strong><span class="category-card-count">3 steps completed</span>${track}<span class="category-card-meta">Next milestone: 6 steps</span><span class="category-card-meta">3 steps on your list</span><span class="category-card-cta">Keep building →</span></button>`);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Safety · Typography preview</title><style>${fonts}\n${css}
.type-review{max-width:490px;margin:auto;padding:16px 24px;background:#f3f0eb;font-size:12px;color:#5c625c}.type-review strong{display:block;font-size:14px;color:var(--green)}.type-review p{font-size:12px;margin:5px 0 10px}.type-switcher{display:flex;gap:6px;flex-wrap:wrap}.type-switcher button{font-size:12px;background:transparent;border:1px solid #cdc7d2;border-radius:20px;padding:8px 12px;min-height:36px}.type-switcher button[aria-pressed=true]{background:var(--green);color:var(--ivory);border-color:var(--green)}.type-screen[hidden]{display:none}.preview-feedback{font-size:12px;margin:10px 0 0!important}.type-screen .topbar{height:82px}.type-screen .task-journey{padding-bottom:0}.type-screen .bottom-nav button{padding:13px 12px}@media(max-width:360px){.type-review{padding:14px 21px}}
</style></head><body><aside class="type-review"><strong>Typography preview · Inter</strong><p>Example screens for visual review. No account data is changed.</p><nav class="type-switcher" aria-label="Choose preview screen">${[['list','My list'],['ideas','Ideas'],['task','Task'],['progress','Progress']].map(([id,label])=>`<button data-screen="${id}" aria-pressed="${id==='list'}">${label}</button>`).join('')}</nav><p class="preview-feedback" role="status"></p></aside>${list}${ideas}${detail}${progress}<script>
function show(id){document.querySelectorAll('.type-screen').forEach(screen=>screen.hidden=screen.id!==id);document.querySelectorAll('.type-switcher button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.screen===id)));document.querySelector('.preview-feedback').textContent='';window.scrollTo(0,0);}
document.addEventListener('click',event=>{const button=event.target.closest('[data-screen]');if(button)show(button.dataset.screen);});
document.querySelectorAll('input[type=checkbox]').forEach(box=>box.addEventListener('change',()=>{box.checked=false;document.querySelector('.preview-feedback').textContent='Font preview only — task progress is unchanged.';}));
</script></body></html>`;
fs.writeFileSync(path.join(here, 'preview.html'), html);
fs.copyFileSync(path.join(root, 'app/node_modules/@fontsource/inter/LICENSE'), path.join(here, 'INTER-LICENSE.txt'));
console.log('Rendered the historical typography trial from frozen design-only styles.');
