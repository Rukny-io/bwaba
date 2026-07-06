'use client';

import { HELP_RESOURCE_LINKS } from '@/lib/help/help-content';
import { HelpLinkChip } from '@/components/help/help-link';
import { HelpSectionHeader } from '@/components/help/help-section-header';
import { cn } from '@/lib/utils';

export function HelpResourceLinks({ className }: { className?: string }) {
  return (
    <section className={cn('bg-card rounded-3xl border border-[var(--border)] p-6 space-y-4', className)}>
      <HelpSectionHeader
        title="روابط مفيدة"
        description="انتقل مباشرة إلى أقسام لوحة Forms"
      />
      <div className="flex flex-wrap gap-2">
        {HELP_RESOURCE_LINKS.map((link) => (
          <HelpLinkChip key={link.id} href={link.href} label={link.label} />
        ))}
      </div>
    </section>
  );
}
