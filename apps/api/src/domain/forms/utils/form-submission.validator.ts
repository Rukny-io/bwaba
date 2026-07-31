import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { TurnstileService } from '../../../infrastructure/security/turnstile.service';

type FormForSubmission = {
  id: string;
  status: string;
  deletedAt?: Date | string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  closeAfterDate?: boolean | null;
  submissionLimit?: number | null;
  maxSubmissions: number | null;
  requiresAuthentication: boolean;
  allowMultipleSubmissions: boolean;
  oneResponsePerUser: boolean;
  requireTurnstileOnSubmit?: boolean;
  fields?: { type: string }[];
};

/**
 * Shared submission gate checks (status, dates, limits, auth, duplicates).
 */
export async function assertFormAcceptsSubmission(
  prisma: PrismaService,
  form: FormForSubmission,
  userId?: string,
): Promise<void> {
  if (form.deletedAt != null) {
    throw new BadRequestException('Form is not accepting submissions');
  }

  if (form.status !== 'PUBLISHED') {
    throw new BadRequestException('Form is not accepting submissions');
  }

  const now = new Date();
  if (form.opensAt && now < form.opensAt) {
    throw new BadRequestException('Form is not open yet');
  }
  if (form.closesAt && now > form.closesAt) {
    throw new BadRequestException('Form is closed');
  }
  if (form.closeAfterDate && form.closesAt && now > form.closesAt) {
    throw new BadRequestException('Form is closed');
  }

  if (form.requiresAuthentication && !userId) {
    throw new BadRequestException(
      'Authentication required to submit this form',
    );
  }
}

export async function verifySubmissionTurnstile(
  turnstileService: TurnstileService,
  formFields: { type: string }[],
  data: Record<string, unknown>,
  turnstileToken: string | undefined,
  requireOnForm = false,
  remoteIp?: string,
): Promise<Record<string, unknown>> {
  const payload = { ...data };
  const hasTurnstileField = formFields.some((f) => f.type === 'RECAPTCHA');
  const token =
    turnstileToken ??
    (payload.turnstileToken as string | undefined) ??
    (payload.recaptchaToken as string | undefined);

  delete payload.turnstileToken;
  delete payload.recaptchaToken;

  if ((hasTurnstileField || requireOnForm) && !token) {
    throw new BadRequestException({
      message: 'Turnstile verification required',
      code: 'TURNSTILE_REQUIRED',
    });
  }

  if (!token) {
    return payload;
  }

  const result = await turnstileService.verifyToken(token, remoteIp);

  if (!result.success) {
    throw new BadRequestException({
      message: 'Turnstile verification failed',
      code: 'TURNSTILE_FAILED',
      details: {
        errorCodes: result.errorCodes,
        error: result.error,
      },
    });
  }

  return payload;
}
