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
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

const FORM_TYPE_OPTIONS: { value: FormType; label: string; icon: LucideIcon }[] = [
  { value: 'FEEDBACK', label: 'ملاحظات', icon: MessageSquare },
  { value: 'SURVEY', label: 'استبيان', icon: ClipboardList },
  { value: 'CONTACT', label: 'تواصل', icon: Phone },
  { value: 'REGISTRATION', label: 'تسجيل', icon: UserPlus },
  { value: 'ORDER', label: 'طلب', icon: Package },
  { value: 'QUIZ', label: 'اختبار', icon: GraduationCap },
  { value: 'APPLICATION', label: 'التحاق', icon: BookOpen },
  { value: 'OTHER', label: 'أخرى', icon: FileQuestion },
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
  const [hovered, setHovered] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(description, descriptionRef);

  const showCoverEditor = Boolean(coverUrl) || coverExpanded;

  return (
    <header
      className="group/header relative mb-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showCoverEditor ? (
        <div className="relative -mx-4 mb-6 sm:-mx-6">
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
      ) : null}

      {!showCoverEditor ? (
        <div
          className={cn(
            'mb-1 h-6 overflow-hidden transition-opacity duration-200',
            'opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100',
            hovered && 'sm:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => setCoverExpanded(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <ImageIcon className="size-3.5" />
            إضافة غلاف
          </button>
        </div>
      ) : null}

      <div className="space-y-1">
        <input
          id="form-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          autoFocus
          placeholder="عنوان النموذج"
          maxLength={TITLE_MAX}
          className={cn(
            'w-full border-0 bg-transparent p-0 text-3xl font-bold leading-[1.15] tracking-tight outline-none sm:text-[2.75rem]',
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

      <div className="mt-6 space-y-2.5">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          نوع النموذج
        </p>
        <div
          className={cn(pillTabGroupClassName, 'justify-start gap-1.5 sm:gap-2')}
          role="radiogroup"
          aria-label="نوع النموذج"
        >
          {FORM_TYPE_OPTIONS.map((opt) => {
            const selected = type === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onTypeChange(opt.value)}
                className={pillTabClassName(
                  selected,
                  'inline-flex items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2',
                )}
              >
                <Icon className="size-3.5 shrink-0 sm:size-4" strokeWidth={1.8} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
