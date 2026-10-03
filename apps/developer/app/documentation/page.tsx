'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import {
  localizeDocumentationProducts,
  type DocsCopy,
} from '@/lib/documentation-i18n';
import { cn } from '@/lib/utils';

type HubLinkKey = keyof DocsCopy['hubLinks'];
type HubSectionKey = keyof DocsCopy['hubSections'];

type HubSectionDef = {
  sectionKey: HubSectionKey;
  links: { labelKey: HubLinkKey; href: string }[];
};

const HUB_SECTIONS: HubSectionDef[] = [
  {
    sectionKey: 'emailApi',
    links: [
      { labelKey: 'emailOverview', href: `${DOCUMENTATION_BASE}/email-api` },
      { labelKey: 'emailGetStarted', href: `${DOCUMENTATION_BASE}/email-api/get-started` },
      { labelKey: 'emailUseCases', href: `${DOCUMENTATION_BASE}/email-api/use-cases` },
      { labelKey: 'emailBestPractices', href: `${DOCUMENTATION_BASE}/email-api/best-practices` },
      { labelKey: 'emailMessages', href: `${DOCUMENTATION_BASE}/email-api/messages` },
      { labelKey: 'emailDomains', href: `${DOCUMENTATION_BASE}/email-api/domains` },
      { labelKey: 'emailTesting', href: `${DOCUMENTATION_BASE}/email-api/testing` },
      { labelKey: 'emailQuotas', href: `${DOCUMENTATION_BASE}/email-api/quotas` },
      { labelKey: 'emailErrors', href: `${DOCUMENTATION_BASE}/email-api/errors` },
    ],
  },
  {
    sectionKey: 'forms',
    links: [
      { labelKey: 'formsOverview', href: `${DOCUMENTATION_BASE}/forms` },
      { labelKey: 'formsGetStarted', href: `${DOCUMENTATION_BASE}/forms/get-started` },
      { labelKey: 'formsLinking', href: `${DOCUMENTATION_BASE}/forms/linking` },
      { labelKey: 'formsDomains', href: `${DOCUMENTATION_BASE}/forms/domains` },
      { labelKey: 'formsEmbedding', href: `${DOCUMENTATION_BASE}/forms/embedding` },
      { labelKey: 'formsEvents', href: `${DOCUMENTATION_BASE}/forms/events` },
      { labelKey: 'formsWebhooks', href: `${DOCUMENTATION_BASE}/forms/webhooks` },
    ],
  },
  {
    sectionKey: 'authentication',
    links: [
      {
        labelKey: 'authEmail',
        href: `${DOCUMENTATION_BASE}/email-api/authentication`,
      },
      { labelKey: 'authDashboard', href: '/login?next=/apps' },
    ],
  },
  {
    sectionKey: 'sdks',
    links: [
      { labelKey: 'sdkNode', href: `${DOCUMENTATION_BASE}/email-api/sdk` },
      { labelKey: 'sdkRest', href: `${DOCUMENTATION_BASE}/email-api/rest` },
      { labelKey: 'sdkReference', href: `${DOCUMENTATION_BASE}/email-api/reference` },
      { labelKey: 'sdkSend', href: `${DOCUMENTATION_BASE}/email-api/send` },
    ],
  },
  {
    sectionKey: 'guides',
    links: [
      { labelKey: 'guideEmail', href: `${DOCUMENTATION_BASE}/email-api` },
      { labelKey: 'guideForms', href: `${DOCUMENTATION_BASE}/forms` },
      { labelKey: 'guideEmbed', href: `${DOCUMENTATION_BASE}/forms/get-started` },
      { labelKey: 'guideSmtp', href: `${DOCUMENTATION_BASE}/email-api/smtp` },
    ],
  },
  {
    sectionKey: 'messaging',
    links: [
      { labelKey: 'msgWhatsapp', href: `${DOCUMENTATION_BASE}/whatsapp-api` },
      {
        labelKey: 'msgWhatsappMessages',
        href: `${DOCUMENTATION_BASE}/whatsapp-api/messages`,
      },
      {
        labelKey: 'msgWhatsappTemplates',
        href: `${DOCUMENTATION_BASE}/whatsapp-api/templates`,
      },
      {
        labelKey: 'msgWhatsappWebhooks',
        href: `${DOCUMENTATION_BASE}/whatsapp-api/webhooks`,
      },
      { labelKey: 'msgEmail', href: `${DOCUMENTATION_BASE}/email-api/messages` },
      { labelKey: 'msgFormsWebhooks', href: `${DOCUMENTATION_BASE}/forms/webhooks` },
    ],
  },
];

function FeaturedCard({
  title,
  description,
  href,
  available,
  docsCta,
  comingSoon,
  isRtl,
}: {
  title: string;
  description: string;
  href: string;
  available: boolean;
  docsCta: string;
  comingSoon: string;
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const inner = (
    <article
      className={cn(
        'group relative flex h-full min-h-[12rem] flex-col justify-between overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white p-5 transition-colors sm:p-6',
        available && 'hover:border-[#D4D4D4] hover:bg-[#FAFAFA]',
        !available && 'opacity-70',
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E5E5E5] to-transparent"
        aria-hidden
      />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1D] sm:text-xl">
          {title}
        </h2>
        <p className="text-[13px] leading-relaxed text-[#6B6F76] sm:text-[14px] sm:leading-6">
          {description}
        </p>
      </div>
      <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1D1D1D]">
        {available ? (
          <>
            {docsCta}
            <Arrow
              className={cn(
                'size-3.5 transition-transform',
                isRtl
                  ? 'group-hover:-translate-x-0.5'
                  : 'group-hover:translate-x-0.5',
              )}
              aria-hidden
            />
          </>
        ) : (
          <span className="text-[#9CA3AF]">{comingSoon}</span>
        )}
      </p>
    </article>
  );

  if (!available) return <div>{inner}</div>;
  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}

export default function DocumentationHubPage() {
  const t = useTranslations();
  const d = t.docs;
  const isRtl = t.common.locale === 'ar';
  const featured = localizeDocumentationProducts(d);

  return (
    <main className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-x-0 -top-14 h-64 bg-[radial-gradient(ellipse_at_top,rgba(245,245,245)_0%,transparent_70%)]"
        aria-hidden
      />

      <header className="relative max-w-3xl">
        <p className="text-[13px] font-medium text-[#9CA3AF]">{d.brandDocs}</p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#1D1D1D] sm:text-[2.75rem] sm:leading-[1.15]">
          {d.title}
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#6B6F76] sm:text-base sm:leading-8">
          {d.subtitle}
        </p>
      </header>

      <section className="relative mt-12" aria-labelledby="docs-products-heading">
        <h2
          id="docs-products-heading"
          className="mb-4 text-[13px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]"
        >
          {d.featuredTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <FeaturedCard
              key={item.id}
              title={item.title}
              description={item.description}
              href={item.href}
              available={item.available}
              docsCta={d.docsCta}
              comingSoon={d.comingSoon}
              isRtl={isRtl}
            />
          ))}
        </div>
      </section>

      <div className="relative mt-16 grid gap-10 border-t border-[#EBEBEB] pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-14">
        {HUB_SECTIONS.map((section) => (
          <section key={section.sectionKey} className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#1D1D1D]">
              {d.hubSections[section.sectionKey]}
            </h2>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href + link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                  >
                    {d.hubLinks[link.labelKey]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
