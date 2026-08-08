import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SettingsPanel } from '@/components/settings/settings-primitives';
import { cn } from '@/lib/utils';

interface SettingsSectionCardProps {
  /** @deprecated Icons are no longer shown in section headers */
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Render children directly inside the surface (for row lists) */
  flush?: boolean;
  /** Render without bordered surface (for metric grids, etc.) */
  plain?: boolean;
  /** Border only — no filled surface background */
  bordered?: boolean;
}

export function SettingsSectionCard({
  title,
  description,
  children,
  className,
  flush = false,
  plain = false,
  bordered = false,
}: SettingsSectionCardProps) {
  const isFlush = flush || bordered;

  return (
    <SettingsPanel
      title={title}
      description={description}
      plain={plain}
      bordered={bordered}
      className={className}
    >
      {plain ? (
        children
      ) : isFlush ? (
        children
      ) : (
        <div className="p-4 sm:p-5">{children}</div>
      )}
    </SettingsPanel>
  );
}
