'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { FormCreateSlashMenu } from '@/components/forms/form-create/blocks/form-create-slash-menu';
import type { FormType } from '@/lib/forms-api';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

const INSERT_HINTS: Partial<Record<FormType, string>> = {
  QUIZ: 'لإضافة سؤال',
  SURVEY: 'لإضافة حقل استبيان',
  FEEDBACK: 'لإضافة حقل ملاحظات',
  CONTACT: 'لإضافة حقل تواصل',
  REGISTRATION: 'لإضافة حقل تسجيل',
  ORDER: 'لإضافة حقل طلب',
  APPLICATION: 'لإضافة حقل',
  OTHER: 'لإدراج حقل',
};

function getInsertHint(formType: FormType): string {
  return INSERT_HINTS[formType] ?? 'لإدراج حقل';
}

interface FormCreateInsertLineProps {
  formType: FormType;
  onInsert: (type: WizardFieldType) => void;
  onOpenCatalog?: () => void;
  onUseTemplate?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function FormCreateInsertLine({
  formType,
  onInsert,
  onOpenCatalog,
  onUseTemplate,
  autoFocus = false,
  className,
}: FormCreateInsertLineProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const slashQuery = value.startsWith('/') ? value.slice(1) : '';
  const showHint = !value && !focused;
  const hint = getInsertHint(formType);

  function handleChange(next: string) {
    setValue(next);
    setMenuOpen(next.startsWith('/'));
  }

  function handlePick(type: WizardFieldType) {
    onInsert(type);
    setValue('');
    setMenuOpen(false);
    inputRef.current?.focus();
  }

  function handleFocus() {
    setFocused(true);
  }

  function handleBlur(e: React.FocusEvent) {
    const related = e.relatedTarget as Node | null;
    if (containerRef.current?.contains(related)) return;
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setFocused(false);
        setMenuOpen(false);
        setValue('');
      }
    }, 120);
  }

  function openCatalog() {
    onOpenCatalog?.();
  }

  return (
    <div
      ref={containerRef}
      className={cn('group relative flex items-start gap-1.5 py-1', className)}
    >
      <div
        className={cn(
          'flex shrink-0 items-center pt-1 transition-opacity',
          'opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100',
        )}
      >
        <button
          type="button"
          onClick={openCatalog}
          className="flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          aria-label="فتح كatalog الحقول"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div
        className="relative min-w-0 flex-1 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {showHint ? (
          <div
            className="pointer-events-none absolute inset-y-0 start-0 z-0 flex items-center gap-1.5 py-2 text-sm text-[var(--muted-foreground)]/55"
            aria-hidden
          >
            <span>اضغط</span>
            <kbd className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--muted-foreground)]">
              /
            </kbd>
            <span>{hint}…</span>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          className={cn(
            'relative z-[1] w-full border-0 bg-transparent py-2 text-sm outline-none',
            'text-[var(--foreground)] caret-[var(--foreground)]',
          )}
          aria-label="إدراج حقل جديد"
        />

        <AnimatePresence>
          {menuOpen ? (
            <FormCreateSlashMenu
              open={menuOpen}
              query={slashQuery}
              formType={formType}
              onPick={handlePick}
              onUseTemplate={onUseTemplate}
              onClose={() => {
                setMenuOpen(false);
                setValue('');
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
