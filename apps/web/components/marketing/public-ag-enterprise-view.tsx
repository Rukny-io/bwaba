'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  Check,
  Code2,
  Globe,
  Headphones,
  Mail,
  MessageCircle,
  Plug,
  Settings2,
  ShieldCheck,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { siteUrls } from '@/lib/site-urls';
import { agLayout } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const ENTERPRISE_TINT = 'bg-[#F5F3FF]';

type EnterpriseFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type DetailSection = {
  eyebrow: string;
  title: string;
  titleMuted: string;
  items: EnterpriseFeature[];
};

const SHOWCASE_ICONS = [Code2, MessageCircle, Mail] as const;

const SECTION_ITEM_ICONS: LucideIcon[][] = [
  [Users, Building2, BarChart3],
  [Code2, MessageCircle, Mail],
  [Webhook, Plug, Globe],
  [Settings2, ShieldCheck, Headphones],
];

function FeatureCard({
  feature,
  index,
  reduceMotion,
  surface = 'muted',
}: {
  feature: EnterpriseFeature;
  index: number;
  reduceMotion: boolean | null;
  surface?: 'muted' | 'white';
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className={cn(
        'rounded-[2rem] p-7 sm:p-8',
        surface === 'white' ? 'bg-white' : 'bg-[#FAFAFA]',
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white/80">
        <Icon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
        {feature.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">{feature.description}</p>
    </motion.div>
  );
}

export function PublicAgEnterpriseView() {
  const t = useTranslations('enterprise');
  const reduceMotion = useReducedMotion();

  const heroPills = t.raw('pills') as string[];
  const showcaseItems = t.raw('showcase.items') as Array<{ title: string; description: string }>;
  const sectionsRaw = t.raw('sections') as Array<{
    eyebrow: string;
    title: string;
    titleMuted: string;
    items: Array<{ title: string; description: string }>;
  }>;
  const highlights = t.raw('highlights.items') as string[];
  const steps = t.raw('steps.items') as Array<{ title: string; description: string }>;

  const detailSections: DetailSection[] = sectionsRaw.map((section, sectionIndex) => ({
    ...section,
    items: section.items.map((item, itemIndex) => ({
      ...item,
      icon: SECTION_ITEM_ICONS[sectionIndex]?.[itemIndex] ?? Building2,
    })),
  }));

  const contactEmail = t('contact.email');

  return (
    <div className={cn(agLayout.container, 'pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16')}>
      <motion.header
        className="mx-auto max-w-4xl text-start md:pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>{t('hero.eyebrow')}</p>
        <h1 className={`${agLayout.sectionTitle} mt-4 max-w-3xl`}>
          {t('hero.title')}
          <span className="text-[#9CA3AF]">{t('hero.titleMuted')}</span>
        </h1>
        <p className={`${agLayout.lead} mt-5 max-w-2xl text-[15px] leading-[1.85] sm:text-[16px]`}>
          {t('hero.lead')}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {heroPills.map((pill) => (
            <li
              key={pill}
              className="rounded-full bg-[#FAFAFA] px-3.5 py-1.5 text-[12px] font-medium text-[#6B6F76]"
            >
              {pill}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(t('hero.mailtoSubject'))}`}
            className={agLayout.btnPrimary}
          >
            {t('hero.contactSales')}
          </a>
          <Link href="/developers" className={agLayout.btnSecondary}>
            {t('hero.developers')}
          </Link>
          <Link href="/pricing" className={agLayout.btnGhost}>
            {t('hero.viewPricing')}
          </Link>
        </div>
      </motion.header>

      <motion.div
        className={cn('mt-12 overflow-hidden rounded-[2rem] sm:mt-16', ENTERPRISE_TINT)}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
      >
        <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-10">
          <div className="text-start">
            <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-white/75">
              <Building2 className="size-7 text-[#1D1D1D]/75" strokeWidth={1.35} />
            </div>
            <h2 className="mt-6 text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
              {t('showcase.title')}
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-[1.85] text-[#6B6F76]">
              {t('showcase.lead')}
            </p>
            <Link
              href="/developers"
              className="mt-4 inline-flex text-[13px] font-medium text-[#1D1D1D] underline underline-offset-4 hover:text-[#6B6F76]"
            >
              {t('showcase.exploreDevelopers')}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {showcaseItems.map((feature, index) => {
              const Icon = SHOWCASE_ICONS[index] ?? Code2;
              return (
                <div key={feature.title} className="rounded-[1.5rem] bg-white/70 p-5 text-start">
                  <Icon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
                  <p className="mt-4 text-[14px] font-medium text-[#1D1D1D]">{feature.title}</p>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-[#6B6F76]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {detailSections.map((section, sectionIndex) => (
        <section
          key={section.eyebrow}
          className={cn(
            'mt-16 sm:mt-20',
            sectionIndex % 2 === 0 ? ENTERPRISE_TINT : agLayout.sectionMuted,
            'rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12',
          )}
          aria-labelledby={`enterprise-detail-${sectionIndex}`}
        >
          <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
            <span className={agLayout.index}>
              {String(sectionIndex + 1).padStart(2, '0')}
            </span>
            <div>
              <p className={agLayout.eyebrow}>{section.eyebrow}</p>
              <h2 id={`enterprise-detail-${sectionIndex}`} className={`${agLayout.sectionTitle} mt-4`}>
                {section.title}
                <span className="text-[#9CA3AF]">{section.titleMuted}</span>
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item, index) => (
              <FeatureCard
                key={item.title}
                feature={item}
                index={index}
                reduceMotion={reduceMotion}
                surface="white"
              />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-16 sm:mt-20" aria-labelledby="enterprise-highlights-heading">
        <div className="mb-8 max-w-2xl text-start sm:mb-10">
          <p className={agLayout.eyebrow}>{t('highlights.eyebrow')}</p>
          <h2 id="enterprise-highlights-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('highlights.title')}
            <span className="text-[#9CA3AF]">{t('highlights.titleMuted')}</span>
          </h2>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-[1.5rem] bg-[#FAFAFA] px-4 py-4 text-[14px] text-[#6B6F76]"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white">
                <Check className="size-3.5 text-[#1D1D1D]/55" strokeWidth={2.5} />
              </span>
              <span className="leading-[1.7]">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${agLayout.sectionMuted} mt-16 rounded-[2rem] px-6 py-10 sm:mt-20 sm:px-10 sm:py-12`}
        aria-labelledby="enterprise-steps-heading"
      >
        <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
          <span className={agLayout.index}>05</span>
          <div>
            <p className={agLayout.eyebrow}>{t('steps.eyebrow')}</p>
            <h2 id="enterprise-steps-heading" className={`${agLayout.sectionTitle} mt-4`}>
              {t('steps.title')}
              <span className="text-[#9CA3AF]">{t('steps.titleMuted')}</span>
            </h2>
          </div>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-[2rem] bg-white p-7 text-start sm:p-8">
              <span className="text-[13px] font-medium tabular-nums text-[#9CA3AF]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="enterprise-contact-heading">
        <div className="grid gap-8 rounded-[2rem] bg-[#1D1D1D] p-8 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="text-start">
            <p className="text-[12px] font-medium tracking-[0.14em] text-white/55">
              {t('contact.eyebrow')}
            </p>
            <h2
              id="enterprise-contact-heading"
              className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em]"
            >
              {t('contact.title')}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-white/70">
              {t('contact.lead')}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 inline-block text-[15px] text-white underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              {contactEmail}
            </a>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(t('hero.mailtoSubject'))}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"
            >
              {t('contact.contactSales')}
            </a>
            <a
              href={siteUrls.developers}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/15"
            >
              {t('contact.developerPortal')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
