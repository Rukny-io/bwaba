import { ForbiddenException } from '@nestjs/common';
import type { CheckoutSessionContext } from './checkout-session.types';

/**
 * Reject cart-only / quick-login sessions from purchase endpoints.
 */
export function assertVerifiedCheckoutSession(
  session: CheckoutSessionContext | undefined,
): CheckoutSessionContext {
  if (!session) {
    throw new ForbiddenException('غير مصرح بالوصول لهذا الطلب');
  }

  if (!session.verified) {
    throw new ForbiddenException({
      message: 'يجب التحقق عبر رمز واتساب لإتمام الشراء',
      code: 'CHECKOUT_VERIFICATION_REQUIRED',
    });
  }

  return session;
}

/**
 * Resolve the phone number bound to a checkout session (never trust client input).
 */
export function resolveCheckoutPhone(
  session: CheckoutSessionContext,
): string | undefined {
  return session.phoneNumber?.trim() || undefined;
}

/**
 * Resolve email when phone is unavailable (email-only OTP path).
 */
export function resolveCheckoutContact(session: CheckoutSessionContext): {
  phoneNumber?: string;
  email?: string;
} {
  return {
    phoneNumber: resolveCheckoutPhone(session),
    email: session.email?.trim() || undefined,
  };
}
