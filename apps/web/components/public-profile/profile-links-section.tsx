'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProfileLinkGroup } from './profile-link-group';
import type { PublicLinkGroup, PublicSocialLink } from './types';
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

export type PublicLinkBlock =
  | { type: 'flat'; rows: ProfileLinkRow[] }
  | { type: 'group'; group: PublicLinkGroup; rows: ProfileLinkRow[] };

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

function sortPublicLinks(a: PublicSocialLink, b: PublicSocialLink) {
  const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
  if (pinDiff !== 0) return pinDiff;
  return a.displayOrder - b.displayOrder;
}

export function buildPublicLinkBlocks(
  links: PublicSocialLink[],
  groups: PublicLinkGroup[] = [],
): PublicLinkBlock[] {
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  const knownGroupIds = new Set(sortedGroups.map((group) => group.id));
  const blocks: PublicLinkBlock[] = [];

  const ungrouped = links
    .filter((link) => !link.groupId || !knownGroupIds.has(link.groupId))
    .sort(sortPublicLinks);

  if (ungrouped.length > 0) {
    blocks.push({ type: 'flat', rows: groupProfileLinkRows(ungrouped) });
  }

  for (const group of sortedGroups) {
    const groupLinks = links
      .filter((link) => link.groupId === group.id)
      .sort(sortPublicLinks);
    if (groupLinks.length === 0) continue;
    blocks.push({
      type: 'group',
      group,
      rows: groupProfileLinkRows(groupLinks),
    });
  }

  return blocks;
}

function renderRows(
  rows: ProfileLinkRow[],
  renderLink: (link: PublicSocialLink) => ReactNode,
  reduceMotion: boolean | null,
  compact: boolean,
) {
  return rows.map((row) =>
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
  );
}

interface ProfileLinksSectionProps {
  blocks: PublicLinkBlock[];
  linkCount: number;
  compact?: boolean;
  showHeading?: boolean;
  heading?: string;
  renderLink: (link: PublicSocialLink) => ReactNode;
}

export function ProfileLinksSection({
  blocks,
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
          className="flex items-center gap-2 px-1"
          variants={reduceMotion ? undefined : HEADING_MOTION}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
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
              compact ? 'text-xs' : 'text-sm sm:text-[15px]',
            )}
          >
            {resolvedHeading}
          </h2>
          <span
            className={cn(
              'font-semibold tabular-nums text-[var(--muted-foreground)]',
              compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
            )}
            dir="ltr"
          >
            {linkCount}
          </span>
        </motion.div>
      ) : null}

      <motion.div
        className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2')}
        variants={reduceMotion ? undefined : LIST_STAGGER}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
      >
        {blocks.map((block) => {
          if (block.type === 'flat') {
            return (
              <div key="flat-links" className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2')}>
                {renderRows(block.rows, renderLink, reduceMotion, compact)}
              </div>
            );
          }

          const groupLinkCount = block.rows.reduce(
            (count, row) =>
              count + (row.type === 'cards' ? row.links.length : 1),
            0,
          );

          return (
            <motion.div
              key={block.group.id}
              variants={reduceMotion ? undefined : LIST_ITEM}
            >
              <ProfileLinkGroup
                group={block.group}
                linkCount={groupLinkCount}
                compact={compact}
              >
                {renderRows(block.rows, renderLink, reduceMotion, compact)}
              </ProfileLinkGroup>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
