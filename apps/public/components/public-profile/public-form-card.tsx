'use client';

import { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { PublicProfileForm } from './types';
import { useMediaUrl } from './media-url-context';
import { cn } from './utils';

const FORM_TYPE_LABELS: Record<string, string> = {
  CONTACT: 'تواصل',
  SURVEY: 'استبيان',
  REGISTRATION: 'تسجيل',
  ORDER: 'طلب',
  FEEDBACK: 'ملاحظات',
  QUIZ: 'اختبار',
  APPLICATION: 'طلب التحاق',
  OTHER: 'أخرى',
};

interface PublicFormCardProps {
  form: PublicProfileForm;
  preview?: boolean;
}

export function PublicFormCard({ form, preview }: PublicFormCardProps) {
  const resolveMedia = useMediaUrl();
  const [coverFailed, setCoverFailed] = useState(false);
  const coverSrc = resolveMedia(form.coverImage);
  const showCover = Boolean(coverSrc) && !coverFailed;
  const typeLabel = FORM_TYPE_LABELS[form.type] ?? form.type;

  const body = (
    <>
      <div className="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-3xl bg-[var(--surface-secondary)]">
        {showCover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc!}
              alt=""
              loading="lazy"
              onError={() => setCoverFailed(true)}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-secondary)]">
            <FileText className="size-8 text-[var(--muted-foreground)]/35" />
          </div>
        )}

        <span className="absolute top-2 start-2 z-10 rounded-lg bg-black/45 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-md sm:text-[10px]">
          {typeLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-0.5 text-right">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-bold leading-snug text-[var(--foreground)] sm:text-[14px]">
          {form.title}
        </h3>

        <p
          className={cn(
            'line-clamp-2 min-h-[2.6em] text-[11px] leading-relaxed sm:text-[12px]',
            form.description
              ? 'text-[var(--muted-foreground)]'
              : 'invisible',
          )}
          aria-hidden={!form.description}
        >
          {form.description || '—'}
        </p>

        <span
          className={cn(
            'mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-bold',
            'bg-[var(--foreground)] text-[var(--background)]',
            'transition-opacity group-hover:opacity-90',
          )}
        >
          افتح
          <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
        </span>
      </div>
    </>
  );

  const className = cn(
    'group flex h-full flex-col rounded-4xl border border-[var(--border)] bg-[var(--surface)] p-2.5 sm:p-3',
    'shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all duration-300',
    !preview &&
      'hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] active:scale-[0.99]',
    preview && 'pointer-events-none',
  );

  if (preview) {
    return (
      <article className={className} aria-label={form.title}>
        {body}
      </article>
    );
  }

  return (
    <a href={`/f/${form.slug}`} className={className} aria-label={form.title}>
      {body}
    </a>
  );
}
