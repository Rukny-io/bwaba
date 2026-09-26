import type { BlogPostSlug } from '@/lib/blog-posts';

export const BLOG_POST_MEDIA: Record<BlogPostSlug, { cover: string }> = {
  'online-stores-launch': {
    cover: '/blog/covers/online-stores-launch.jpg',
  },
  'smart-forms-google-sheets': {
    cover: '/blog/covers/smart-forms-google-sheets.jpg',
  },
  'enterprise-solutions': {
    cover: '/blog/covers/enterprise-solutions.jpg',
  },
  'webhooks-and-apis': {
    cover: '/blog/covers/webhooks-and-apis.jpg',
  },
  'unified-analytics': {
    cover: '/blog/covers/unified-analytics.jpg',
  },
};
