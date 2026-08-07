'use client';

import Link from 'next/link';
import {
  Gauge,
  LayoutGrid,
  Link2,
  Palette,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { cn } from '@/lib/utils';

export type SettingsSectionId = 'overview' | 'account' | 'preferences' | 'links';

const SECTION_ITEMS: {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'overview', label: 'عامة', icon: Gauge },
  { id: 'account', label: 'الحساب', icon: UserCircle },
  { id: 'preferences', label: 'تفضيلات', icon: Palette },
  { id: 'links', label: 'روابط', icon: Link2 },
];

function DockItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  href,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        'relative flex h-[42px] items-center justify-center rounded-[20px] px-3.5 transition-all duration-200',
        isActive
          ? 'gap-1.5 bg-[var(--foreground)] text-[var(--background)] shadow-md'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon
        size={18}
        strokeWidth={isActive ? 2.2 : 1.7}
        className="shrink-0"
      />
      {isActive ? (
        <span className="whitespace-nowrap text-[12px] font-bold tracking-tight">
          {label}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className="flex">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className="flex bg-transparent p-0"
    >
      {inner}
    </button>
  );
}

interface SettingsMobileDockProps {
  section: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
}

/** Bottom nav for settings — same visual language as app MobileDock */
export function SettingsMobileDock({
  section,
  onSectionChange,
}: SettingsMobileDockProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            'linear-gradient(to top, var(--background) 35%, transparent 100%)',
        }}
      />
      <div className="pointer-events-auto relative mb-3 flex justify-center">
        <nav
          dir="rtl"
          aria-label="أقسام الإعدادات"
          className="flex items-center gap-0.5 rounded-[26px] border border-[var(--border)] bg-[var(--surface)]/95 px-[5px] py-1 shadow-xl backdrop-blur-[32px]"
        >
          <DockItem
            href={APP_BASE}
            icon={LayoutGrid}
            label="الرئيسية"
            isActive={false}
          />
          <div className="mx-0.5 h-4 w-px shrink-0 rounded-[1px] bg-[var(--border)]" />
          {SECTION_ITEMS.map((item) => (
            <DockItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={section === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
