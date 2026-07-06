'use client';

import { Clock, Layers, Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';
import { FORM_TYPE_STYLES } from '@/lib/form-type-styles';
import { getFormTypeLabel } from '@/lib/forms-format';
import {
  getTemplateFieldCount,
  TEMPLATE_CATEGORY_LABELS,
  type FormTemplateDefinition,
} from '@/lib/form-templates';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: FormTemplateDefinition;
  busy?: boolean;
  onPreview: (template: FormTemplateDefinition) => void;
  onUse: (template: FormTemplateDefinition) => void;
  compact?: boolean;
}

export function TemplateCard({
  template,
  busy,
  onPreview,
  onUse,
  compact,
}: TemplateCardProps) {
  const typeStyle = FORM_TYPE_STYLES[template.formType];
  const TypeIcon = typeStyle.icon;
  const fieldCount = getTemplateFieldCount(template);

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 shadow-sm shadow-black/[0.02] transition-colors hover:border-[var(--border)] sm:rounded-3xl sm:p-5',
        compact && 'p-3.5 sm:p-4',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl text-white',
            typeStyle.bg,
          )}
        >
          <TypeIcon className="size-5" strokeWidth={1.8} />
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {template.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft-lime)] px-2 py-0.5 text-[10px] font-semibold text-[var(--foreground)]">
              <Sparkles className="size-3" />
              مميز
            </span>
          ) : null}
          {template.popular ? (
            <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
              شائع
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
          {template.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
          {template.description}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
        <span>{getFormTypeLabel(template.formType)}</span>
        <span>·</span>
        <span>{TEMPLATE_CATEGORY_LABELS[template.category]}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3" />
          {fieldCount} حقول
        </span>
        {template.estimatedMinutes ? (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />~{template.estimatedMinutes} د
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="tertiary"
          size="sm"
          className="flex-1 rounded-xl"
          isDisabled={busy}
          onPress={() => onPreview(template)}
        >
          معاينة
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1 rounded-xl"
          isDisabled={busy}
          onPress={() => onUse(template)}
        >
          {busy ? 'جاري الإنشاء…' : 'استخدام'}
        </Button>
      </div>
    </article>
  );
}
