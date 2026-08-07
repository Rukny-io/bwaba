'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  ImageIcon,
  MessageSquare,
  Package,
  Phone,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { FormType } from '@/lib/forms-api';
import { FormCoverUpload } from '@/components/forms/form-create/form-cover-upload';
import {
  FormCreatePill,
  FormCreateTypeTile,
} from '@/components/forms/form-create/form-create-primitives';
import { cn } from '@/lib/utils';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

const FORM_TYPE_OPTIONS: {
  value: FormType;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    value: 'FEEDBACK',
    label: 'ملاحظات',
    hint: 'آراء وتقييمات العملاء',
    icon: MessageSquare,
  },
  {
    value: 'SURVEY',
    label: 'استبيان',
    hint: 'أسئلة واستطلاعات الرأي',
    icon: ClipboardList,
  },
  {
    value: 'CONTACT',
    label: 'تواصل',
    hint: 'رسائل وطلبات التواصل',
    icon: Phone,
  },
  {
    value: 'REGISTRATION',
    label: 'تسجيل',
    hint: 'حضور، اشتراك، أو فعاليات',
    icon: UserPlus,
  },
  {
    value: 'ORDER',
    label: 'طلب',
    hint: 'طلبات شراء ومنتجات',
    icon: Package,
  },
  {
    value: 'OTHER',
    label: 'أخرى',
    hint: 'نموذج مخصّص حسب حاجتك',
    icon: FileQuestion,
  },
];

interface FormCreateHeaderProps {
  formId: string;
  title: string;
  description: string;
  type: FormType;
  coverUrl: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTypeChange: (value: FormType) => void;
  onCoverChange: (url: string | null) => void;
  onTitleBlur: () => void;
  onDescriptionBlur: () => void;
}

function useAutoResizeTextarea(
  value: string,
  ref: RefObject<HTMLTextAreaElement | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);
}

export function FormCreateHeader({
  formId,
  title,
  description,
  type,
  coverUrl,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
  onCoverChange,
  onTitleBlur,
  onDescriptionBlur,
}: FormCreateHeaderProps) {
  const [coverExpanded, setCoverExpanded] = useState(Boolean(coverUrl));
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(description, descriptionRef);

  const showCoverEditor = Boolean(coverUrl) || coverExpanded;

  return (
    <header className="group/header relative mb-6 sm:mb-8">
      {showCoverEditor ? (
        <div className="relative -mx-1 mb-5 sm:-mx-2 sm:mb-6">
          <FormCoverUpload
            formId={formId}
            coverUrl={coverUrl}
            onCoverChange={(url) => {
              onCoverChange(url);
              if (!url) setCoverExpanded(false);
            }}
            embedded
          />
        </div>
      ) : (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setCoverExpanded(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <ImageIcon className="size-3.5" />
            إضافة غلاف
          </button>
        </div>
      )}

      <section className="form-create-header-fields mb-6 space-y-4 sm:mb-8 sm:space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="form-title"
              className="text-xs font-semibold text-[var(--foreground)] sm:text-[13px]"
            >
              عنوان النموذج
            </label>
            {title.trim() ? (
              <span className="text-[10px] tabular-nums text-[var(--muted-foreground)] sm:text-[11px]">
                {title.length}/{TITLE_MAX}
              </span>
            ) : null}
          </div>
          <input
            id="form-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            autoFocus
            placeholder="مثال: استبيان رضا العملاء"
            maxLength={TITLE_MAX}
            className={cn(
              'w-full rounded-2xl border border-transparent bg-[var(--surface)] px-3.5 py-3 text-xl font-bold leading-[1.2] tracking-tight outline-none transition-colors sm:px-4 sm:py-3.5 sm:text-[2rem]',
              'placeholder:text-[var(--muted-foreground)]/45',
              'focus:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]',
              title.trim()
                ? 'text-[var(--foreground)]'
                : 'text-[var(--foreground)]',
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="form-description"
              className="text-xs font-semibold text-[var(--foreground)] sm:text-[13px]"
            >
              الوصف
              <span className="ms-1 font-normal text-[var(--muted-foreground)]">
                (اختياري)
              </span>
            </label>
            {description.trim() ? (
              <span className="text-[10px] tabular-nums text-[var(--muted-foreground)] sm:text-[11px]">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            ) : null}
          </div>
          <textarea
            ref={descriptionRef}
            id="form-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={onDescriptionBlur}
            placeholder="يظهر للمستجيب تحت العنوان — سطر أو سطرين يكفي عادةً"
            maxLength={DESCRIPTION_MAX}
            rows={2}
            className={cn(
              'w-full resize-none overflow-hidden rounded-2xl border border-transparent bg-[var(--surface)] px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors sm:px-4 sm:py-3.5 sm:text-[15px]',
              'placeholder:text-[var(--muted-foreground)]/45',
              'focus:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]',
              description.trim()
                ? 'text-[var(--muted-foreground)]'
                : 'text-[var(--foreground)]',
            )}
          />
        </div>
      </section>

      <section className="form-create-type-picker mt-6 space-y-3.5 sm:mt-7 sm:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <FormCreatePill label="نوع النموذج" />
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:max-w-[16rem] sm:text-end sm:text-[13px]">
            اختر التصنيف الأنسب — سنقترح حقولاً جاهزة
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5"
          role="radiogroup"
          aria-label="نوع النموذج"
        >
          {FORM_TYPE_OPTIONS.map((opt) => (
            <FormCreateTypeTile
              key={opt.value}
              label={opt.label}
              hint={opt.hint}
              icon={opt.icon}
              isActive={type === opt.value}
              onClick={() => onTypeChange(opt.value)}
            />
          ))}
        </div>
      </section>
    </header>
  );
}
