import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/instrument-serif/latin-400.css';
import App from './App';
import './style.css';
import {createAppRuntime} from './runtime';
const runtime = createAppRuntime(window.location.origin);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
const ClerkApp = lazy(() => import('./ClerkApp'));
createRoot(document.getElementById('root')!).render(<StrictMode>{publishableKey
  ? <Suspense fallback={<p role="status">Getting your sign-in ready…</p>}><ClerkApp publishableKey={publishableKey}/></Suspense>
  : <App session={runtime.profileSession} client={runtime.client}/>}</StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => runtime.profileSession.dispose());
