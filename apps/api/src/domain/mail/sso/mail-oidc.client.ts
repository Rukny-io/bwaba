import {
  createHash,
  createPublicKey,
  randomBytes,
  type JsonWebKey,
  type KeyObject,
} from 'crypto';
import * as jwt from 'jsonwebtoken';
import { assertUrlSafe } from '../../../core/common/utils/ssrf-guard';

async function assertOidcUrlSafe(url: string): Promise<void> {
  // Unit tests use reserved `.test` hosts which intentionally do not resolve.
  // Production and all real environments always go through the full DNS/IP
  // validation in assertUrlSafe.
  if (
    process.env.NODE_ENV === 'test' &&
    new URL(url).hostname.endsWith('.test')
  ) {
    return;
  }
  await assertUrlSafe(url);
}

/**
 * Minimal OpenID Connect relying party (authorization code + PKCE).
 * Discovery and JWKS are cached in-process; ID tokens are verified locally.
 */

export type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  id_token_signing_alg_values_supported?: string[];
};

export type OidcIdClaims = {
  iss: string;
  sub: string;
  aud: string | string[];
  nonce?: string;
  email?: string;
  email_verified?: boolean | string;
  preferred_username?: string;
  upn?: string;
  name?: string;
  picture?: string;
  /** Google Workspace hosted domain. */
  hd?: string;
};

const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const JWKS_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const ALLOWED_ALGS: jwt.Algorithm[] = [
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'ES256',
  'ES384',
];

const discoveryCache = new Map<string, { at: number; value: OidcDiscovery }>();
const jwksCache = new Map<
  string,
  { at: number; keys: (JsonWebKey & { kid?: string })[] }
>();

export class OidcError extends Error {}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = (await res.json().catch(() => ({}))) as T & {
      error?: string;
      error_description?: string;
    };
    if (!res.ok) {
      throw new OidcError(
        body.error_description ||
          body.error ||
          `HTTP ${res.status} from ${new URL(url).host}`,
      );
    }
    return body;
  } catch (error) {
    if (error instanceof OidcError) throw error;
    throw new OidcError(`Could not reach ${new URL(url).host}.`);
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeIssuer(issuer: string): string {
  return issuer.trim().replace(/\/+$/, '');
}

export async function discoverOidc(
  issuer: string,
  opts?: { fresh?: boolean },
): Promise<OidcDiscovery> {
  const normalized = normalizeIssuer(issuer);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
    // Discovery is user-configurable. Validate the issuer before making the
    // first request so an administrator cannot turn the API into an SSRF proxy.
    await assertOidcUrlSafe(normalized);
  } catch (error) {
    if (error instanceof OidcError) throw error;
    throw new OidcError(
      error instanceof Error ? error.message : 'Unsafe issuer URL.',
    );
  }
  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new OidcError('Issuer must use https.');
  }
  const cached = discoveryCache.get(normalized);
  if (!opts?.fresh && cached && Date.now() - cached.at < DISCOVERY_TTL_MS)
    return cached.value;

  const doc = await fetchJson<OidcDiscovery>(
    `${normalized}/.well-known/openid-configuration`,
  );
  if (
    !doc.authorization_endpoint ||
    !doc.token_endpoint ||
    !doc.jwks_uri ||
    !doc.issuer
  ) {
    throw new OidcError('Discovery document is missing required endpoints.');
  }
  // Multi-tenant issuers (Entra "common"/"organizations") would accept any tenant's users.
  if (doc.issuer.includes('{tenantid}')) {
    throw new OidcError(
      'Use your tenant-specific issuer (login.microsoftonline.com/<tenant-id>/v2.0).',
    );
  }
  if (normalizeIssuer(doc.issuer) !== normalized) {
    throw new OidcError(`Issuer mismatch: discovery says ${doc.issuer}.`);
  }
  // Discovery documents can point token/JWKS endpoints at a different host.
  // Validate every endpoint independently before any later callback fetch.
  try {
    await Promise.all([
      assertOidcUrlSafe(doc.authorization_endpoint),
      assertOidcUrlSafe(doc.token_endpoint),
      assertOidcUrlSafe(doc.jwks_uri),
    ]);
  } catch (error) {
    throw new OidcError(
      error instanceof Error ? error.message : 'Unsafe OIDC endpoint.',
    );
  }
  discoveryCache.set(normalized, { at: Date.now(), value: doc });
  return doc;
}

export function newPkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function newOidcNonce() {
  return randomBytes(16).toString('base64url');
}

export function buildAuthorizationUrl(
  discovery: OidcDiscovery,
  params: {
    clientId: string;
    redirectUri: string;
    state: string;
    nonce: string;
    codeChallenge: string;
    loginHint?: string;
    hostedDomain?: string;
  },
): string {
  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
  if (params.hostedDomain) url.searchParams.set('hd', params.hostedDomain);
  return url.toString();
}

export async function exchangeAuthorizationCode(
  discovery: OidcDiscovery,
  params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    codeVerifier: string;
  },
): Promise<{ id_token: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code_verifier: params.codeVerifier,
  });
  const tokens = await fetchJson<{ id_token?: string }>(
    discovery.token_endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    },
  );
  if (!tokens.id_token)
    throw new OidcError('The identity provider did not return an ID token.');
  return { id_token: tokens.id_token };
}

async function signingKey(
  jwksUri: string,
  kid: string | undefined,
): Promise<KeyObject> {
  const pick = (keys: (JsonWebKey & { kid?: string; use?: string })[]) =>
    keys.find(
      (k) => (kid ? k.kid === kid : true) && (!k.use || k.use === 'sig'),
    );

  let cached = jwksCache.get(jwksUri);
  let jwk =
    cached && Date.now() - cached.at < JWKS_TTL_MS
      ? pick(cached.keys)
      : undefined;
  if (!jwk) {
    // Unknown kid usually means key rotation: refetch once.
    const doc = await fetchJson<{ keys?: (JsonWebKey & { kid?: string })[] }>(
      jwksUri,
    );
    cached = { at: Date.now(), keys: doc.keys ?? [] };
    jwksCache.set(jwksUri, cached);
    jwk = pick(cached.keys);
  }
  if (!jwk) throw new OidcError('No matching signing key for the ID token.');
  return createPublicKey({ key: jwk, format: 'jwk' });
}

export async function verifyIdToken(
  idToken: string,
  opts: {
    discovery: OidcDiscovery;
    issuer: string;
    clientId: string;
    nonce: string;
  },
): Promise<OidcIdClaims> {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === 'string')
    throw new OidcError('Malformed ID token.');
  const key = await signingKey(opts.discovery.jwks_uri, decoded.header.kid);

  let claims: OidcIdClaims;
  try {
    claims = jwt.verify(idToken, key, {
      algorithms: ALLOWED_ALGS,
      audience: opts.clientId,
      clockTolerance: 60,
    }) as unknown as OidcIdClaims;
  } catch (error) {
    throw new OidcError(`ID token rejected: ${(error as Error).message}`);
  }

  const expectedIssuer = normalizeIssuer(opts.issuer);
  if (normalizeIssuer(claims.iss) !== expectedIssuer) {
    throw new OidcError(
      'ID token issuer does not match the configured issuer.',
    );
  }
  if (!claims.nonce || claims.nonce !== opts.nonce) {
    throw new OidcError('ID token nonce mismatch.');
  }
  if (!claims.sub) throw new OidcError('ID token has no subject.');
  return claims;
}

/** Email the IdP vouches for, or null if it cannot be trusted. */
export function trustedEmailFromClaims(claims: OidcIdClaims): string | null {
  const raw = claims.email || claims.preferred_username || claims.upn || '';
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  // Never provision an account from an unverified mailbox. Accept the string
  // form for providers that serialize boolean claims as strings.
  if (claims.email_verified !== true && claims.email_verified !== 'true')
    return null;
  return email;
}

export function __resetOidcCachesForTests() {
  discoveryCache.clear();
  jwksCache.clear();
}
