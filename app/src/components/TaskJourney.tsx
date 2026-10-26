import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { SafetyClient } from '../cloud-api';
import type { ProfileDraft } from '../profile-draft';
import type { RecommendationTask, TaskActionEvent, TopicId } from '../api-contracts';
import { interestEntries, interestLabels } from '../interest-labels';
import { orderTopics } from '../topic-order';
import { createTaskSession } from '../task-session';
import { activeAiQuota, recommendationFeedback } from '../recommendation-feedback';
import { Elephant } from './Elephant';
import { TaskFeedback } from './TaskFeedback';
import { TaskSteps } from './TaskSteps';
import { accountIsLeaving } from '../navigation';
import { SERVICE_COUNTRY } from '../service-market';
import { useCategoryProgress } from '../use-category-progress';
import { newMilestone, reachedMilestone } from '../progress';
import { CategoryProgressCard, ListProgress, MilestoneSheet } from './CategoryProgress';

type Route = { page: 'explore' | 'list' | 'progress' | 'concerns' | 'ideas' | 'earlier' } | { page: 'topic'; topic: TopicId } |
  { page: 'task' | 'refine'; task: string };
function readRoute(): Route {
  const [, , page, id] = location.hash.split('/');
  if (page === 'complete') return { page: 'list' };
  if ((page === 'task' || page === 'refine') && /^[a-z0-9_-]{1,100}$/.test(id || '')) return { page, task: id };
  if (page === 'topic' && interestEntries.some(([value]) => value === id)) return { page, topic: id as TopicId };
  if (['list', 'progress', 'earlier'].includes(page) && !id) return { page: page as 'list' | 'progress' | 'earlier' };
  if (['concerns', 'ideas'].includes(page) && id === 'sick_care') return { page: page as 'concerns' | 'ideas' };
  return { page: 'explore' };
}
const hash = (r: Route) => `#/app/${r.page}${'task' in r ? `/${r.task}` : 'topic' in r ? `/${r.topic}` : ['concerns', 'ideas'].includes(r.page) ? '/sick_care' : ''}`;

export function TaskJourney({ draft, client, active, onIdentityError }: { draft: ProfileDraft; client: SafetyClient; active: boolean; onIdentityError: () => void }) {
  const [session] = useState(() => createTaskSession(client));
  const state = useSyncExternalStore(session.subscribe, session.getState);
  const progress = useCategoryProgress(client, state.collection?.stateVersion);
  const sickProgress = progress.data?.categories.find(category => category.topicId === 'sick_care');
  const [milestone, setMilestone] = useState<{ count: number; replay: boolean } | null>(null);
  const [completionVersion, setCompletionVersion] = useState<string | null>(null);
  const [recentCompletion, setRecentCompletion] = useState<RecommendationTask | null>(null);
  const [pulse, setPulse] = useState(false);
  const [route, setRoute] = useState<Route>(readRoute);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [refinementNote, setRefinementNote] = useState('');
  const [short, setShort] = useState(false);
  const [noSpend, setNoSpend] = useState(false);
  const [notice, setNotice] = useState('');
  const [quotaClock, setQuotaClock] = useState(Date.now);
  const quota = activeAiQuota(state.latest?.result, quotaClock);
  const requestNotice = notice || (quota ? state.latest?.result?.batch.message || '' : '');
  const origin = useRef<'ideas' | 'list'>(history.state?.taskOrigin === 'list' ? 'list' : 'ideas');
  const restored = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const feedbackArea = useRef<HTMLDivElement>(null);
  const identityError = useRef(onIdentityError);
  identityError.current = onIdentityError;
  useEffect(() => { session.connect(); void session.load(); return () => session.dispose(); }, [session]);
  useEffect(() => {
    if (!active || !completionVersion || progress.data?.stateVersion !== completionVersion || !sickProgress) return;
    const count = newMilestone(sickProgress);
    setCompletionVersion(null);
    if (count) setMilestone({ count, replay: false });
  }, [active, completionVersion, progress.data, sickProgress]);
  useEffect(() => {
    if (active && milestone && !milestone.replay) void progress.acknowledge('sick_care', milestone.count);
  }, [milestone]);
  useEffect(() => { if (!active) setMilestone(null); }, [active]);
  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(timer);
  }, [pulse]);
  useEffect(() => {
    if (!quota) return;
    const timer = window.setTimeout(() => {
      setQuotaClock(Date.now());
      setNotice(value => value === state.latest?.result?.batch.message ? '' : value);
    }, Math.max(0, Date.parse(quota.resetsAt) - Date.now()) + 50);
    return () => window.clearTimeout(timer);
  }, [quota, state.latest]);
  useEffect(() => {
    if (state.error && (state.error.status === 401 || accountIsLeaving(state.error.code))) identityError.current();
  }, [state.error]);
  useEffect(() => {
    if (progress.error && (progress.error.status === 401 || accountIsLeaving(progress.error.code))) identityError.current();
  }, [progress.error]);
  useEffect(() => {
    const restore = () => { if (location.hash.startsWith('#/app')) { setRoute(readRoute()); origin.current = history.state?.taskOrigin === 'list' ? 'list' : 'ideas'; } };
    window.addEventListener('popstate', restore); window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, []);
  useEffect(() => { if (active) { root.current?.querySelector<HTMLElement>('h1')?.focus(); window.scrollTo(0, 0); } }, [route, active, state.loaded]);
  useEffect(() => {
    if (!restored.current && state.loaded) {
      const request = state.latest?.result?.request;
      if (request?.topicId === 'sick_care') { setConcerns(request.concernIds); if (request.maxMinutes !== undefined) setShort(request.maxMinutes === 10); if (request.noSpend !== undefined) setNoSpend(Boolean(request.noSpend)); }
      restored.current = true;
    }
  }, [state.loaded, state.latest]);
  useEffect(() => {
    if (active && (route.page === 'concerns' || route.page === 'refine') && (requestNotice || state.error)) {
      feedbackArea.current?.scrollIntoView({ block: 'center' });
      feedbackArea.current?.focus({ preventScroll: true });
    }
  }, [requestNotice, state.error, active, route.page]);
  function navigate(next: Route) {
    setNotice('');
    if (hash(next) !== location.hash) history.pushState({ taskOrigin: origin.current }, '', hash(next));
    setRoute(next);
  }
  const topic = state.catalog?.topics.find(t => t.id === 'sick_care');
  const entries = state.collection?.tasks || [];
  const saved = entries.filter(item => item.state.savedAt && !item.state.removedAt);
  const done = entries.filter(item => item.state.completedAt);
  const pending = saved.filter(item => !item.state.completedAt);
  const earlier = entries.filter(item => !item.state.savedAt);
  const canRefine = (task: RecommendationTask) => entries.some(item => item.state.actionKey === task.action_key &&
    !item.state.savedAt && !item.state.completedAt && !item.state.removedAt);
  const current = 'task' in route ? entries.find(item => item.state.actionKey === route.task) : undefined;
  const batch = state.latest?.result?.batch;
  const blocked = state.busy || !state.loaded || Boolean(state.error);
  async function suggest(mode: 'auto' | 'more' | 'pool' = 'auto') {
    const preparedOnly = mode !== 'auto';
    const startingHash = location.hash;
    const submittedNote = note;
    setNotice('');
    const okay = await session.recommend({ topicId: 'sick_care', concernIds: concerns, maxMinutes: short ? 10 : null,
      ...(!preparedOnly && note.trim() ? { note: note.trim() } : {}), noSpend, country: SERVICE_COUNTRY,
      localSupport: 'unknown' }, mode === 'pool' ? 'pool' : 'auto');
    if (okay && location.hash === startingHash) {
      const result = session.getState().latest?.result;
      const feedback = recommendationFeedback(result, !preparedOnly && Boolean(submittedNote.trim()));
      if (!feedback.openIdeas) { setNotice(feedback.notice); return; }
      if (!preparedOnly) setNote(value => value === submittedNote ? '' : value);
      if (result?.request?.topicId === 'sick_care') setConcerns(result.request.concernIds);
      navigate({ page: 'ideas' });
    }
  }
  async function act(task: RecommendationTask, event: TaskActionEvent) {
    const startingHash = location.hash;
    if (await session.act(task.action_key, event)) {
      if (event.type === 'complete' && location.hash === startingHash) {
        setRecentCompletion(task); setPulse(true);
        setCompletionVersion(session.getState().collection?.stateVersion || null);
        navigate({ page: 'list' });
      }
      else if (event.type === 'undo_complete') { setRecentCompletion(null); setMilestone(null); }
      else if (event.type !== 'check_step') setNotice(event.type === 'save' ? 'Added to your list.' : event.type === 'remove' ? 'Removed. You’ll find it in earlier ideas.' : 'Moved back to your list.');
    }
  }
  function startRefining(task: RecommendationTask, from: 'ideas' | 'list') {
    origin.current = from; setRefinementNote(''); navigate({ page: 'refine', task: task.action_key });
  }
  async function refine(task: RecommendationTask) {
    const startingHash = location.hash;
    const okay = await session.recommend({ topicId: 'sick_care', concernIds: task.concern_ids,
      refineActionKey: task.action_key, note: refinementNote.trim(), maxMinutes: short ? 10 : null, noSpend, country: SERVICE_COUNTRY,
      localSupport: 'unknown' });
    if (okay && location.hash === startingHash) {
      const result = session.getState().latest?.result;
      if (result?.adaptation?.status === 'adapted') { setRefinementNote(''); navigate({ page: 'ideas' }); }
      else setNotice(result?.batch.message || 'Your original idea is unchanged. Try another change when you’re ready.');
    }
  }
  function open(task: RecommendationTask, from: 'ideas' | 'list') { origin.current = from; navigate({ page: 'task', task: task.action_key }); }
  async function findIdeas() {
    if (batch?.tasks.some(task => {
      const owned = entries.find(item => item.state.actionKey === task.action_key)?.state;
      return owned && !owned.savedAt && !owned.completedAt && !owned.removedAt;
    })) { navigate({ page: 'ideas' }); return; }
    if (concerns.length) {
      const okay = await session.recommend({ topicId: 'sick_care', concernIds: concerns, country: SERVICE_COUNTRY,
        maxMinutes: short ? 10 : null, noSpend, localSupport: 'unknown' }, 'auto');
      if (okay) navigate({ page: 'ideas' });
    } else navigate({ page: 'concerns' });
  }
  const replayMilestone = sickProgress ? Math.max(reachedMilestone(sickProgress) || 0, ...sickProgress.seenMilestones) : 0;
  const replayHug = replayMilestone ? () => setMilestone({ count: replayMilestone, replay: true }) : undefined;
  function card(task: RecommendationTask, from: 'ideas' | 'list' = 'ideas') {
    const added = saved.some(item => item.state.actionKey === task.action_key);
    const owned = entries.find(item => item.state.actionKey === task.action_key);
    return <article className="task-card" key={task.action_key}><div className="task-card-main">
      <button className="task-title" onClick={() => open(task, from)}>{task.title}<span className="meta">{task.estimated_minutes} min</span></button>
      <button className={`add${added ? ' added' : ''}`} disabled={added || blocked} aria-label={`${added ? 'Added' : 'Add'} ${task.title}`}
        onClick={() => void act(task, { type: 'save' })}>{added ? '✓' : '+'}</button>
    </div><p className="description">{task.summary}</p>{entries.find(item => item.state.actionKey === task.action_key)?.state.contentRef.startsWith('ai_') && <p className="hint">AI-tailored to your request</p>}
      {canRefine(task) && <button className="text-button" disabled={blocked} onClick={() => startRefining(task, from)}>Make this fit me</button>}
      {owned && <TaskFeedback task={owned.state} disabled={blocked} enabled={draft.personalizationEnabled}
        onChange={event => session.act(task.action_key, event)} />}</article>;
  }
  function row(item: typeof entries[number]) {
    const complete = Boolean(item.state.completedAt);
    return <div className={`list-task${complete ? ' completed' : ''}`} key={item.state.actionKey}>
      <input type="checkbox" checked={complete} disabled={blocked} aria-label={`${complete ? 'Undo completion of' : 'Complete'} ${item.content.title}`}
        onChange={() => void act(item.content, { type: complete ? 'undo_complete' : 'complete' })} />
      <button className="task-title" onClick={() => open(item.content, 'list')}>{item.content.title}<small>{complete ? 'Done, by you' : `${item.content.estimated_minutes} min`}</small></button>
      {!complete && <button className="remove" disabled={blocked} aria-label={`Remove ${item.content.title}`} onClick={() => void act(item.content, { type: 'remove' })}>×</button>}
    </div>;
  }
  function choose(id: TopicId) { navigate(id === 'sick_care' && topic ? { page: 'concerns' } : { page: 'topic', topic: id }); }
  function topicCard(id: TopicId, label: string) {
    return <button className="topic-card" key={id} onClick={() => choose(id)}><div><strong>{label}</strong>
      <span className="meta">{id === 'sick_care' && topic ? 'Prepare a little, rest a little easier' : 'Coming next'}</span></div><span aria-hidden>›</span></button>;
  }
  function back() { navigate(route.page === 'refine' ? { page: 'task', task: route.task } : route.page === 'task' ? { page: origin.current } : route.page === 'ideas' ? { page: 'concerns' } : route.page === 'earlier' ? { page: 'list' } : { page: 'explore' }); }
  const ordered = orderTopics(draft);
  const chosen = draft.personalizationEnabled ? ordered.filter(([id]) => draft.interests.includes(id)) : [];
  const others = chosen.length ? ordered.filter(([id]) => !draft.interests.includes(id)) : ordered;
  const requestPage = route.page === 'concerns' || route.page === 'refine';
  // Keep request outcomes next to their submit button, including errors/quotas.
  // The same block is used at the top of non-form screens; never duplicate it.
  const feedback = <div ref={feedbackArea} tabIndex={-1} aria-label="Request update">
    {state.busy && <p className="hint" role="status">{requestPage ? 'Working on your request. This can take a moment…' : 'Checking your saved progress…'}</p>}
    {state.error && <div role="alert" className="message error"><p>{state.error.code === 'refinement_not_available' ? 'This idea can’t be changed with your current choices, or it has already been saved. Check your progress and choose another unsaved idea.' : state.error.code === 'generation_in_progress' ? 'A suggestion is still being prepared. Give it a moment, then check your saved progress.' : state.error.conflict ? 'Your list changed in another tab. Check the latest version before trying again.' : state.error.outcomeUnknown ? 'We couldn’t confirm the result. Check your saved progress before trying again.' : 'We couldn’t connect to your tasks just now.'}</p>
      <button className="secondary" disabled={state.busy} onClick={() => void session.load()}>Check saved progress</button></div>}
    {requestNotice && <p className={`message${quota ? ' error' : ''}`} role={quota ? 'alert' : 'status'}>{requestNotice}</p>}
  </div>;
  if (!state.loaded && !state.error) return <div className="task-journey" role="status"><p>Finding your saved place…</p></div>;
  return <div className="task-journey" ref={root} aria-busy={state.busy}>
    {route.page !== 'explore' && route.page !== 'list' && route.page !== 'progress' && <button className="back" onClick={back}><span aria-hidden>‹</span> Back</button>}
    {!requestPage && feedback}
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
    {route.page === 'concerns' && <section><span className="pill">Sick-day care</span><h1 tabIndex={-1}>What would help you feel<br />more prepared?</h1>
      <p>Choose what matters to you. We’ll put those ideas first.</p>
      <div className="choices">{topic?.concerns.map(c => <label className={`choice${concerns.includes(c.id) ? ' selected' : ''}`} key={c.id}><span>{c.label}</span>
        <input type="checkbox" checked={concerns.includes(c.id)} onChange={() => setConcerns(values => values.includes(c.id) ? values.filter(id => id !== c.id) : [...values, c.id])} /></label>)}</div>
      <details className="more-topics"><summary>Make it fit today</summary>
        <label className="choice"><span>Keep each task to 10 minutes or less</span><input type="checkbox" checked={short} onChange={e => setShort(e.target.checked)} /></label>
        <label className="choice"><span>Leave out paid-service options and purchases</span><input type="checkbox" checked={noSpend} onChange={e => setNoSpend(e.target.checked)} /></label>
        <p className="hint">Your preferences help order ideas. These limits are optional.</p></details>
      <label className="manual-request">Anything specific you’d like help with? <span className="hint">Optional</span><textarea maxLength={800} value={note} onChange={e => { setNote(e.target.value); setNotice(''); }} placeholder="For example: I have a cat and want to understand care options before booking anything." /></label>
      <p className="hint">US resources. Availability varies by area.</p>
      {state.catalog?.aiUnlimited === true && <p className="hint">Unlimited AI requests on your account.</p>}
      <p className="hint">OpenAI can use your request and relevant preferences to tailor an idea. Leave out private or medical details. We save the task, not your note.</p>
      {feedback}
      <button className="primary" disabled={blocked || !topic || (!concerns.length && !note.trim()) || Boolean(quota && note.trim())} onClick={() => void suggest()}>{state.busy ? 'Finding three useful ideas…' : quota && note.trim() ? 'AI limit reached for today' : note.trim() ? 'Create 3 ideas for my request' : 'Find my next steps'}</button>
      {quota && (concerns.length ? <button className="secondary" disabled={blocked} onClick={() => void suggest('pool')}>See prepared ideas</button>
        : <p className="hint">Choose a concern above to explore prepared ideas without AI.</p>)}
      {batch && <button className="text-button" onClick={() => navigate({ page: 'ideas' })}>Return to my latest ideas</button>}
      <p className="hint">For planning ahead. This app doesn’t provide urgent care or medical advice.</p>
    </section>}
    {route.page === 'ideas' && <section><span className="pill">Sick-day care</span><h1 tabIndex={-1}>{state.latest?.result?.adaptation?.newNeed ? batch && batch.tasks.length > 1 ? <>A few ideas for<br />what you need.</> : <>A step for<br />what you need.</> : state.latest?.result?.adaptation?.refinement ? <>A different way<br />to make it work.</> : <>A few small<br />places to start.</>}</h1>
      <p>Explore a step. Add what feels useful.</p>
      {batch?.message && <p className="message" role="status">{batch.message}</p>}
      {state.latest?.result?.adaptation?.message && <p className="message" role="status">{state.latest.result.adaptation.message}</p>}
      {batch?.tasks.map(task => card(task))}
      {(!batch || batch.status === 'no_more_ideas') && !state.latest?.result?.adaptation?.newNeed && (!batch?.message || state.latest?.result?.adaptation?.refinement) && <p className="message">{batch?.tasks.length ? state.latest?.result?.adaptation?.refinement ? 'This replaces the unsaved version of that idea. It isn’t an extra task on your list.' : 'Start with what feels useful. You can explore more ideas below.' : 'You’ve seen the fitting prepared ideas. Change your choices or tell us what you need for a tailored step.'}</p>}
      <button className="primary" onClick={() => navigate({ page: 'list' })}>Go to my list{saved.length ? ` (${saved.length})` : ''}</button>
      <button className="secondary" onClick={() => navigate({ page: 'concerns' })}>Tell us what you need</button>
      {batch && !['safety_redirect', 'out_of_scope'].includes(batch.status) && !state.latest?.result?.adaptation?.refinement && <button className="secondary" disabled={blocked || Boolean(quota)} onClick={() => void suggest('more')}>See more ideas</button>}
      {earlier.length > 0 && <button className="secondary" onClick={() => navigate({ page: 'earlier' })}>Revisit earlier ideas</button>}
      <button className="text-button" onClick={() => navigate({ page: 'concerns' })}>Change my choices</button>
    </section>}
    {route.page === 'earlier' && <section><span className="pill">Sick-day care</span><h1 tabIndex={-1}>Let’s find<br />a better fit.</h1>
      <p>These are ideas you’ve already seen. Pick an unsaved one, then tell us what you’d change.</p>
      {earlier.map(item => card(item.content, 'list'))}
      {!earlier.length && <p className="message">No unsaved ideas here yet. Your saved steps are still on your list.</p>}
      <button className="secondary" onClick={() => navigate({ page: 'concerns' })}>Explore another concern</button>
      <button className="text-button" onClick={() => navigate({ page: 'list' })}>Back to my list</button></section>}
    {route.page === 'refine' && <section><span className="pill">Make it yours</span><h1 tabIndex={-1}>What would<br />fit better?</h1>
      {current && canRefine(current.content) ? <><p>Let’s find another way to approach “{current.content.title}”.</p>
        <label className="manual-request">What would you like to change?<textarea maxLength={800} value={refinementNote}
          onChange={e => { setRefinementNote(e.target.value); setNotice(''); }} placeholder="For example: I don’t have a microwave. I’d prefer something with no cooking." /></label>
        <p className="hint">OpenAI uses your note and relevant preferences. Leave out private or medical details. We save the new task, not your note.</p>
        {feedback}
        <button className="primary" disabled={blocked || Boolean(quota) || refinementNote.trim().length < 5} onClick={() => void refine(current.content)}>{quota ? 'AI limit reached for today' : 'Try a tailored alternative'}</button>
        <p className="hint">Same goal, a different approach.</p>
        {quota && <button className="secondary" onClick={() => navigate({ page: 'concerns' })}>Explore prepared ideas</button>}
        <button className="text-button" onClick={() => navigate({ page: 'task', task: current.state.actionKey })}>Keep the original idea</button></>
        : <>{feedback}<p>Saved and completed tasks stay as you left them. Choose an unsaved idea to try a different approach.</p>
          <button className="primary" onClick={() => navigate({ page: 'earlier' })}>Choose an unsaved idea</button></>}
    </section>}
    {route.page === 'task' && (current ? <section className="detail"><div className="task-meta"><span className="pill">Sick-day care</span><span>{current.content.estimated_minutes} min</span></div>
      <h1 tabIndex={-1}>{current.content.title}</h1><p className="description">{current.content.summary}</p>
      {current.state.contentRef.startsWith('ai_') && <p className="hint">AI-tailored to your request.</p>}
      <TaskSteps key={`${current.state.actionKey}:${current.state.contentRef}`} steps={current.content.steps}
        checked={current.state.stepChecks} disabled={blocked || current.state.stepChecks === undefined}
        onCheck={(index, checked) => void act(current.content, { type: 'check_step', index, checked })} />
      {current.content.resources.length > 0 && <details className="optional-row"><summary>Helpful links · {current.content.resources.length}</summary>{current.content.resources.map(r => {
        const resource = state.catalog?.resources.find(item => item.id === r.resource_id);
        return resource ? <p key={r.resource_id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.name} ↗</a><br />{r.why}<br /><small>{resource.limits}</small></p> : <p key={r.resource_id}>This resource is being checked.</p>;
      })}</details>}
      {current.content.purchase_checks.length > 0 && <details className="optional-row"><summary>If you’re buying</summary><ul>{current.content.purchase_checks.map(s => <li key={s}>{s}</li>)}</ul>{current.content.no_purchase_option && <p>{current.content.no_purchase_option}</p>}</details>}
      <div className="done-when"><strong>Done when</strong><p>{current.content.done_when}</p></div>
      {!current.state.savedAt ? <button className="primary" disabled={blocked} onClick={() => void act(current.content, { type: 'save' })}>+ Add to my list</button>
        : current.state.completedAt ? <><p className="message">Done, by you.</p><button className="text-button" disabled={blocked} onClick={() => void act(current.content, { type: 'undo_complete' })}>Mark as not done</button></>
          : <button className="primary" disabled={blocked} onClick={() => void act(current.content, { type: 'complete' })}>Mark as done</button>}
      {canRefine(current.content) && <button className="text-button" disabled={blocked} onClick={() => startRefining(current.content, origin.current)}>Make this fit me</button>}
      <details className="optional-row"><summary>Was this useful?</summary>
        <TaskFeedback key={current.state.actionKey} task={current.state} disabled={blocked} enabled={draft.personalizationEnabled}
          onChange={event => session.act(current.state.actionKey, event)} /></details>
    </section> : <section><h1 tabIndex={-1}>Let’s find<br />your next step.</h1><p>This task isn’t in your account. Your list is still here.</p><button className="primary" onClick={() => navigate({ page: 'list' })}>Go to my list</button></section>)}
    {route.page === 'list' && <section className={pulse ? 'completion-nudge' : undefined}><header className="list-top"><h1 tabIndex={-1}>My list</h1><span className="pill">Sick days</span></header>
      {sickProgress && <ListProgress progress={sickProgress} label="Sick-day care" elephantName={draft.elephantName} onReplay={replayHug} />}
      {progress.error && <p className="message" role="status">Your list is here, but progress couldn’t load. <button className="text-button" onClick={() => void progress.reload()}>Try again</button></p>}
      {recentCompletion && entries.some(item => item.state.actionKey === recentCompletion.action_key && item.state.completedAt) && <p className="message" role="status">One more thing in place, thanks to you. <button className="text-button" disabled={blocked} onClick={() => void act(recentCompletion, { type: 'undo_complete' })}>Undo</button></p>}
      {!saved.length ? <div className="empty">{!sickProgress && <Elephant large name={draft.elephantName} />}<p>Your list has room for something small. Add an idea when it feels useful.</p><button className="primary" disabled={blocked} onClick={() => void findIdeas()}>Find a first step</button></div>
        : <><p>{pending.length ? `${pending.length} ${pending.length === 1 ? 'step' : 'steps'}, at your pace.` : 'A little more in place. You can leave it here for today.'}</p>{pending.map(row)}
          </>}
      {done.length > 0 && <details className="completed-list"><summary>Completed · {done.length}</summary>{done.map(row)}</details>}
      {saved.length > 0 && <button className="secondary" disabled={blocked} onClick={() => void findIdeas()}>Find more ideas</button>}
      {earlier.length > 0 && <button className="text-button" onClick={() => navigate({ page: 'earlier' })}>Revisit earlier ideas</button>}
    </section>}
    {route.page === 'progress' && <section><header className="progress-top"><div><h1 tabIndex={-1}>My progress</h1><p>Look at what you’re building.</p></div><Elephant name={draft.elephantName} /></header>
      {!progress.data && !progress.error && <p role="status">Finding your progress…</p>}
      {progress.error && <div className="message" role="alert"><p>We couldn’t load your progress.</p><button className="secondary" disabled={progress.busy} onClick={() => void progress.reload()}>Try again</button></div>}
      {progress.data?.categories.map(category => <CategoryProgressCard key={category.topicId} progress={category}
        label={interestLabels[category.topicId]} elephantName={draft.elephantName} onReplay={category.topicId === 'sick_care' ? replayHug : undefined}
        onContinue={() => category.completedCount || category.pendingCount ? navigate({ page: 'list' }) : void findIdeas()} />)}
    </section>}
    <nav className="bottom-nav" aria-label="App navigation">
      <button aria-current={route.page === 'list' || (route.page === 'task' && origin.current === 'list') ? 'page' : undefined} onClick={() => navigate({ page: 'list' })}>My list</button>
      <button aria-current={!['list', 'progress'].includes(route.page) && !(route.page === 'task' && origin.current === 'list') ? 'page' : undefined} onClick={() => navigate({ page: 'explore' })}>Explore</button>
      <button aria-current={route.page === 'progress' ? 'page' : undefined} onClick={() => navigate({ page: 'progress' })}>My progress</button></nav>
    {active && milestone && <MilestoneSheet key={`${milestone.count}-${milestone.replay}`} milestone={milestone.count} label="Sick-day care" elephantName={draft.elephantName}
      onClose={() => setMilestone(null)} busy={progress.busy} error={progress.error ? 'Your check-in couldn’t connect. Please try again.' : null}
      onCheckIn={feeling => progress.checkIn('sick_care', milestone.count, feeling)}
      onExplore={() => { setMilestone(null); navigate({ page: 'explore' }); }}
      onKeepBuilding={() => { setMilestone(null); void findIdeas(); }} />}
  </div>;
}
