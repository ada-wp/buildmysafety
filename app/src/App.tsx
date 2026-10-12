import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Elephant } from './components/Elephant';
import { OnboardingQuestion } from './components/OnboardingQuestion';
import { emptyDraft, editableProfile, type ProfileDraft } from './profile-draft';
import type { ProfileSession, ProfileSessionState } from './profile-session';
import { questions } from './onboarding';
import { interestLabels, interestEntries } from './interest-labels';

type Page = 'welcome' | 'question' | 'interests' | 'recap' | 'account';
const pages: Page[] = ['welcome', 'question', 'interests', 'recap', 'account'];
const labelFor = (key: string, value: string) => questions.find(q => q.id === key)?.options?.find(o => o[0] === value)?.[1] || value;

export default function App({ session }: { session: ProfileSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getState);
  useEffect(() => { void session.load(); }, [session]);
  // A changed identity discards all private UI state, including unsaved reflections.
  return <ProfileScreens key={state.identityEpoch} session={session} state={state} />;
}

function ProfileScreens({ session, state }: { session: ProfileSession; state: ProfileSessionState }) {
  const [page, setPage] = useState<Page>('welcome');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState('');
  const [feeling, setFeeling] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state.snapshot && !dirty) setDraft(editableProfile(state.snapshot.profile));
  }, [state.snapshot, dirty]);
  useEffect(() => {
    main.current?.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  }, [page, step]);
  useEffect(() => {
    const restore = () => {
      const value = location.hash.slice(2) as Page;
      setPage(pages.includes(value) ? value : 'welcome');
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  function nav(next: Page) {
    if (state.busy) return;
    setPage(next);
    history.pushState(null, '', `#/${next}`);
  }
  function update(next: ProfileDraft) { setDirty(true); setNotice(''); setDraft(next); }
  function values(key: string): string[] {
    if (key === 'feeling') return feeling;
    const answer = draft.answers[key as keyof ProfileDraft['answers']];
    return Array.isArray(answer) ? answer : answer ? [answer] : [];
  }
  function setAnswer(key: string, next: string[]) {
    if (key === 'feeling') { setFeeling(next.filter(value => value !== 'private')); return; }
    if (!Object.hasOwn(draft.answers, key)) return;
    const q = questions.find(question => question.id === key)!;
    // Choice IDs come from the established question set. The API is authoritative on validation.
    update({ ...draft, answers: { ...draft.answers, [key]: q.multi ? next : next[0] === 'private' ? null : next[0] || null } });
  }
  function choose(option: string) {
    const q = questions[step];
    let next = values(q.id);
    if (!q.multi) next = [option];
    else if (next.includes(option)) next = next.filter(value => value !== option);
    else if (q.exclusive?.includes(option)) next = [option];
    else {
      next = next.filter(value => !q.exclusive?.includes(value));
      if (q.max && next.length >= q.max) return;
      next = [...next, option];
    }
    setAnswer(q.id, next);
  }
  function nextQuestion() {
    if (editing) { setEditing(false); nav('recap'); }
    else if (step < questions.length - 1) setStep(value => value + 1);
    else nav('interests');
  }
  function back() {
    if (page === 'question' && editing) { setEditing(false); nav('recap'); }
    else if (page === 'question' && step > 0) setStep(value => value - 1);
    else if (page === 'interests') { setStep(questions.length - 1); nav('question'); }
    else if (page === 'recap') nav('interests');
    else nav('welcome');
  }
  async function save() {
    if (await session.save(structuredClone(draft))) { setDirty(false); setNotice('Your starting point is saved.'); }
  }
  const canSave = state.status === 'new' || state.status === 'ready';

  return <>
    <aside className="build-status">Early app preview · {state.status === 'unconfigured' ? 'email sign-in and cloud saving are not available yet' : state.busy ? 'Connecting…' : 'profile connection'}</aside>
    <div className="app-shell">
      <header className="topbar">
        {page === 'welcome' ? <span className="wordmark">my safety</span> : <button className="back" disabled={state.busy} onClick={back}><span aria-hidden>‹</span> Back</button>}
        <button className="pet-button" disabled={state.busy} aria-label="Your account" onClick={() => nav('account')}><Elephant name={draft.elephantName} /></button>
      </header>
      <main ref={main} aria-busy={state.busy}>
        {state.error && <div role="alert" className="message error">
          {state.error.conflict ? 'Your saved answers changed elsewhere. Your edits are still here. Load the latest version before reviewing and saving again.' : state.error.message}
          <button className="text-button" disabled={state.busy} onClick={() => { setNotice('Your unsaved choices stay here while we check the saved version.'); void session.load(); }}>Check saved answers</button>
        </div>}
        {notice && <div role="status" className="message">{notice}</div>}
        {state.snapshot && dirty && <button className="text-button" disabled={state.busy} onClick={() => { setDirty(false); setNotice('Showing your last saved answers.'); }}>Use my last saved answers</button>}
        <fieldset className="screen-fields" disabled={state.busy}>
          {page === 'welcome' && <section className="welcome">
            <span className="eyebrow">A little more “I can handle this.”</span><h1 tabIndex={-1}>Meet your<br />little protector.</h1>
            <Elephant large /><p>Build a life that feels more like yours. One preparation, one choice, one small action at a time.</p>
            <button className="primary" onClick={() => { setStep(0); nav('question'); }}>Let’s begin</button>
            <button className="text-button" onClick={() => nav('account')}>I already have a list</button>
          </section>}
          {page === 'question' && <OnboardingQuestion step={step} draft={draft} values={values(questions[step].id)} note={note} editing={editing}
            onChoose={choose} onNote={setNote} onNext={nextQuestion} onSkip={() => { if (questions[step].kind === 'text') setNote(''); else setAnswer(questions[step].id, []); nextQuestion(); }} />}
          {page === 'interests' && <section>
            <span className="eyebrow">Follow your curiosity</span><h1 tabIndex={-1}>What would you<br />like to build?</h1>
            <p>Choose what would make life on your own feel a little easier.</p>
            <div className="bubbles">{interestEntries.map(([id, label]) => <button key={id} aria-pressed={draft.interests.includes(id)}
              className={draft.interests.includes(id) ? 'selected' : ''} onClick={() => update({ ...draft, interests: draft.interests.includes(id) ? draft.interests.filter(value => value !== id) : [...draft.interests, id] })}>
              {label}{draft.interests.includes(id) ? ' ✓' : ''}</button>)}</div>
            <button className="primary" onClick={() => nav('recap')}>Continue</button>
            <button className="text-button" onClick={() => { update({ ...draft, interests: [] }); nav('recap'); }}>I’ll explore along the way</button>
          </section>}
          {page === 'recap' && <section>
            <span className="eyebrow">Yours to change</span><h1 tabIndex={-1}>A starting point<br />that feels like you.</h1>
            <p>These choices add a little focus. You can always explore something different.</p>
            {draft.answers.hope.length > 0 && <div className="hope-card"><span className="eyebrow">A feeling you’d like to build</span>{draft.answers.hope.map(id => <p key={id}>{labelFor('hope', id)}</p>)}</div>}
            <div className="recap-row"><div><small>What draws you in</small><p>{draft.interests.map(id => interestLabels[id]).join(' · ') || 'Explore along the way'}</p></div><button className="text-button" onClick={() => nav('interests')}>Edit</button></div>
            <details className="answer-review"><summary>Review my answers</summary>{questions.filter(q => !['note', 'feeling'].includes(q.id)).map(q => <div className="recap-row" key={q.id}>
              <div><small>{q.title}</small><p>{values(q.id).map(id => labelFor(q.id, id)).join(' · ') || 'Skipped'}</p></div>
              <button className="text-button" aria-label={`Edit ${q.title}`} onClick={() => { setStep(questions.indexOf(q)); setEditing(true); nav('question'); }}>Edit</button>
            </div>)}</details>
            {canSave ? <button className="primary" onClick={() => void save()}>Save my starting point</button> : <>
              <div className="message">{state.status === 'unconfigured'
                ? 'Your starting point is ready to review. Email sign-in and saving are being connected; these answers are kept only while this page is open.'
                : state.status === 'signed_out' ? 'Sign in to save your starting point.'
                : 'We haven’t confirmed these changes as saved. Your edits stay here while you check your connection.'}</div>
              <button className="primary" onClick={() => nav('welcome')}>Back to the beginning</button>
            </>}
            <p className="hint">Task suggestions and My list will be connected in the next build steps.</p>
          </section>}
          {page === 'account' && <section>
            <span className="eyebrow">Your little corner</span><h1 tabIndex={-1}>Growing<br />together.</h1><Elephant large name={draft.elephantName} />
            {state.status === 'unconfigured' ? <>
              <p>Email sign-in is being connected. You can explore the welcome questions for now.</p><button className="primary" onClick={() => nav('welcome')}>Back to the beginning</button>
            </> : <>
              <p>{state.status === 'signed_out' ? 'You are signed out.' : state.status === 'error' ? 'Your connection needs attention. You can check your saved answers or sign out.' : 'Your starting point is yours to revisit.'}</p>
              <button className="primary" onClick={() => nav(canSave ? 'recap' : 'welcome')}>{canSave ? 'Review my starting point' : 'Back to the beginning'}</button>
              {state.status !== 'signed_out' && <button className="text-button" onClick={() => void session.signOut()}>Sign out</button>}
            </>}
          </section>}
        </fieldset>
      </main>
    </div>
  </>;
}
