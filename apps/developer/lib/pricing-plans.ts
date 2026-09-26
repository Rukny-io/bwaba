/**
 * Developer portal pricing — Free + Pro + product usage.
 * Platform prices align with apps/api DEVELOPER_PRO_PRICING (10,000 / 100,000 IQD).
 * Email API tiers compete with Resend — priced in IQD (USD ≈ 1,320 IQD).
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
      'Email API — 3,000 free messages / month',
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
      'Transactional email from a verified domain. Free monthly tier, then Pro / Scale plans with overage packs.',
    rows: [
      {
        label: 'Product install',
        values: { free: true, pro: true },
      },
      {
        label: 'Free tier',
        hint: '3,000 / month · 100 / day',
        values: { free: '3,000 messages / month', pro: '3,000 messages / month' },
      },
      {
        label: 'Paid transactional plans',
        hint: 'From 5,000 IQD / month',
        values: { free: 'Pro & Scale tiers', pro: 'Pro & Scale tiers' },
      },
      {
        label: 'Overage packs',
        hint: '700 IQD / 1,000 emails',
        values: { free: true, pro: true },
      },
      {
        label: 'Marketing contacts',
        hint: 'From 1,500 free contacts',
        values: { free: true, pro: true },
      },
      {
        label: 'Domain verify + sender authorize',
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

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function monthlyEquivalentFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}

export const EMAIL_TRANSACTIONAL_PLANS = [
  { id: 'FREE', name: 'Free', priceMonthly: 0, volume: 3_000, overagePer1k: null, dailyLimit: 100 },
  { id: 'PRO_10K', name: 'Pro 10K', priceMonthly: 5_000, volume: 10_000, overagePer1k: 700, popular: true },
  { id: 'PRO_50K', name: 'Pro 50K', priceMonthly: 16_000, volume: 50_000, overagePer1k: 700 },
  { id: 'PRO_100K', name: 'Pro 100K', priceMonthly: 28_000, volume: 100_000, overagePer1k: 700 },
  { id: 'SCALE_100K', name: 'Scale 100K', priceMonthly: 72_000, volume: 100_000, overagePer1k: 650 },
  { id: 'SCALE_200K', name: 'Scale 200K', priceMonthly: 125_000, volume: 200_000, overagePer1k: 600 },
  { id: 'SCALE_500K', name: 'Scale 500K', priceMonthly: 275_000, volume: 500_000, overagePer1k: 550 },
  { id: 'SCALE_1M', name: 'Scale 1M', priceMonthly: 500_000, volume: 1_000_000, overagePer1k: 500 },
] as const;

export const EMAIL_MARKETING_PLANS = [
  { id: 'FREE', name: 'Marketing Free', priceMonthly: 0, contacts: 1_500 },
  { id: 'PRO_5K', name: 'Marketing 5K', priceMonthly: 35_000, contacts: 5_000 },
  { id: 'PRO_10K', name: 'Marketing 10K', priceMonthly: 65_000, contacts: 10_000 },
  { id: 'PRO_25K', name: 'Marketing 25K', priceMonthly: 140_000, contacts: 25_000 },
  { id: 'PRO_50K', name: 'Marketing 50K', priceMonthly: 190_000, contacts: 50_000 },
  { id: 'PRO_100K', name: 'Marketing 100K', priceMonthly: 340_000, contacts: 100_000 },
] as const;

export const EMAIL_ADDON_PLANS = [
  { id: 'domains', name: '+100 domains', priceMonthly: 20_000 },
  { id: 'dedicated-ip', name: 'Dedicated IP', priceMonthly: 30_000 },
  { id: 'sso', name: 'Single Sign-On', priceMonthly: 120_000 },
] as const;

export const EMAIL_AUTOMATION_PRICING = {
  includedRuns: 15_000,
  overagePerRun: 1,
} as const;

export const EMAIL_OVERAGE_PACK = {
  emails: 1_000,
  priceIqd: 700,
} as const;

export const EMAIL_PRODUCT_PLANS = EMAIL_TRANSACTIONAL_PLANS.filter(
  (p) => p.id === 'FREE' || p.id === 'PRO_10K' || p.id === 'PRO_50K',
).map((plan) => ({
  id: plan.id.toLowerCase().replace('_', '-'),
  name: plan.name,
  nameEn: plan.name,
  priceLabel: plan.priceMonthly === 0 ? 'Free' : formatPrice(plan.priceMonthly),
  priceNote: plan.priceMonthly === 0 ? 'Monthly · 100/day cap' : `${CURRENCY} / month`,
  volume:
    plan.volume >= 1_000
      ? `${formatPrice(plan.volume)} messages / month`
      : `${plan.volume} messages / month`,
  description:
    plan.id === 'FREE'
      ? 'Start integrating after you install Email API.'
      : 'Fixed monthly allowance for transactional email in production.',
  highlights:
    plan.id === 'FREE'
      ? [
          '3,000 messages every month',
          '100 emails per day cap',
          '3 verified domains',
          'SDK and REST',
        ]
      : [
          `${formatPrice(plan.volume)} messages every billing cycle`,
          `Overage ${formatPrice(plan.overagePer1k ?? 700)} IQD / 1,000`,
          'Request from the developer portal',
          'Annual billing −17%',
        ],
  popular: 'popular' in plan ? plan.popular : false,
}));

export const EMAIL_SECTION_COPY = {
  eyebrow: 'Email API',
  title: 'Email API pricing',
  subtitle:
    'Separate from Free / Pro platform plans. Resend-style tiers in IQD — typically 15–40% lower at scale.',
  docsCta: 'Read Email API docs',
  docsHref: '/documentation/email-api/quotas',
  compareCta: 'Compare with Resend',
  compareHref: '/pricing/compare-resend',
} as const;

export const RESEND_COMPARE_HIGHLIGHTS = [
  { volume: '50K/mo', resend: '$20', rukny: '16,000 IQD (~$12)' },
  { volume: '100K/mo', resend: '$35', rukny: '28,000 IQD (~$21)' },
  { volume: '500K/mo', resend: '$350', rukny: '275,000 IQD (~$208)' },
  { volume: '1M/mo', resend: '$650', rukny: '500,000 IQD (~$379)' },
] as const;

export const PRICING_FAQS = [
  {
    question: 'Are messages included in Pro?',
    answer:
      'No. Pro unlocks platform ceilings (apps, keys, webhooks…). WhatsApp messages are charged from the app wallet by usage. Email API has a separate free tier (3,000/mo) and paid Pro / Scale plans.',
  },
  {
    question: 'What is the difference between Free and Pro?',
    answer:
      'Free fits experiments and small projects (up to 10 apps and 5 keys). Pro removes most ceilings, raises rate limits and log retention, and adds priority support.',
  },
  {
    question: 'How is Email API priced?',
    answer:
      'Every account gets 3,000 free transactional emails per month (100/day cap). Paid plans start at 5,000 IQD for 10K messages. Overage packs are 700 IQD per 1,000 emails. Marketing contacts and automations are billed separately.',
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
      'Open each app → Wallet. IQD balance is used for WhatsApp messages and Email overage packs. Paid Email plans are requested from the Email API subscription card.',
  },
  {
    question: 'Can I upgrade or cancel anytime?',
    answer:
      'Yes. Upgrading to Pro is immediate. If you cancel, you stay on Free with its limits; remaining wallet balance stays available.',
  },
];
