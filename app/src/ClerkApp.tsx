import { ClerkFailed, ClerkLoaded, ClerkLoading, ClerkProvider, useClerk, useUser } from '@clerk/react';
import { useEffect, useState } from 'react';
import App from './App';
import { createAppRuntime } from './runtime';
import { createClerkIdentity } from './clerk-identity';

function navigateWithinApp(to: string) {
  const target = new URL(to, window.location.origin);
  if (target.origin !== window.location.origin || target.pathname !== window.location.pathname) {
    throw new Error('Unexpected sign-in destination');
  }
  history.replaceState(null, '', target.pathname + target.hash);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function ReadyApp() {
  const clerk = useClerk();
  const { user } = useUser();
  const [runtime, setRuntime] = useState<ReturnType<typeof createAppRuntime> | null>(null);
  useEffect(() => {
    const identity = createClerkIdentity(clerk);
    const next = createAppRuntime(window.location.origin, identity);
    setRuntime(next);
    return () => { next.profileSession.dispose(); identity.dispose(); };
  }, [clerk]);
  if (!runtime) return <ConnectionMessage />;
  const returnTo = `${window.location.origin}${window.location.pathname}#/recap`;
  return <App session={runtime.profileSession} accountLabel={user?.primaryEmailAddress?.emailAddress}
    providerSignedIn={Boolean(user && clerk.session?.status === 'active')}
    renderSignIn={() => <EmailSignIn returnTo={returnTo} />} />;
}

function EmailSignIn({ returnTo }: { returnTo: string }) {
  const clerk = useClerk();
  // Clerk's modal owns its internal navigation; it cannot collide with our hash routes.
  const open = () => clerk.openSignIn({ withSignUp: true, forceRedirectUrl: returnTo, signUpForceRedirectUrl: returnTo });
  useEffect(() => { open(); return () => clerk.closeSignIn(); }, [clerk, returnTo]);
  return <button className="secondary" onClick={open}>Open email sign-in</button>;
}

function ConnectionMessage({ failed = false }: { failed?: boolean }) {
  return <main className="app-shell connection-screen" role="status">
    <h1>{failed ? 'Let’s try that again.' : 'One moment…'}</h1>
    <p>{failed ? 'Sign-in couldn’t connect. Please reload when your connection is ready.' : 'Getting your sign-in ready.'}</p>
    {failed && <button className="primary" onClick={() => location.reload()}>Try again</button>}
  </main>;
}

export default function ClerkApp({ publishableKey }: { publishableKey: string }) {
  return <ClerkProvider publishableKey={publishableKey} telemetry={false} routerPush={navigateWithinApp} routerReplace={navigateWithinApp}
    appearance={{ variables: { colorPrimary: '#3e5044', colorBackground: '#faf7f2',
      fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '1rem' } }}>
    <ClerkLoading><ConnectionMessage /></ClerkLoading>
    <ClerkFailed><ConnectionMessage failed /></ClerkFailed>
    <ClerkLoaded><ReadyApp /></ClerkLoaded>
  </ClerkProvider>;
}
