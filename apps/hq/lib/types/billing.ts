export type SubscriptionPlan = 'FREE' | 'PRO' | 'WHALE' | 'BUSINESS';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAST_DUE';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface UserBillingPayment {
  id: string;
  amount: number;
  billingCycle: BillingCycle;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  receiptUrl: string | null;
}

export interface UserBillingSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

export interface UserBillingResponse {
  subscription: UserBillingSubscription | null;
  limits: {
    storageBytes: number;
    forms: number;
    links: number;
  };
  payments: UserBillingPayment[];
}
