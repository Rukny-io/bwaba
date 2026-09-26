'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDocGuides } from '@/lib/use-localized-marketing-content';
import { agLayout } from '@/lib/public-antigravity-theme';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PublicAgDocsView() {
  const t = useTranslations('docs');
  const guides = useDocGuides();
  const reduceMotion = useReducedMotion();

  return (
    <div className={`${agLayout.container} pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16`}>
      <motion.header
        className="mx-auto max-w-3xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h1 className={`${agLayout.sectionTitle} mt-4`}>
          {t('title')}
          <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
        </h1>
        <p className={`${agLayout.lead} mx-auto mt-5 max-w-2xl`}>{t('lead')}</p>
      </motion.header>

      <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => {
          const className =
            'flex h-full flex-col rounded-[2rem] bg-[#FAFAFA] p-7 transition-colors hover:bg-[#F5F5F5] sm:p-8';
          const body = (
            <>
              <span className={agLayout.pill}>{guide.category}</span>
              <h2 className="mt-5 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {guide.title}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-[1.8] text-[#6B6F76]">
                {guide.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1D]">
                {t('readGuide')}
                <ArrowLeft className="size-3.5 opacity-60 rtl:rotate-180" aria-hidden />
              </span>
            </>
          );

          return (
            <motion.div
              key={guide.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.04, ease: EASE }}
            >
              {guide.external ? (
                <a href={guide.href} className={className}>
                  {body}
                </a>
              ) : (
                <Link href={guide.href} className={className}>
                  {body}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 rounded-[2rem] bg-[#1D1D1D] p-8 text-white sm:mt-16 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-start">
            <p className="text-[12px] font-medium tracking-[0.14em] text-white/55">
              {t('cta.eyebrow')}
            </p>
            <h2 className="mt-3 text-[1.35rem] font-medium tracking-[-0.02em]">
              {t('cta.title')}
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-[1.8] text-white/70">
              {t('cta.lead')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/support"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#1D1D1D]"
            >
              {t('cta.supportCenter')}
            </Link>
            <a
              href="mailto:support@rukny.io"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white"
            >
              support@rukny.io
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
