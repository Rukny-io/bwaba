/**
 * Shared checkout session context attached by CheckoutSessionGuard.
 */
export interface CheckoutSessionContext {
  phoneNumber?: string;
  email?: string;
  storeId?: string;
  sessionId?: string;
  userId?: string;
  type?: string;
  verified: boolean;
  scope?: string;
}

export interface TrackingSessionContext {
  phoneNumber: string;
  type: 'tracking';
}
