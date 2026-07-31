'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { FormThemeProvider } from '@/components/forms/form-theme-provider';
import { parseFormTheme, type FormTheme } from '@/lib/form-theme';
import { cn } from '@/lib/utils';

export function PublicFormStatusCard({
  variant,
  title,
  message,
  theme: rawTheme,
  embed = false,
}: {
  variant: 'success' | 'unavailable';
  title: string;
  message: string;
  theme?: FormTheme | Record<string, unknown> | null;
  embed?: boolean;
}) {
  const theme = parseFormTheme(rawTheme);
  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <FormThemeProvider theme={theme} className="form-themed--wayl">
      <div
        className={cn(
          'public-form-page public-form-page--wayl flex items-center justify-center px-4',
          embed ? 'min-h-[280px] py-10' : 'min-h-dvh py-16',
        )}
      >
        <div
          className={cn(
            'public-form-status-card w-full max-w-md rounded-3xl border px-8 py-10 text-center',
            isSuccess
              ? 'border-[color-mix(in_srgb,var(--form-primary)_22%,var(--form-input-border))] bg-[var(--form-card)]'
              : 'border-[var(--form-input-border)] bg-[var(--form-card)]',
          )}
          style={{
            boxShadow: 'var(--form-input-shadow, 0 4px 24px rgba(15, 23, 42, 0.06))',
          }}
        >
          <div
            className={cn(
              'mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl',
              isSuccess
                ? 'bg-[color-mix(in_srgb,var(--form-primary)_12%,var(--form-card))] text-[var(--form-primary)]'
                : 'bg-[color-mix(in_srgb,var(--form-input-border)_40%,var(--form-card))] text-[var(--form-text-body)]',
            )}
          >
            <Icon className="size-7" strokeWidth={2} aria-hidden />
          </div>
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--form-text-heading)' }}
          >
            {title}
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: 'var(--form-text-body)' }}
          >
            {message}
          </p>
        </div>
      </div>
    </FormThemeProvider>
  );
}
