import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  FileText,
  LayoutTemplate,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';

const SHORTCUTS = [
  {
    href: `${APP_BASE}/forms`,
    icon: FileText,
    title: 'نماذجي',
    description: 'إدارة النماذج وإعدادات كل نموذج.',
  },
  {
    href: `${APP_BASE}/analytics`,
    icon: BarChart2,
    title: 'التحليلات',
    description: 'نظرة عامة على المشاهدات والاستجابات.',
  },
  {
    href: `${APP_BASE}/templates`,
    icon: LayoutTemplate,
    title: 'القوالب',
    description: 'إنشاء نماذج من قوالب جاهزة.',
  },
] as const;

export function SettingsShortcutsSection() {
  return (
    <SettingsSectionCard
      icon={FileText}
      title="اختصارات"
      description="انتقل سريعاً إلى أقسام Forms الأخرى."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]">
                <Icon className="size-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
              <ArrowLeft
                className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </SettingsSectionCard>
  );
}
