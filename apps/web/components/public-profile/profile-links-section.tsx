'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PublicSocialLink } from './types';
import { cn } from './utils';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const LIST_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const LIST_ITEM: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
};

const HEADING_MOTION: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
};

export type ProfileLinkRow =
  | { type: 'cards'; links: PublicSocialLink[] }
  | { type: 'single'; link: PublicSocialLink };

export function isProfileCardLink(link: PublicSocialLink): boolean {
  return link.layout === 'profile_card';
}

export function groupProfileLinkRows(links: PublicSocialLink[]): ProfileLinkRow[] {
  const rows: ProfileLinkRow[] = [];
  let cardBuffer: PublicSocialLink[] = [];

  const flushCards = () => {
    if (cardBuffer.length === 0) return;
    rows.push({ type: 'cards', links: cardBuffer });
    cardBuffer = [];
  };

  for (const link of links) {
    if (isProfileCardLink(link)) {
      cardBuffer.push(link);
      continue;
    }
    flushCards();
    rows.push({ type: 'single', link });
  }

  flushCards();
  return rows;
}

interface ProfileLinksSectionProps {
  rows: ProfileLinkRow[];
  linkCount: number;
  compact?: boolean;
  showHeading?: boolean;
  heading?: string;
  renderLink: (link: PublicSocialLink) => ReactNode;
}

export function ProfileLinksSection({
  rows,
  linkCount,
  compact = false,
  showHeading = true,
  heading,
  renderLink,
}: ProfileLinksSectionProps) {
  const t = useTranslations('publicProfile.sections');
  const resolvedHeading = heading ?? t('myLinks');
  const reduceMotion = useReducedMotion();

  if (linkCount === 0) return null;

  return (
    <section
      className={cn(
        'profile-links-chrome',
        compact ? 'space-y-3 pt-1' : 'space-y-4 pt-2 sm:space-y-4',
      )}
      aria-label={resolvedHeading}
    >
      {showHeading ? (
        <motion.div
          className="flex items-center gap-3 sm:gap-4"
          variants={reduceMotion ? undefined : HEADING_MOTION}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
        >
          <div className="h-px flex-1 bg-[var(--border)] opacity-60" aria-hidden />
          <div
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full',
              'bg-[var(--surface-secondary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[var(--border)]',
              compact ? 'px-3 py-1' : 'px-3.5 py-1.5',
            )}
          >
            <Link2
              className={cn(
                'shrink-0 text-[var(--muted-foreground)]',
                compact ? 'size-3' : 'size-3.5',
              )}
              strokeWidth={2}
              aria-hidden
            />
            <h2
              className={cn(
                'font-bold tracking-tight text-[var(--foreground)]',
                compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
              )}
            >
              {resolvedHeading}
            </h2>
            <span
              className={cn(
                'inline-flex min-w-[1.25rem] items-center justify-center rounded-full',
                'bg-[var(--foreground)] font-bold tabular-nums text-[var(--background)]',
                compact ? 'px-1.5 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]',
              )}
              dir="ltr"
            >
              {linkCount}
            </span>
          </div>
          <div className="h-px flex-1 bg-[var(--border)] opacity-60" aria-hidden />
        </motion.div>
      ) : null}

      <motion.div
        className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2')}
        variants={reduceMotion ? undefined : LIST_STAGGER}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
      >
        {rows.map((row) =>
          row.type === 'cards' ? (
            <motion.div
              key={`cards-${row.links.map((link) => link.id).join('-')}`}
              variants={reduceMotion ? undefined : LIST_ITEM}
            >
              <div
                className={cn(
                  'grid grid-cols-2',
                  compact ? 'gap-2' : 'gap-2.5 sm:gap-3',
                )}
              >
                {row.links.map((link) => renderLink(link))}
              </div>
            </motion.div>
          ) : (
            <motion.div key={row.link.id} variants={reduceMotion ? undefined : LIST_ITEM}>
              {renderLink(row.link)}
            </motion.div>
          ),
        )}
      </motion.div>
    </section>
  );
}
