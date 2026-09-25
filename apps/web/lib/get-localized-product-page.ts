import { getMessages, type AppLocale } from '@/lib/i18n';
import {
  PRODUCT_PAGES,
  type ProductDetailSection,
  type ProductFeature,
  type ProductPageContent,
  type ProductSlug,
} from '@/lib/public-marketing-pages';

function mergeFeatures(
  base: ProductFeature[],
  localized: Array<{ title: string; description: string }> | undefined,
): ProductFeature[] {
  if (!localized) return base;
  return localized.map((item, index) => ({
    ...item,
    icon: base[index]?.icon,
  }));
}

export function getLocalizedProductPage(
  slug: string,
  locale: AppLocale,
): ProductPageContent | undefined {
  const base = PRODUCT_PAGES[slug as ProductSlug];
  if (!base) return undefined;

  const { products } = getMessages(locale);
  const page = products.pages[slug as ProductSlug];
  if (!page) return base;

  const localized = page as Partial<ProductPageContent> & {
    title: string;
    description: string;
    features?: Array<{ title: string; description: string }>;
    highlights?: string[];
    secondaryCta?: { label: string };
  };

  return {
    ...base,
    eyebrow: localized.eyebrow ?? base.eyebrow,
    title: localized.title,
    headline: localized.headline ?? base.headline,
    headlineMuted: localized.headlineMuted ?? base.headlineMuted,
    description: localized.description,
    ctaLabel: localized.ctaLabel ?? base.ctaLabel,
    badge: localized.badge ?? base.badge,
    showcaseDescription: localized.showcaseDescription ?? base.showcaseDescription,
    workflowEyebrow: localized.workflowEyebrow ?? base.workflowEyebrow,
    workflowTitle: localized.workflowTitle ?? base.workflowTitle,
    workflowTitleMuted: localized.workflowTitleMuted ?? base.workflowTitleMuted,
    features: mergeFeatures(base.features, localized.features),
    highlights: localized.highlights ?? base.highlights,
    detailSections: localized.detailSections ?? base.detailSections,
    workflowSteps: localized.workflowSteps ?? base.workflowSteps,
    secondaryCta: localized.secondaryCta
      ? { label: localized.secondaryCta.label, href: base.secondaryCta?.href ?? '/pricing' }
      : base.secondaryCta,
  };
}

export function getProductNotFoundTitle(locale: AppLocale): string {
  return getMessages(locale).products.notFound;
}
