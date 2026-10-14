/** Public routes only: never preserve answers, external destinations or query strings. */
export function publicReturn(hash: string, fallback = '#/welcome'): string {
  return /^#\/(?:welcome|account|privacy|recap|interests|pause|question\/[a-z_]+|app\/(?:explore|list|earlier|(?:concerns|ideas)\/sick_care|(?:topic|task|complete|refine)\/[a-z0-9_-]{1,100}))$/.test(hash)
    ? hash : fallback;
}
export function signInDestination(hash: string, hasDraft: boolean): string {
  return hasDraft ? '#/recap' : publicReturn(hash, '#/account');
}
export function accountBack(hash: string, hasProfile: boolean): string {
  const fallback = hasProfile ? '#/app/explore' : '#/welcome';
  return ['#/account', '#/privacy'].includes(hash) ? fallback : publicReturn(hash, fallback);
}
export function accountIsLeaving(code?: string): boolean {
  return code === 'account_deleted' || code === 'account_deletion_pending';
}
