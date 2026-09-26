'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, type AppLocale } from '@/lib/i18n';
import { agLayout } from '@/lib/public-antigravity-theme';
import { useBlogPosts, type BlogPost } from '@/lib/use-localized-marketing-content';
import { siteUrls } from '@/lib/site-urls';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

function PostMeta({
  post,
  readTimeLabel,
  className,
}: {
  post: BlogPost;
  readTimeLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <span className={agLayout.pill}>{post.category}</span>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
        <Calendar className="size-3.5" aria-hidden />
        <span dir="ltr" lang="en" className="tabular-nums">
          {post.date}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
        <Clock className="size-3.5" aria-hidden />
        {readTimeLabel}
      </span>
    </div>
  );
}

function FeaturedPost({
  post,
  featuredLabel,
  readMore,
  readTimeLabel,
  reduceMotion,
  direction,
}: {
  post: BlogPost;
  featuredLabel: string;
  readMore: string;
  readTimeLabel: string;
  reduceMotion: boolean | null;
  direction: 'rtl' | 'ltr';
}) {
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
      className="overflow-hidden rounded-[2rem] bg-[#FAFAFA] sm:rounded-[2.5rem]"
    >
      <Link
        href={post.href}
        className="group grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
      >
        <div className="relative min-h-[14rem] overflow-hidden sm:min-h-[16rem]">
          <Image
            src={post.coverImage}
            alt={post.coverAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 520px"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1D1D1D]/45 via-transparent to-[#1D1D1D]/10"
            aria-hidden
          />
          <div className="relative z-10 flex h-full min-h-[14rem] flex-col p-6 sm:min-h-[16rem] sm:p-8">
            <span className="text-[12px] font-medium tracking-[0.14em] text-white/85">
              {featuredLabel}
            </span>
            <span
              className={cn(
                agLayout.pill,
                'absolute bottom-6 end-6 bg-white/90 sm:bottom-8 sm:end-8',
              )}
            >
              {post.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 text-start sm:p-8 lg:p-10">
          <PostMeta post={post} readTimeLabel={readTimeLabel} className="mb-5" />
          <h2 className="text-balance text-[clamp(1.35rem,3vw,1.85rem)] font-medium leading-[1.25] tracking-[-0.03em] text-[#1D1D1D]">
            {post.title}
          </h2>
          <p className="mt-4 line-clamp-4 text-[15px] leading-[1.8] text-[#6B6F76]">
            {post.excerpt}
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1D1D1D] transition-opacity group-hover:opacity-70">
            {readMore}
            <Arrow className="size-4" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function PublicAgBlogView() {
  const t = useTranslations('blog');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const reduceMotion = useReducedMotion();
  const posts = useBlogPosts();
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all');

  const categories = useMemo(
    () => [...new Set(posts.map((post) => post.categoryKey))],
    [posts],
  );

  const filteredPosts = useMemo(
    () =>
      activeCategory === 'all'
        ? posts
        : posts.filter((post) => post.categoryKey === activeCategory),
    [activeCategory, posts],
  );

  const featuredPost = filteredPosts[0];

  return (
    <div className={`${agLayout.container} pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16`}>
      <motion.header
        className="mx-auto max-w-3xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h1 className={`${agLayout.sectionTitle} mt-4`}>
          {t('title')}
          <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
        </h1>
        <p className={`${agLayout.lead} mx-auto mt-5 max-w-2xl`}>{t('lead')}</p>
      </motion.header>

      <div className="mt-10 sm:mt-12">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t('filterAria')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
              activeCategory === 'all'
                ? 'bg-[#1D1D1D] text-white'
                : 'bg-[#F5F5F5] text-[#6B6F76] hover:bg-[#EBEBEB] hover:text-[#1D1D1D]',
            )}
          >
            {t('filterAll')}
          </button>
          {categories.map((categoryKey) => (
            <button
              key={categoryKey}
              type="button"
              role="tab"
              aria-selected={activeCategory === categoryKey}
              onClick={() => setActiveCategory(categoryKey)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                activeCategory === categoryKey
                  ? 'bg-[#1D1D1D] text-white'
                  : 'bg-[#F5F5F5] text-[#6B6F76] hover:bg-[#EBEBEB] hover:text-[#1D1D1D]',
              )}
            >
              {t(`categories.${categoryKey}`)}
            </button>
          ))}
        </div>
      </div>

      {featuredPost ? (
        <div className="mt-8 sm:mt-10">
          <FeaturedPost
            post={featuredPost}
            featuredLabel={t('featured')}
            readMore={t('readMore')}
            readTimeLabel={t('readTime', { minutes: featuredPost.readMinutes })}
            reduceMotion={reduceMotion}
            direction={direction}
          />
        </div>
      ) : (
        <p className="mt-10 rounded-[2rem] bg-[#FAFAFA] px-6 py-10 text-center text-[15px] text-[#6B6F76]">
          {t('empty')}
        </p>
      )}

      <div className="mt-12 rounded-[2rem] bg-[#1D1D1D] p-8 text-white sm:mt-16 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-start">
            <p className="text-[12px] font-medium tracking-[0.14em] text-white/55">
              {t('cta.eyebrow')}
            </p>
            <h2 className="mt-3 text-[1.35rem] font-medium tracking-[-0.02em]">
              {t('cta.title')}
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-[1.8] text-white/70">
              {t('cta.lead')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={siteUrls.accounts}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#1D1D1D]"
            >
              {t('cta.startFree')}
            </Link>
            <Link
              href="/developers"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white"
            >
              {t('cta.developers')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
