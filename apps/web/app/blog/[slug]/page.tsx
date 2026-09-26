import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicAgBlogArticleView } from '@/components/marketing/public-ag-blog-article-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import {
  BLOG_POST_SLUGS,
  getBlogPostNotFoundTitle,
  getLocalizedBlogPost,
} from '@/lib/blog-posts';
import { getLocale } from '@/lib/i18n-server';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_POST_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getLocalizedBlogPost(slug, locale);

  if (!post) {
    return { title: getBlogPostNotFoundTitle(locale) };
  }

  return {
    title: `${post.title} — Rukny`,
    description: post.excerpt,
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getLocalizedBlogPost(slug, locale);

  if (!post) notFound();

  return (
    <PublicMarketingShell smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgBlogArticleView post={post} />
      </main>
    </PublicMarketingShell>
  );
}
