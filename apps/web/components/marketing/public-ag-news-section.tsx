'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, type AppLocale } from '@/lib/i18n';
import { agLayout, productTints } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

const CARD_TINTS = [
  productTints.stores,
  productTints.forms,
  productTints.profile,
  productTints.analytics,
  productTints.ai,
] as const;

type NewsItem = {
  category: string;
  title: string;
  excerpt: string;
  href: string;
};

const NEWS_LINKS = [
  '/products/stores',
  '/products/forms',
  '/enterprise',
  '/developers',
  '/products/analytics',
] as const;

function useNewsItems(): NewsItem[] {
  const t = useTranslations('home.news');
  const items = t.raw('items') as Array<{
    category: string;
    title: string;
    excerpt: string;
  }>;

  return items.map((item, index) => ({
    ...item,
    href: NEWS_LINKS[index] ?? '/docs',
  }));
}

function NewsCard({
  item,
  tint,
  index,
  reduceMotion,
  direction,
  readMore,
}: {
  item: NewsItem;
  tint: string;
  index: number;
  reduceMotion: boolean | null;
  direction: 'rtl' | 'ltr';
  readMore: string;
}) {
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className="w-[min(72vw,17.5rem)] shrink-0 snap-start sm:w-[15.5rem]"
      dir={direction}
    >
      <Link
        href={item.href}
        className={cn(
          'group flex h-full min-h-[17.5rem] flex-col rounded-[1.75rem] p-4 transition-opacity hover:opacity-90 sm:min-h-[18.25rem] sm:p-5',
          tint,
        )}
      >
        <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-white/70">
          <div className="flex h-full flex-col justify-between bg-gradient-to-br from-white/90 to-white/40 p-4">
            <span className={agLayout.index}>{String(index + 1).padStart(2, '0')}</span>
            <span className={cn(agLayout.pill, 'w-fit bg-white/90')}>{item.category}</span>
          </div>
        </div>
        <h3 className="mt-4 line-clamp-3 text-[14px] font-medium leading-[1.55] tracking-[-0.02em] text-[#1D1D1D] sm:text-[15px]">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-4 flex-1 text-[12px] leading-[1.7] text-[#6B6F76] sm:text-[13px]">
          {item.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#1D1D1D] opacity-70 transition-opacity group-hover:opacity-100">
          {readMore}
          <Arrow className="size-3.5" aria-hidden />
        </span>
      </Link>
    </motion.article>
  );
}

type PublicAgNewsSectionProps = {
  variant?: 'section' | 'page';
};

export function PublicAgNewsSection({
  variant = 'section',
}: PublicAgNewsSectionProps) {
  const t = useTranslations('home.news');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const reduceMotion = useReducedMotion();
  const items = useNewsItems();
  const isPage = variant === 'page';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    const scrollPos = Math.abs(scrollLeft);

    setCanScrollBack(scrollPos > 8);
    setCanScrollForward(scrollPos < maxScroll - 8);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByCards = (direction: 'back' | 'forward') => {
    const container = scrollRef.current;
    if (!container) return;

    const amount = direction === 'forward' ? 320 : -320;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const HeadingTag = isPage ? 'h1' : 'h2';

  return (
    <section
      id="news"
      className={cn(
        agLayout.sectionWhite,
        isPage ? 'pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16' : 'py-16 sm:py-20 md:py-24',
      )}
      aria-labelledby="public-news-heading"
    >
      <div className={agLayout.container}>
        {isPage ? (
          <motion.header
            className="mx-auto mb-10 max-w-3xl text-center sm:mb-12"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
            <HeadingTag
              id="public-news-heading"
              className={`${agLayout.sectionTitle} mt-4`}
            >
              {t('title')}
              <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
            </HeadingTag>
            <p className={`${agLayout.lead} mx-auto mt-5 max-w-2xl`}>{t('lead')}</p>
          </motion.header>
        ) : (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
            <div className="max-w-xl text-start">
              <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
              <HeadingTag
                id="public-news-heading"
                className={`${agLayout.sectionTitle} mt-4`}
              >
                {t('title')}
                <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
              </HeadingTag>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70"
            >
              {t('viewAll')}
              <ArrowLeft className="size-4 opacity-60 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-white to-transparent transition-opacity sm:w-16',
              canScrollBack ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-white to-transparent transition-opacity sm:w-16',
              canScrollForward ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />

          <div className="absolute -top-12 end-0 hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards('back')}
              disabled={!canScrollBack}
              className="flex size-9 items-center justify-center rounded-full bg-[#FAFAFA] text-[#1D1D1D] transition-opacity hover:opacity-80 disabled:opacity-30"
              aria-label={t('scrollBack')}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards('forward')}
              disabled={!canScrollForward}
              className="flex size-9 items-center justify-center rounded-full bg-[#FAFAFA] text-[#1D1D1D] transition-opacity hover:opacity-80 disabled:opacity-30"
              aria-label={t('scrollForward')}
            >
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            dir="ltr"
            aria-label={t('carouselAria')}
          >
            {items.map((item, index) => (
              <NewsCard
                key={item.title}
                item={item}
                tint={CARD_TINTS[index % CARD_TINTS.length]}
                index={index}
                reduceMotion={reduceMotion}
                direction={direction}
                readMore={t('readMore')}
              />
            ))}
          </div>

          <p className="mt-4 text-center text-[12px] text-[#9CA3AF] sm:hidden">
            {t('swipeHint')}
          </p>
        </div>
      </div>
    </section>
  );
}
