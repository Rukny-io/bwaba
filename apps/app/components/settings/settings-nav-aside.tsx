'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  SETTINGS_SECTIONS,
  parseSettingsSection,
  type SettingsSectionId,
} from '@/lib/settings/sections';
import { cn } from '@/lib/utils';

function SettingsNavButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full flex-col items-start gap-0.5 rounded-xl px-3.5 py-2.5 text-start transition-colors',
        active
          ? 'bg-[var(--foreground)] text-[var(--background)]'
          : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
      )}
    >
      <span className="text-[13px] font-medium leading-snug">{label}</span>
      <span
        className={cn(
          'text-[11px] leading-relaxed',
          active ? 'text-[var(--background)]/75' : 'text-[var(--muted-foreground)]',
        )}
      >
        {description}
      </span>
    </button>
  );
}

export function SettingsNavAside() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseSettingsSection(searchParams.get('section'));

  const setSection = useCallback(
    (id: SettingsSectionId) => {
      if (!pathname?.startsWith('/app/settings')) return;
      const params = new URLSearchParams(searchParams.toString());
      if (id === 'basics') {
        params.delete('section');
      } else {
        params.set('section', id);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <aside
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col px-4 pb-8 pt-4"
      aria-label="أقسام الإعدادات"
    >
      <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        الإعدادات
      </p>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {SETTINGS_SECTIONS.map((section) => (
          <SettingsNavButton
            key={section.id}
            active={active === section.id}
            label={section.label}
            description={section.description}
            onClick={() => setSection(section.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

/** Horizontal nav for viewports without the side column */
export function SettingsNavMobile() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseSettingsSection(searchParams.get('section'));

  const setSection = useCallback(
    (id: SettingsSectionId) => {
      if (!pathname?.startsWith('/app/settings')) return;
      const params = new URLSearchParams(searchParams.toString());
      if (id === 'basics') {
        params.delete('section');
      } else {
        params.set('section', id);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="أقسام الإعدادات"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setSection(section.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
              isActive
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
            )}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}
