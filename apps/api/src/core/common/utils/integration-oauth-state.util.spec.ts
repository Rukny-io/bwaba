import {
  integrationOAuthStateLegacyAllowed,
  parseLegacyIntegrationOAuthState,
  signIntegrationOAuthState,
  verifyIntegrationOAuthState,
} from './integration-oauth-state.util';

const SECRET = 'test-secret-at-least-32-characters-long';

describe('integration-oauth-state.util', () => {
  it('signs and verifies payload', () => {
    const state = signIntegrationOAuthState({ userId: 'u1' }, SECRET);
    const payload = verifyIntegrationOAuthState<{ userId: string }>(
      state,
      SECRET,
    );
    expect(payload?.userId).toBe('u1');
  });

  it('rejects tampered state', () => {
    const state = signIntegrationOAuthState({ userId: 'u1' }, SECRET);
    const dot = state.lastIndexOf('.');
    const tampered = `${state.slice(0, dot - 1)}X${state.slice(dot)}`;
    expect(verifyIntegrationOAuthState(tampered, SECRET)).toBeNull();
  });

  it('rejects wrong secret', () => {
    const state = signIntegrationOAuthState({ userId: 'u1' }, SECRET);
    expect(verifyIntegrationOAuthState(state, 'other-secret-wrong')).toBeNull();
  });

  it('parses legacy base64 JSON', () => {
    const legacy = Buffer.from(JSON.stringify({ userId: 'legacy' })).toString(
      'base64',
    );
    expect(parseLegacyIntegrationOAuthState(legacy)).toEqual({
      userId: 'legacy',
    });
  });

  it('legacy mode flag is off in production by default', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.INTEGRATION_OAUTH_STATE_LEGACY;
    expect(integrationOAuthStateLegacyAllowed()).toBe(false);
    process.env.NODE_ENV = prev;
  });
});
