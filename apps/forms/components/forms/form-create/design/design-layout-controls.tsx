'use client';

import type { ElementType, ReactNode } from 'react';
import { LayoutGrid, Maximize2, Rows3, Square } from 'lucide-react';
import {
  BORDER_RADIUS_OPTIONS,
  CARD_STYLE_OPTIONS,
  getBorderRadiusPreviewClass,
  MAX_WIDTH_OPTIONS,
  SHADOW_OPTIONS,
  SPACING_OPTIONS,
} from '@/lib/form-theme/layout-presets';
import type { FormTheme } from '@/lib/form-theme';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

interface DesignLayoutControlsProps {
  theme: FormTheme;
  onThemeChange: (theme: FormTheme) => void;
  embedded?: boolean;
}

function OptionGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
            <Icon className="size-4 text-[var(--muted-foreground)]" strokeWidth={1.8} />
          </div>
        ) : null}
        <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={pillTabClassName(
        active,
        cn(
          'inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2.5 text-sm',
          className,
        ),
      )}
    >
      {children}
    </button>
  );
}

export function DesignLayoutControls({
  theme,
  onThemeChange,
  embedded = false,
}: DesignLayoutControlsProps) {
  function patchLayout(patch: Partial<FormTheme['layout']>) {
    onThemeChange({
      ...theme,
      layout: { ...theme.layout, ...patch },
    });
  }

  const showShadow = theme.layout.cardStyle !== 'flat';

  return (
    <section
      className={cn(
        'space-y-6',
        !embedded && 'wizard-section-card',
      )}
    >
      <OptionGroup label="استدارة الزوايا" icon={Square}>
        <div className={cn(pillTabGroupClassName, 'justify-start gap-2.5')}>
          {BORDER_RADIUS_OPTIONS.map((opt) => (
            <PillButton
              key={opt.value}
              active={theme.layout.borderRadius === opt.value}
              onClick={() => patchLayout({ borderRadius: opt.value })}
            >
              <span
                aria-hidden
                className={cn(
                  'size-4 shrink-0 border-2 border-current bg-[var(--surface-secondary)]',
                  getBorderRadiusPreviewClass(opt.value),
                )}
              />
              {opt.label}
            </PillButton>
          ))}
        </div>
      </OptionGroup>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <OptionGroup label="شكل البطاقة" icon={LayoutGrid}>
          <div className={cn(pillTabGroupClassName, 'justify-start gap-2.5')}>
            {CARD_STYLE_OPTIONS.map((opt) => (
              <PillButton
                key={opt.value}
                active={theme.layout.cardStyle === opt.value}
                onClick={() =>
                  patchLayout({
                    cardStyle: opt.value,
                    shadow:
                      opt.value === 'flat' ? 'none' : theme.layout.shadow,
                  })
                }
              >
                {opt.label}
              </PillButton>
            ))}
          </div>
        </OptionGroup>

        {showShadow ? (
          <OptionGroup label="الظل">
            <div className={cn(pillTabGroupClassName, 'justify-start gap-2.5')}>
              {SHADOW_OPTIONS.map((opt) => (
                <PillButton
                  key={opt.value}
                  active={theme.layout.shadow === opt.value}
                  onClick={() => patchLayout({ shadow: opt.value })}
                >
                  {opt.label}
                </PillButton>
              ))}
            </div>
          </OptionGroup>
        ) : null}

        <OptionGroup label="المسافات" icon={Rows3}>
          <div className={cn(pillTabGroupClassName, 'justify-start gap-2.5')}>
            {SPACING_OPTIONS.map((opt) => (
              <PillButton
                key={opt.value}
                active={theme.layout.spacing === opt.value}
                onClick={() => patchLayout({ spacing: opt.value })}
              >
                {opt.label}
              </PillButton>
            ))}
          </div>
        </OptionGroup>

        {!embedded ? (
          <OptionGroup label="عرض النموذج" icon={Maximize2}>
            <div className={cn(pillTabGroupClassName, 'justify-start gap-2.5')}>
              {MAX_WIDTH_OPTIONS.map((opt) => (
                <PillButton
                  key={opt.value}
                  active={theme.layout.maxWidth === opt.value}
                  onClick={() => patchLayout({ maxWidth: opt.value })}
                >
                  {opt.label}
                </PillButton>
              ))}
            </div>
          </OptionGroup>
        ) : null}
      </div>
    </section>
  );
}
