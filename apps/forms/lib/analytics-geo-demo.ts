import type { AnalyticsGeoBreakdown } from '@/lib/forms-api';
import { IRAQ_GOVERNORATE_NAMES } from '@/lib/iraq-governorate-geo';

/** Sample geo data for advanced analytics paywall preview. */
export const DEMO_GEO_BREAKDOWN: AnalyticsGeoBreakdown = {
  governorates: Object.entries(IRAQ_GOVERNORATE_NAMES).map(([code, names]) => {
    const seed = code.charCodeAt(code.length - 1) + code.charCodeAt(code.length - 2);
    const views =
      code === 'IQ-BG'
        ? 142
        : code === 'IQ-BA'
          ? 87
          : code === 'IQ-NI'
            ? 64
            : code === 'IQ-AR'
              ? 41
              : Math.max(0, (seed % 7) * 3);
    const submissions = Math.round(views * 0.38);
    return {
      code,
      name: names.nameEn,
      nameAr: names.nameAr,
      views,
      submissions,
    };
  }),
  countries: [
    { code: 'IQ', name: 'Iraq', nameAr: 'العراق', views: 412, submissions: 156 },
    { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', views: 48, submissions: 14 },
    { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', views: 31, submissions: 9 },
    { code: 'JO', name: 'Jordan', nameAr: 'الأردن', views: 22, submissions: 6 },
    { code: 'TR', name: 'Turkey', nameAr: 'تركيا', views: 18, submissions: 4 },
  ],
  cities: [
    { name: 'Baghdad', countryCode: 'IQ', views: 98, submissions: 41 },
    { name: 'Basra', countryCode: 'IQ', views: 54, submissions: 19 },
    { name: 'Erbil', countryCode: 'IQ', views: 37, submissions: 12 },
    { name: 'Mosul', countryCode: 'IQ', views: 28, submissions: 9 },
    { name: 'Riyadh', countryCode: 'SA', views: 22, submissions: 7 },
    { name: 'Dubai', countryCode: 'AE', views: 18, submissions: 5 },
  ],
  maxViews: 412,
  maxSubmissions: 156,
};
