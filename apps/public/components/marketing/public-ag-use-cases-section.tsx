'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { agLayout, useCaseTints } from '@/lib/public-antigravity-theme';

const USE_CASES = [
  {
    id: 'ecommerce' as const,
    label: 'التجارة الإلكترونية',
    title: 'للتجار',
    description:
      'أطلق متجرك، اجمع الطلبات، وتابع المبيعات — من لوحة واحدة مصممة للعربية.',
    href: '/use-cases/ecommerce',
  },
  {
    id: 'personal' as const,
    label: 'العلامة الشخصية',
    title: 'للأفراد',
    description:
      'صفحة شخصية احترافية تجمع روابطك، نماذجك، ومنتجاتك في مكان واحد.',
    href: '/use-cases/personal-brand',
  },
  {
    id: 'teams' as const,
    label: 'الفرق والمؤسسات',
    title: 'للشركات',
    description:
      'حلول مخصصة للفرق — من التكاملات إلى الدعم المباشر وإعداد متعدد المستخدمين.',
    href: '/use-cases/teams',
  },
] as const;

export function PublicAgUseCasesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section
      id="use-cases"
      dir="rtl"
      className={`${agLayout.sectionMuted} overflow-hidden py-20 sm:py-24`}
      aria-labelledby="public-use-cases-heading"
    >
      <div className={`${agLayout.container} mb-12`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={agLayout.eyebrow}>حالات الاستخدام</p>
            <h2 id="public-use-cases-heading" className={`${agLayout.sectionTitle} mt-4`}>
              لكل مرحلة
              <span className="text-[#9CA3AF]"> من رحلتك</span>
            </h2>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(1)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#1D1D1D] transition-colors hover:bg-[#F5F5F5]"
              aria-label="التالي"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#1D1D1D] transition-colors hover:bg-[#F5F5F5]"
              aria-label="السابق"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {USE_CASES.map((item, i) => (
          <motion.article
            key={item.id}
            className="w-[min(85vw,320px)] shrink-0 sm:w-[360px]"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <div
              className={`flex min-h-[340px] flex-col justify-between rounded-[2rem] p-7 sm:p-8 ${useCaseTints[item.id]}`}
            >
              <div className="text-right">
                <p className="text-[12px] font-medium text-[#6B6F76]">
                  {item.label}
                </p>
                <h3 className="mt-3 text-[1.5rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                  {item.title}
                </h3>
                <p className="mt-4 text-[15px] leading-[1.75] text-[#6B6F76]">
                  {item.description}
                </p>
              </div>
              <Link
                href={item.href}
                className="mt-8 inline-flex w-fit items-center rounded-full bg-white/80 px-5 py-2.5 text-[13px] font-medium text-[#1D1D1D] transition-colors hover:bg-white"
              >
                اقرأ المزيد
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
