jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));
jest.mock('../../auth/redis-oauth-code.service', () => ({ RedisOAuthCodeService: class {} }));
jest.mock('../mail-members.service', () => ({ MailMembersService: class {} }));

import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { MailSsoOidcService } from './mail-sso-oidc.service';
import { __resetOidcCachesForTests } from './mail-oidc.client';
import { encryptMailSsoSecret } from './mail-sso-secret.util';

const ISSUER = 'https://idp.example.test';
const CLIENT_ID = 'client-123';
const DOMAIN = 'acme.com';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', use: 'sig', alg: 'RS256' };

function signIdToken(claims: Record<string, unknown>, opts: { key?: typeof privateKey } = {}) {
  return jwt.sign(
    { iss: ISSUER, aud: CLIENT_ID, sub: 'idp-sub-1', email: `sara@${DOMAIN}`, email_verified: true, ...claims },
    opts.key ?? privateKey,
    { algorithm: 'RS256', keyid: 'k1', expiresIn: 300 },
  );
}

function setup(over: { idp?: Record<string, unknown>; idToken?: (nonce: string) => string } = {}) {
  const store = new Map<string, unknown>();
  const redis = {
    set: jest.fn(async (k: string, v: unknown) => void store.set(k, v)),
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    del: jest.fn(async (k: string) => void store.delete(k)),
  };

  const idp = {
    id: 'idp-1',
    mailAppId: 'app-uuid',
    type: 'OIDC',
    preset: 'CUSTOM',
    enabled: true,
    issuer: ISSUER,
    clientId: CLIENT_ID,
    clientSecretEncrypted: encryptMailSsoSecret('shh'),
    emailDomain: DOMAIN,
    jitProvisioning: true,
    defaultRole: 'MEMBER',
    enforceSso: false,
    autoMapMailboxByLocalPart: true,
    lastTestedAt: null,
    lastTestError: null,
    mailApp: { id: 'app-uuid', appId: 'ma_1', status: 'ACTIVE', userId: 'owner' },
    ...over.idp,
  };

  const user = {
    id: 'user-1',
    email: `sara@${DOMAIN}`,
    role: 'USER',
    profileCompleted: true,
    profile: { name: 'Sara', username: 'sara', avatar: null },
  };

  const prisma = {
    mailAppIdentityProvider: {
      findFirst: jest.fn(async () => idp),
      findUnique: jest.fn(async () => idp),
    },
    mailSsoIdentity: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(async () => ({})),
      update: jest.fn(),
    },
    user: { findFirst: jest.fn(async () => null) },
    mailAppEmailInvite: { count: jest.fn(async () => 0) },
    mailMailbox: {
      findMany: jest.fn(async () => [{ id: 'box-1' }]),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    mailSsoAccessLink: { updateMany: jest.fn(async () => ({ count: 0 })) },
  };

  const members = {
    joinViaIdentityProvider: jest.fn(async () => ({ slotIndex: 2, joined: true })),
  };
  const auth = {
    createVerifiedExternalUser: jest.fn(async () => ({ ...user })),
    completeExternalLogin: jest.fn(async (u: typeof user) => ({
      user: { id: u.id, email: u.email, role: u.role },
      needsProfileCompletion: false,
    })),
  };
  const oauthCodes = { generate: jest.fn(async () => 'handoff-code') };
  const config = {
    get: jest.fn((key: string) =>
      ({ API_PUBLIC_URL: 'https://api.test', NEXT_PUBLIC_MAIL_URL: 'https://mail.test' })[key],
    ),
  };

  let capturedNonce = '';
  let tokenRequestBody: URLSearchParams | null = null;
  global.fetch = jest.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const json = (body: unknown, status = 200) =>
      ({ ok: status < 400, status, json: async () => body }) as Response;
    if (url === `${ISSUER}/.well-known/openid-configuration`) {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
      });
    }
    if (url === `${ISSUER}/jwks`) return json({ keys: [jwk] });
    if (url === `${ISSUER}/token`) {
      tokenRequestBody = init?.body as URLSearchParams;
      return json({
        id_token: over.idToken ? over.idToken(capturedNonce) : signIdToken({ nonce: capturedNonce }),
      });
    }
    return json({ error: 'not_found' }, 404);
  }) as unknown as typeof fetch;

  const service = new MailSsoOidcService(
    prisma as never,
    redis as never,
    config as never,
    {} as never,
    members as never,
    {} as never,
    auth as never,
    oauthCodes as never,
  );

  async function startFlow() {
    const authorizeUrl = new URL(await service.startUrl(`Sara@${DOMAIN}`));
    capturedNonce = authorizeUrl.searchParams.get('nonce')!;
    return authorizeUrl;
  }

  return {
    service,
    prisma,
    members,
    auth,
    oauthCodes,
    startFlow,
    tokenBody: () => tokenRequestBody,
  };
}

describe('MailSsoOidcService', () => {
  beforeEach(() => __resetOidcCachesForTests());

  it('builds a PKCE authorization request and logs the user in on callback', async () => {
    const t = setup();
    const authorizeUrl = await t.startFlow();
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(`${ISSUER}/authorize`);
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      'https://api.test/api/v1/mail/sso/oidc/callback',
    );
    expect(authorizeUrl.searchParams.get('login_hint')).toBe(`sara@${DOMAIN}`);

    const redirect = new URL(
      await t.service.handleCallback({
        code: 'auth-code',
        state: authorizeUrl.searchParams.get('state')!,
        ipAddress: '1.2.3.4',
      }),
    );

    expect(redirect.origin + redirect.pathname).toBe('https://mail.test/callback');
    expect(redirect.searchParams.get('code')).toBe('handoff-code');
    expect(redirect.searchParams.get('next')).toBe('/apps/ma_1/open?next=inbox');
    expect(t.tokenBody()?.get('code_verifier')).toHaveLength(43);
    expect(t.tokenBody()?.get('client_secret')).toBe('shh');
    expect(t.auth.createVerifiedExternalUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: `sara@${DOMAIN}` }),
    );
    expect(t.prisma.mailSsoIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ identityProviderId: 'idp-1', subject: 'idp-sub-1' }),
    });
    expect(t.members.joinViaIdentityProvider).toHaveBeenCalledWith(
      expect.objectContaining({ mailAppId: 'app-uuid', jitProvisioning: true, defaultRole: 'MEMBER' }),
    );
    expect(t.prisma.mailMailbox.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['box-1'] } },
      data: { assignedUserId: 'user-1', pendingAssigneeEmail: null },
    });
    expect(t.oauthCodes.generate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      '1.2.3.4',
    );
  });

  it('rejects a replayed state', async () => {
    const t = setup();
    const state = (await t.startFlow()).searchParams.get('state')!;
    await t.service.handleCallback({ code: 'c', state });
    const second = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(second.searchParams.get('sso_error')).toBe('state');
  });

  it('rejects an ID token with the wrong nonce', async () => {
    const t = setup({ idToken: () => signIdToken({ nonce: 'attacker' }) });
    const state = (await t.startFlow()).searchParams.get('state')!;
    const url = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(url.searchParams.get('sso_error')).toBe('provider');
    expect(t.oauthCodes.generate).not.toHaveBeenCalled();
  });

  it('rejects an ID token signed by another key', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const t = setup({ idToken: (nonce) => signIdToken({ nonce }, { key: other }) });
    const state = (await t.startFlow()).searchParams.get('state')!;
    const url = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(url.searchParams.get('sso_error')).toBe('provider');
  });

  it('rejects emails outside the workspace domain', async () => {
    const t = setup({ idToken: (nonce) => signIdToken({ nonce, email: 'eve@evil.com' }) });
    const state = (await t.startFlow()).searchParams.get('state')!;
    const url = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(url.searchParams.get('sso_error')).toBe('domain');
  });

  it('rejects unverified emails', async () => {
    const t = setup({ idToken: (nonce) => signIdToken({ nonce, email_verified: false }) });
    const state = (await t.startFlow()).searchParams.get('state')!;
    const url = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(url.searchParams.get('sso_error')).toBe('email');
  });

  it('requires an invite when JIT provisioning is off', async () => {
    const t = setup({ idp: { jitProvisioning: false } });
    const state = (await t.startFlow()).searchParams.get('state')!;
    const url = new URL(await t.service.handleCallback({ code: 'c', state }));
    expect(url.searchParams.get('sso_error')).toBe('not_provisioned');
    expect(t.auth.createVerifiedExternalUser).not.toHaveBeenCalled();
  });

  it('requires the Google hosted-domain claim for Google Workspace', async () => {
    const t = setup({ idp: { preset: 'GOOGLE_WORKSPACE' } });
    const authorizeUrl = await t.startFlow();
    expect(authorizeUrl.searchParams.get('hd')).toBe(DOMAIN);
    const url = new URL(
      await t.service.handleCallback({ code: 'c', state: authorizeUrl.searchParams.get('state')! }),
    );
    expect(url.searchParams.get('sso_error')).toBe('domain');
  });

  it('discover reports SSO only for configured domains', async () => {
    const t = setup();
    t.prisma.mailAppIdentityProvider.findFirst.mockResolvedValueOnce(null as never);
    await expect(t.service.discover('x@other.com')).resolves.toEqual(
      expect.objectContaining({ sso: false }),
    );
    await expect(t.service.discover(`x@${DOMAIN}`)).resolves.toEqual(
      expect.objectContaining({ sso: true }),
    );
  });
});
