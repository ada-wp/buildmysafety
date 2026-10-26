/** A provider adapter will implement this in Step 2. No credentials are stored by the app. */
export interface IdentityAdapter {
  readonly configured: boolean;
  getAccessToken(): Promise<string | null>;
  signOut(): Promise<void>;
  subscribe(onChange: () => void): () => void;
}

export const unconfiguredIdentity: IdentityAdapter = {
  configured: false,
  async getAccessToken() { return null; },
  async signOut() {},
  subscribe() { return () => {}; }
};
