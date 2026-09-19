/**
 * Developer portal pricing — Free + Pro + product usage.
 * Platform prices align with apps/api DEVELOPER_PRO_PRICING (10,000 / 100,000 IQD).
 * Email API Starter: 6,000 IQD / month for 10,000 messages.
 */

export type PlanId = 'free' | 'pro';
export type BillingPeriod = 'monthly' | 'yearly';

export const CURRENCY = 'IQD';
export const CURRENCY_EN = 'IQD';
export const YEARLY_DISCOUNT_PERCENT = 17;

export interface PricingPlan {
  id: PlanId;
  name: string;
  nameEn: string;
  badge?: string;
  popular?: boolean;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  ctaLabel: string;
  highlights: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameEn: 'Free',
    description:
      'Build on WhatsApp and Email API with no platform subscription. Pay only for actual product usage.',
    priceMonthly: 0,
    priceYearly: 0,
    ctaLabel: 'Start for free',
    highlights: [
      'Up to 10 apps',
      '5 API keys per account',
      'WhatsApp API — wallet-based billing',
      'Email API — 1,000 free messages once',
      'Up to 3 webhooks per app',
      '14-day log retention',
      '60 API requests / minute',
      'Public docs and SDKs',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    badge: 'For production',
    popular: true,
    description:
      'Open ceilings for apps and keys. Same usage billing for messages — with higher performance and priority support.',
    priceMonthly: 10_000,
    priceYearly: 100_000,
    ctaLabel: 'Subscribe to Pro',
    highlights: [
      'Everything in Free, plus:',
      'Unlimited apps',
      'Unlimited API keys',
      'WhatsApp numbers & webhooks without practical limits',
      '365-day log retention',
      '300 API requests / minute',
      'Priority support and template sync',
      'Built to run Email + WhatsApp together',
    ],
  },
];

export type CellValue = boolean | string;

export interface FeatureRow {
  label: string;
  hint?: string;
  values: Record<PlanId, CellValue>;
}

export interface FeatureSection {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  rows: FeatureRow[];
}

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'platform',
    eyebrow: 'Platform',
    title: 'Apps & API keys',
    description: 'Manage apps and access keys from the developer dashboard.',
    rows: [
      {
        label: 'Apps',
        values: { free: '10', pro: 'Unlimited' },
      },
      {
        label: 'API keys',
        values: { free: '5', pro: 'Unlimited' },
      },
      {
        label: 'Fine-grained scopes',
        values: { free: true, pro: true },
      },
      {
        label: 'Test + live environments',
        values: { free: true, pro: true },
      },
      {
        label: 'Public docs & SDKs',
        hint: '@rukny/email and @rukny/whatsapp',
        values: { free: true, pro: true },
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp API',
    description:
      'Messages are billed from the app wallet — no monthly message cap on the platform plan.',
    rows: [
      {
        label: 'Send via API',
        values: { free: true, pro: true },
      },
      {
        label: 'Billing model',
        hint: 'By conversation category (Meta + platform margin)',
        values: { free: 'Usage-based', pro: 'Usage-based' },
      },
      {
        label: 'Service messages',
        hint: 'First 1,000 conversations / month free from Meta',
        values: { free: true, pro: true },
      },
      {
        label: 'WhatsApp Business numbers',
        values: { free: '1', pro: 'Unlimited' },
      },
      {
        label: 'Template sync',
        values: { free: false, pro: true },
      },
    ],
  },
  {
    id: 'email',
    title: 'Email API',
    description:
      'Transactional email from a verified domain. One-time free allowance, then Email Starter for the product.',
    rows: [
      {
        label: 'Product install',
        values: { free: true, pro: true },
      },
      {
        label: 'Free allowance',
        hint: 'Once per account',
        values: { free: '1,000 messages', pro: '1,000 messages' },
      },
      {
        label: 'Email API Starter',
        hint: '6,000 IQD / month',
        values: { free: '10,000 messages / month', pro: '10,000 messages / month' },
      },
      {
        label: 'Domain verify + sender authorize',
        values: { free: true, pro: true },
      },
      {
        label: 'Test / live keys',
        values: { free: true, pro: true },
      },
      {
        label: 'Official SDK @rukny/email',
        values: { free: true, pro: true },
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Webhooks & integrations',
    rows: [
      {
        label: 'Webhooks (WhatsApp)',
        values: { free: '3', pro: 'Unlimited' },
      },
      {
        label: 'Contacts',
        values: { free: '1,000', pro: 'Unlimited' },
      },
      {
        label: 'IP allowlist',
        values: { free: true, pro: true },
      },
      {
        label: 'Portal Try it',
        values: { free: true, pro: true },
      },
    ],
  },
  {
    id: 'ops',
    title: 'Performance & support',
    rows: [
      {
        label: 'API requests / minute',
        values: { free: '60', pro: '300' },
      },
      {
        label: 'Log retention',
        values: { free: '14 days', pro: '365 days' },
      },
      {
        label: 'Queue priority',
        values: { free: 'Standard', pro: 'High' },
      },
      {
        label: 'Priority support',
        values: { free: false, pro: true },
      },
    ],
  },
];

export const USAGE_RATES = [
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'OTP & verification',
    price: 12,
  },
  {
    id: 'utility',
    label: 'Utility',
    description: 'Transactional updates',
    price: 15,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Promotions & campaigns',
    price: 60,
  },
  {
    id: 'service',
    label: 'Service',
    description: 'User-initiated support',
    price: 0,
    note: 'Per Meta policy · first 1k/mo free',
  },
] as const;

export const USAGE_SECTION_COPY = {
  eyebrow: 'WhatsApp usage',
  title: 'WhatsApp message pricing',
  subtitle:
    'Charged from your app wallet. Same rates on Free and Pro — no monthly message cap on the platform plan.',
  perMessage: 'per message',
  free: 'Free',
  footnote:
    'Prices include Meta conversation fees and Rukny platform margin. Billed per delivered message category.',
} as const;

export const EMAIL_PRODUCT_PLANS = [
  {
    id: 'email-free',
    name: 'Free allowance',
    nameEn: 'Free',
    priceLabel: 'Free',
    priceNote: 'Once per account',
    volume: '1,000 messages',
    description: 'Start integrating after you install Email API.',
    highlights: [
      'Verified domain and authorized sender',
      'Test and live keys',
      'SDK and REST',
      'Does not renew monthly',
    ],
  },
  {
    id: 'email-starter',
    name: 'Email API Starter',
    nameEn: 'Starter',
    priceLabel: '6,000',
    priceNote: `${CURRENCY} / month`,
    volume: '10,000 messages / month',
    description: 'Fixed monthly allowance for transactional email in production.',
    highlights: [
      '10,000 messages every billing cycle',
      'Same API and SDK surface',
      'Request from the developer portal',
      'No unlimited sending in the MVP',
    ],
    popular: true,
  },
] as const;

export const EMAIL_SECTION_COPY = {
  eyebrow: 'Email API',
  title: 'Email API pricing',
  subtitle:
    'Separate from Free / Pro platform plans. Start with the free allowance, then enable Starter when you need more volume.',
  docsCta: 'Read Email API docs',
  docsHref: '/documentation/email-api/quotas',
} as const;

export const PRICING_FAQS = [
  {
    question: 'Are messages included in Pro?',
    answer:
      'No. Pro unlocks platform ceilings (apps, keys, webhooks…). WhatsApp messages are charged from the app wallet by usage. Email API has a one-time free allowance, then a separate Email Starter product plan.',
  },
  {
    question: 'What is the difference between Free and Pro?',
    answer:
      'Free fits experiments and small projects (up to 10 apps and 5 keys). Pro removes most ceilings, raises rate limits and log retention, and adds priority support.',
  },
  {
    question: 'How is Email API priced?',
    answer:
      'Every account gets 1,000 free messages once. After that you can request Email API Starter for 6,000 IQD per month for 10,000 messages per cycle. Unlimited sending is not available in the MVP.',
  },
  {
    question: 'Do I need Pro to use Email API?',
    answer:
      'No. Email API can be installed on Free. Pro helps when you need more apps, keys, and higher request rates.',
  },
  {
    question: 'I already have a Rukny BUSINESS plan — do I need Pro?',
    answer:
      'Platform plans (Pro / Whale / Business) grant developer-portal Pro benefits automatically without a separate subscription.',
  },
  {
    question: 'How do I top up the wallet?',
    answer:
      'Open each app → Wallet. IQD balance is used for WhatsApp messages. Email Starter is requested from the product page in the portal.',
  },
  {
    question: 'Can I upgrade or cancel anytime?',
    answer:
      'Yes. Upgrading to Pro is immediate. If you cancel, you stay on Free with its limits; remaining wallet balance stays available.',
  },
];

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function monthlyEquivalentFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}
