import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { SafetyClient } from '../cloud-api';
import type { ProfileDraft } from '../profile-draft';
import type { RecommendationTask, TaskActionEvent, TopicId } from '../api-contracts';
import { interestEntries, interestLabels } from '../interest-labels';
import { orderTopics } from '../topic-order';
import { createTaskSession } from '../task-session';
import { Elephant } from './Elephant';

type Route = { page: 'explore' | 'list' | 'concerns' | 'ideas' } | { page: 'topic'; topic: TopicId } |
  { page: 'task' | 'complete'; task: string };
function readRoute(): Route {
  const [, , page, id] = location.hash.split('/');
  if ((page === 'task' || page === 'complete') && /^[a-z0-9_-]{1,100}$/.test(id || '')) return { page, task: id };
  if (page === 'topic' && interestEntries.some(([value]) => value === id)) return { page, topic: id as TopicId };
  if (['list', 'concerns', 'ideas'].includes(page)) return { page: page as 'list' | 'concerns' | 'ideas' };
  return { page: 'explore' };
}
const hash = (r: Route) => `#/app/${r.page}${'task' in r ? `/${r.task}` : 'topic' in r ? `/${r.topic}` : ['concerns', 'ideas'].includes(r.page) ? '/sick_care' : ''}`;

export function TaskJourney({ draft, client, active }: { draft: ProfileDraft; client: SafetyClient; active: boolean }) {
  const [session] = useState(() => createTaskSession(client));
  const state = useSyncExternalStore(session.subscribe, session.getState);
  const [route, setRoute] = useState<Route>(readRoute);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [short, setShort] = useState(draft.answers.constraints.some(v => v === 'time' || v === 'energy'));
  const [noSpend, setNoSpend] = useState(draft.answers.constraints.includes('cost'));
  const [notice, setNotice] = useState('');
  const [showAll, setShowAll] = useState(draft.answers.style !== 'one');
  const origin = useRef<'ideas' | 'list'>('ideas');
  const restored = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { session.connect(); void session.load(); return () => session.dispose(); }, [session]);
  useEffect(() => {
    const restore = () => { if (location.hash.startsWith('#/app')) { setRoute(readRoute()); origin.current = history.state?.taskOrigin === 'list' ? 'list' : 'ideas'; } };
    window.addEventListener('popstate', restore); return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => { if (active) { root.current?.querySelector<HTMLElement>('h1')?.focus(); window.scrollTo(0, 0); } }, [route, active]);
  useEffect(() => {
    if (!restored.current && state.loaded) {
      const request = state.latest?.result?.request;
      if (request?.topicId === 'sick_care') { setConcerns(request.concernIds); if (request.maxMinutes !== undefined) setShort(request.maxMinutes === 10); if (request.noSpend !== undefined) setNoSpend(Boolean(request.noSpend)); }
      restored.current = true;
    }
  }, [state.loaded, state.latest]);
  function navigate(next: Route) {
    setNotice('');
    if (hash(next) !== location.hash) history.pushState({ taskOrigin: origin.current }, '', hash(next));
    setRoute(next);
  }
  const topic = state.catalog?.topics.find(t => t.id === 'sick_care');
  const entries = state.collection?.tasks || [];
  const saved = entries.filter(item => item.state.savedAt && !item.state.removedAt);
  const done = saved.filter(item => item.state.completedAt);
  const pending = saved.filter(item => !item.state.completedAt);
  const current = 'task' in route ? entries.find(item => item.state.actionKey === route.task) : undefined;
  const batch = state.latest?.result?.batch;
  const blocked = state.busy || !state.loaded || Boolean(state.error);
  async function suggest() {
    if (note.trim()) { setNotice('This collection can match the choices above. It cannot interpret your own request yet. Keep your note here, or choose “Use my selected concerns” to continue without it.'); return; }
    const startingHash = location.hash;
    const okay = await session.recommend({ topicId: 'sick_care', concernIds: concerns, maxMinutes: short ? 10 : null,
      noSpend, localSupport: draft.answers.constraints.includes('support') ? 'unavailable' : 'unknown' });
    if (okay && location.hash === startingHash) { setShowAll(draft.answers.style !== 'one'); navigate({ page: 'ideas' }); }
  }
  async function act(task: RecommendationTask, event: TaskActionEvent) {
    const startingHash = location.hash;
    if (await session.act(task.action_key, event)) {
      if (event.type === 'complete' && location.hash === startingHash) navigate({ page: 'complete', task: task.action_key });
      else setNotice(event.type === 'save' ? 'Added to your list. It will be here when you return.' : event.type === 'remove' ? 'Removed from your list. You can find it in earlier ideas.' : 'Moved back to your list. Your little win stays with you.');
    }
  }
  function open(task: RecommendationTask, from: 'ideas' | 'list') { origin.current = from; navigate({ page: 'task', task: task.action_key }); }
  function card(task: RecommendationTask, from: 'ideas' | 'list' = 'ideas') {
    const added = saved.some(item => item.state.actionKey === task.action_key);
    return <article className="task-card" key={task.action_key}><div className="task-card-main">
      <button className="task-title" onClick={() => open(task, from)}>{task.title}<span className="meta">{task.estimated_minutes} min</span></button>
      <button className={`add${added ? ' added' : ''}`} disabled={added || blocked} aria-label={`${added ? 'Added' : 'Add'} ${task.title}`}
        onClick={() => void act(task, { type: 'save' })}>{added ? '✓' : '+'}</button>
    </div><p className="description">{task.summary}</p></article>;
  }
  function row(item: typeof entries[number]) {
    const complete = Boolean(item.state.completedAt);
    return <div className={`list-task${complete ? ' completed' : ''}`} key={item.state.actionKey}>
      <input type="checkbox" checked={complete} disabled={blocked} aria-label={`${complete ? 'Undo completion of' : 'Complete'} ${item.content.title}`}
        onChange={() => void act(item.content, { type: complete ? 'undo_complete' : 'complete' })} />
      <button className="task-title" onClick={() => open(item.content, 'list')}>{item.content.title}<small>{complete ? 'Done, by you' : `${item.content.estimated_minutes} min`}</small></button>
      <button className="remove" disabled={blocked} aria-label={`Remove ${item.content.title}`} onClick={() => void act(item.content, { type: 'remove' })}>×</button>
    </div>;
  }
  function choose(id: TopicId) { navigate(id === 'sick_care' && topic ? { page: 'concerns' } : { page: 'topic', topic: id }); }
  function topicCard(id: TopicId, label: string) {
    return <button className="topic-card" key={id} onClick={() => choose(id)}><div><strong>{label}</strong>
      <span className="meta">{id === 'sick_care' && topic ? 'Prepare a little, rest a little easier' : 'Coming next'}</span></div><span aria-hidden>›</span></button>;
  }
  function back() { navigate(route.page === 'task' ? { page: origin.current } : route.page === 'ideas' ? { page: 'concerns' } : route.page === 'complete' ? { page: 'list' } : { page: 'explore' }); }
  const ordered = orderTopics(draft);
  const chosen = draft.personalizationEnabled ? ordered.filter(([id]) => draft.interests.includes(id)) : [];
  const others = chosen.length ? ordered.filter(([id]) => !draft.interests.includes(id)) : ordered;
  if (!state.loaded && !state.error) return <div className="task-journey" role="status"><p>Finding your saved place…</p></div>;
  return <div className="task-journey" ref={root} aria-busy={state.busy}>
    {route.page !== 'explore' && route.page !== 'list' && <button className="back" onClick={back}><span aria-hidden>‹</span> Back</button>}
    {state.busy && <p className="hint" role="status">Saving or checking your account…</p>}
    {state.error && <div role="alert" className="message error"><p>{state.error.conflict ? 'Your list changed in another tab. Check the latest version before trying again.' : state.error.outcomeUnknown ? 'We couldn’t confirm the result. Check your saved progress before trying again.' : 'We couldn’t connect to your tasks just now.'}</p>
      <button className="secondary" disabled={state.busy} onClick={() => void session.load()}>Check saved progress</button></div>}
    {notice && <p className="message" role="status">{notice}</p>}
    {route.page === 'explore' && <section><span className="eyebrow">Explore</span><h1 tabIndex={-1}>One small place<br />to begin.</h1>
      <p>Sick-day preparation is ready to explore. More areas will grow from here.</p>
      {chosen.length > 0 && <><h2 className="topic-group-title">Your interests</h2><div className="topic-grid">{chosen.map(([id, label]) => topicCard(id, label))}</div></>}
      {chosen.length ? <details className="more-topics" open={!chosen.some(([id]) => id === 'sick_care')}><summary>Explore other areas</summary><div className="topic-grid">{others.map(([id, label]) => topicCard(id, label))}</div></details>
        : <div className="topic-grid">{others.map(([id, label]) => topicCard(id, label))}</div>}
    </section>}
    {route.page === 'topic' && <section><span className="pill">{interestLabels[route.topic]}</span><h1 tabIndex={-1}>This area is<br />growing next.</h1>
      <p>We’re starting with sick-day preparation. Your other interests are saved, and you can choose where to go.</p>
      <button className="primary" disabled={!topic} onClick={() => navigate({ page: 'concerns' })}>Explore sick-day care</button>
      <button className="text-button" onClick={() => navigate({ page: 'explore' })}>Back to Explore</button></section>}
    {route.page === 'concerns' && <section><span className="pill">Sick-day care</span><h1 tabIndex={-1}>What would make<br />a sick day easier?</h1>
      <p>A little preparation for future you. Choose any that are on your mind.</p>
      <div className="choices">{topic?.concerns.map(c => <label className={`choice${concerns.includes(c.id) ? ' selected' : ''}`} key={c.id}><span>{c.label}</span>
        <input type="checkbox" checked={concerns.includes(c.id)} onChange={() => setConcerns(values => values.includes(c.id) ? values.filter(id => id !== c.id) : [...values, c.id])} /></label>)}</div>
      <details className="more-topics"><summary>Make it fit today</summary>
        <label className="choice"><span>Keep each task to 10 minutes or less</span><input type="checkbox" checked={short} onChange={e => setShort(e.target.checked)} /></label>
        <label className="choice"><span>No spending needed</span><input type="checkbox" checked={noSpend} onChange={e => setNoSpend(e.target.checked)} /></label>
        <p className="hint">Started from your preferences. You can change these for today.</p></details>
      <label className="manual-request">Something else? <span className="hint">Optional</span><textarea maxLength={800} value={note} onChange={e => setNote(e.target.value)} placeholder="What would you like help preparing for?" /></label>
      {note.trim() && <div className="message"><p>Your own request needs a more flexible response than this collection can give yet. It isn’t sent or saved. You can use the concerns above for now.</p>
        <button className="text-button" onClick={() => { setNote(''); setNotice('Your note has been cleared. The next suggestions will use your selected concerns.'); }}>Use my selected concerns</button></div>}
      <button className="primary" disabled={blocked || !topic || Boolean(note.trim())} onClick={() => void suggest()}>Find my next steps</button>
      {batch && <button className="text-button" onClick={() => navigate({ page: 'ideas' })}>Return to my latest ideas</button>}
      <p className="hint">For planning ahead. This app doesn’t provide urgent care or medical advice.</p>
    </section>}
    {route.page === 'ideas' && <section><span className="pill">Sick-day care</span><h1 tabIndex={-1}>A few small<br />places to start.</h1>
      <p>Take a look, then add what feels useful. You choose the pace.</p>
      {batch?.tasks.slice(0, showAll ? 3 : 1).map(task => card(task))}
      {batch && !showAll && batch.tasks.length > 1 && <button className="text-button" onClick={() => setShowAll(true)}>See the other ideas</button>}
      {(!batch || batch.status === 'no_more_ideas') && <p className="message">{batch?.tasks.length ? 'These are the matching new options in this small collection. There’s no need to add them all.' : 'No new matching ideas right now. Your saved tasks and earlier ideas are still here.'}</p>}
      <button className="primary" onClick={() => navigate({ page: 'list' })}>Go to my list{saved.length ? ` (${saved.length})` : ''}</button>
      <button className="secondary" disabled={blocked || batch?.tasks.length === 0} onClick={() => void suggest()}>{batch?.tasks.length === 0 ? 'All caught up for these choices' : 'See more ideas'}</button>
      <button className="text-button" onClick={() => navigate({ page: 'concerns' })}>Change my choices</button>
    </section>}
    {route.page === 'task' && (current ? <section className="detail"><div className="task-meta"><span className="pill">Sick-day care</span><span>{current.content.estimated_minutes} min</span></div>
      <h1 tabIndex={-1}>{current.content.title}</h1><p className="description">{current.content.summary}</p>
      <ol className="steps">{current.content.steps.map((s, i) => <li key={i}><span className="step-number" aria-hidden>{i + 1}</span><p>{s}</p></li>)}</ol>
      <div className="done-when"><strong>Done when</strong><p>{current.content.done_when}</p></div>
      {current.content.resources.length > 0 && <details className="more-topics"><summary>Helpful links · {current.content.resources.length}</summary>{current.content.resources.map(r => {
        const resource = state.catalog?.resources.find(item => item.id === r.resource_id);
        return resource ? <p key={r.resource_id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.name} ↗</a><br />{r.why}<br /><small>{resource.limits}</small></p> : <p key={r.resource_id}>This resource is being checked.</p>;
      })}</details>}
      {current.content.purchase_checks.length > 0 && <details className="more-topics"><summary>If you’re buying</summary><ul>{current.content.purchase_checks.map(s => <li key={s}>{s}</li>)}</ul>{current.content.no_purchase_option && <p>{current.content.no_purchase_option}</p>}</details>}
      {!current.state.savedAt ? <button className="primary" disabled={blocked} onClick={() => void act(current.content, { type: 'save' })}>+ Add to my list</button>
        : current.state.completedAt ? <><p className="message">Done, by you.</p><button className="text-button" disabled={blocked} onClick={() => void act(current.content, { type: 'undo_complete' })}>Mark as not done</button></>
          : <button className="primary" disabled={blocked} onClick={() => void act(current.content, { type: 'complete' })}>Mark as done</button>}
      <button className="text-button" onClick={() => navigate({ page: 'list' })}>View my list</button>
    </section> : <section><h1 tabIndex={-1}>Let’s find<br />your next step.</h1><p>This task isn’t in your account. Your list is still here.</p><button className="primary" onClick={() => navigate({ page: 'list' })}>Go to my list</button></section>)}
    {route.page === 'list' && <section><span className="eyebrow">My list</span><h1 tabIndex={-1}>One thing<br />at a time.</h1>
      {!saved.length ? <div className="empty"><Elephant large name={draft.elephantName} /><p>Your list has room for something small. Add an idea when it feels useful.</p><button className="primary" onClick={() => navigate({ page: 'concerns' })}>Find a first step</button></div>
        : <><p>{pending.length ? `${pending.length} ${pending.length === 1 ? 'step' : 'steps'}, at your pace.` : 'A little more in place. You can leave it here for today.'}</p>{pending.map(row)}
          {done.length > 0 && <div className="completed-list"><h2>Little wins · {done.length}</h2>{done.map(row)}</div>}</>}
      {entries.some(item => !item.state.savedAt) && <details className="more-topics"><summary>Earlier ideas</summary>{entries.filter(item => !item.state.savedAt).map(item => card(item.content, 'list'))}</details>}
      <p className="hint">Saved to your account. Pick up here on another device.</p>
    </section>}
    {route.page === 'complete' && <section className="celebration"><span className="eyebrow">A little win</span>
      <h1 tabIndex={-1}>{current?.state.completedAt ? 'You put something\nin place.' : 'Your progress\nis here.'}</h1>
      <div className="high-five"><Elephant large name={draft.elephantName} /></div>
      <p>{current?.state.completedAt ? 'A small thing, done by you. Your little companion is here to celebrate it with you.' : 'Head to your list whenever you’re ready for another step.'}</p>
      <span className="growth-label">{state.collection?.earnedCount || 0} little {state.collection?.earnedCount === 1 ? 'win' : 'wins'}</span>
      <p className="hint">Each action earns one little win. You never lose them for taking a break.</p>
      <button className="primary" onClick={() => navigate({ page: 'list' })}>Back to my list</button><button className="text-button" onClick={() => navigate({ page: 'explore' })}>Explore</button>
    </section>}
    <nav className="bottom-nav" aria-label="App navigation"><button aria-current={route.page !== 'list' && route.page !== 'complete' && !(route.page === 'task' && origin.current === 'list') ? 'page' : undefined} onClick={() => navigate({ page: 'explore' })}>Explore</button>
      <button aria-current={route.page === 'list' || route.page === 'complete' || (route.page === 'task' && origin.current === 'list') ? 'page' : undefined} onClick={() => navigate({ page: 'list' })}>My list{saved.length ? ` (${saved.length})` : ''}</button></nav>
  </div>;
}
