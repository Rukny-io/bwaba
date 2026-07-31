import { FileText } from 'lucide-react';
import type { PublicProfileForm } from '../types';
import { ProfileLinkChevron } from './profile-platform-icon';
import { linkCardClass } from './profile-link-button';

interface ProfileFormsSectionProps {
  forms: PublicProfileForm[];
  preview?: boolean;
  showHeading?: boolean;
}

function FormLinkCard({
  form,
  preview,
}: {
  form: PublicProfileForm;
  preview?: boolean;
}) {
  const className = linkCardClass(preview);

  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--profile-accent-soft)] ring-1 ring-[var(--border)]">
        <FileText className="size-[1.15rem] text-[var(--primary)]" />
      </div>
      <div className="min-w-0 flex-1 text-center">
        <p className="truncate font-semibold text-[var(--foreground)]">{form.title}</p>
        {form.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {form.description}
          </p>
        ) : null}
      </div>
      <ProfileLinkChevron />
    </>
  );

  if (preview) {
    return (
      <div className={className} aria-label={form.title}>
        {content}
      </div>
    );
  }

  return (
    <a href={`/f/${form.slug}`} className={className}>
      {content}
    </a>
  );
}

export function ProfileFormsSection({ forms, preview, showHeading = true }: ProfileFormsSectionProps) {
  if (forms.length === 0) return null;

  return (
    <section className="space-y-2.5">
      {showHeading ? (
        <p className="px-1 text-center text-xs font-bold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
          النماذج
        </p>
      ) : null}
      <div className="flex flex-col gap-2.5">
        {forms.map((form) => (
          <FormLinkCard key={form.id} form={form} preview={preview} />
        ))}
      </div>
    </section>
  );
}
