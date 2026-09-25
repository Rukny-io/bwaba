'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowUp } from 'lucide-react';
import { LanguageSwitcher } from '@/components/locale/language-switcher';
import { agLayout } from '@/lib/public-antigravity-theme';
import { FOOTER_LINK_HREFS } from '@/lib/marketing-nav-config';
import { siteUrls } from '@/lib/site-urls';

const CONTACT_EMAIL = 'support@rukny.io';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    'inline-flex text-[14px] leading-relaxed text-[#6B6F76] transition-colors hover:text-[#1D1D1D]';

  if (link.external || link.href.startsWith('http') || link.href.startsWith('mailto:')) {
    return (
      <a
        href={link.href}
        className={className}
        {...(link.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function PublicAgFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('columns.products.title'),
      links: [
        ...(['stores', 'forms', 'profile', 'analytics', 'ai'] as const).map((key) => ({
          label: t(`columns.products.links.${key}`),
          href: FOOTER_LINK_HREFS.products[key],
        })),
        {
          label: t('columns.products.links.viewAll'),
          href: FOOTER_LINK_HREFS.products.viewAll,
        },
      ],
    },
    {
      title: t('columns.platform.title'),
      links: (['home', 'pricing', 'enterprise', 'about'] as const).map((key) => ({
        label: t(`columns.platform.links.${key}`),
        href: FOOTER_LINK_HREFS.platform[key],
      })),
    },
    {
      title: t('columns.resources.title'),
      links: (['docs', 'developers', 'helpCenter', 'faq'] as const).map((key) => ({
        label: t(`columns.resources.links.${key}`),
        href: FOOTER_LINK_HREFS.resources[key],
      })),
    },
    {
      title: t('columns.account.title'),
      links: [
        {
          label: t('columns.account.links.startFree'),
          href: siteUrls.accounts,
        },
        {
          label: t('columns.account.links.login'),
          href: siteUrls.accounts,
        },
        {
          label: t('columns.account.links.createStore'),
          href: FOOTER_LINK_HREFS.account.createStore,
        },
        {
          label: t('columns.account.links.createForm'),
          href: FOOTER_LINK_HREFS.account.createForm,
        },
      ],
    },
    {
      title: t('columns.legal.title'),
      links: [
        {
          label: t('columns.legal.links.privacy'),
          href: siteUrls.privacy,
          external: true,
        },
        {
          label: t('columns.legal.links.terms'),
          href: siteUrls.terms,
          external: true,
        },
      ],
    },
  ];

  return (
    <footer id="contact" className={`${agLayout.sectionMuted} pt-20 sm:pt-24`}>
      <div className={`${agLayout.container} pb-16 sm:pb-20 md:pb-24`}>
        <div className="rounded-[2rem] bg-white p-7 sm:p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div className="text-start">
              <p className={agLayout.eyebrow}>{t('cta.eyebrow')}</p>
              <h2 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                {t('cta.title')}
              </h2>
              <p className={`${agLayout.lead} mt-3 max-w-lg`}>{t('cta.lead')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link href={siteUrls.accounts} className={`${agLayout.btnPrimary} sm:min-w-[10rem]`}>
                {t('cta.startFree')}
              </Link>
              <Link href="/enterprise" className={`${agLayout.btnSecondary} sm:min-w-[10rem]`}>
                {t('cta.enterprise')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:mt-16 lg:grid-cols-7 lg:gap-x-6 xl:gap-x-10">
          <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-2 lg:max-w-none">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="" width={24} height={24} />
              <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[1.5rem]">
                {t('brand.name')}
              </span>
            </Link>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-[1.75] text-[#6B6F76]">
              {t('brand.tagline')}
            </p>

            <div className="mt-6 border-t border-[#EBEBEB] pt-6">
              <p className={agLayout.eyebrow}>{t('contact.eyebrow')}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                dir="ltr"
                className="mt-3 inline-flex text-[15px] text-[#1D1D1D] underline underline-offset-4 transition-colors hover:text-[#6B6F76]"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#9CA3AF]">
                {t('contact.hint')}
              </p>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="min-w-0 text-start">
              <h3 className={agLayout.eyebrow}>{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-[1.5rem] bg-white px-5 py-4 sm:mt-16 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#9CA3AF]">
              <span>{t('bottom.copyright', { year })}</span>
              <span className="hidden sm:inline" aria-hidden>·</span>
              <span>{t('bottom.tagline')}</span>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-3 sm:justify-end">
              <LanguageSwitcher variant="footer" />
              <a
                href={siteUrls.privacy}
                rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
              >
                {t('bottom.privacy')}
              </a>
              <a
                href={siteUrls.terms}
                rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
              >
                {t('bottom.terms')}
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70"
              >
                {t('bottom.backToTop')}
                <ArrowUp className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
