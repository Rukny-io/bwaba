'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PublicAgBlogArticleBody } from '@/components/marketing/public-ag-blog-article-body';
import { getDirection, type AppLocale } from '@/lib/i18n';
import type { LocalizedBlogPost } from '@/lib/blog-posts';
import { agLayout } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

type PublicAgBlogArticleViewProps = {
  post: LocalizedBlogPost;
};

export function PublicAgBlogArticleView({ post }: PublicAgBlogArticleViewProps) {
  const t = useTranslations('blog.article');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const BackArrow = direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <article className="m-auto max-w-2xl px-5 pb-20 pt-10 md:pt-24 xl:px-0">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
      >
        <BackArrow className="size-4 rtl:rotate-180" aria-hidden />
        {t('backToBlog')}
      </Link>

      <header className="mt-8 text-start sm:mt-10">
        <span className={agLayout.pill}>{post.category}</span>
        <h1 className="mt-5 text-balance text-[clamp(1.75rem,4.5vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.03em] text-[#1D1D1D]">
          {post.title}
        </h1>
        <p className="mt-4 text-[14px] text-[#9CA3AF]">
          <span dir="ltr" lang="en" className="tabular-nums">
            {post.date}
          </span>
          <span aria-hidden className="mx-2">
            ·
          </span>
          {t('readTime', { minutes: post.readMinutes })}
        </p>
      </header>

      <PublicAgBlogArticleBody blocks={post.blocks} />

      <div className="mt-12 border-t border-[#EBEBEB] pt-8">
        <Link
          href={post.relatedHref}
          className={cn(
            agLayout.btnSecondary,
            'inline-flex h-11 items-center gap-1.5 px-5',
          )}
        >
          {t('relatedCta')}
          <ArrowLeft className="size-4 opacity-60 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
