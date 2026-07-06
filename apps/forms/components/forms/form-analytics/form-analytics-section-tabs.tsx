'use client';

import { useState, type ReactNode } from 'react';
import {
  BarChart3,
  CalendarRange,
  Eye,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  formWorkspaceTabClassName,
  formWorkspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

export type FormAnalyticsSectionId =
  | 'filters'
  | 'intro'
  | 'visits'
  | 'advanced';

const SECTIONS: {
  id: FormAnalyticsSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'filters', label: 'الفترة', icon: CalendarRange },
  { id: 'intro', label: 'مقدمة', icon: Sparkles },
  { id: 'visits', label: 'الزيارات', icon: Eye },
  { id: 'advanced', label: 'التحليلات المتقدمة', icon: BarChart3 },
];

export function FormAnalyticsSectionTabs({
  defaultSection = 'intro',
  panels,
}: {
  defaultSection?: FormAnalyticsSectionId;
  panels: Record<FormAnalyticsSectionId, ReactNode>;
}) {
  const [active, setActive] = useState<FormAnalyticsSectionId>(defaultSection);

  return (
    <div className="space-y-6">
      <nav
        className={cn(formWorkspaceTabGroupClassName, 'gap-1.5 sm:gap-2')}
        aria-label="أقسام التحليلات"
        role="tablist"
      >
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;

          return (
            <button
              key={section.id}
              type="button"
              aria-selected={isActive}
              role="tab"
              onClick={() => setActive(section.id)}
              className={formWorkspaceTabClassName(
                isActive,
                'min-w-0 shrink px-3 sm:min-w-[5.5rem] sm:px-4',
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">{panels[active]}</div>
    </div>
  );
}
