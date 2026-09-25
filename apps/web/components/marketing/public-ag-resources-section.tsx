'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { agLayout } from '@/lib/public-antigravity-theme';

const RESOURCES = [
  {
    title: 'البدء مع ركني',
    category: 'دليل',
    href: '/docs',
    tint: 'bg-[#EFF6FF]',
  },
  {
    title: 'إعداد المتجر الأول',
    category: 'منتج',
    href: '/products/stores',
    tint: 'bg-[#FFF7ED]',
  },
  {
    title: 'مزامنة جداول جوجل',
    category: 'تكامل',
    href: '/products/forms',
    tint: 'bg-[#ECFDF5]',
  },
  {
    title: 'واجهة برمجية للمطورين',
    category: 'مطورون',
    href: '/developers',
    tint: 'bg-[#F5F3FF]',
  },
  {
    title: 'الأسئلة الشائعة',
    category: 'دعم',
    href: '/support',
    tint: 'bg-[#FAFAFA]',
  },
] as const;

export function PublicAgResourcesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 304, behavior: 'smooth' });
  };

  return (
    <section
      dir="rtl"
      className={`${agLayout.sectionWhite} pb-24 pt-20 sm:pb-28 sm:pt-24`}
      aria-labelledby="public-resources-heading"
    >
      <div className={agLayout.container}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={agLayout.eyebrow}>الموارد</p>
            <h2
              id="public-resources-heading"
              className={`${agLayout.sectionTitle} mt-4`}
            >
              أدلة وموارد
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6B6F76]">
              إعداد، تكاملات، وإدارة — مكتوبة للمؤسسين والمطورين.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(1)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#1D1D1D] transition-colors hover:bg-[#F5F5F5]"
              aria-label="التالي"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#1D1D1D] transition-colors hover:bg-[#F5F5F5]"
              aria-label="السابق"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mt-12 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {RESOURCES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex w-[min(85vw,280px)] shrink-0 flex-col justify-between rounded-[1.75rem] p-7 transition-colors hover:brightness-[0.98] sm:w-[288px] ${item.tint}`}
            >
              <span className={`${agLayout.pill} w-fit bg-white/70`}>
                {item.category}
              </span>
              <p className="mt-8 text-[16px] font-medium leading-snug text-[#1D1D1D]">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
