'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from './utils';

export type ProfileContentTab = 'links' | 'products' | 'forms';

export type ProfileContentTabItem = {
  id: ProfileContentTab;
  label: string;
  count: number;
};

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

interface ProfileContentTabsProps {
  tabs: ProfileContentTabItem[];
  activeTab: ProfileContentTab;
  onTabChange: (tab: ProfileContentTab) => void;
  children: ReactNode;
  className?: string;
}

export function ProfileContentTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: ProfileContentTabsProps) {
  const reduceMotion = useReducedMotion();
  const showTabBar = tabs.length > 1;

  return (
    <div className={cn('space-y-4 pt-2 sm:space-y-5', className)}>
      {showTabBar ? (
        <div
          className="flex rounded-full bg-[var(--surface-secondary)] p-1"
          role="tablist"
          aria-label="Profile content"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`profile-tab-panel-${tab.id}`}
                id={`profile-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'profile-tab-pill min-w-0 flex-1',
                  isActive ? 'profile-tab-pill-active' : 'profile-tab-pill-idle border-transparent bg-transparent',
                )}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    isActive
                      ? 'bg-[var(--profile-tab-active-fg)]/15 text-[var(--profile-tab-active-fg)]'
                      : 'bg-[var(--foreground)]/8 text-[var(--muted-foreground)]',
                  )}
                  dir="ltr"
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          id={`profile-tab-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={showTabBar ? `profile-tab-${activeTab}` : undefined}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE_OUT }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function resolveDefaultProfileTab(
  initialProductId: string | null,
  counts: { links: number; products: number; forms: number },
): ProfileContentTab {
  if (initialProductId && counts.products > 0) return 'products';
  if (counts.links > 0) return 'links';
  if (counts.products > 0) return 'products';
  if (counts.forms > 0) return 'forms';
  return 'links';
}
