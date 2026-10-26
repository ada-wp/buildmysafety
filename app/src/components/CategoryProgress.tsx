import { useEffect, useRef, useState } from 'react';
import type { CategoryProgress, PreparednessFeeling } from '../api-contracts';
import { FEELING_LABELS, MILESTONES, MILESTONE_MESSAGES, nextMilestone } from '../progress';
import { Elephant } from './Elephant';
import './category-progress.css';

type ProgressProps = { progress: CategoryProgress; label: string; elephantName?: string | null; onReplay?: () => void };
function ProgressBar({ count, label }: { count: number; label: string }) {
  return <div className="category-progress-track" role="progressbar" aria-label={`${label}: first ten completed steps`}
    aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(10, count)} aria-valuetext={`${count} completed steps`}>
    <span style={{ width: `${Math.min(100, count * 10)}%` }} /></div>;
}
export function ListProgress({ progress, label, elephantName, onReplay }: ProgressProps) {
  const next = nextMilestone(progress.completedCount);
  return <div className="list-progress"><p className="progress-hello">Here with you, one step at a time.</p><Elephant large name={elephantName} />
    <div className="category-progress-count"><strong>Your first block</strong>
      <span>{progress.completedCount < 10 ? `${progress.completedCount} / 10 steps` : `${progress.completedCount} steps completed`}</span></div>
    <ProgressBar count={progress.completedCount} label={label} />
    <div className="category-progress-markers" aria-label="Milestones at 1, 3, 6, 9 and 10 tasks">{MILESTONES.map(n =>
      <span key={n} className={progress.completedCount >= n ? 'earned' : undefined} style={{ left: `${n * 10}%` }}>{n}</span>)}</div>
    <p className="hint">{progress.latestCheckIn?.feeling === 'ready' ? 'Feeling prepared enough for now' : next ? `Next milestone: ${next} ${next === 1 ? 'step' : 'steps'}` : 'Your first block is built. Keep going if it helps.'}</p>
    {onReplay && <button className="text-button" onClick={onReplay}>Replay milestone</button>}
  </div>;
}
export function CategoryProgressCard({ progress, label, onContinue }: ProgressProps & { onContinue: () => void }) {
  const next = nextMilestone(progress.completedCount);
  return <button className="category-overview-card" onClick={onContinue}><strong>{label}</strong>
    <span className="category-card-count">{progress.completedCount < 10 ? `${progress.completedCount} / 10 steps` : `${progress.completedCount} steps completed`}</span>
    <ProgressBar count={progress.completedCount} label={label} />
    <span className="category-card-meta">{progress.completedCount === 0 ? 'Your first milestone: 1 step' : next ? `Next milestone: ${next} steps` : 'Your first block is built.'}</span>
    {progress.pendingCount > 0 && <span className="category-card-meta">{progress.pendingCount} {progress.pendingCount === 1 ? 'task' : 'tasks'} on your list</span>}
    {progress.latestCheckIn && <span className="category-last-checkin">Your last check-in: {FEELING_LABELS[progress.latestCheckIn.feeling]}</span>}
    <span className="category-card-cta">{progress.completedCount || progress.pendingCount ? 'Continue' : 'Choose your first step'} <span aria-hidden>→</span></span>
  </button>;
}

type MilestoneProps = { milestone: number; label: string; elephantName?: string | null;
  onClose: () => void; onCheckIn: (feeling: PreparednessFeeling) => Promise<boolean>;
  onExplore: () => void; onKeepBuilding: () => void; busy?: boolean; error?: string | null };
export function MilestoneSheet({ milestone, label, elephantName, onClose, onCheckIn, onExplore, onKeepBuilding, busy = false, error }: MilestoneProps) {
  const [moment, setMoment] = useState<'hug' | 'checkin' | 'ready'>('hug');
  const [hug, setHug] = useState(0);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const sheet = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheet.current?.querySelector<HTMLElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...(sheet.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input:not(:disabled),[tabindex="0"]') || [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  useEffect(() => { sheet.current?.querySelector<HTMLElement>('h2')?.focus(); }, [moment]);
  async function answer(feeling: PreparednessFeeling) {
    setSaving(true); setLocalError('');
    const okay = await onCheckIn(feeling);
    setSaving(false);
    if (!okay) { setLocalError('We couldn’t save that check-in. You can try again or leave it for now.'); return; }
    if (feeling === 'ready') setMoment('ready'); else onClose();
  }
  return <div className="milestone-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="milestone-sheet" role="dialog" aria-modal="true" aria-labelledby="milestone-title" ref={sheet}>
      <div className="milestone-handle" aria-hidden />
      <button className="milestone-close" aria-label="Close milestone" onClick={onClose}>×</button>
      {moment === 'hug' ? <><h2 id="milestone-title" tabIndex={-1}>{milestone === 1 ? 'Your first step.' : milestone === 10 ? 'Your first block, built.' : `${milestone} steps. Look at you.`}</h2>
        <p className="hint">{label}</p><p className="milestone-speech" id="elephant-milestone-words">{MILESTONE_MESSAGES[milestone]}</p>
        <button className="milestone-hug" key={hug} onClick={() => setHug(n => n + 1)} aria-label="Replay your elephant’s hug">
          <Elephant large name={elephantName} /><span className="hug-heart hug-heart-left" aria-hidden>♥</span><span className="hug-heart hug-heart-right" aria-hidden>♥</span><span className="hug-heart hug-heart-small" aria-hidden>♥</span></button>
        <p className="hint hug-hint">Tap me for another hug</p>
        <button className="primary" onClick={() => setMoment('checkin')}>A little check-in</button>
        <button className="text-button" onClick={onClose}>Back to my list</button></>
        : moment === 'checkin' ? <><Elephant name={elephantName} /><h2 id="milestone-title" tabIndex={-1}>A moment for you.</h2>
          <p className="hint">{milestone} {milestone === 1 ? 'task completed' : 'tasks completed'} · {label}</p>
          <p className="milestone-question">{label === 'Sick-day care' ? 'How prepared do you feel for a sick day on your own?' : `How prepared do you feel about ${label.toLowerCase()}?`}</p>
          <div className="choices">{(Object.keys(FEELING_LABELS) as PreparednessFeeling[]).map(feeling =>
            <button className="choice" key={feeling} disabled={busy || saving} onClick={() => void answer(feeling)}>{FEELING_LABELS[feeling]}</button>)}</div>
          {(localError || error) && <p className="message error" role="alert">{localError || error}</p>}
          <button className="text-button" onClick={onClose}>Not now</button></>
          : <><Elephant name={elephantName} /><h2 id="milestone-title" tabIndex={-1}>Good for now.</h2>
            <p>You can keep building here, or explore another area. Your steps will be here when you return.</p>
            <button className="primary" onClick={onExplore}>Explore another area</button>
            <button className="secondary" onClick={onKeepBuilding}>Keep building here</button></>}
    </div>
  </div>;
}
