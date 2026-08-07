'use client';

import { Link2 } from 'lucide-react';
import { HELP_RESOURCE_LINKS } from '@/lib/help/help-content';
import { HelpLinkChip } from '@/components/help/help-link';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { cn } from '@/lib/utils';

export function HelpResourceLinks({ className }: { className?: string }) {
  return (
    <SettingsSectionCard
      icon={Link2}
      title="روابط مفيدة"
      description="انتقل مباشرة إلى أقسام لوحة Forms"
      className={className}
    >
      <div className={cn('flex flex-wrap gap-2')}>
        {HELP_RESOURCE_LINKS.map((link) => (
          <HelpLinkChip key={link.id} href={link.href} label={link.label} />
        ))}
      </div>
    </SettingsSectionCard>
  );
}
