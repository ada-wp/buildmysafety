import { useEffect, useState, useSyncExternalStore } from 'react';
import type { SafetyClient } from './cloud-api';
import { createProgressSession } from './progress-session';

export function useCategoryProgress(client: SafetyClient, taskVersion: string | undefined) {
  const [session] = useState(() => createProgressSession(client));
  const state = useSyncExternalStore(session.subscribe, session.getState);
  useEffect(() => { session.connect(); return () => session.dispose(); }, [session]);
  useEffect(() => { if (taskVersion) void session.reload(); }, [session, taskVersion]);
  return { ...state, reload: session.reload, acknowledge: session.acknowledge, checkIn: session.checkIn };
}
