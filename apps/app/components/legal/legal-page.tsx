'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { DynamicIslandTOC } from '@/components/ui/dynamic-island-toc';
import { LegalDesktopToc } from '@/components/legal/legal-desktop-toc';
import { LegalSectionBlock } from '@/components/legal/legal-section';
import { useLegalLocale } from '@/components/legal/use-legal-locale';
import type { LegalDocumentContent } from '@/lib/legal/types';
import { cn } from '@/lib/utils';

type LegalPageKind = 'terms' | 'privacy';

interface LegalPageProps {
  kind: LegalPageKind;
  contentAr: LegalDocumentContent;
  contentEn: LegalDocumentContent;
}

const RELATED: Record<
  LegalPageKind,
  { href: string; labelAr: string; labelEn: string }
> = {
  terms: {
    href: '/privacy',
    labelAr: 'سياسة الخصوصية',
    labelEn: 'Privacy Policy',
  },
  privacy: {
    href: '/terms',
    labelAr: 'شروط الاستخدام',
    labelEn: 'Terms of Use',
  },
};

function LegalPageContent({ kind, contentAr, contentEn }: LegalPageProps) {
  const { isEn, toggleLocale } = useLegalLocale();
  const content = isEn ? contentEn : contentAr;
  const dir = isEn ? 'ltr' : 'rtl';
  const related = RELATED[kind];
  const reduceMotion = useReducedMotion();

  const tocItems = useMemo(
    () =>
      content.sections.map((section, index) => ({
        id: section.id,
        title: section.title,
        number: index + 1,
      })),
    [content.sections],
  );

  const fadeIn = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      };

  const sectionFade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.35, ease: 'easeOut' as const },
      };

  return (
    <div className="relative min-h-dvh bg-[var(--background)] text-[var(--foreground)]" dir={dir}>
      <div className="lg:hidden">
        <DynamicIslandTOC />
      </div>

      <header className="sticky top-0 z-20 border-b border-[var(--border)]/40 bg-[var(--background)]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6 lg:max-w-6xl">
          <Link href="/login" className="flex items-center gap-2.5">
            <Image
              src="/rukny-logo.svg"
              alt="Rukny"
              width={28}
              height={28}
              className="size-7"
              priority
            />
            <span className="text-sm font-medium tracking-tight text-[var(--foreground)]/90 sm:text-base">
              {isEn ? 'Rukny' : 'ركني'}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle
              labelLight={isEn ? 'Light mode' : 'الوضع الفاتح'}
              labelDark={isEn ? 'Dark mode' : 'الوضع الداكن'}
            />
            <button
              type="button"
              onClick={toggleLocale}
              className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              aria-label={isEn ? 'Language' : 'اللغة'}
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span>{isEn ? 'Language' : 'اللغة'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14 lg:max-w-6xl lg:pb-20">
        <motion.div {...fadeIn}>
          <header className="mb-10 border-b border-[var(--border)]/50 pb-8 text-start sm:mb-12 sm:pb-10 lg:mb-14 lg:border-0 lg:pb-0 lg:text-center">
            <p className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] lg:hidden">
              {isEn ? 'Legal' : 'قانوني'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl sm:leading-tight lg:mt-0 lg:text-[2.5rem]">
              {content.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted-foreground)] sm:text-[15px]">
              {isEn
                ? `This document is effective as of ${content.lastUpdated}.`
                : `تسري هذه الوثيقة اعتبارًا من ${content.lastUpdated}.`}
            </p>
          </header>

          <div className="lg:grid lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
            <LegalDesktopToc
              items={tocItems}
              isEn={isEn}
              className="hidden lg:block"
            />

            <article className={cn(isEn ? 'text-left' : 'text-right')}>
              <p className="mb-10 max-w-2xl text-[15px] leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8 lg:mb-12">
                {content.description}{' '}
                {isEn ? (
                  <>
                    See also our{' '}
                    <Link
                      href={related.href}
                      className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
                    >
                      {related.labelEn}
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    راجع أيضًا{' '}
                    <Link
                      href={related.href}
                      className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
                    >
                      {related.labelAr}
                    </Link>
                    .
                  </>
                )}
              </p>

              <div className="space-y-10 sm:space-y-12">
                {content.sections.map((section, index) => (
                  <motion.div key={section.id} {...sectionFade}>
                    <LegalSectionBlock
                      section={section}
                      index={index}
                      isEn={isEn}
                    />
                  </motion.div>
                ))}
              </div>

              <footer className="mt-14 border-t border-[var(--border)]/50 pt-8">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {isEn ? 'Related:' : 'ذات صلة:'}{' '}
                  <Link
                    href={related.href}
                    className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
                  >
                    {isEn ? related.labelEn : related.labelAr}
                  </Link>
                </p>
                <p className="mt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {isEn ? '← Back to sign in' : 'العودة لتسجيل الدخول ←'}
                  </Link>
                </p>
              </footer>
            </article>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export function LegalPage(props: LegalPageProps) {
  return (
    <ThemeProvider>
      <LegalPageContent {...props} />
    </ThemeProvider>
  );
}
