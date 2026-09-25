'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, type AppLocale } from '@/lib/i18n';
import { agLayout, productTints } from '@/lib/public-antigravity-theme';
import { useProductBlocks, type ProductBlock } from '@/lib/use-product-blocks';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

function ProductShowcase({
  block,
  reduceMotion,
  layout = 'desktop',
  exploreCta,
}: {
  block: ProductBlock;
  reduceMotion: boolean | null;
  layout?: 'mobile' | 'desktop';
  exploreCta: string;
}) {
  const Icon = block.icon;
  const isMobile = layout === 'mobile';

  return (
    <motion.div
      key={block.id}
      initial={reduceMotion ? false : { opacity: 0, y: isMobile ? 12 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isMobile ? 0.45 : 0.8, ease: EASE }}
      className={cn(
        'relative flex h-full flex-col justify-between',
        isMobile
          ? 'min-h-[18.5rem] rounded-[1.5rem] p-5 sm:min-h-[19rem] sm:p-6'
          : 'min-h-[24rem] rounded-[2rem] p-8 sm:min-h-[26rem] sm:p-10 md:min-h-[28rem] md:p-12',
        productTints[block.id],
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute select-none font-medium leading-none tracking-[-0.06em] text-[#1D1D1D]/[0.06]',
          isMobile
            ? 'bottom-0 end-0 text-[clamp(3rem,18vw,4.5rem)]'
            : '-bottom-4 end-4 text-[clamp(5rem,16vw,9rem)]',
        )}
        aria-hidden
      >
        {block.index}
      </span>

      <div className="relative">
        <div
          className={cn(
            'flex items-center justify-center rounded-[1rem] bg-white/70',
            isMobile ? 'size-12 sm:size-14' : 'size-16 sm:size-[4.5rem]',
          )}
        >
          <Icon
            className={cn('text-[#1D1D1D]/75', isMobile ? 'size-6' : 'size-8')}
            strokeWidth={1.35}
          />
        </div>
        <p
          className={cn(
            'font-medium tracking-[0.14em] text-[#6B6F76]',
            isMobile ? 'mt-5 text-[11px]' : 'mt-8 text-[12px]',
          )}
        >
          {block.subtitle}
        </p>
        <h3
          className={cn(
            'mt-1.5 font-medium leading-[1.15] tracking-[-0.03em] text-[#1D1D1D]',
            isMobile
              ? 'text-[1.35rem] sm:text-[1.5rem]'
              : 'text-[clamp(1.5rem,3vw,2.25rem)]',
          )}
        >
          {block.title}
        </h3>
      </div>

      <div
        className={cn(
          'relative',
          isMobile ? 'mt-5 flex flex-col items-start' : 'mt-8',
        )}
      >
        <p
          className={cn(
            'leading-[1.75] text-[#6B6F76]',
            isMobile ? 'max-w-[85%] text-[14px]' : 'max-w-md text-[15px] sm:text-[16px] sm:leading-[1.8]',
          )}
        >
          {block.description}
        </p>
        <Link
          href={block.href}
          className={cn(
            agLayout.btnPrimary,
            isMobile
              ? 'mt-4 h-9 self-start px-4 text-[13px]'
              : 'mt-8',
          )}
        >
          {exploreCta}
        </Link>
      </div>
    </motion.div>
  );
}

function MobileProductsCarousel({
  reduceMotion,
  blocks,
  exploreCta,
  carouselAria,
  tabsAria,
  swipeHint,
  direction,
}: {
  reduceMotion: boolean | null;
  blocks: ProductBlock[];
  exploreCta: string;
  carouselAria: string;
  tabsAria: string;
  swipeHint: string;
  direction: 'rtl' | 'ltr';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveFromScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-product-card]'),
    );
    if (cards.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateActiveFromScroll();

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveFromScroll);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateActiveFromScroll);
    };
  }, [updateActiveFromScroll]);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>(
      `[data-product-card="${index}"]`,
    );
    card?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
    setActiveIndex(index);
  };

  return (
    <div className="lg:hidden">
      <div
        ref={scrollRef}
        className="products-mobile-carousel -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        dir="ltr"
        aria-label={carouselAria}
      >
        {blocks.map((block, index) => (
          <article
            key={block.id}
            data-product-card={index}
            className="w-[min(88vw,22rem)] shrink-0 snap-center"
            dir={direction}
            aria-label={block.title}
          >
            <ProductShowcase
              block={block}
              reduceMotion={reduceMotion}
              layout="mobile"
              exploreCta={exploreCta}
            />
          </article>
        ))}
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label={tabsAria}
      >
        {blocks.map((block, index) => (
          <button
            key={block.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={block.title}
            onClick={() => scrollToIndex(index)}
            className={cn(
              'rounded-full transition-all duration-300',
              index === activeIndex
                ? 'h-2.5 w-6 bg-[#1D1D1D]'
                : 'size-2 bg-[#D1D5DB]',
            )}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[12px] text-[#9CA3AF]">{swipeHint}</p>
    </div>
  );
}

function DesktopProductsExplorer({
  reduceMotion,
  blocks,
  exploreCta,
  listAria,
}: {
  reduceMotion: boolean | null;
  blocks: ProductBlock[];
  exploreCta: string;
  listAria: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = blocks[activeIndex]!;

  return (
    <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
      <div
        className="flex flex-col gap-1"
        role="tablist"
        aria-orientation="vertical"
        aria-label={listAria}
      >
        {blocks.map((block, index) => (
          <button
            key={block.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'cursor-pointer rounded-[1.25rem] px-5 py-5 text-start transition-colors',
              'min-h-11 touch-manipulation',
              index === activeIndex ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]/70',
            )}
          >
            <span className="block text-[15px] font-medium leading-snug text-[#1D1D1D]">
              {block.index} — {block.title}
            </span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="relative z-[1] min-w-0">
        <ProductShowcase
          block={active}
          reduceMotion={reduceMotion}
          layout="desktop"
          exploreCta={exploreCta}
        />
      </div>
    </div>
  );
}

export function PublicAgProductsSection() {
  const t = useTranslations('home.products');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const reduceMotion = useReducedMotion();
  const blocks = useProductBlocks();

  return (
    <section
      id="products"
      className={`${agLayout.sectionWhite} pb-14 pt-16 sm:pb-20 sm:pt-24 md:pt-28`}
      aria-labelledby="public-products-heading"
    >
      <div className={agLayout.container}>
        <motion.div
          className="mb-8 max-w-2xl sm:mb-12"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
          <h2 id="public-products-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('title')}
            <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
          </h2>
          <p className={`${agLayout.lead} mt-4 max-w-xl sm:mt-5`}>{t('lead')}</p>
        </motion.div>

        <MobileProductsCarousel
          reduceMotion={reduceMotion}
          blocks={blocks}
          exploreCta={t('exploreCta')}
          carouselAria={t('carouselAria')}
          tabsAria={t('tabsAria')}
          swipeHint={t('swipeHint')}
          direction={direction}
        />
        <DesktopProductsExplorer
          reduceMotion={reduceMotion}
          blocks={blocks}
          exploreCta={t('exploreCta')}
          listAria={t('listAria')}
        />
      </div>
    </section>
  );
}
