import { getMessages, type AppLocale } from '@/lib/i18n';
import { BLOG_POST_MEDIA } from '@/lib/blog-post-media';

export const BLOG_POST_SLUGS = [
  'online-stores-launch',
  'smart-forms-google-sheets',
  'enterprise-solutions',
  'webhooks-and-apis',
  'unified-analytics',
] as const;

export type BlogPostSlug = (typeof BLOG_POST_SLUGS)[number];

export type BlogBodyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] };

export type LocalizedBlogPost = {
  slug: BlogPostSlug;
  categoryKey: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  coverImage: string;
  coverAlt: string;
  blocks: BlogBodyBlock[];
  relatedHref: string;
};

const RELATED_HREFS: Record<BlogPostSlug, string> = {
  'online-stores-launch': '/products/stores',
  'smart-forms-google-sheets': '/products/forms',
  'enterprise-solutions': '/enterprise',
  'webhooks-and-apis': '/developers',
  'unified-analytics': '/products/analytics',
};

type RawBlogPost = {
  slug: BlogPostSlug;
  categoryKey: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  coverAlt: string;
  blocks: BlogBodyBlock[];
};

export function isBlogPostSlug(value: string): value is BlogPostSlug {
  return BLOG_POST_SLUGS.includes(value as BlogPostSlug);
}

export function getLocalizedBlogPost(
  slug: string,
  locale: AppLocale,
): LocalizedBlogPost | undefined {
  if (!isBlogPostSlug(slug)) return undefined;

  const { blog } = getMessages(locale);
  const post = (blog.posts as RawBlogPost[]).find((item) => item.slug === slug);
  if (!post) return undefined;

  return {
    slug: post.slug,
    categoryKey: post.categoryKey,
    category: blog.categories[post.categoryKey as keyof typeof blog.categories],
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    readMinutes: post.readMinutes,
    coverImage: BLOG_POST_MEDIA[post.slug].cover,
    coverAlt: post.coverAlt,
    blocks: post.blocks,
    relatedHref: RELATED_HREFS[post.slug],
  };
}

export function getBlogPostNotFoundTitle(locale: AppLocale): string {
  return getMessages(locale).blog.notFound;
}

export function getBlogPostCover(slug: BlogPostSlug): string {
  return BLOG_POST_MEDIA[slug].cover;
}
