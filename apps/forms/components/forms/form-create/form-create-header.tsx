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

      <div className="mb-6 space-y-1 sm:mb-8">
        <input
          id="form-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          autoFocus
          placeholder="عنوان النموذج"
          maxLength={TITLE_MAX}
          className={cn(
            'w-full border-0 bg-transparent p-0 text-2xl font-bold leading-[1.15] tracking-tight outline-none sm:text-[2.25rem]',
            title.trim()
              ? 'text-[var(--foreground)]'
              : 'text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/35',
          )}
        />

        <textarea
          ref={descriptionRef}
          id="form-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onDescriptionBlur}
          placeholder="وصف قصير (اختياري)"
          maxLength={DESCRIPTION_MAX}
          rows={1}
          className={cn(
            'w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-base leading-relaxed outline-none',
            description.trim()
              ? 'text-[var(--muted-foreground)]'
              : 'text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40',
          )}
        />
      </div>

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
