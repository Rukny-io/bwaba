'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronRight,
  Banknote,
  BarChart3,
  Bell,
  Calendar,
  Check,
  ClipboardList,
  Cloud,
  CreditCard,
  Download,
  Eye,
  GitBranch,
  Globe,
  ImageIcon,
  Layers,
  Layout,
  Link2,
  MessageSquare,
  Package,
  Palette,
  PenLine,
  Settings2,
  Share2,
  ShieldCheck,
  Store,
  Table2,
  Tag,
  Upload,
  User,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  PRODUCT_SLUGS,
  type ProductFeature,
  type ProductSlug,
} from '@/lib/public-marketing-pages';
import { useLocalizedProductPage } from '@/lib/use-localized-product-page';
import { agLayout } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  'credit-card': CreditCard,
  settings: Settings2,
  package: Package,
  download: Download,
  calendar: Calendar,
  banknote: Banknote,
  shield: ShieldCheck,
  palette: Palette,
  store: Store,
  tag: Tag,
  link: Link2,
  share: Share2,
  image: ImageIcon,
  user: User,
  globe: Globe,
  eye: Eye,
  chart: BarChart3,
  layout: Layout,
  spreadsheet: Table2,
  bell: Bell,
  branch: GitBranch,
  webhook: Webhook,
  upload: Upload,
  pen: PenLine,
  cloud: Cloud,
  message: MessageSquare,
  clipboard: ClipboardList,
  users: Users,
};

function CtaLink({
  href,
  label,
  variant = 'primary',
}: {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const className =
    variant === 'primary' ? agLayout.btnPrimary : agLayout.btnSecondary;

  if (href.startsWith('mailto:') || href.startsWith('http')) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function FeatureIcon({ icon }: { icon?: string }) {
  const Icon = icon ? FEATURE_ICONS[icon] : null;
  if (!Icon) return null;

  return (
    <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white/80">
      <Icon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
    </div>
  );
}

function RelatedProductCard({ itemSlug }: { itemSlug: ProductSlug }) {
  const item = useLocalizedProductPage(itemSlug);
  const ItemIcon = item.icon;

  return (
    <Link
      href={`/products/${itemSlug}`}
      className={cn(
        'rounded-[2rem] p-6 transition-opacity hover:opacity-90 sm:p-7',
        item.tint,
      )}
    >
      <ItemIcon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
      <p className="mt-5 text-[1rem] font-medium text-[#1D1D1D]">{item.title}</p>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#6B6F76]">
        {item.description}
      </p>
    </Link>
  );
}

function FeatureCard({
  feature,
  index,
  reduceMotion,
  surface = 'muted',
}: {
  feature: ProductFeature;
  index: number;
  reduceMotion: boolean | null;
  surface?: 'muted' | 'white' | 'tint';
  tintClass?: string;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className={cn(
        'rounded-[2rem] p-7 sm:p-8',
        surface === 'white' && 'bg-white',
        surface === 'muted' && 'bg-[#FAFAFA]',
        surface === 'tint' && 'bg-white/70',
      )}
    >
      <FeatureIcon icon={feature.icon} />
      <h3 className="mt-5 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
        {feature.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">{feature.description}</p>
    </motion.div>
  );
}

export function PublicAgProductPage({ slug }: { slug: ProductSlug }) {
  const t = useTranslations('products');
  const product = useLocalizedProductPage(slug);
  const reduceMotion = useReducedMotion();
  const Icon = product.icon;
  const hasDetailSections = Boolean(product.detailSections?.length);
  const heroPills = product.highlights.slice(0, 4);
  const otherProducts = PRODUCT_SLUGS.filter((itemSlug) => itemSlug !== product.slug).slice(
    0,
    3,
  );

  return (
    <div className={cn(agLayout.container, 'pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16')}>
      <motion.header
        className="mx-auto max-w-4xl text-start md:pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className={agLayout.eyebrow}>{product.eyebrow}</p>
          {product.badge ? (
            <span className={cn(agLayout.pill, 'bg-[#FAFAFA]')}>{product.badge}</span>
          ) : null}
        </div>

        <h1 className={`${agLayout.sectionTitle} mt-4 max-w-3xl`}>
          {product.headline}
          <span className="text-[#9CA3AF]">{product.headlineMuted}</span>
        </h1>
        <p className={`${agLayout.lead} mt-5 max-w-2xl text-[15px] leading-[1.85] sm:text-[16px]`}>
          {product.description}
        </p>

        {heroPills.length > 0 ? (
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
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <CtaLink href={product.ctaHref} label={product.ctaLabel} />
          {product.secondaryCta ? (
            <CtaLink
              href={product.secondaryCta.href}
              label={product.secondaryCta.label}
              variant="secondary"
            />
          ) : null}
        </div>
      </motion.header>

      {!hasDetailSections ? (
        <motion.div
          className={cn(
            'mx-auto mt-12 max-w-4xl rounded-[2rem] p-8 sm:mt-16 sm:p-10 md:p-12',
            product.tint,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
        >
          <div className="flex items-start gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/75">
              <Icon className="size-7 text-[#1D1D1D]/75" strokeWidth={1.35} />
            </div>
            <div className="min-w-0 text-start">
              <h2 className="text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {product.title}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.8] text-[#6B6F76]">
                {product.description}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className={cn(
            'mt-12 overflow-hidden rounded-[2rem] sm:mt-16',
            product.tint,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
        >
          <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-10">
            <div className="text-start">
              <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-white/75">
                <Icon className="size-7 text-[#1D1D1D]/75" strokeWidth={1.35} />
              </div>
              <h2 className="mt-6 text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {product.title}
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-[1.85] text-[#6B6F76]">
                {product.showcaseDescription ??
                  'كل ما تحتاجه في تجربة واحدة متكاملة — جاهزة للمشاركة فوراً.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {product.features.map((feature) => {
                const FeatureItemIcon = feature.icon ? FEATURE_ICONS[feature.icon] : Icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-[1.5rem] bg-white/70 p-5 text-start"
                  >
                    <FeatureItemIcon
                      className="size-5 text-[#1D1D1D]/70"
                      strokeWidth={1.5}
                    />
                    <p className="mt-4 text-[14px] font-medium text-[#1D1D1D]">
                      {feature.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {!hasDetailSections ? (
        <section className="mt-16 sm:mt-20" aria-labelledby="product-features-heading">
          <div className="mb-8 max-w-2xl text-start sm:mb-10">
            <p className={agLayout.eyebrow}>{t('featuresEyebrow')}</p>
            <h2 id="product-features-heading" className={`${agLayout.sectionTitle} mt-4`}>
              {t('featuresTitle')}
              <span className="text-[#9CA3AF]">{t('featuresTitleMuted')}</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {product.features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </section>
      ) : null}

      {product.detailSections?.map((section, sectionIndex) => (
        <section
          key={`${section.title}-${section.eyebrow ?? sectionIndex}`}
          className={cn(
            'mt-16 sm:mt-20',
            sectionIndex % 2 === 0 ? product.tint : agLayout.sectionMuted,
            'rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12',
          )}
          aria-labelledby={`product-detail-${sectionIndex}`}
        >
          <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
            <span className={agLayout.index}>
              {String(sectionIndex + 1).padStart(2, '0')}
            </span>
            <div>
              {section.eyebrow ? <p className={agLayout.eyebrow}>{section.eyebrow}</p> : null}
              <h2 id={`product-detail-${sectionIndex}`} className={`${agLayout.sectionTitle} mt-4`}>
                {section.title}
                {section.titleMuted ? (
                  <span className="text-[#9CA3AF]">{section.titleMuted}</span>
                ) : null}
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

      {product.workflowSteps && product.workflowSteps.length > 0 ? (
        <section
          className={`${agLayout.sectionMuted} mt-16 rounded-[2rem] px-6 py-10 sm:mt-20 sm:px-10 sm:py-12`}
          aria-labelledby="product-workflow-heading"
        >
          <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
            <span className={agLayout.index}>
              {String((product.detailSections?.length ?? 0) + 1).padStart(2, '0')}
            </span>
            <div>
              <p className={agLayout.eyebrow}>
                {product.workflowEyebrow ?? 'كيف يعمل'}
              </p>
              <h2 id="product-workflow-heading" className={`${agLayout.sectionTitle} mt-4`}>
                {product.workflowTitle ?? 'ثلاث خطوات'}
                {product.workflowTitleMuted ? (
                  <span className="text-[#9CA3AF]">{product.workflowTitleMuted}</span>
                ) : null}
              </h2>
            </div>
          </div>

          <ol className="grid gap-4 md:grid-cols-3">
            {product.workflowSteps.map((step, index) => (
              <li key={step.title} className="rounded-[2rem] bg-white p-7 text-start sm:p-8">
                <span className="text-[13px] font-medium tabular-nums text-[#9CA3AF]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="product-highlights-heading"
      >
        <div className="mb-8 max-w-2xl text-start sm:mb-10">
          <p className={agLayout.eyebrow}>{t('highlightsEyebrow')}</p>
          <h2 id="product-highlights-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('highlightsTitle')}
            <span className="text-[#9CA3AF]">{t('highlightsTitleMuted')}</span>
          </h2>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {product.highlights.map((item) => (
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

      {otherProducts.length > 0 ? (
        <section className="mt-16 sm:mt-20" aria-labelledby="related-products-heading">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="text-start">
              <p className={agLayout.eyebrow}>{t('relatedEyebrow')}</p>
              <h2 id="related-products-heading" className={`${agLayout.sectionTitle} mt-4`}>
                {t('relatedTitle')}
                <span className="text-[#9CA3AF]">{t('relatedTitleMuted')}</span>
              </h2>
            </div>
            <Link
              href="/#products"
              className="hidden items-center gap-1 text-[14px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70 sm:inline-flex"
            >
              {t('viewAll')}
              <ChevronRight className="size-4 opacity-60 rtl:rotate-180" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {otherProducts.map((itemSlug) => (
              <RelatedProductCard key={itemSlug} itemSlug={itemSlug} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
