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
  /** @deprecated Kept for API compat — layout is unified for grid alignment */
  compact?: boolean;
}

export function TemplateCard({
  template,
  busy,
  onPreview,
  onUse,
}: TemplateCardProps) {
  const typeStyle = FORM_TYPE_STYLES[template.formType];
  const TypeIcon = typeStyle.icon;
  const fieldCount = getTemplateFieldCount(template);

  return (
    <article
      className={cn(
        'dashboard-card group flex h-full min-h-0 flex-col rounded-2xl p-3.5 transition-colors sm:rounded-3xl sm:p-4',
        'hover:border-[color-mix(in_srgb,var(--border)_70%,var(--primary)_30%)]',
        busy && 'pointer-events-none opacity-60',
      )}
    >
      {/* Cover — fixed height across all cards */}
      <div className="relative mb-3 h-[4.75rem] shrink-0 overflow-hidden rounded-2xl sm:h-[5.25rem]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(6,44,48,0.1),transparent_55%),linear-gradient(160deg,var(--surface-secondary)_0%,var(--surface)_55%,var(--surface-tertiary)_100%)]" />
        <div
          className={cn(
            'absolute inset-0 opacity-[0.12] dark:opacity-[0.18]',
            typeStyle.bg,
          )}
        />

        <div
          className={cn(
            'absolute start-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-xl bg-[var(--surface)]/90 shadow-sm backdrop-blur-sm sm:size-9',
            typeStyle.color,
          )}
        >
          <TypeIcon className="size-4" strokeWidth={1.8} />
        </div>

        <div className="absolute end-2.5 top-2.5 z-10 flex h-6 items-center gap-1">
          {template.featured ? (
            <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-[var(--surface)]/90 px-2 text-[10px] font-semibold text-[var(--foreground)] shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3 shrink-0 text-[var(--primary)]" />
              مميز
            </span>
          ) : null}
          {template.popular ? (
            <span className="inline-flex h-6 items-center rounded-lg bg-[var(--surface)]/90 px-2 text-[10px] font-semibold text-[var(--muted-foreground)] shadow-sm backdrop-blur-sm">
              شائع
            </span>
          ) : null}
        </div>
      </div>

      {/* Text block — fixed line heights for row alignment */}
      <div className="min-w-0">
        <h3 className="line-clamp-1 min-h-[1.375rem] text-sm font-semibold leading-snug text-[var(--foreground)] sm:min-h-[1.5rem] sm:text-[15px]">
          {template.title}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:min-h-[2.625rem] sm:text-[13px]">
          {template.description}
        </p>
      </div>

      {/* Meta — single non-wrapping row */}
      <div className="mt-2.5 flex min-h-[1.25rem] items-center gap-2 overflow-hidden text-[11px] text-[var(--muted-foreground)]">
        <span className="shrink-0 font-medium text-[var(--foreground)]/80">
          {getFormTypeLabel(template.formType)}
        </span>
        <span className="shrink-0 text-[var(--border)]" aria-hidden>
          ·
        </span>
        <span className="min-w-0 truncate">
          {TEMPLATE_CATEGORY_LABELS[template.category]}
        </span>
        <span className="shrink-0 text-[var(--border)]" aria-hidden>
          ·
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          <Layers className="size-3" />
          {fieldCount}
        </span>
        <span className="shrink-0 text-[var(--border)]" aria-hidden>
          ·
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
          <Clock className="size-3" />
          {template.estimatedMinutes
            ? `~${template.estimatedMinutes} د`
            : '—'}
        </span>
      </div>

      {/* Actions — pinned to bottom, equal width */}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Button
          variant="tertiary"
          size="sm"
          className="w-full rounded-xl"
          isDisabled={busy}
          onPress={() => onPreview(template)}
        >
          معاينة
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="w-full rounded-xl"
          isDisabled={busy}
          onPress={() => onUse(template)}
        >
          {busy ? 'جاري الإنشاء…' : 'استخدام'}
        </Button>
      </div>
    </article>
  );
}
