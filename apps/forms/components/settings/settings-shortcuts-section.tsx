import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  FileText,
  LayoutTemplate,
  Users,
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
    href: `${APP_BASE}/templates`,
    icon: LayoutTemplate,
    title: 'القوالب',
    description: 'إنشاء نماذج من قوالب جاهزة.',
  },
  {
    href: `${APP_BASE}/analytics`,
    icon: BarChart2,
    title: 'التحليلات',
    description: 'نظرة عامة على المشاهدات والاستجابات.',
  },
  {
    href: `${APP_BASE}/team`,
    icon: Users,
    title: 'الفريق',
    description: 'دعوة الأعضاء وإدارة الصلاحيات.',
  },
] as const;

export function SettingsShortcutsSection() {
  return (
    <SettingsSectionCard
      icon={FileText}
      title="اختصارات سريعة"
      description="انتقل مباشرة إلى أقسام Forms الأخرى."
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 px-3.5 py-3 transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
                <Icon className="size-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--muted-foreground)]">
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
