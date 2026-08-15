'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ClipboardList,
  Globe2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import 'lenis/dist/lenis.css';

const BRAND = '#062c30';
const ACCENT = '#02797E';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';

type PreviewVariant = 'quick-launch' | 'mint-shield' | 'dual-cards' | 'brand-mark';

type StoryFeature = {
  label: string;
  labelColor: string;
  description: string;
  preview: PreviewVariant;
  previewClassName: string;
};

const DEFAULT_FEATURES: StoryFeature[] = [
  {
    label: 'جاهزة خلال دقائق',
    labelColor: BRAND,
    preview: 'quick-launch',
    previewClassName: 'bg-[#F6F7F8]',
    description:
      'ركني أسرع طريقة لإطلاق متجرك أو نماذجك على الإنترنت في العراق — ابدأ خلال دقائق دون إعدادات معقدة أو أدوات متفرقة.',
  },
  {
    label: 'ربط تقني محكم',
    labelColor: ACCENT,
    preview: 'mint-shield',
    previewClassName: 'bg-[rgba(6,44,48,0.06)]',
    description:
      'صُممت المنصة من الصفر لتوفير تجربة موحّدة لزبائنك. ربط تقني محكم يضمن تشغيل متجرك ونماذجك وملفك الشخصي بكفاءة من لوحة واحدة.',
  },
  {
    label: 'آمنة ومطابقة للمواصفات',
    labelColor: BRAND,
    preview: 'dual-cards',
    previewClassName: 'bg-[rgba(2,121,126,0.06)]',
    description:
      'بنية تحتية موثوقة مع تشفير كامل وحماية للبيانات. منصة مستقرة جاهزة لاستقبال زيارات متجرك واستجابات نماذجك على مدار الساعة.',
  },
  {
    label: 'من أي مكان',
    labelColor: ACCENT,
    preview: 'brand-mark',
    previewClassName: 'bg-[rgba(6,44,48,0.04)]',
    description:
      'وسّع نشاطك وتواصل مع جمهورك من أي مكان. متجرك ونماذجك وروابطك متاحة للجمهور العربي والعالمي على مدار الساعة.',
  },
];

const LAUNCH_STEPS = [
  { label: 'متجر', icon: ShoppingBag },
  { label: 'نموذج', icon: ClipboardList },
  { label: 'ملف', icon: UserCircle2 },
] as const;

function QuickLaunchPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5" dir="rtl" aria-hidden>
      {LAUNCH_STEPS.map((step) => {
        const Icon = step.icon;

        return (
          <div
            key={step.label}
            className="flex items-center gap-2 rounded-full border border-[#E8ECF0] bg-white px-4 py-2 text-[13px] font-medium text-[#062c30]"
          >
            <Icon className="size-4 text-[#02797E]" strokeWidth={1.75} aria-hidden />
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

function MintShieldPreview() {
  return (
    <div
      className="flex size-14 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white text-[#02797E]"
      aria-hidden
    >
      <ShieldCheck className="size-7" strokeWidth={1.75} />
    </div>
  );
}

function DualCardsPreview() {
  return (
    <div
      className="flex size-14 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white text-[#02797E]"
      aria-hidden
    >
      <Lock className="size-7" strokeWidth={1.75} />
    </div>
  );
}

function BrandMarkPreview() {
  return (
    <div
      className="flex size-14 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white text-[#02797E]"
      aria-hidden
    >
      <Globe2 className="size-7" strokeWidth={1.75} />
    </div>
  );
}

function FeaturePreview({ variant, className }: { variant: PreviewVariant; className: string }) {
  return (
    <div
      className={cn(
        'mb-4 flex h-[200px] items-center justify-center overflow-hidden rounded-[12px]',
        className,
      )}
    >
      {variant === 'quick-launch' && <QuickLaunchPreview />}
      {variant === 'mint-shield' && <MintShieldPreview />}
      {variant === 'dual-cards' && <DualCardsPreview />}
      {variant === 'brand-mark' && <BrandMarkPreview />}
    </div>
  );
}

export type ParallaxScrollingProps = {
  title?: string;
  body?: string;
  features?: StoryFeature[];
  className?: string;
};

export function ParallaxScrolling({
  title = 'البنية التحتية لحضورك الرقمي',
  body = 'في سوق سريع النمو مثل العراق، يعاني التجار وصنّاع المحتوى من صعوبة إدارة حضورهم الرقمي عبر أدوات متفرقة. ركني وُجدت لحل هذه الفجوة، من خلال منصة موحدة وسلسة، تجمع المتجر والنماذج والملف الشخصي والتحليلات في مكان واحد.',
  features = DEFAULT_FEATURES,
  className,
}: ParallaxScrollingProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = root.querySelector<HTMLElement>('[data-parallax-section]');
    const layersRoot = root.querySelector<HTMLElement>('[data-parallax-layers]');
    const intro = root.querySelector<HTMLElement>('[data-parallax-intro]');

    if (!section || !layersRoot) return;

    const layerConfig = [
      { layer: '1', yPercent: 24 },
      { layer: '2', yPercent: 16 },
      { layer: '3', yPercent: 10 },
      { layer: '4', yPercent: 6 },
    ] as const;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0,
      },
    });

    layerConfig.forEach((layerObj, index) => {
      const targets = layersRoot.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`);
      if (!targets.length) return;

      timeline.to(
        targets,
        { yPercent: layerObj.yPercent, ease: 'none' },
        index === 0 ? undefined : '<',
      );
    });

    if (intro) {
      gsap.to(intro, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0,
        },
      });
    }

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(ticker);
      timeline.scrollTrigger?.kill();
      timeline.kill();
      ScrollTrigger.getAll().forEach((instance) => instance.kill());
      lenis.destroy();
    };
  }, [features.length]);

  return (
    <section
      ref={parallaxRef}
      className={cn('parallax-story', className)}
      id="features"
      dir="rtl"
      aria-labelledby="parallax-story-title"
    >
      <div
        data-parallax-section
        className="relative mx-auto mt-16 grid max-w-6xl grid-cols-12 gap-8 px-4 sm:mt-24 sm:gap-10 sm:px-6 md:mt-[120px] lg:px-0"
      >
        <div className="col-span-12 md:col-span-7">
          <div data-parallax-intro className="sticky top-24">
            <h2
              id="parallax-story-title"
              className="mb-6 text-[1.75rem] font-semibold leading-[1.2] sm:mb-10 sm:text-3xl sm:leading-[1.25] md:text-[2.75rem] md:leading-[1.15]"
              style={{ color: TEXT }}
            >
              {title}
            </h2>
            <p
              className="w-full text-[15px] font-normal leading-[1.65] sm:w-[90%] sm:text-base md:w-[80%] md:text-[18px] md:leading-[1.5]"
              style={{ color: MUTED }}
            >
              {body}
            </p>
          </div>
        </div>

        <div
          data-parallax-layers
          className="col-span-12 flex flex-col gap-8 sm:gap-[46px] md:col-span-5"
        >
          {features.map((feature, index) => (
            <article
              key={feature.label}
              data-parallax-layer={String(Math.min(index + 1, 4))}
              data-parallax-feature
            >
              <FeaturePreview variant={feature.preview} className={feature.previewClassName} />
              <p className="mb-2 text-sm font-medium" style={{ color: feature.labelColor }}>
                {feature.label}
              </p>
              <p className="text-[15px] font-normal leading-[1.65] sm:text-[18px] sm:leading-[1.5]" style={{ color: 'rgba(19, 35, 39, 0.62)' }}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
