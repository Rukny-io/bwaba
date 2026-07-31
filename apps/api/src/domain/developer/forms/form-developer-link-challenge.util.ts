import { createHmac, timingSafeEqual } from 'crypto';

const CHALLENGE_VERSION = 1;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type ChallengePayload = {
  v: number;
  formId: string;
  appInternalId: string;
  userId: string;
  exp: number;
};

function getChallengeSecret(): string {
  const dedicated = process.env.FORMS_DEV_LINK_PEPPER?.trim();
  if (dedicated && dedicated.length >= 32) return dedicated;

  const jwt = process.env.JWT_SECRET?.trim();
  if (jwt && jwt.length >= 32) return jwt;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FORMS_DEV_LINK_PEPPER or JWT_SECRET (32+ chars) required for developer form linking',
    );
  }

  return 'dev-only-forms-developer-link-pepper-32chars';
}

function signPayload(payload: ChallengePayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getChallengeSecret())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function parseToken(token: string): ChallengePayload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', getChallengeSecret())
    .update(body)
    .digest('base64url');

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as ChallengePayload;
    if (payload.v !== CHALLENGE_VERSION) return null;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (!payload.formId || !payload.appInternalId || !payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createFormDeveloperLinkChallenge(input: {
  formId: string;
  appInternalId: string;
  userId: string;
}): string {
  return signPayload({
    v: CHALLENGE_VERSION,
    formId: input.formId,
    appInternalId: input.appInternalId,
    userId: input.userId,
    exp: Date.now() + CHALLENGE_TTL_MS,
  });
}

export function verifyFormDeveloperLinkChallenge(
  token: string,
  expected: { formId: string; userId: string },
): { appInternalId: string } | null {
  const payload = parseToken(token);
  if (!payload) return null;
  if (payload.formId !== expected.formId) return null;
  if (payload.userId !== expected.userId) return null;
  return { appInternalId: payload.appInternalId };
}
