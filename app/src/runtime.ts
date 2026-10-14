import { createSafetyClient } from './cloud-api.ts';
import { createProfileSession } from './profile-session.ts';
import { unconfiguredIdentity, type IdentityAdapter } from './identity.ts';

/** Hosting stays same-origin; Step 2 supplies a real identity provider adapter. */
export function createAppRuntime(origin: string, identity: IdentityAdapter = unconfiguredIdentity) {
  const client = createSafetyClient({ baseUrl: origin, getAccessToken: () => identity.getAccessToken() });
  return { profileSession: createProfileSession(client, identity), client };
}
