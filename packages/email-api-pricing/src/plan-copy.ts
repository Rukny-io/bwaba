export const FEATURED_TRANSACTIONAL_PLAN_IDS = [
  'FREE',
  'PRO_50K',
  'PRO_100K',
  'SCALE_500K',
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
      '700 IQD / 1,000 overage',
    ],
    featuresAr: [
      '50,000 رسالة/شهر',
      '10 نطاقات موثّقة',
      'بدون حد يومي',
      '700 د.ع / 1,000 رسالة إضافية',
    ],
  },
  PRO_100K: {
    taglineEn: 'Higher-volume production',
    taglineAr: 'إنتاج بحجم أعلى',
    featuresEn: [
      '100,000 emails / mo',
      '10 verified domains',
      'No daily send cap',
      '700 IQD / 1,000 overage',
    ],
    featuresAr: [
      '100,000 رسالة/شهر',
      '10 نطاقات موثّقة',
      'بدون حد يومي',
      '700 د.ع / 1,000 رسالة إضافية',
    ],
  },
  SCALE_500K: {
    taglineEn: 'High volume and deliverability',
    taglineAr: 'حجم عالٍ وموثوقية إرسال',
    featuresEn: [
      '500,000 emails / mo',
      '1,000 verified domains',
      '550 IQD / 1,000 overage',
      'Dedicated IP add-on',
    ],
    featuresAr: [
      '500,000 رسالة/شهر',
      '1,000 نطاق موثّق',
      '550 د.ع / 1,000 رسالة إضافية',
      'إضافة IP مخصص',
    ],
  },
};
