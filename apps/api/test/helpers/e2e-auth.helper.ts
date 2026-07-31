import { randomUUID, createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { COOKIE_NAMES } from '../../src/domain/auth/cookie.config';

export interface E2eAuthContext {
  userId: string;
  sessionId: string;
  email: string;
  accessToken: string;
  accessCookieName: string;
  cookieHeader: string;
}

type E2ePrisma = Pick<
  PrismaClient,
  'user' | 'session' | 'form' | 'formField' | 'form_steps' | 'form_submissions' | 'form_submission_slot' | 'form_submission_idempotency'
>;

export async function createE2eAuthContext(
  prisma: E2ePrisma,
): Promise<E2eAuthContext> {
  const userId = randomUUID();
  const sessionId = randomUUID();
  const email = `e2e-forms-${randomUUID()}@rukny.test`;

  await prisma.user.create({
    data: {
      id: userId,
      email,
      emailVerified: true,
    },
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

  const refreshTokenHash = createHash('sha256')
    .update(randomUUID())
    .digest('hex');

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
      refreshExpiresAt,
      deviceName: 'E2E',
      deviceType: 'desktop',
      browser: 'Playwright',
      os: 'Test',
    },
  });

  const jwtSecret =
    process.env.JWT_SECRET ||
    'fallback-secret-min-32-chars-for-e2e-tests!!';

  const accessToken = jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      email,
      type: 'access',
    },
    jwtSecret,
    { expiresIn: '2h' },
  );

  return {
    userId,
    sessionId,
    email,
    accessToken,
    accessCookieName: COOKIE_NAMES.accessToken,
    cookieHeader: `${COOKIE_NAMES.accessToken}=${accessToken}`,
  };
}

export async function cleanupE2eUser(
  prisma: E2ePrisma,
  userId: string,
): Promise<void> {
  await prisma.form_submission_idempotency.deleteMany({
    where: { form: { userId } },
  });
  await prisma.form_submission_slot.deleteMany({
    where: { form: { userId } },
  });
  await prisma.form_submissions.deleteMany({
    where: { form: { userId } },
  });
  await prisma.formField.deleteMany({ where: { form: { userId } } });
  await prisma.form_steps.deleteMany({ where: { forms: { userId } } });
  await prisma.form.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}
