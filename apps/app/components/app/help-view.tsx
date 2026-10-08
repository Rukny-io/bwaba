'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function HelpCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--surface)] p-4 sm:p-5',
        className,
      )}
    >
      <h2 className="text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function HelpView() {
  const { t } = useTranslations();

  return (
    <div className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:pt-6">
      <HelpCard title={t('help.title')}>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t('help.description')}
        </p>
      </HelpCard>

      <HelpCard title={t('help.gettingStarted')}>
        <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          <li>{t('help.step1')}</li>
          <li>{t('help.step2')}</li>
          <li>{t('help.step3')}</li>
        </ol>
      </HelpCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <HelpCard title={t('help.storeTitle')}>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t('help.storeBody')}
          </p>
        </HelpCard>

        <HelpCard title={t('help.needHelpTitle')}>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t('help.needHelpBody')}
          </p>
          <a
            href="mailto:support@rukny.io"
            className="mt-1 inline-flex w-fit text-sm font-medium text-[var(--foreground)] underline underline-offset-4"
          >
            {t('help.contactSupport')}
          </a>
        </HelpCard>
      </div>
    </div>
  );
}
