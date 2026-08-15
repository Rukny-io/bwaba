'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  Sparkles,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import {
  productFilters,
  type ProductFilterId,
} from '@/lib/cinematic-theme';
import { cn } from '@/lib/utils';

type ProductItem = {
  id: ProductFilterId;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tags: string[];
  stat: string;
  badge?: string;
  preview: string;
};

const products: ProductItem[] = [
  {
    id: 'stores',
    title: 'المتاجر',
    description: 'منتجات، طلبات، ومدفوعات محلية من أول يوم.',
    href: '/products/stores',
    icon: ShoppingBag,
    tags: ['متجر', 'مدفوعات', 'طلبات'],
    stat: '12 طلب اليوم',
    badge: 'شائع',
    preview:
      'linear-gradient(135deg, #1a1510 0%, #ea580c 45%, #431407 100%)',
  },
  {
    id: 'forms',
    title: 'النماذج الذكية',
    description: 'استبيانات مع مزامنة Google Sheets وإشعارات فورية.',
    href: '/products/forms',
    icon: ClipboardList,
    tags: ['نماذج', 'sheets', 'nextjs'],
    stat: '48 استجابة',
    badge: 'جديد',
    preview:
      'linear-gradient(135deg, #0c1929 0%, #0284c7 50%, #082f49 100%)',
  },
  {
    id: 'profile',
    title: 'الملف الشخصي',
    description: 'رابط واحد يجمع متجرك وروابطك ونماذجك.',
    href: '/products/profile',
    icon: UserCircle2,
    tags: ['روابط', 'bio', 'landing'],
    stat: 'rukny.io/you',
    preview:
      'linear-gradient(135deg, #052e24 0%, #10b981 48%, #064e3b 100%)',
  },
  {
    id: 'analytics',
    title: 'التحليلات',
    description: 'مبيعات وزيارات واستجابات في لوحة واحدة.',
    href: '/products/analytics',
    icon: BarChart3,
    tags: ['تحليلات', 'لوحة', 'تقارير'],
    stat: '+23% نمو',
    preview:
      'linear-gradient(135deg, #1e1b4b 0%, #6366f1 50%, #312e81 100%)',
  },
  {
    id: 'ai',
    title: 'الذكاء الاصطناعي',
    description: 'أدوات ذكية لتسريع المحتوى والقرارات.',
    href: '/products/ai',
    icon: BrainCircuit,
    tags: ['AI', 'محتوى', 'أتمتة'],
    stat: 'قريباً',
    badge: 'مميز',
    preview:
      'linear-gradient(135deg, #0f1416 0%, #062c30 55%, #2dd4bf 120%)',
  },
];

export function ProductsLibrarySection() {
  const [active, setActive] = useState<ProductFilterId>('all');

  const filtered = useMemo(
    () =>
      active === 'all'
        ? products
        : products.filter((p) => p.id === active),
    [active],
  );

  return (
    <section
      id="products"
      className="relative z-10 px-4 py-12 sm:px-6 sm:py-16 md:py-20"
      dir="rtl"
      aria-labelledby="products-library-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 sm:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/40">
              مكتبة المنتجات
            </p>
            <h2
              id="products-library-heading"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2.15rem]"
            >
              كل منتج، في مكان واحد
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/55">
              اختر ما تحتاجه — متجر، نماذج، ملف شخصي، تحليلات، وذكاء اصطناعي.
              كلها ضمن منصة Rukny.
            </p>
          </div>
          <p className="text-[13px] text-white/40">
            تحديثات وتحسينات{' '}
            <span className="text-teal-300/90">كل أسبوع</span>
          </p>
        </div>

        <div
          className="mb-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="تصفية المنتجات"
        >
          {productFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active === filter.id}
              onClick={() => setActive(filter.id)}
              className={cn(
                'cinematic-pill rounded-full px-4 py-2 text-[13px] font-medium',
                active === filter.id && 'cinematic-pill-active',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const Icon = product.icon;
            return (
              <Link
                key={product.id}
                href={product.href}
                className="cinematic-card group overflow-hidden rounded-2xl"
              >
                <div
                  className="relative flex h-36 items-end p-4 sm:h-40"
                  style={{ background: product.preview }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                    aria-hidden
                  />
                  {product.badge && (
                    <span
                      className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm"
                    >
                      {product.badge}
                    </span>
                  )}
                  <div className="relative flex items-center gap-2 text-white">
                    <Icon className="size-4 opacity-90" strokeWidth={1.75} />
                    <span className="text-[12px] font-medium opacity-80">
                      {product.stat}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-[16px] font-semibold text-white">
                    {product.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
                    {product.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/50"
                        dir="ltr"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-teal-300/90 transition-transform group-hover:-translate-x-0.5"
                  >
                    استكشف
                    <ArrowLeft className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}

          <div
            className="cinematic-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
            style={{
              background:
                'linear-gradient(145deg, rgba(45,212,191,0.12) 0%, rgba(6,44,48,0.5) 100%)',
            }}
          >
            <div>
              <Sparkles className="mb-3 size-5 text-teal-300/80" />
              <h3 className="text-lg font-bold text-white">
                منصة كاملة — بدون تشتت
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                ابدأ مجاناً ووسّع لاحقاً. كل المنتجات تعمل معاً من لوحة Rukny
                واحدة.
              </p>
            </div>
            <Link
              href="/pricing"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[13px] font-semibold text-[#062c30] transition hover:bg-white/90"
            >
              عرض الأسعار
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
