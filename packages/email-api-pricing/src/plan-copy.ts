export const FEATURED_TRANSACTIONAL_PLAN_IDS = [
  'FREE',
  'PRO_50K',
  'PRO_100K',
] as const;

export type FeaturedTransactionalPlanId =
  (typeof FEATURED_TRANSACTIONAL_PLAN_IDS)[number];

export type EmailApiPlanCardCopy = {
  taglineEn: string;
  taglineAr: string;
  featuresEn: string[];
  featuresAr: string[];
};

export const FEATURED_TRANSACTIONAL_PLAN_COPY: Record<
  FeaturedTransactionalPlanId,
  EmailApiPlanCardCopy
> = {
  FREE: {
    taglineEn: 'For experiments and side projects',
    taglineAr: 'للتجارب والمشاريع الجانبية',
    featuresEn: [
      '3,000 emails / mo · 100 / day',
      '3 verified domains',
      '10,000 automation runs',
      'Ticket support',
    ],
    featuresAr: [
      '3,000 رسالة/شهر · 100/يوم',
      '3 نطاقات موثّقة',
      '10,000 تشغيل أتمتة',
      'دعم عبر التذاكر',
    ],
  },
  PRO_50K: {
    taglineEn: 'Production apps and growing teams',
    taglineAr: 'تطبيقات إنتاجية وفرق نامية',
    featuresEn: [
      '50,000 emails / mo',
      '10 verified domains',
      'No daily send cap',
      '1,000 IQD / 1,000 overage',
    ],
    featuresAr: [
      '50,000 رسالة/شهر',
      '10 نطاقات موثّقة',
      'بدون حد يومي',
      '1,000 د.ع / 1,000 رسالة إضافية',
    ],
  },
  PRO_100K: {
    taglineEn: 'High volume teams and deliverability',
    taglineAr: 'فرق بحجم عالٍ وموثوقية إرسال',
    featuresEn: [
      '100,000 emails / mo',
      'All Pro features',
      '1,000 domains',
      'Dedicated Slack channel',
      '10 webhook endpoints',
      '500 AI credits / mo',
      'SSO with add-on · Dedicated IP with add-on',
      '1,000 IQD / 1,000 overage',
    ],
    featuresAr: [
      '100,000 رسالة/شهر',
      'كل ميزات Pro',
      '1,000 نطاق',
      'قناة Slack مخصصة',
      '10 نقاط webhook',
      '500 رصيد AI / شهر',
      'SSO و IP مخصص كإضافات',
      '1,000 د.ع / 1,000 رسالة إضافية',
    ],
  },
};
