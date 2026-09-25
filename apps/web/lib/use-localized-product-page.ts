'use client';

import { useMessages } from 'next-intl';
import {
  PRODUCT_PAGES,
  type ProductDetailSection,
  type ProductFeature,
  type ProductPageContent,
  type ProductSlug,
  type ProductWorkflowStep,
} from '@/lib/public-marketing-pages';

type LocalizedPageText = {
  eyebrow: string;
  title: string;
  headline: string;
  headlineMuted: string;
  description: string;
  ctaLabel: string;
  secondaryCta?: { label: string };
  badge?: string;
  showcaseDescription?: string;
  workflowEyebrow?: string;
  workflowTitle?: string;
  workflowTitleMuted?: string;
  features: Array<{ title: string; description: string }>;
  highlights: string[];
  detailSections?: Array<{
    eyebrow?: string;
    title: string;
    titleMuted?: string;
    items: Array<{ title: string; description: string }>;
  }>;
  workflowSteps?: Array<{ title: string; description: string }>;
};

function mergeFeatures(
  base: ProductFeature[],
  localized: Array<{ title: string; description: string }>,
): ProductFeature[] {
  return localized.map((item, index) => ({
    ...item,
    icon: base[index]?.icon,
  }));
}

function mergeDetailSections(
  base: ProductDetailSection[] | undefined,
  localized: LocalizedPageText['detailSections'],
): ProductDetailSection[] | undefined {
  if (!localized) return base;

  return localized.map((section, sectionIndex) => ({
    eyebrow: section.eyebrow,
    title: section.title,
    titleMuted: section.titleMuted,
    items: section.items.map((item, itemIndex) => ({
      ...item,
      icon: base?.[sectionIndex]?.items[itemIndex]?.icon,
    })),
  }));
}

function mergeWorkflowSteps(
  base: ProductWorkflowStep[] | undefined,
  localized: LocalizedPageText['workflowSteps'],
): ProductWorkflowStep[] | undefined {
  return localized ?? base;
}

type ProductsMessages = {
  products: {
    pages: Record<ProductSlug, LocalizedPageText>;
  };
};

export function useLocalizedProductPage(slug: ProductSlug): ProductPageContent {
  const base = PRODUCT_PAGES[slug];
  const messages = useMessages() as ProductsMessages;
  const rawPage = messages.products.pages[slug];

  const text = {
    eyebrow: rawPage.eyebrow,
    title: rawPage.title,
    headline: rawPage.headline,
    headlineMuted: rawPage.headlineMuted,
    description: rawPage.description,
    ctaLabel: rawPage.ctaLabel,
    badge: rawPage.badge,
    showcaseDescription: rawPage.showcaseDescription,
    workflowEyebrow: rawPage.workflowEyebrow,
    workflowTitle: rawPage.workflowTitle,
    workflowTitleMuted: rawPage.workflowTitleMuted,
    features: rawPage.features,
    highlights: rawPage.highlights,
    detailSections: rawPage.detailSections,
    workflowSteps: rawPage.workflowSteps,
    secondaryCta: rawPage.secondaryCta
      ? { label: rawPage.secondaryCta.label, href: base.secondaryCta?.href ?? '/pricing' }
      : base.secondaryCta,
  };

  return {
    ...base,
    ...text,
    features: mergeFeatures(base.features, text.features),
    detailSections: mergeDetailSections(base.detailSections, text.detailSections),
    workflowSteps: mergeWorkflowSteps(base.workflowSteps, text.workflowSteps),
  };
}
