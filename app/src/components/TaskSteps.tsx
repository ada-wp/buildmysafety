import { useState } from 'react';
import './task-steps.css';

/** A compact excerpt only. Expanding always reveals the complete, unedited instruction. */
export function stepLabel(step: string) {
  const text = step.trim();
  const sentence = text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim();
  if (sentence && sentence.length <= 78) return sentence;
  if (text.length <= 78) return text;
  const prefix = text.slice(0, 72).replace(/\s+\S*$/u, '');
  return `${prefix || text.slice(0, 72)}…`;
}

export function TaskSteps({ steps, checked = 0, disabled = false, onCheck }: {
  steps: string[]; checked?: number; disabled?: boolean; onCheck: (index: number, value: boolean) => void;
}) {
  const [open, setOpen] = useState<number[]>([0]);
  const count = steps.filter((_, index) => checked & (1 << index)).length;
  return <div className="task-checklist">
    <div className="task-checklist-heading"><span>Your steps</span><span role="status" aria-label={`${count} of ${steps.length} steps checked`}>{count} / {steps.length}</span></div>
    <ol className="task-checklist-group">{steps.map((step, index) => <li key={index} className="task-checklist-row">
      <label className="task-step-check"><input type="checkbox" checked={Boolean(checked & (1 << index))} disabled={disabled}
        aria-label={`Check step ${index + 1}: ${step}`} onChange={event => onCheck(index, event.target.checked)} /></label>
      {stepLabel(step) === step.trim() ? <p className="task-step-short">{step}</p> : <details open={open.includes(index)} onToggle={event => {
        const expanded = event.currentTarget.open;
        setOpen(values => expanded ? values.includes(index) ? values : [...values, index] : values.filter(value => value !== index));
      }}>
        <summary><span>{stepLabel(step)}</span><span className="task-chevron" aria-hidden="true" /></summary>
        <p>{step}</p>
      </details>}
    </li>)}</ol>
  </div>;
}
