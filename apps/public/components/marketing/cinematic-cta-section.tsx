import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { siteUrls } from '@/lib/site-urls';

export function CinematicCtaSection() {
  return (
    <section
      className="relative z-10 px-4 py-16 sm:px-6 sm:py-20"
      dir="rtl"
      aria-labelledby="cinematic-cta-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className="overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-10 md:p-12"
          style={{
            background:
              'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(6,44,48,0.6) 50%, rgba(8,11,12,0.9) 100%)',
          }}
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/40">
            مجاني للبدء
          </p>
          <h2
            id="cinematic-cta-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2.1rem]"
          >
            ابدأ رحلتك الرقمية مع Rukny
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/55">
            سجّل مجاناً وأنشئ متجرك أو نماذجك خلال دقائق — بدون بطاقة ائتمان.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={siteUrls.accounts}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold text-[#062c30] transition hover:bg-white/90"
            >
              ابدأ مجاناً
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-[14px] font-medium text-white/70 transition hover:text-white"
            >
              <span>عرض الأسعار</span>
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
