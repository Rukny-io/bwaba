'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, RocketIcon } from 'lucide-react';
import { LogoCloud } from '@/components/ui/logo-cloud-3';
import { siteUrls } from '@/lib/site-urls';
import { marketingLayout } from '@/lib/marketing-theme';

const rotatingItems = ['روابطك', 'منتجاتك', 'نماذجك', 'إعلاناتك', 'أعمالك'] as const;
const ITEM_H = 1.15;

function RotatingText() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingItems.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ height: `${ITEM_H}em` }}>
      <span
        className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: `translateY(-${index * ITEM_H}em)` }}
      >
        {rotatingItems.map((item) => (
          <span
            key={item}
            className="block shrink-0 font-bold text-[#02797E]"
            style={{ height: `${ITEM_H}em`, lineHeight: `${ITEM_H}em` }}
          >
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}

export function HeroSection() {
  return (
    <section className={cn('relative w-full', marketingLayout.container)} dir="rtl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mx-auto hidden min-h-[32rem] w-full max-w-6xl lg:block"
      >
        <div className="absolute inset-y-0 left-0 z-10 h-full w-px bg-[#E8ECF0]/80" />
        <div className="absolute inset-y-0 right-0 z-10 h-full w-px bg-[#E8ECF0]/80" />
      </div>

      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 sm:gap-5',
          marketingLayout.heroPad,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 hidden size-full overflow-hidden sm:block"
        >
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-[#E8ECF0] to-[#E8ECF0] md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-[#E8ECF0] to-[#E8ECF0] md:right-8" />
        </div>

        <Link href="#features" className={cn('home-hero-enter group', marketingLayout.heroBadge)}>
          <RocketIcon className="size-3 shrink-0 text-muted-foreground" />
          <span>نسخة مستقرة — جاهزة للإطلاق</span>
          <span className="hidden h-5 border-l border-[#E8ECF0] sm:block" />
          <ArrowRightIcon className="hidden size-3 rotate-180 duration-150 ease-out group-hover:-translate-x-1 sm:block" />
        </Link>

        <h1 className={cn('home-hero-enter-delayed', marketingLayout.heroTitle)}>
          <span className="block text-base font-semibold tracking-normal text-[#132327]/75 sm:text-lg md:text-xl" dir="ltr">
            Rukny
          </span>
          <span className="mt-2 block sm:mt-3">منصة رقمية متكاملة لـ</span>
          <span className="my-1 block sm:my-2">
            <RotatingText />
          </span>
          <span className="block">على الإنترنت</span>
        </h1>

        <p className={cn('home-hero-enter-delayed', marketingLayout.heroLead)}>
          أطلق مشروعك خلال دقائق. أنشئ متجرك، أضف منتجاتك وروابطك ونماذجك، وتواصل مع عملائك — من لوحة
          تحكم واحدة.
        </p>

        <div className="home-hero-enter-delayed flex w-full max-w-sm flex-col gap-2.5 pt-1 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:pt-2">
          <Button className="h-11 w-full rounded-full sm:h-12 sm:w-auto" size="lg" variant="secondary" asChild>
            <Link href="/pricing">الأسعار</Link>
          </Button>
          <Button className="h-11 w-full rounded-full sm:h-12 sm:w-auto" size="lg" asChild>
            <Link href={siteUrls.accounts}>
              ابدأ مجاناً
              <ArrowRightIcon className="ms-2 size-4 rotate-180" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const logos = [
  { src: '/logos/tL_v571NdZ0.svg', alt: 'Meta' },
  { src: '/logos/facebook-wordmark.svg', alt: 'Facebook' },
  { src: '/logos/whatsapp-wordmark.svg', alt: 'WhatsApp' },
  { src: '/logos/instagram-wordmark.svg', alt: 'Instagram' },
  { src: '/logos/udemy.svg', alt: 'Udemy' },
  { src: '/logos/google-wordmark.svg', alt: 'Google' },
  { src: '/logos/gemini_wordmark.svg', alt: 'Gemini' },
  { src: '/logos/notion-full.svg', alt: 'Notion' },
  { src: '/logos/microsoft.svg', alt: 'Microsoft' },
];

export function LogosSection() {
  return (
    <section className="relative border-t border-[#E8ECF0] py-8 sm:py-10" dir="rtl">
      <div className={cn(marketingLayout.container, 'space-y-4')}>
        <h2 className="text-center text-base font-medium tracking-tight text-muted-foreground sm:text-lg md:text-xl">
          نعتمد على أحدث التقنيات من <span className="text-foreground">الشركات الرائدة</span>
        </h2>
        <div className="relative z-10 mx-auto max-w-4xl" dir="ltr">
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  );
}
