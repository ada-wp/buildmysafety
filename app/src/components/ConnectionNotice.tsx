import { useEffect, useState } from 'react';

/** A connectivity hint, never evidence that a write succeeded or permission to replay it. */
export function ConnectionNotice() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online ? null : <p role="status" className="message">You’re offline. What’s already on screen is still here. Reconnect and check saved progress before trying a change again.</p>;
}
