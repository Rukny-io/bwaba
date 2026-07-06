import { BadRequestException } from '@nestjs/common';
import type { SubscriptionPlan } from '@prisma/client';
import { PLAN_LIMITS } from '../../subscriptions/plan-limits.config';
import { fieldRequiresEmailVerification } from './form-email-verification-check.util';

type FormFieldLike = {
  id?: string;
  label?: string;
  type: string;
  validationRules?: unknown;
  options?: unknown;
};

function fieldRequiresPhoneWhatsappVerification(field: FormFieldLike): boolean {
  if (field.type !== 'PHONE') return false;
  if (!field.validationRules || typeof field.validationRules !== 'object') {
    return false;
  }
  const r = field.validationRules as Record<string, unknown>;
  return (
    r.requireWhatsappVerification === true ||
    r.requirePhoneVerification === true
  );
}

export function assertFormFieldsVerificationAllowed(
  plan: SubscriptionPlan,
  fields: FormFieldLike[] | undefined,
): void {
  if (!fields?.length) return;

  const limits = PLAN_LIMITS[plan];

  for (const field of fields) {
    if (
      fieldRequiresEmailVerification(field as any) &&
      !limits.emailFieldVerification
    ) {
      throw new BadRequestException(
        'التحقق من البريد (OTP) متاح لباقة Plus فما فوق',
      );
    }
    if (
      fieldRequiresPhoneWhatsappVerification(field) &&
      !limits.phoneWhatsappVerification
    ) {
      throw new BadRequestException(
        'التحقق من الهاتف عبر WhatsApp متاح لباقة Plus فما فوق',
      );
    }
  }
}
