import { useEffect, useRef, useState } from 'react';
import type { TopicId } from '../api-contracts.ts';
import type { ProfileDraft } from '../profile-draft.ts';
import { interestEntries, interestLabels } from '../interest-labels.ts';
import { orderTopics } from '../topic-order.ts';
import { addSampleTask, completeSampleTask, parsePreviewRoute, previewHash, previewTask,
  sampleTasks, sickDayConcerns, type PreviewRoute, type PreviewTask } from '../task-preview.ts';
import { Elephant } from './Elephant';

const topicIds = interestEntries.map(([id]) => id);

/** A complete, explicitly temporary interaction preview. Profile persistence is
 * handled by the parent; this component makes no API or browser-storage calls. */
export function TaskJourneyPreview({ draft, initialTopic = null }: {
  draft: ProfileDraft; initialTopic?: TopicId | null;
}) {
  const [route, setRoute] = useState<PreviewRoute>(() => {
    if (location.hash.startsWith('#/app/')) return parsePreviewRoute(location.hash, topicIds);
    return initialTopic ? initialTopic === 'sick_care' ? { page: 'concerns', topic: 'sick_care' }
      : { page: 'topic', topic: initialTopic } : { page: 'explore' };
  });
  const [concerns, setConcerns] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [exhausted, setExhausted] = useState(false);
  const taskOrigin = useRef<'ideas' | 'list'>('ideas');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restore = () => {
      if (!location.hash.startsWith('#/app')) return;
      setRoute(parsePreviewRoute(location.hash, topicIds));
      taskOrigin.current = history.state?.taskPreview?.origin === 'list' ? 'list' : 'ideas';
      setNotice('');
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('h1')?.focus();
    window.scrollTo(0, 0);
  }, [route]);

  function navigate(next: PreviewRoute) {
    setNotice('');
    if (previewHash(next) !== location.hash) {
      history.pushState({ taskPreview: { origin: taskOrigin.current } }, '', previewHash(next));
    }
    setRoute(next);
  }
  function chooseTopic(topic: TopicId) {
    navigate(topic === 'sick_care' ? { page: 'concerns', topic } : { page: 'topic', topic });
  }
  function openTask(task: PreviewTask, origin: 'ideas' | 'list') {
    taskOrigin.current = origin;
    navigate({ page: 'task', task: task.id });
  }
  function add(task: PreviewTask) {
    setSaved(current => addSampleTask(current, task.id));
    setNotice(`${task.title} is on your sample list.`);
  }
  function complete(task: PreviewTask) {
    if (!saved.includes(task.id) || completed.includes(task.id)) return;
    setCompleted(current => completeSampleTask(saved, current, task.id));
    navigate({ page: 'complete', task: task.id });
  }
  function back() {
    if (route.page === 'task') navigate(taskOrigin.current === 'list' ? { page: 'list' } : { page: 'ideas', topic: 'sick_care' });
    else if (route.page === 'ideas') navigate({ page: 'concerns', topic: 'sick_care' });
    else if (route.page === 'complete') navigate({ page: 'list' });
    else navigate({ page: 'explore' });
  }
  function topicCard(id: TopicId, label: string) {
    return <button className="topic-card" key={id} onClick={() => chooseTopic(id)}>
      <div><strong>{label}</strong><span className="meta">{id === 'sick_care' ? 'Try the sample journey' : 'Task collection coming next'}</span></div>
      <span aria-hidden="true">›</span>
    </button>;
  }
  function taskCard(task: PreviewTask) {
    const added = saved.includes(task.id);
    return <article key={task.id} className="task-card">
      <div className="task-card-main">
        <button className="task-title" onClick={() => openTask(task, 'ideas')}>{task.title}<span className="meta">{task.minutes} min</span></button>
        <button className={`add${added ? ' added' : ''}`} disabled={added}
          aria-label={`${added ? 'Added' : 'Add'} ${task.title}`} onClick={() => add(task)}>{added ? '✓' : '+'}</button>
      </div><p className="description">{task.description}</p>
    </article>;
  }
  function listRow(task: PreviewTask) {
    const done = completed.includes(task.id);
    return <div className={`list-task${done ? ' completed' : ''}`} key={task.id}>
      <input type="checkbox" checked={done} disabled={done} aria-label={`${done ? 'Completed' : 'Complete'} ${task.title}`}
        onChange={() => complete(task)} />
      <button className="task-title" onClick={() => openTask(task, 'list')}>{task.title}<small>{done ? 'Completed in this preview' : `${task.minutes} min`}</small></button>
      <button className="remove" aria-label={`Remove ${task.title}`} onClick={() => {
        setSaved(current => current.filter(id => id !== task.id));
        setNotice('Removed from your sample list. You can add it again from the ideas.');
      }}>×</button>
    </div>;
  }

  const ordered = orderTopics(draft);
  const interests = new Set(draft.interests);
  const chosen = draft.personalizationEnabled ? ordered.filter(([id]) => interests.has(id)) : [];
  const other = chosen.length ? ordered.filter(([id]) => !interests.has(id)) : ordered;
  const currentTask = 'task' in route ? previewTask(route.task) : undefined;
  const orderedTasks = draft.personalizationEnabled && (draft.answers.constraints.includes('time') || draft.answers.constraints.includes('energy'))
    ? [...sampleTasks].sort((a, b) => a.minutes - b.minutes) : [...sampleTasks];
  const pending = sampleTasks.filter(task => saved.includes(task.id) && !completed.includes(task.id));
  const done = sampleTasks.filter(task => saved.includes(task.id) && completed.includes(task.id));

  return <div className="task-journey" ref={root}>
    <p className="hint preview-badge">Task-flow preview · sample tasks; not synced. Your sample list clears when you refresh.</p>
    {route.page !== 'explore' && route.page !== 'list' && <button className="back" onClick={back}><span aria-hidden="true">‹</span> Back</button>}
    {notice && <p className="message" role="status">{notice}</p>}

    {route.page === 'explore' && <section>
      <span className="eyebrow">Explore</span><h1 tabIndex={-1}>One small place<br />to begin.</h1>
      <p>Open an area to take the next step. Your other interests will still be here.</p>
      {chosen.length > 0 && <><h2 className="topic-group-title">Your interests</h2><div className="topic-grid">{chosen.map(([id, label]) => topicCard(id, label))}</div></>}
      {chosen.length ? <details className="more-topics"><summary>Explore other areas</summary>
        <div className="topic-grid">{other.map(([id, label]) => topicCard(id, label))}</div>
      </details> : <><h2 className="topic-group-title">Choose an area</h2>
        <div className="topic-grid">{other.map(([id, label]) => topicCard(id, label))}</div></>}
    </section>}

    {route.page === 'topic' && <section>
      <span className="pill">{interestLabels[route.topic]}</span><h1 tabIndex={-1}>This area is<br />coming next.</h1>
      <p>Its task collection is not connected yet. Your interest is still welcome here.</p>
      <p>You can try the sick-day sample to see how task ideas, My list and completion will work.</p>
      <button className="primary" onClick={() => chooseTopic('sick_care')}>Try the sick-day sample</button>
      <button className="secondary" onClick={() => navigate({ page: 'explore' })}>Explore other areas</button>
    </section>}

    {route.page === 'concerns' && <section>
      <span className="pill">Sick-day care</span><h1 tabIndex={-1}>What would make<br />a sick day easier?</h1>
      <p>Choose any that are on your mind.</p>
      <div className="choices">{sickDayConcerns.map(([id, label]) => <label key={id} className={`choice${concerns.includes(id) ? ' selected' : ''}`}>
        <span>{label}</span><input type="checkbox" checked={concerns.includes(id)} onChange={() => setConcerns(current =>
          current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />
      </label>)}</div>
      <p className="hint">This preview has three fixed examples. They do not yet change with these choices, and may not cover the help you selected.</p>
      <button className="primary" onClick={() => navigate({ page: 'ideas', topic: 'sick_care' })}>See 3 sample ideas</button>
    </section>}

    {route.page === 'ideas' && <section>
      <span className="pill">Sick-day care · sample ideas</span><h1 tabIndex={-1}>A few small<br />places to start.</h1>
      <p>Open an idea to see what is involved. Use + to try adding it to your list.</p>
      {orderedTasks.map(taskCard)}
      {exhausted && <p className="message" role="status">You have seen all three sample ideas. Your list is kept; more task content is being prepared.</p>}
      <button className="primary" onClick={() => navigate({ page: 'list' })}>Go to my list{saved.length ? ` (${saved.length})` : ''}</button>
      <button className="secondary" onClick={() => setExhausted(true)}>See more ideas</button>
      <button className="text-button" onClick={() => navigate({ page: 'concerns', topic: 'sick_care' })}>Change my choices</button>
    </section>}

    {route.page === 'task' && currentTask && <section className="detail">
      <div className="task-meta"><span className="pill">Sick-day care</span><span>{currentTask.minutes} min</span></div>
      <h1 tabIndex={-1}>{currentTask.title}.</h1><p className="description">{currentTask.description}</p>
      <ol className="steps">{currentTask.steps.map((step, index) => <li key={step}><span className="step-number" aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
      <div className="done-when"><strong>Done when</strong><p>{currentTask.doneWhen}</p></div>
      {!saved.includes(currentTask.id) ? <button className="primary" onClick={() => add(currentTask)}>+ Add to my list</button>
        : completed.includes(currentTask.id) ? <><p className="message">Completed in this preview.</p><button className="primary" onClick={() => navigate({ page: 'list' })}>Back to my list</button></>
          : <><button className="primary" onClick={() => complete(currentTask)}>Mark as done</button><button className="text-button" onClick={() => navigate({ page: 'list' })}>View my list</button></>}
    </section>}

    {route.page === 'list' && <section>
      <span className="eyebrow">Your sample list</span><h1 tabIndex={-1}>One thing<br />at a time.</h1>
      {!saved.length ? <div className="empty"><Elephant large name={draft.elephantName} /><p>Your list has room for something small. Try adding an idea when it feels useful.</p>
        <button className="primary" onClick={() => chooseTopic('sick_care')}>Try the sick-day sample</button></div>
        : <><p>{pending.length ? `${pending.length} ${pending.length === 1 ? 'idea' : 'ideas'} to try. You set the pace.` : 'That is everything on your sample list. You can leave it here for now.'}</p>
          {pending.map(listRow)}{done.length > 0 && <div className="completed-list"><h2>Little wins · {done.length}</h2>{done.map(listRow)}</div>}
          <button className="secondary" onClick={() => navigate({ page: 'explore' })}>Explore another area</button></>}
    </section>}

    {route.page === 'complete' && <section className="celebration">
      <span className="eyebrow">Completion preview</span><h1 tabIndex={-1}>{currentTask && completed.includes(currentTask.id) ? 'A little more\n“I can do this.”' : 'Your little wins\nhave a place here.'}</h1>
      <div className="high-five"><Elephant large name={draft.elephantName} /></div>
      <p>{currentTask && completed.includes(currentTask.id) ? 'One small thing, put in place by you. Your little companion is here to celebrate it with you.' : 'This sample has no saved completion to show. Choose a task from your list when you are ready.'}</p>
      <span className="growth-label">{completed.length} sample {completed.length === 1 ? 'task' : 'tasks'} completed</span>
      <p className="hint">Sample completion only. Your companion’s progress is not saved yet.</p>
      <button className="primary" onClick={() => navigate({ page: 'list' })}>Back to my list</button>
      <button className="text-button" onClick={() => navigate({ page: 'explore' })}>Explore another area</button>
    </section>}

    <nav className="bottom-nav" aria-label="App navigation">
      <button aria-current={route.page !== 'list' && route.page !== 'complete' && !(route.page === 'task' && taskOrigin.current === 'list') ? 'page' : undefined}
        onClick={() => navigate({ page: 'explore' })}>Explore</button>
      <button aria-current={route.page === 'list' || route.page === 'complete' || (route.page === 'task' && taskOrigin.current === 'list') ? 'page' : undefined}
        onClick={() => navigate({ page: 'list' })}>My list{saved.length ? ` (${saved.length})` : ''}</button>
    </nav>
  </div>;
}
