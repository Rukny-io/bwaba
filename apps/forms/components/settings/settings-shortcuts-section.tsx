import { ArrowLeft, BarChart2, FileText, LayoutTemplate, Users } from 'lucide-react';
import {
  SettingsPanel,
  SettingsRow,
  SettingsRowDivider,
} from '@/components/settings/settings-primitives';
import { APP_BASE } from '@/components/app/nav-config';

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
    <SettingsPanel title="اختصارات سريعة" description="انتقل مباشرة إلى أقسام التطبيق الأخرى.">
      {SHORTCUTS.map((item, index) => (
        <div key={item.href}>
          {index > 0 ? <SettingsRowDivider /> : null}
          <SettingsRow
            href={item.href}
            icon={item.icon}
            title={item.title}
            subtitle={item.description}
            trailing={
              <ArrowLeft
                className="size-4 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
                strokeWidth={1.75}
                aria-hidden
              />
            }
          />
        </div>
      ))}
    </SettingsPanel>
  );
}
