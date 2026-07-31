'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FORM_SUBMIT_LABEL,
  getFormSubmitLabel,
} from '@/lib/form-theme';
import type { FormTheme } from '@/lib/form-theme';
import { cn } from '@/lib/utils';

interface FormCreateSubmitPreviewProps {
  theme: FormTheme;
  hasFields: boolean;
  onSubmitLabelChange: (submitLabel: string) => void;
}

export function FormCreateSubmitPreview({
  theme,
  hasFields,
  onSubmitLabelChange,
}: FormCreateSubmitPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLabel = getFormSubmitLabel(theme);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitLabel = useCallback(() => {
    const next = draft.trim() || DEFAULT_FORM_SUBMIT_LABEL;
    onSubmitLabelChange(next);
    setEditing(false);
  }, [draft, onSubmitLabelChange]);

  function startEditing() {
    setDraft(theme.submitLabel?.trim() || DEFAULT_FORM_SUBMIT_LABEL);
    setEditing(true);
  }

  if (!hasFields) return null;

  return (
    <div className="mt-10 border-t border-[var(--border)]/50 pt-8">
      <p className="mb-3 text-xs text-[var(--muted-foreground)]">
        <span className="font-medium text-[var(--foreground)]">زر الإرسال</span>
        {' — '}
        اضغط على الزر لتغيير النص
      </p>
      <div className="public-form-submit-row">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={48}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitLabel();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
              }
            }}
            className={cn(
              'public-form-submit public-form-submit--themed',
              'min-w-[8rem] max-w-full border-2 border-white/40 bg-transparent text-center outline-none',
              'ring-2 ring-[var(--form-primary)]/30',
            )}
            aria-label="نص زر الإرسال"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className={cn(
              'public-form-submit public-form-submit--themed',
              'inline-flex cursor-text items-center justify-center gap-2',
              'transition-opacity hover:opacity-95',
            )}
            aria-label={`تعديل نص زر الإرسال: ${submitLabel}`}
          >
            {submitLabel}
            <span className="text-[0.85em] opacity-75">(بعد النشر)</span>
          </button>
        )}
      </div>
    </div>
  );
}
