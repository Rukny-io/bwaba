import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { siteUrls } from '@/lib/site-urls';
import { marketingLayout } from '@/lib/marketing-theme';

const BRAND = '#062c30';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.58)';

export function ConsultationCtaSection() {
  return (
    <section className="pb-12 sm:pb-16 md:pb-[72px]" dir="rtl" aria-labelledby="consultation-cta-heading">
      <div className={marketingLayout.container}>
        <div
          className="relative mx-auto flex flex-col gap-5 overflow-hidden rounded-2xl p-6 text-center sm:gap-8 sm:rounded-[34px] sm:p-12 md:p-16 lg:p-20"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(210, 214, 239, 0.2) 0%, rgba(210, 214, 239, 0.2) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-0 size-56 rounded-full bg-[#D2D6EF]/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 bottom-0 size-48 rounded-full bg-[#EEF2F2]/80 blur-3xl"
          />

          <div className="relative flex flex-col gap-4 sm:gap-5">
            <h2
              id="consultation-cta-heading"
              className="text-[1.5rem] font-bold leading-[1.25] tracking-[-0.025em] sm:text-[2rem] md:text-[2.125rem]"
              style={{ color: TEXT }}
            >
              ما متأكد إذا نقدر نخدمك؟
            </h2>
            <p
              className="mx-auto max-w-2xl text-[15px] leading-[1.85] sm:text-base md:text-[1.05rem]"
              style={{ color: MUTED }}
            >
              تقدر تحجز استشارة مع فريقنا يجاوب كل استفساراتك ومتطلباتك، أو تقدر
              تروح على لوحة التحكم وتستكشف بنفسك.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-sm flex-col gap-2.5 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold text-white shadow-[0_4px_18px_rgba(6,44,48,0.2)] transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_8px_28px_rgba(6,44,48,0.26)] sm:min-w-[11rem] sm:w-auto"
              style={{ backgroundColor: BRAND }}
            >
              <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
              <span>تحدث مع فريقنا</span>
            </Link>
            <Link
              href={siteUrls.accounts}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#132327]/10 bg-white/80 px-6 text-[14px] font-semibold text-[#132327]/75 transition-all hover:border-[#132327]/15 hover:bg-white hover:text-[#132327] sm:min-w-[11rem] sm:w-auto"
            >
              <span>لوحة التحكم</span>
              <ArrowRight className="size-3.5 rotate-180 opacity-60" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
