import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Elephant } from './components/Elephant';
import { OnboardingQuestion } from './components/OnboardingQuestion';
import { ElephantMessage } from './components/ElephantMessage';
import { acknowledgementMessage, startingPointMessage } from './elephant-messages';
import { emptyDraft, editableProfile, type ProfileDraft } from './profile-draft';
import type { ProfileSession, ProfileSessionState } from './profile-session';
import { questions, questionStep } from './onboarding';
import { interestEntries } from './interest-labels';
import { createSignInHandoff } from './sign-in-handoff';
import { TaskJourney } from './components/TaskJourney';
import { PrivacyScreen } from './components/PrivacyScreen';
import { ConnectionNotice } from './components/ConnectionNotice';
import type { SafetyClient } from './cloud-api';
import type { OnboardingResponse } from './api-contracts';
import { accountBack, accountIsLeaving, signInDestination } from './navigation';

type Page = 'welcome' | 'question' | 'pause' | 'interests' | 'recap' | 'app' | 'account' | 'privacy' | 'goodbye';
const pages: Page[] = ['welcome', 'question', 'pause', 'interests', 'recap', 'app', 'account', 'privacy', 'goodbye'];
const feelingStep = questions.findIndex(question => question.id === 'feeling');

/** An API rejection clears app data, but does not revoke the provider's session. */
export function accountControls(status: ProfileSessionState['status'], providerSignedIn: boolean) {
  return {
    canSignIn: status === 'signed_out' && !providerSignedIn,
    canSignOut: providerSignedIn || !['signed_out', 'unconfigured'].includes(status),
    needsReconnection: status === 'signed_out' && providerSignedIn
  };
}

export default function App({ session, client, renderSignIn, accountLabel, providerSignedIn = false }: {
  session: ProfileSession; client: SafetyClient; renderSignIn?: (returnHash: string) => ReactNode; accountLabel?: string; providerSignedIn?: boolean
}) {
  const state = useSyncExternalStore(session.subscribe, session.getState);
  const controls = accountControls(state.status, providerSignedIn);
  const handoff = useRef(createSignInHandoff());
  const signInEpoch = useRef<number | null>(null);
  const signInReturn = useRef('#/account');
  const [signingIn, setSigningIn] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  useEffect(() => { void session.load(); }, [session]);
  useEffect(() => {
    if (signingIn && signInEpoch.current !== null && state.identityEpoch > signInEpoch.current && !state.busy) {
      // Expose storage/auth errors as well as success; never trap a signed-in user in the login form.
      history.replaceState(null, '', signInReturn.current);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setSigningIn(false);
      signInEpoch.current = null;
    }
    if (!signingIn && state.status === 'signed_out') handoff.current.clear();
  }, [state.status, state.identityEpoch, state.busy, signingIn]);
  function beginSignIn(draft?: ProfileDraft) {
    if (!renderSignIn || !controls.canSignIn) return;
    setDeletionConfirmed(false);
    signInReturn.current = signInDestination(location.hash, Boolean(draft));
    if (draft) handoff.current.begin(draft, state.identityEpoch); else handoff.current.clear();
    signInEpoch.current = state.identityEpoch;
    setSigningIn(true);
  }
  return <>
    <div hidden={signingIn}>
      <ProfileScreens key={state.identityEpoch} session={session} client={client} state={state}
        initialDraft={handoff.current.peek(state.identityEpoch)} onSignIn={renderSignIn ? beginSignIn : undefined}
        accountLabel={accountLabel} providerSignedIn={providerSignedIn}
        deletionConfirmed={deletionConfirmed} onDeleted={() => setDeletionConfirmed(true)} />
    </div>
    {signingIn && <div className="app-shell sign-in-screen"><h1>Keep your<br />little wins.</h1>
      <p>A code in your inbox. A place for your progress.</p>
      {renderSignIn?.(signInReturn.current)}
      <button className="text-button" onClick={() => {
        handoff.current.clear(); signInEpoch.current = null;
        history.replaceState(null, '', signInReturn.current);
        window.dispatchEvent(new PopStateEvent('popstate')); setSigningIn(false);
      }}>{signInReturn.current === '#/recap' ? 'Back to my answers' : 'Back'}</button>
      <p className="hint">Your email is used for sign-in. Your profile and task choices are stored separately in My Safety.</p>
    </div>}
  </>;
}

function ProfileScreens({ session, client, state, initialDraft, onSignIn, accountLabel, providerSignedIn, deletionConfirmed, onDeleted }: {
  session: ProfileSession; client: SafetyClient; state: ProfileSessionState; initialDraft: ProfileDraft | null;
  onSignIn?: (draft?: ProfileDraft) => void; accountLabel?: string; providerSignedIn: boolean;
  deletionConfirmed: boolean; onDeleted: () => void
}) {
  const [page, setPage] = useState<Page>('welcome');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(() => initialDraft || emptyDraft());
  const [dirty, setDirty] = useState(Boolean(initialDraft));
  const [feeling, setFeeling] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [appEntered, setAppEntered] = useState(false);
  const accountReturn = useRef('');
  const interestReturn = useRef<{ page: Page; step: number }>({ page: 'question', step: questions.length - 1 });
  const [notice, setNotice] = useState(initialDraft ? 'Your choices came with you. Review them before saving; your previous saved answers have not been replaced.' : '');
  const main = useRef<HTMLElement>(null);
  const progress = useRef<OnboardingResponse | null>(null);
  const [checkpointBusy, setCheckpointBusy] = useState(false);
  const [checkpointError, setCheckpointError] = useState('');
  const [checkpointReady, setCheckpointReady] = useState(false);
  const [checkpointRetry, setCheckpointRetry] = useState(0);
  const alive = useRef(true);
  const pendingCheckpoint = useRef<AbortController | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; pendingCheckpoint.current?.abort(); }; }, []);
  useEffect(() => {
    if (!['ready', 'new'].includes(state.status) || progress.current) return;
    const abort = new AbortController();
    void client.getOnboarding({ signal: abort.signal }).then(saved => {
      if (abort.signal.aborted || !alive.current) return;
      progress.current = saved; setCheckpointReady(true); setCheckpointError('');
      if (initialDraft) return;
      if (saved.progress?.draft && !saved.progress.completedAt) {
        setDraft(saved.progress.draft as ProfileDraft); setDirty(true);
        if (!['#/account', '#/privacy', '#/goodbye'].includes(location.hash)) {
          history.replaceState(null, '', `#/${saved.progress.checkpoint}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        setNotice('Welcome back. Let’s pick up where you left off.');
      } else if ((saved.legacyComplete || saved.progress?.completedAt) && !location.hash.startsWith('#/app/') && !['#/account', '#/privacy', '#/goodbye'].includes(location.hash)) {
        enterApp();
      }
    }).catch(() => { if (!abort.signal.aborted && alive.current) setCheckpointError('We couldn’t load your onboarding progress. Try connecting again before saving changes.'); });
    return () => abort.abort();
  }, [state.status, client, initialDraft, checkpointRetry]);

  useEffect(() => {
    if (state.snapshot && !dirty) setDraft(editableProfile(state.snapshot.profile));
  }, [state.snapshot, dirty]);
  useEffect(() => {
    if (accountIsLeaving(state.error?.code) && !['#/privacy', '#/goodbye'].includes(location.hash)) {
      history.replaceState(null, '', '#/privacy');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [state.error]);
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
      if (['account', 'privacy'].includes(value) && typeof history.state?.accountReturn === 'string')
        accountReturn.current = history.state.accountReturn;
      setEditing(['question', 'interests'].includes(value) && savedNavigation?.editing === true);
      const returnTo = savedNavigation?.interestReturn;
      interestReturn.current = returnTo && pages.includes(returnTo.page) &&
        Number.isInteger(returnTo.step) && returnTo.step >= 0 && returnTo.step < questions.length
        ? { page: returnTo.page, step: returnTo.step }
        : { page: 'question', step: questions.length - 1 };
      if (value === 'question') {
        if (['country', 'note'].includes(questionId)) {
          history.replaceState(history.state, '', '#/interests');
          setPage('interests');
          return;
        }
        const restoredStep = questionStep(questionId);
        setStep(restoredStep >= 0 ? restoredStep : 0);
      }
    };
    restore();
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, []);

  async function nav(next: Page, nextStep = step, editMode = false, nextDraft = draft) {
    if (state.busy || checkpointBusy) return;
    const startingHash = location.hash;
    if (['question', 'pause', 'interests', 'recap'].includes(next) && ['ready', 'new'].includes(state.status)) {
      if (!checkpointReady) { setCheckpointError('Please reconnect your saved progress before continuing.'); return; }
      setCheckpointBusy(true); setCheckpointError('');
      const abort = new AbortController(); pendingCheckpoint.current = abort;
      try {
        const result = await client.saveOnboarding({ expectedRevision: progress.current?.progress?.revision ?? 0,
          draft: nextDraft, checkpoint: next === 'question' ? `question/${questions[nextStep].id}` : next }, false, { signal: abort.signal });
        if (!alive.current) return;
        progress.current = result;
        if (location.hash !== startingHash) return;
      } catch { if (alive.current) setCheckpointError('We couldn’t confirm that save. Your choices are still here. Check saved progress before continuing.'); return; }
      finally { if (alive.current) setCheckpointBusy(false); }
    }
    if (next === 'account' && !['account', 'privacy', 'goodbye'].includes(page)) accountReturn.current = location.hash || '#/welcome';
    if (next === 'app') setAppEntered(true);
    setPage(next);
    setEditing(editMode);
    if (next === 'question') setStep(nextStep);
    // Only public question IDs enter the URL. Browser Back restores the question,
    // without putting any answers in history or claiming cloud draft recovery.
    history.pushState({ accountReturn: accountBack(accountReturn.current, Boolean(state.snapshot)), onboarding: { editing: editMode, interestReturn: { ...interestReturn.current } } }, '',
      `#/${next}${next === 'question' ? `/${questions[nextStep].id}` : next === 'app' ? '/list' : ''}`);
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
    if (key === 'feeling') { setFeeling(next.filter(value => value !== 'private')); return draft; }
    if (!Object.hasOwn(draft.answers, key)) return draft;
    const q = questions.find(question => question.id === key)!;
    // Choice IDs come from the established question set. The API is authoritative on validation.
    const nextDraft = { ...draft, answers: { ...draft.answers, [key]: q.multi ? next : next[0] === 'private' ? null : next[0] || null } };
    update(nextDraft); return nextDraft;
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
  function nextQuestion(nextDraft = draft) {
    if (editing) void nav('recap', step, false, nextDraft);
    else if (step === feelingStep) void nav('pause', step, false, nextDraft);
    else if (step < questions.length - 1) void nav('question', step + 1, false, nextDraft);
    else { interestReturn.current = { page, step }; void nav('interests', step, false, nextDraft); }
  }
  function back() {
    if (page === 'question' && editing) nav('recap');
    else if (page === 'pause') nav('question', feelingStep);
    else if (page === 'question' && step === feelingStep + 1) nav('pause');
    else if (page === 'question' && step > 0) nav('question', step - 1);
    else if (page === 'interests' && editing) nav('recap');
    else if (page === 'interests') nav(interestReturn.current.page, interestReturn.current.step);
    else if (page === 'recap') nav('interests');
    else if (page === 'privacy') nav('account');
    else if (page === 'account') {
      history.pushState(null, '', accountBack(accountReturn.current, Boolean(state.snapshot)));
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    else nav('welcome');
  }
  async function continueToApp() {
    if (!checkpointReady || checkpointBusy || !['ready', 'new'].includes(state.status)) return;
    setCheckpointBusy(true); setCheckpointError('');
    const abort = new AbortController(); pendingCheckpoint.current = abort;
    try {
      const result = await client.saveOnboarding({ expectedRevision: progress.current?.progress?.revision ?? 0,
        expectedProfileRevision: state.snapshot?.profile.revision ?? 0, draft, checkpoint: 'complete' }, true, { signal: abort.signal });
      if (!alive.current) return;
      progress.current = result;
      if (await session.load()) { setDirty(false); setNotice(''); enterApp(); }
    } catch { if (alive.current) setCheckpointError('We couldn’t confirm your starting point was saved. Check saved progress before trying again.'); }
    finally { if (alive.current) setCheckpointBusy(false); }
  }
  function enterApp() {
    // Continue completes this transition instead of stacking another question page.
    history.replaceState(null, '', '#/app/list');
    setAppEntered(true); setPage('app');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  const canSave = state.status === 'new' || state.status === 'ready';
  const controls = accountControls(state.status, providerSignedIn);

  return <>
    <aside className="build-status">Early access{state.busy || checkpointBusy ? ' · Updating your progress…' : state.status === 'error' ? ' · Please check your connection' : ''}</aside>
    <div className="app-shell">
      <header className="topbar">
        {page === 'welcome' || page === 'app' ? <span className="wordmark">my safety</span> : <button className="back" disabled={state.busy || checkpointBusy} onClick={back}><span aria-hidden>‹</span> Back</button>}
        <button className="pet-button" disabled={state.busy || checkpointBusy} aria-label="Your account" onClick={() => nav('account')}><Elephant name={draft.elephantName} /></button>
      </header>
      <main ref={main} aria-busy={state.busy}>
        <ConnectionNotice />
        {state.error && page !== 'privacy' && page !== 'goodbye' && <div role="alert" className="message error">
          {state.error.conflict ? 'Your saved answers changed elsewhere. Your edits are still here. Load the latest version before reviewing and saving again.' : state.error.message}
          <button className="text-button" disabled={state.busy} onClick={() => { setNotice('Your unsaved choices stay here while we check the saved version.'); void session.load(); }}>Check saved answers</button>
        </div>}
        {notice && <div role="status" className="message">{notice}</div>}
        {checkpointError && <div className="message error" role="alert"><p>{checkpointError}</p><p>This restores your last saved choices. Unsaved edits on this page will be replaced.</p><button className="text-button" disabled={checkpointBusy} onClick={() => {
          progress.current = null; setCheckpointReady(false); setCheckpointRetry(value => value + 1);
          void session.load();
        }}>Load saved progress</button></div>}
        {state.snapshot && dirty && <button className="text-button" disabled={state.busy} onClick={() => { setDirty(false); setNotice('Showing your last saved answers.'); }}>Use my last saved answers</button>}
        <fieldset className="screen-fields" disabled={state.busy || checkpointBusy || (canSave && !checkpointReady && ['question', 'pause', 'interests', 'recap'].includes(page))}>
          {page === 'privacy' && <PrivacyScreen client={client} session={session} signedIn={providerSignedIn} onDeleted={onDeleted} connectionError={state.error?.message}
            onSignIn={controls.canSignIn && onSignIn ? () => onSignIn() : undefined} />}
          {page === 'goodbye' && <section><h1 tabIndex={-1}>{deletionConfirmed ? <>Your account<br />is deleted.</> : <>Your little<br />corner.</>}</h1><p>{deletionConfirmed ? 'Your app data has been removed and your sign-in account deleted. Thank you for spending a little time here.' : 'Visit Your account to check your sign-in and data controls.'}</p>
            <button className="primary" onClick={() => nav('welcome')}>Back to welcome</button>
            {providerSignedIn && <button className="text-button" onClick={() => void session.signOut()}>Finish signing out</button>}</section>}
          {page === 'welcome' && <section className="welcome">
            <span className="eyebrow">A little more “I can handle this.”</span><h1 tabIndex={-1}>Meet your<br />protector.</h1>
            <Elephant large /><p>Build a life that feels more like yours. One preparation, one choice, one small action at a time.</p>
            <button className="primary" onClick={() => nav('question', 0)}>Let’s begin</button>
            <button className="text-button" onClick={() => openInterests()}>I’ll pick a topic instead</button>
            <button className="text-button" onClick={() => nav('account')}>I already have a list</button>
          </section>}
          {page === 'question' && <OnboardingQuestion step={step} draft={draft} values={values(questions[step].id)} editing={editing}
            onChoose={choose} onNext={() => nextQuestion()} onPickTopic={() => openInterests()}
            onSkip={() => nextQuestion(setAnswer(questions[step].id, []))} />}
          {page === 'question' && <p className="hint">{canSave ? 'Continue saves your choices to your account.' : 'Your choices stay in this page until you sign in.'}</p>}
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
            <button className="text-button" onClick={() => { const nextDraft = { ...draft, interests: [] }; update(nextDraft); void nav('recap', step, false, nextDraft); }}>I’ll explore along the way</button>
          </section>}
          {page === 'recap' && <section className="companion-recap">
            <ElephantMessage compact name={draft.elephantName} message={startingPointMessage(draft)} />
            <p className="hint recap-intro">You can change direction whenever you like.</p>
            {canSave ? <button className="primary" disabled={!checkpointReady} onClick={() => void continueToApp()}>Continue</button> : <>
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
          {appEntered && state.status === 'ready' && <section hidden={page !== 'app'}>
            <TaskJourney key={state.snapshot!.profile.revision} draft={editableProfile(state.snapshot!.profile)} client={client} active={page === 'app'} onIdentityError={() => void session.load()} />
          </section>}
          {page === 'app' && state.status !== 'ready' && <section><h1 tabIndex={-1}>Your next step<br />has a place here.</h1><p>Sign in and save your starting point to open your tasks.</p><button className="primary" onClick={() => nav('recap')}>Continue with my account</button></section>}
          {page === 'account' && <section>
            <span className="eyebrow">Your little corner</span><h1 tabIndex={-1}>Growing<br />together.</h1><Elephant large name={draft.elephantName} />
            <button className="text-button" onClick={() => nav('privacy')}>Privacy &amp; my data</button>
            {state.status === 'unconfigured' ? <>
              <p>Email sign-in is being connected. You can explore the welcome questions for now.</p><button className="primary" onClick={() => nav('welcome')}>Back to the beginning</button>
            </> : <>
              <p>{controls.needsReconnection ? 'You’re signed in, but we couldn’t verify your connection. Check your saved answers, or sign out and try again.'
                : state.status === 'signed_out' ? 'You are signed out.' : state.status === 'error' ? 'Your connection needs attention. You can check your saved answers or sign out.' : 'Your starting point is yours to revisit.'}</p>
              {providerSignedIn && accountLabel && <p className="hint">Signed in as {accountLabel}</p>}
              <button className="primary" onClick={() => nav(state.status === 'ready' ? 'app' : state.status === 'new' ? 'recap' : 'welcome')}>{state.status === 'ready' ? 'Back to my list' : state.status === 'new' ? 'Save my starting point' : 'Back to the beginning'}</button>
              {canSave && <button className="text-button" onClick={() => nav('question', 0)}>Update my preferences</button>}
              {state.status === 'ready' && state.snapshot && <div className="learning-controls">
                <label className="setting"><span>Personalize future suggestions</span>
                  <input type="checkbox" checked={state.snapshot.profile.personalizationEnabled} onChange={async e => {
                    const enabled = e.target.checked;
                    if (await session.setPersonalization(enabled)) {
                      setDraft(value => ({ ...value, personalizationEnabled: enabled }));
                      setNotice(enabled ? 'Personalization is on. Your current request still comes first.' : 'Personalization is off. Past task choices won’t guide new suggestions.');
                    }
                  }} /></label>
                <p className="hint">Use your preferences and past choices to make future ideas more useful. What you ask for today comes first.</p>
                <button className="text-button" onClick={() => setConfirmReset(value => !value)}>Reset learning</button>
                {confirmReset && <div className="message"><p>Stop using past likes, feedback and saved choices to shape new ideas. Your answers, tasks and progress stay.</p>
                  <button className="secondary" onClick={async () => { if (await session.resetLearning()) {
                    setConfirmReset(false); setNotice('Learning reset. Your answers, tasks and progress are still here.');
                  } }}>Reset my learning</button>
                  <button className="text-button" onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>}
              </div>}
              {controls.canSignIn && onSignIn && <button className="secondary" onClick={() => onSignIn()}>Sign in with email</button>}
              {controls.canSignOut && <button className="text-button" onClick={() => void session.signOut()}>Sign out</button>}
            </>}
          </section>}
        </fieldset>
      </main>
    </div>
  </>;
}
