'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Code2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useDeveloperFeatures,
  useDeveloperLinks,
} from '@/lib/use-localized-marketing-content';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PublicAgDevelopersView() {
  const t = useTranslations('developers');
  const features = useDeveloperFeatures();
  const links = useDeveloperLinks();
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={siteUrls.developers} className={agLayout.btnPrimary}>
            {t('openPortal')}
          </a>
          <Link href="/docs" className={agLayout.btnSecondary}>
            {t('docs')}
          </Link>
        </div>
      </motion.header>

      <motion.div
        className="mx-auto mt-12 max-w-4xl rounded-[2rem] bg-[#F5F3FF] p-8 sm:mt-16 sm:p-10"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
      >
        <div className="flex items-start gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/75">
            <Code2 className="size-7 text-[#1D1D1D]/75" strokeWidth={1.35} />
          </div>
          <div className="text-start">
            <h2 className="text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
              {t('showcase.title')}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.8] text-[#6B6F76]">
              {t('showcase.lead')}
            </p>
          </div>
        </div>
      </motion.div>

      <section className="mt-16 sm:mt-20" aria-labelledby="developer-features-heading">
        <div className="mb-8 text-start sm:mb-10">
          <p className={agLayout.eyebrow}>{t('features.eyebrow')}</p>
          <h2 id="developer-features-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('features.title')}
            <span className="text-[#9CA3AF]">{t('features.titleMuted')}</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
              className="rounded-[2rem] bg-[#FAFAFA] p-7 sm:p-8"
            >
              <h3 className="text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="developer-links-heading">
        <div className="rounded-[2rem] bg-[#FAFAFA] p-7 sm:p-8">
          <h2 id="developer-links-heading" className="text-start text-[1.05rem] font-medium text-[#1D1D1D]">
            {t('links.title')}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 text-[14px] text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                >
                  {link.label}
                  <ArrowLeft className="size-3.5 opacity-50 rtl:rotate-180" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="developer-email-pricing-heading">
        <div className="mb-8 text-start sm:mb-10">
          <p className={agLayout.eyebrow}>{t('emailPricing.eyebrow')}</p>
          <h2 id="developer-email-pricing-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('emailPricing.title')}
            <span className="text-[#9CA3AF]">{t('emailPricing.titleMuted')}</span>
          </h2>
          <p className={`${agLayout.lead} mt-4 max-w-2xl`}>{t('emailPricing.lead')}</p>
        </div>

        <div className="overflow-x-auto rounded-[2rem] bg-[#FAFAFA] p-6 sm:p-8">
          <table className="w-full min-w-[32rem] border-collapse text-start text-[14px]">
            <thead>
              <tr className="text-[#6B6F76]">
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {(t.raw('emailPricing.rows') as Array<{ plan: string; price: string; volume: string }>).map(
                (row) => (
                  <tr key={row.plan} className="border-t border-[#ECECEC]">
                    <td className="py-3 font-medium text-[#1D1D1D]">{row.plan}</td>
                    <td className="py-3 text-[#1D1D1D]">{row.price}</td>
                    <td className="py-3 text-[#6B6F76]">{row.volume}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`${siteUrls.developers}/pricing/compare-resend`} className={agLayout.btnSecondary}>
              {t('emailPricing.compareCta')}
            </a>
            <a href={`${siteUrls.developers}/pricing`} className={agLayout.btnPrimary}>
              {t('emailPricing.portalCta')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
