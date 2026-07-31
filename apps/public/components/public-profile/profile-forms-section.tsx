'use client';

import type { PublicProfileForm } from './types';
import { PublicFormCard } from './public-form-card';

interface ProfileFormsSectionProps {
  forms: PublicProfileForm[];
  preview?: boolean;
  showHeading?: boolean;
  heading?: string;
  emptyMessage?: string;
}

export function ProfileFormsSection({
  forms,
  preview,
  showHeading = false,
  heading = 'النماذج',
  emptyMessage,
}: ProfileFormsSectionProps) {
  if (forms.length === 0) {
    if (!emptyMessage) return null;
    return (
      <p className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <section className="space-y-2.5">
      {showHeading ? (
        <p className="px-1 text-center text-[11px] font-bold tracking-wide text-[var(--muted-foreground)]">
          {heading}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {forms.map((form) => (
          <PublicFormCard key={form.id} form={form} preview={preview} />
        ))}
      </div>
    </section>
  );
}
