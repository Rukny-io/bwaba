import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { FORMS_IDEMPOTENCY_TTL_SECONDS } from '../forms.constants';

/**
 * Reserves an idempotency key in PostgreSQL before processing (Redis lock is still primary).
 * Returns true when this request should proceed; false when caller must return existing submission.
 */
export type IdempotencyClaimResult = 'proceed' | 'completed' | 'in_progress';

export async function claimIdempotencyKey(
  prisma: PrismaService,
  formId: string,
  key: string,
): Promise<IdempotencyClaimResult> {
  const expiresAt = new Date(
    Date.now() + FORMS_IDEMPOTENCY_TTL_SECONDS * 1000,
  );

  try {
    await prisma.form_submission_idempotency.create({
      data: {
        formId,
        idempotencyKey: key,
        expiresAt,
        submissionId: null,
      },
    });
    return 'proceed';
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const row = await prisma.form_submission_idempotency.findUnique({
        where: {
          formId_idempotencyKey: { formId, idempotencyKey: key },
        },
      });
      if (row?.submissionId && row.expiresAt.getTime() > Date.now()) {
        return 'completed';
      }
      if (row && row.expiresAt.getTime() <= Date.now()) {
        await prisma.form_submission_idempotency.delete({
          where: {
            formId_idempotencyKey: { formId, idempotencyKey: key },
          },
        });
        return claimIdempotencyKey(prisma, formId, key);
      }
      throw new ConflictException({
        message:
          'A submission with this idempotency key is already being processed',
        code: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }
    throw error;
  }
}

export async function releaseIdempotencyClaim(
  prisma: PrismaService,
  formId: string,
  key: string,
): Promise<void> {
  await prisma.form_submission_idempotency.deleteMany({
    where: {
      formId,
      idempotencyKey: key,
      submissionId: null,
    },
  });
}
