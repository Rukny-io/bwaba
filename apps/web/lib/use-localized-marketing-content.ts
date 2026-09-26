'use client';

import { useTranslations } from 'next-intl';
import { getBlogPostCover, type BlogPostSlug } from '@/lib/blog-posts';
import { siteUrls } from '@/lib/site-urls';

export type DocGuide = {
  title: string;
  description: string;
  href: string;
  category: string;
  external?: boolean;
};

export type SupportQuickLink = {
  title: string;
  text: string;
  href: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type DeveloperFeature = {
  title: string;
  description: string;
};

export type DeveloperLink = {
  label: string;
  href: string;
};

export type BlogPost = {
  slug: string;
  categoryKey: string;
  category: string;
  title: string;
  excerpt: string;
  href: string;
  date: string;
  readMinutes: number;
  coverImage: string;
  coverAlt: string;
};

const DOC_GUIDE_LINKS = [
  { href: siteUrls.accounts, external: true },
  { href: '/products/stores' },
  { href: '/products/forms' },
  { href: '/products/forms' },
  { href: '/products/profile' },
  { href: '/products/analytics' },
] as const;

const SUPPORT_QUICK_LINK_HREFS = ['/docs', '/pricing', '/enterprise'] as const;

const DEVELOPER_LINK_META = [
  { key: 'webhooks', href: `${siteUrls.developers}/documentation` },
  { key: 'embedForms', href: '/products/forms' },
  { key: 'docs', href: '/docs' },
  { key: 'support', href: '/support' },
] as const;

export function useDocGuides(): DocGuide[] {
  const t = useTranslations('docs');
  const guides = t.raw('guides') as Array<{
    category: string;
    title: string;
    description: string;
  }>;

  return guides.map((guide, index) => {
    const link = DOC_GUIDE_LINKS[index];
    return {
      ...guide,
      href: link.href,
      external: 'external' in link ? link.external : undefined,
    };
  });
}

export function useSupportQuickLinks(): SupportQuickLink[] {
  const t = useTranslations('support');
  const links = t.raw('quickLinks') as Array<{ title: string; text: string }>;

  return links.map((link, index) => ({
    ...link,
    href: SUPPORT_QUICK_LINK_HREFS[index],
  }));
}

export function useSupportFaqs(): FaqItem[] {
  const t = useTranslations('support.faq');
  return t.raw('items') as FaqItem[];
}

export function useDeveloperFeatures(): DeveloperFeature[] {
  const t = useTranslations('developers.features');
  return t.raw('items') as DeveloperFeature[];
}

export function useDeveloperLinks(): DeveloperLink[] {
  const t = useTranslations('developers.links');

  return DEVELOPER_LINK_META.map((link) => ({
    label: t(`items.${link.key}`),
    href: link.href,
  }));
}

export function useBlogPosts(): BlogPost[] {
  const t = useTranslations('blog');
  const posts = t.raw('posts') as Array<{
    slug: string;
    categoryKey: string;
    title: string;
    excerpt: string;
    date: string;
    readMinutes: number;
    coverAlt: string;
  }>;

  return posts.map((post) => ({
    ...post,
    category: t(`categories.${post.categoryKey}`),
    href: `/blog/${post.slug}`,
    coverImage: getBlogPostCover(post.slug as BlogPostSlug),
  }));
}
