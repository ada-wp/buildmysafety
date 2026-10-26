import { useState } from 'react';
import type { FeedbackCode, TaskActionEvent, TaskState } from '../api-contracts';

const reasons: Array<[FeedbackCode, string]> = [
  ['too_generic', 'Too obvious or basic'], ['too_much_effort', 'Too much effort'],
  ['too_expensive', 'Costs too much'], ['already_done', 'Already in place'],
  ['not_relevant_now', 'Not what I need now']
];

export function TaskFeedback({ task, disabled, enabled, onChange }: {
  task: TaskState; disabled: boolean; enabled: boolean; onChange: (event: TaskActionEvent) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const negative = task.feedbackCode && task.feedbackCode !== 'helpful';
  const liked = Boolean(task.likedAt) || task.feedbackCode === 'helpful';
  async function send(event: TaskActionEvent) {
    setMessage('');
    if (await onChange(event)) {
      setOpen(false);
      setMessage(event.type === 'unlike' || (event.type === 'feedback' && event.code === null)
        ? 'Feedback cleared.' : enabled ? 'Saved for future suggestions. Your current request still comes first.'
          : 'Feedback saved. Turn personalization on in Your account to use it for future suggestions.');
    }
  }
  return <div className="task-feedback" aria-label="Suggestion feedback">
    <div className="feedback-buttons">
      <button type="button" disabled={disabled} aria-pressed={liked} onClick={() => void send(liked
        ? task.likedAt ? { type: 'unlike' } : { type: 'feedback', code: null } : { type: 'like' })}>
        {liked ? '✓ More like this' : 'More like this'}
      </button>
      <button type="button" disabled={disabled} aria-expanded={open} onClick={() => { setOpen(value => !value); setMessage(''); }}>Not for me</button>
    </div>
    {open && <fieldset className="feedback-reasons"><legend>What didn’t fit?</legend>
      {reasons.map(([code, label]) => <button type="button" key={code} disabled={disabled}
        aria-pressed={task.feedbackCode === code} onClick={() => void send({ type: 'feedback', code })}>{label}</button>)}
      <button type="button" disabled={disabled} onClick={() => setOpen(false)}>Cancel</button>
    </fieldset>}
    {negative && !open && <p className="hint">{reasons.find(([code]) => code === task.feedbackCode)?.[1]}
      {' · '}<button className="feedback-clear" disabled={disabled} onClick={() => void send({ type: 'feedback', code: null })}>Undo feedback</button></p>}
    {message && <p className="hint" role="status">{message}</p>}
  </div>;
}
