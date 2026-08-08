'use client';

import { useState, type ReactNode } from 'react';
import {
  BarChart3,
  CalendarRange,
  Eye,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { pillTabClassName } from '@/components/ui/pill-tab';
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
    <div className="flex flex-col gap-6 sm:gap-8">
      <nav
        className="flex flex-wrap items-center justify-center gap-2"
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
              className={cn(
                pillTabClassName(isActive),
                'inline-flex items-center gap-2',
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
