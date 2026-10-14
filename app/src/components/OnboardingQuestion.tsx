import { questions } from '../onboarding';
import type { ProfileDraft } from '../profile-draft';

export function OnboardingQuestion({ step, draft, values, editing, onChoose, onNext, onSkip, onPickTopic }:
  { step: number; draft: ProfileDraft; values: string[]; editing: boolean;
    onChoose: (id: string) => void; onNext: () => void; onSkip: () => void; onPickTopic: () => void }) {
  const q = questions[step];
  return <section className="onboarding">
    <div className="question-progress" aria-label={`Question ${step + 1} of ${questions.length}`}>
      {questions.map((_, i) => <span key={i} className={i <= step ? 'filled' : ''} />)}
    </div>
    <span className="eyebrow">Getting to know you · {step + 1}/{questions.length}</span>
    {step === 2 && draft.answers.why === 'trust' && <p className="gentle-comment">We can build from small moments of “I did that.”</p>}
    {step === 7 && <p className="gentle-comment">Small preparations can give us more room to choose how we live.</p>}
    <h1 tabIndex={-1} className="question-title">{q.title}</h1>
    {q.multi && <p className="hint">{q.max ? `Choose up to ${q.max}.` : 'Choose what fits.'}</p>}
    <div className="choices" role="group" aria-label={q.title}>
      {q.options?.map(([id, label]) => <button key={id} className={'choice ' + (values.includes(id) ? 'selected' : '')}
        aria-pressed={values.includes(id)} onClick={() => onChoose(id)}>
        <span>{label}</span><span className={q.multi ? 'check' : 'radio'} aria-hidden>{values.includes(id) ? '✓' : ''}</span>
      </button>)}
    </div>
    <button className="primary" disabled={!q.optional && !values.length} onClick={onNext}>{editing ? 'Keep answer' : 'Continue'}</button>
    {q.optional && <button className="text-button" onClick={onSkip}>Skip for now</button>}
    {!editing && <button className="text-button" onClick={onPickTopic}>I’ll pick a topic instead</button>}
  </section>;
}
