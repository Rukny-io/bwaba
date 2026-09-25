'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import { agLayout, productTints } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

type ProductBlock = {
  id: keyof typeof productTints;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const blocks: ProductBlock[] = [
  {
    id: 'stores',
    index: '01',
    title: 'المتاجر الإلكترونية',
    subtitle: 'المتجر',
    description:
      'منتجات رقمية ومادية، بوابة دفع آمنة، ومتغيرات مرنة — أطلق البيع من أول يوم.',
    href: '/products/stores',
    icon: ShoppingBag,
  },
  {
    id: 'forms',
    index: '02',
    title: 'النماذج الذكية',
    subtitle: 'النماذج',
    description:
      'حقول متنوعة، مزامنة Sheets، Webhooks، وتحليلات — نماذج احترافية لكل احتياج.',
    href: '/products/forms',
    icon: ClipboardList,
  },
  {
    id: 'profile',
    index: '03',
    title: 'الملف الشخصي',
    subtitle: 'الهوية',
    description:
      'رابط واحد يجمع روابطك، متجرك، ونماذجك — صفحة احترافية تشاركها بضغطة واحدة.',
    href: '/products/profile',
    icon: UserCircle2,
  },
  {
    id: 'analytics',
    index: '04',
    title: 'التحليلات',
    subtitle: 'القرار',
    description:
      'مبيعات، زيارات، واستجابات في لوحة واحدة — صورة واضحة قبل الخطوة التالية.',
    href: '/products/analytics',
    icon: BarChart3,
  },
  {
    id: 'ai',
    index: '05',
    title: 'الذكاء الاصطناعي',
    subtitle: 'قريباً',
    description:
      'أدوات ذكية لتسريع المحتوى، الردود، وقراراتك اليومية داخل المنصة.',
    href: '/products/ai',
    icon: BrainCircuit,
  },
];

function ProductShowcase({
  block,
  reduceMotion,
}: {
  block: ProductBlock;
  reduceMotion: boolean | null;
}) {
  const Icon = block.icon;

  return (
    <motion.div
      key={block.id}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={cn(
        'relative flex min-h-[24rem] flex-col justify-between rounded-[2rem] p-8 sm:min-h-[26rem] sm:p-10 md:min-h-[28rem] md:p-12',
        productTints[block.id],
      )}
    >
      <span
        className="pointer-events-none absolute -bottom-4 end-4 select-none text-[clamp(5rem,16vw,9rem)] font-medium leading-none tracking-[-0.06em] text-[#1D1D1D]/[0.06]"
        aria-hidden
      >
        {block.index}
      </span>

      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-white/70 sm:size-[4.5rem]">
          <Icon className="size-8 text-[#1D1D1D]/75" strokeWidth={1.35} />
        </div>
        <p className="mt-8 text-[12px] font-medium tracking-[0.14em] text-[#6B6F76]">
          {block.subtitle}
        </p>
        <h3 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.03em] text-[#1D1D1D]">
          {block.title}
        </h3>
      </div>

      <div className="relative mt-8">
        <p className="max-w-md text-[15px] leading-[1.8] text-[#6B6F76] sm:text-[16px]">
          {block.description}
        </p>
        <Link href={block.href} className={`${agLayout.btnPrimary} mt-8`}>
          استكشف المنتج
        </Link>
      </div>
    </motion.div>
  );
}

function StaticProductsFallback() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = blocks[activeIndex]!;

  return (
    <>
      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="اختر منتجاً"
      >
        {blocks.map((block, index) => (
          <button
            key={block.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'shrink-0 touch-manipulation rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors',
              index === activeIndex
                ? 'bg-[#1D1D1D] text-white'
                : 'bg-[#F5F5F5] text-[#6B6F76]',
            )}
          >
            {block.subtitle}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
        <div className="hidden flex-col gap-1 lg:flex" role="tablist">
          {blocks.map((block, index) => (
            <button
              key={block.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'touch-manipulation rounded-[1.25rem] px-5 py-5 text-start transition-colors',
                index === activeIndex ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]/70',
              )}
            >
              <span className="text-[15px] font-medium text-[#1D1D1D]">
                {block.index} — {block.title}
              </span>
            </button>
          ))}
        </div>
        <div role="tabpanel" className="min-w-0">
          <ProductShowcase block={active} reduceMotion />
        </div>
      </div>
    </>
  );
}

export function PublicAgProductsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="products"
      dir="rtl"
      className={`${agLayout.sectionWhite} pb-16 pt-20 sm:pb-20 sm:pt-24 md:pt-28`}
      aria-labelledby="public-products-heading"
    >
      <div className={agLayout.container}>
        <motion.div
          className="mb-10 max-w-2xl sm:mb-12"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className={agLayout.eyebrow}>منتجات ركني</p>
          <h2 id="public-products-heading" className={`${agLayout.sectionTitle} mt-4`}>
            كل ما تحتاجه
            <span className="text-[#9CA3AF]"> في مساحة واحدة</span>
          </h2>
          <p className={`${agLayout.lead} mt-5 max-w-xl`}>
            من المتجر إلى النماذج والتحليلات — كل شيء في مكان واحد.
          </p>
        </motion.div>

        <StaticProductsFallback />
      </div>
    </section>
  );
}
