import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Elephant } from './components/Elephant';
import { OnboardingQuestion } from './components/OnboardingQuestion';
import { ElephantMessage } from './components/ElephantMessage';
import { acknowledgementMessage, startingPointMessage } from './elephant-messages';
import { emptyDraft, editableProfile, type ProfileDraft } from './profile-draft';
import type { ProfileSession, ProfileSessionState } from './profile-session';
import { questions } from './onboarding';
import { interestEntries } from './interest-labels';
import { createSignInHandoff } from './sign-in-handoff';
import { TaskJourneyPreview } from './components/TaskJourneyPreview';

type Page = 'welcome' | 'question' | 'pause' | 'interests' | 'recap' | 'app' | 'account';
const pages: Page[] = ['welcome', 'question', 'pause', 'interests', 'recap', 'app', 'account'];
const feelingStep = questions.findIndex(question => question.id === 'feeling');

/** An API rejection clears app data, but does not revoke the provider's session. */
export function accountControls(status: ProfileSessionState['status'], providerSignedIn: boolean) {
  return {
    canSignIn: status === 'signed_out' && !providerSignedIn,
    canSignOut: providerSignedIn || !['signed_out', 'unconfigured'].includes(status),
    needsReconnection: status === 'signed_out' && providerSignedIn
  };
}

export default function App({ session, renderSignIn, accountLabel, providerSignedIn = false }: {
  session: ProfileSession; renderSignIn?: () => ReactNode; accountLabel?: string; providerSignedIn?: boolean
}) {
  const state = useSyncExternalStore(session.subscribe, session.getState);
  const controls = accountControls(state.status, providerSignedIn);
  const handoff = useRef(createSignInHandoff());
  const signInEpoch = useRef<number | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  useEffect(() => { void session.load(); }, [session]);
  useEffect(() => {
    if (signingIn && signInEpoch.current !== null && state.identityEpoch > signInEpoch.current && !state.busy) {
      // Expose storage/auth errors as well as success; never trap a signed-in user in the login form.
      history.replaceState(null, '', `${location.pathname}#/recap`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setSigningIn(false);
      signInEpoch.current = null;
    }
    if (!signingIn && state.status === 'signed_out') handoff.current.clear();
  }, [state.status, state.identityEpoch, state.busy, signingIn]);
  function beginSignIn(draft?: ProfileDraft) {
    if (!renderSignIn || !controls.canSignIn) return;
    if (draft) handoff.current.begin(draft, state.identityEpoch); else handoff.current.clear();
    signInEpoch.current = state.identityEpoch;
    setSigningIn(true);
  }
  return <>
    <div hidden={signingIn}>
      <ProfileScreens key={state.identityEpoch} session={session} state={state}
        initialDraft={handoff.current.peek(state.identityEpoch)} onSignIn={renderSignIn ? beginSignIn : undefined}
        accountLabel={accountLabel} providerSignedIn={providerSignedIn} />
    </div>
    {signingIn && <div className="app-shell sign-in-screen"><h1>Keep your<br />little wins.</h1>
      <p>A code in your inbox. A place for your progress.</p>
      {renderSignIn?.()}
      <button className="text-button" onClick={() => {
        handoff.current.clear(); signInEpoch.current = null;
        history.replaceState(null, '', `${location.pathname}#/recap`);
        window.dispatchEvent(new PopStateEvent('popstate')); setSigningIn(false);
      }}>Back to my answers</button>
      <p className="hint">Your email is used for sign-in. Your profile and task choices are stored separately in My Safety.</p>
    </div>}
  </>;
}

function ProfileScreens({ session, state, initialDraft, onSignIn, accountLabel, providerSignedIn }: {
  session: ProfileSession; state: ProfileSessionState; initialDraft: ProfileDraft | null;
  onSignIn?: (draft?: ProfileDraft) => void; accountLabel?: string; providerSignedIn: boolean
}) {
  const [page, setPage] = useState<Page>('welcome');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(() => initialDraft || emptyDraft());
  const [dirty, setDirty] = useState(Boolean(initialDraft));
  const [note, setNote] = useState('');
  const [feeling, setFeeling] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [appEntered, setAppEntered] = useState(false);
  const accountReturn = useRef('#/welcome');
  const interestReturn = useRef<{ page: Page; step: number }>({ page: 'question', step: questions.length - 1 });
  const [notice, setNotice] = useState(initialDraft ? 'Your choices came with you. Review them before saving; your previous saved answers have not been replaced.' : '');
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state.snapshot && !dirty) setDraft(editableProfile(state.snapshot.profile));
  }, [state.snapshot, dirty]);
  useEffect(() => {
    [...(main.current?.querySelectorAll('h1') || [])].find(heading => !heading.closest('[hidden]'))?.focus();
    window.scrollTo(0, 0);
  }, [page, step]);
  useEffect(() => {
    const restore = () => {
      const [rawPage, questionId] = location.hash.slice(2).split('/');
      // Retire the dead-end topic URL as well as its UI. Old bookmarks move forward.
      const value = (rawPage === 'topics' ? 'app' : rawPage) as Page;
      if (rawPage === 'topics') history.replaceState(null, '', '#/app/explore');
      setPage(pages.includes(value) ? value : 'welcome');
      if (value === 'app') setAppEntered(true);
      const savedNavigation = history.state?.onboarding;
      setEditing(['question', 'interests'].includes(value) && savedNavigation?.editing === true);
      const returnTo = savedNavigation?.interestReturn;
      interestReturn.current = returnTo && pages.includes(returnTo.page) &&
        Number.isInteger(returnTo.step) && returnTo.step >= 0 && returnTo.step < questions.length
        ? { page: returnTo.page, step: returnTo.step }
        : { page: 'question', step: questions.length - 1 };
      if (value === 'question') {
        const restoredStep = questions.findIndex(question => question.id === questionId);
        setStep(restoredStep >= 0 ? restoredStep : 0);
      }
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  function nav(next: Page, nextStep = step, editMode = false) {
    if (state.busy) return;
    if (next === 'account' && page !== 'account') accountReturn.current = location.hash || '#/welcome';
    if (next === 'app') setAppEntered(true);
    setPage(next);
    setEditing(editMode);
    if (next === 'question') setStep(nextStep);
    // Only public question IDs enter the URL. Browser Back restores the question,
    // without putting any answers in history or claiming cloud draft recovery.
    history.pushState({ onboarding: { editing: editMode, interestReturn: { ...interestReturn.current } } }, '',
      `#/${next}${next === 'question' ? `/${questions[nextStep].id}` : next === 'app' ? '/explore' : ''}`);
    if (next === 'app') window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function openInterests(editMode = false) {
    if (!editMode) interestReturn.current = { page, step };
    nav('interests', step, editMode);
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
    if (editing) nav('recap');
    else if (step === feelingStep) nav('pause');
    else if (step < questions.length - 1) nav('question', step + 1);
    else openInterests();
  }
  function back() {
    if (page === 'question' && editing) nav('recap');
    else if (page === 'pause') nav('question', feelingStep);
    else if (page === 'question' && step === feelingStep + 1) nav('pause');
    else if (page === 'question' && step > 0) nav('question', step - 1);
    else if (page === 'interests' && editing) nav('recap');
    else if (page === 'interests') nav(interestReturn.current.page, interestReturn.current.step);
    else if (page === 'recap') nav('interests');
    else if (page === 'account') {
      history.pushState(null, '', accountReturn.current);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    else nav('welcome');
  }
  async function continueToApp() {
    if (state.status === 'unconfigured') { enterApp(); return; }
    if (await session.save(structuredClone(draft))) {
      setDirty(false); setNotice(''); enterApp();
    }
  }
  function enterApp() {
    // Continue completes this transition instead of stacking another question page.
    history.replaceState(null, '', '#/app/explore');
    setAppEntered(true); setPage('app');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  const canSave = state.status === 'new' || state.status === 'ready';
  const controls = accountControls(state.status, providerSignedIn);

  return <>
    <aside className="build-status">Early app preview · {state.status === 'unconfigured' ? 'email sign-in and cloud saving are not available yet' : state.busy ? 'Connecting…' : 'your profile, at your pace'}</aside>
    <div className="app-shell">
      <header className="topbar">
        {page === 'welcome' || page === 'app' ? <span className="wordmark">my safety</span> : <button className="back" disabled={state.busy} onClick={back}><span aria-hidden>‹</span> Back</button>}
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
            <button className="primary" onClick={() => nav('question', 0)}>Let’s begin</button>
            <button className="text-button" onClick={() => openInterests()}>I’ll pick a topic instead</button>
            <button className="text-button" onClick={() => nav('account')}>I already have a list</button>
          </section>}
          {page === 'question' && <OnboardingQuestion step={step} draft={draft} values={values(questions[step].id)} note={note} editing={editing}
            onChoose={choose} onNote={setNote} onNext={nextQuestion} onPickTopic={() => openInterests()}
            onSkip={() => { if (questions[step].kind === 'text') setNote(''); else setAnswer(questions[step].id, []); nextQuestion(); }} />}
          {page === 'pause' && <section className="companion-pause">
            <ElephantMessage name={draft.elephantName} message={acknowledgementMessage({
              why: draft.answers.why, difficulty: draft.answers.difficulty, feeling: feeling[0] ?? null
            })} />
            <button className="primary" onClick={() => nav('question', feelingStep + 1)}>Continue</button>
            <button className="text-button" onClick={() => openInterests()}>I’ll pick a topic instead</button>
          </section>}
          {page === 'interests' && <section>
            <span className="eyebrow">Follow your curiosity</span><h1 tabIndex={-1}>What would you<br />like to build?</h1>
            <p>Choose what would make life on your own feel a little easier.</p>
            <div className="bubbles">{interestEntries.map(([id, label]) => <button key={id} aria-pressed={draft.interests.includes(id)}
              className={draft.interests.includes(id) ? 'selected' : ''} onClick={() => update({ ...draft, interests: draft.interests.includes(id) ? draft.interests.filter(value => value !== id) : [...draft.interests, id] })}>
              {label}{draft.interests.includes(id) ? ' ✓' : ''}</button>)}</div>
            <button className="primary" onClick={() => nav('recap')}>Continue</button>
            <button className="text-button" onClick={() => { update({ ...draft, interests: [] }); nav('recap'); }}>I’ll explore along the way</button>
          </section>}
          {page === 'recap' && <section className="companion-recap">
            <ElephantMessage compact name={draft.elephantName} message={startingPointMessage(draft)} />
            <p className="hint recap-intro">You can change direction whenever you like.</p>
            {canSave || state.status === 'unconfigured' ? <button className="primary" onClick={() => void continueToApp()}>Continue</button> : <>
              <div className="message">{controls.needsReconnection ? 'Your sign-in needs to reconnect before you can save. Check your saved answers, or sign out and try again.'
                : state.status === 'signed_out' ? 'Sign in to save your starting point.'
                : 'We haven’t confirmed these changes as saved. Your edits stay here while you check your connection.'}</div>
              {controls.canSignIn && onSignIn
                ? <button className="primary" onClick={() => onSignIn(draft)}>Continue with email</button>
                : controls.needsReconnection ? <button className="primary" onClick={() => nav('account')}>Go to my account</button>
                : <button className="primary" onClick={() => void session.load()}>Try connecting again</button>}
            </>}
            {canSave && <p className="hint">Continue saves your choices to your account.</p>}
          </section>}
          {appEntered && <section hidden={page !== 'app'}>
            <TaskJourneyPreview draft={draft} />
          </section>}
          {page === 'account' && <section>
            <span className="eyebrow">Your little corner</span><h1 tabIndex={-1}>Growing<br />together.</h1><Elephant large name={draft.elephantName} />
            {state.status === 'unconfigured' ? <>
              <p>Email sign-in is being connected. You can explore the welcome questions for now.</p><button className="primary" onClick={() => nav('welcome')}>Back to the beginning</button>
            </> : <>
              <p>{controls.needsReconnection ? 'You’re signed in, but we couldn’t verify your connection. Check your saved answers, or sign out and try again.'
                : state.status === 'signed_out' ? 'You are signed out.' : state.status === 'error' ? 'Your connection needs attention. You can check your saved answers or sign out.' : 'Your starting point is yours to revisit.'}</p>
              {providerSignedIn && accountLabel && <p className="hint">Signed in as {accountLabel}</p>}
              <button className="primary" onClick={() => nav(canSave ? 'app' : 'welcome')}>{canSave ? 'Explore topics' : 'Back to the beginning'}</button>
              {canSave && <button className="text-button" onClick={() => nav('question', 0)}>Update my preferences</button>}
              {controls.canSignIn && onSignIn && <button className="secondary" onClick={() => onSignIn()}>Sign in with email</button>}
              {controls.canSignOut && <button className="text-button" onClick={() => void session.signOut()}>Sign out</button>}
            </>}
          </section>}
        </fieldset>
      </main>
    </div>
  </>;
}
