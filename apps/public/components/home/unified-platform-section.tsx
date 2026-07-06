'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ModuleId = 'store' | 'forms' | 'profile' | 'analytics';

type PlatformModule = {
  id: ModuleId;
  title: string;
  hook: string;
  description: string;
  stat: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
  orbit: { x: number; y: number };
};

const MODULES: PlatformModule[] = [
  {
    id: 'store',
    title: 'المتجر',
    hook: 'بِع من أول يوم',
    description:
      'منتجات، طلبات، ومدفوعات محلية — دون إضافة أدوات خارجية أو تكاملات معقدة.',
    stat: 'طلب جديد كل ٤ دقائق',
    icon: ShoppingBag,
    accent: '#f97316',
    accentSoft: '#fff7ed',
    orbit: { x: 50, y: 10 },
  },
  {
    id: 'forms',
    title: 'النماذج',
    hook: 'بيانات تتدفق وحدها',
    description:
      'استبيانات ونماذج ذكية تُرسل الاستجابات لمتجرك أو جدولك أو Webhook.',
    stat: '+١٢٠ استجابة / أسبوع',
    icon: ClipboardList,
    accent: '#0ea5e9',
    accentSoft: '#f0f9ff',
    orbit: { x: 86, y: 50 },
  },
  {
    id: 'profile',
    title: 'الملف الشخصي',
    hook: 'هويتك الرقمية',
    description:
      'رابط واحد يجمع متجرك وروابطك ونماذجك — وجهة واحدة لجمهورك.',
    stat: 'rukny.io/اسمك',
    icon: UserCircle2,
    accent: '#10b981',
    accentSoft: '#ecfdf5',
    orbit: { x: 50, y: 90 },
  },
  {
    id: 'analytics',
    title: 'التحليلات',
    hook: 'قرار واحد واضح',
    description:
      'مبيعات، زيارات، وتحويلات من كل المنتجات في لوحة واحدة لا تتشتت.',
    stat: '+٢٣٪ نمو أسبوعي',
    icon: BarChart3,
    accent: '#1434CB',
    accentSoft: '#eef2ff',
    orbit: { x: 14, y: 50 },
  },
];

function OrbitMap({
  activeId,
  onSelect,
}: {
  activeId: ModuleId;
  onSelect: (id: ModuleId) => void;
}) {
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,340px)]">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        aria-hidden
      >
        {MODULES.map((mod) => (
          <line
            key={mod.id}
            x1="50"
            y1="50"
            x2={mod.orbit.x}
            y2={mod.orbit.y}
            stroke={mod.id === activeId ? mod.accent : '#E2E8F0'}
            strokeWidth={mod.id === activeId ? 0.55 : 0.35}
            strokeDasharray={mod.id === activeId ? '0' : '2 2'}
            className="transition-all duration-500"
            opacity={mod.id === activeId ? 0.9 : 0.45}
          />
        ))}
        <circle cx="50" cy="50" r="14" fill="#FAFBFC" stroke="#E8ECF0" strokeWidth="0.4" />
      </svg>

      <div className="absolute left-1/2 top-1/2 flex size-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#E8ECF0] bg-white shadow-[0_12px_40px_rgba(6,44,48,0.08)] sm:size-20">
        <Zap className="size-4 text-[#062c30] sm:size-5" strokeWidth={1.75} />
        <span className="mt-0.5 text-[9px] font-bold text-[#062c30] sm:text-[10px]">ركني</span>
      </div>

      {MODULES.map((mod) => {
        const Icon = mod.icon;
        const isActive = mod.id === activeId;
        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-105"
            style={{ left: `${mod.orbit.x}%`, top: `${mod.orbit.y}%` }}
            aria-label={mod.title}
            aria-pressed={isActive}
          >
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all duration-300 sm:size-11',
                isActive
                  ? 'scale-110 border-transparent shadow-[0_8px_24px_rgba(19,35,39,0.12)]'
                  : 'border-[#E8ECF0] opacity-80 hover:opacity-100',
              )}
              style={
                isActive
                  ? { backgroundColor: mod.accentSoft, boxShadow: `0 8px 28px ${mod.accent}22` }
                  : undefined
              }
            >
              <Icon
                className="size-4 sm:size-[18px]"
                style={{ color: isActive ? mod.accent : '#64748b' }}
                strokeWidth={1.75}
              />
            </span>
          </button>
        );
      })}

      <motion.div
        key={activeId}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pointer-events-none absolute inset-x-0 -bottom-1 text-center"
      >
        <span
          className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: active.accentSoft, color: active.accent }}
        >
          {active.hook}
        </span>
      </motion.div>
    </div>
  );
}


export function UnifiedPlatformSection() {
  const [activeId, setActiveId] = useState<ModuleId>('store');
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0];

  return (
    <section
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-28"
      dir="rtl"
      id="features"
      aria-labelledby="unified-platform-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #E2E8F0 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 text-center md:mb-14 md:text-right">
          <p className="text-[13px] font-semibold tracking-wide text-[#062c30]/65">
            المنظومة المتكاملة
          </p>
          <h2
            id="unified-platform-heading"
            className="text-[1.9rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#132327] sm:text-4xl md:text-[2.75rem]"
          >
            مشروع واحد.
            <br />
            <span className="text-[#062c30]">أربع قدرات تتصل ببعضها.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-[15px] leading-[1.85] text-[#132327]/58 sm:text-[17px] md:mx-0">
            لا تنقل بياناتك بين تطبيقات منفصلة — ركني تربط المتجر
            والنماذج والملف والتحليلات في شبكة واحدة تتحرك معك.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 xl:gap-16">
          <div className="order-2 lg:order-1">
            <ul className="space-y-2 sm:space-y-2.5" role="tablist" aria-label="منتجات المنصة">
              {MODULES.map((mod, index) => {
                const Icon = mod.icon;
                const isActive = mod.id === activeId;
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveId(mod.id)}
                      className={cn(
                        'group flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-right transition-all duration-300 sm:rounded-[20px] sm:px-5 sm:py-4',
                        isActive
                          ? 'border-[#132327]/12 bg-white shadow-[0_8px_32px_rgba(19,35,39,0.07)]'
                          : 'border-transparent bg-transparent hover:border-[#E8ECF0] hover:bg-[#FAFBFC]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300',
                          isActive ? '' : 'bg-[#F1F3F5] group-hover:bg-white',
                        )}
                        style={
                          isActive
                            ? { backgroundColor: mod.accentSoft }
                            : undefined
                        }
                      >
                        <Icon
                          className="size-[18px]"
                          style={{ color: isActive ? mod.accent : '#64748b' }}
                          strokeWidth={1.75}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#132327] sm:text-[15px]">
                            {mod.title}
                          </span>
                          <span className="font-mono text-[10px] text-[#132327]/30">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </span>
                        <span className="block text-[12px] leading-relaxed text-[#132327]/52 sm:text-[13px]">
                          {mod.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 hidden flex-wrap items-center gap-4 border-t border-[#E8ECF0] pt-6 lg:flex">
              <Link
                href={process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io'}
                className="inline-flex h-10 items-center rounded-full bg-[#062c30] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                ابدأ منصتك الموحّدة
              </Link>
              <p className="text-[12px] text-[#132327]/45">
                ٤ منتجات · لوحة واحدة · بيانات متصلة
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-[28px] border border-[#E8ECF0] bg-white p-4 shadow-[0_20px_60px_rgba(6,44,48,0.06)] sm:p-6">
              <OrbitMap activeId={activeId} onSelect={setActiveId} />

            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:hidden">
              <Link
                href={process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io'}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#062c30] px-5 text-[13px] font-semibold text-white sm:w-auto"
              >
                ابدأ منصتك الموحّدة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
