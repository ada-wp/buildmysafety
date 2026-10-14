import { useEffect, useRef, useState } from 'react';
import type { SafetyClient } from '../cloud-api';
import type { AccountStatus } from '../api-contracts';
import type { ProfileSession } from '../profile-session';
import './privacy.css';

export function PrivacyScreen({ client, session, signedIn, onSignIn, onDeleted, connectionError }: {
  client: SafetyClient; session: ProfileSession; signedIn: boolean; onSignIn?: () => void; onDeleted: () => void;
  connectionError?: string
}) {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState('');
  const [refresh, setRefresh] = useState(0);
  const alive = useRef(true);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; pending.current?.abort(); }; }, []);
  useEffect(() => {
    if (!signedIn) { setAccount(null); return; }
    const controller = new AbortController();
    void client.getAccount({ signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) { setAccount(result); setMessage(''); }
    }).catch(() => { if (!controller.signal.aborted) setMessage('We couldn’t check your account. Try again before making changes.'); });
    return () => controller.abort();
  }, [client, signedIn, refresh]);
  async function download() {
    if (busy) return;
    setBusy(true); setMessage('');
    const controller = new AbortController(); pending.current = controller;
    try {
      const data = await client.exportAccount({ signal: controller.signal });
      if (!alive.current) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url;
      link.download = `my-safety-data-${data.exportedAt.slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Your data file is ready. Check your browser’s downloads. Keep it somewhere private.');
    } catch { if (alive.current) setMessage('We couldn’t prepare your download. Please try again.'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setMessage('Removing your account…');
    try {
      const result = await session.deleteAccount();
      // Session returns null on account-switch races. Success deliberately survives
      // the private-screen remount that cleared all temporary data.
      if (result === 'deleted') {
        onDeleted();
        history.replaceState(null, '', '#/goodbye'); window.dispatchEvent(new PopStateEvent('popstate'));
        await session.signOut();
      }
    } finally { if (alive.current) { setBusy(false); setMessage(''); } }
  }
  return <section className="privacy-screen">
    <span className="eyebrow">Your choices, yours</span><h1 tabIndex={-1}>Your data.<br />Your say.</h1>
    <h2>What we keep</h2>
    <p>We save your preferences, tasks, progress and feedback so you can return to them. Clerk manages your email and sign-in.</p>
    <p>Your optional feelings answer during onboarding stays on that page. If you answer a milestone check-in, we save your latest answer for that topic.</p>
    <h2>When AI helps</h2>
    <p>A request you type for suggestions can go to OpenAI, together with relevant preferences and task history. We don’t send your email or account ID. Please leave out addresses, medical details and other private information.</p>
    <p>We don’t keep the original typed request in app storage, but we save the task it produces. OpenAI may retain data under its own policies; deleting your app account doesn’t instantly erase provider logs.</p>
    <p><a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noreferrer">OpenAI data controls</a></p>
    <h2>You’re in charge</h2>
    <p>You can edit your preferences, turn personalization off or reset learning in Your account. Reset learning keeps your answers, tasks and progress.</p>
    <h2>Download or leave</h2>
    <p>Download your app data as a JSON file before deleting. It includes saved answers, tasks, feedback and progress. Email and sign-in records held by Clerk are outside this app-data export.</p>
    <p>Deletion removes your data from our active app database and asks Clerk to remove your sign-in account. A small record containing your account ID, deletion status and dates stays to block old sessions and handle retries. Database backups may retain older copies for up to 30 days.</p>
    <p className="hint">These controls cover your app account. If you used the website’s separate Safety Scan, its records are not included here.</p>
    {message && <p role="status" className="message">{message}</p>}
    {connectionError && !account?.deletion && <p role="alert" className="message">{connectionError} Check your account status before trying again.</p>}
    {!signedIn ? <p>Sign in to download or delete your app data. {onSignIn && <button className="text-button" onClick={onSignIn}>Sign in with email</button>}</p>
      : account?.deletion ? <div className="message" role="status">
        {account.deletion.status === 'deleted' ? <><p>Your app data and sign-in account have been deleted.</p><button className="secondary" onClick={() => void session.signOut()}>Finish signing out</button></>
          : <><p>Your app data has been removed. Sign-in account deletion hasn’t finished yet. Please retry; you don’t need to start over.</p><button className="secondary" disabled={busy} onClick={() => void remove()}>Retry sign-in deletion</button></>}
      </div> : <>
        <button className="secondary" disabled={busy || !account} onClick={() => void download()}>{busy ? 'Preparing your file…' : 'Download my app data'}</button>
        {!account && <button className="text-button" onClick={() => setRefresh(value => value + 1)}>Check account status</button>}
        {account && !account.deletionAvailable && <p className="hint">Account deletion is temporarily unavailable. No data will be removed until the connection is ready.</p>}
        <button className="text-button danger" disabled={busy || !account?.deletionAvailable} onClick={() => { setConfirm(true); setTyped(''); }}>Delete my account</button>
        {confirm && <div className="message deletion-confirmation"><h2>Delete this account?</h2>
          <p>This permanently removes your saved answers, tasks, progress, feedback and sign-in account. You can’t undo it in the app.</p>
          <label>Type DELETE to confirm<input value={typed} autoComplete="off" onChange={event => setTyped(event.target.value)} /></label>
          <button className="secondary danger" disabled={typed !== 'DELETE' || busy} onClick={() => void remove()}>Permanently delete my account</button>
          <button className="text-button" onClick={() => { setConfirm(false); setTyped(''); }}>Keep my account</button>
        </div>}
      </>}
  </section>;
}
