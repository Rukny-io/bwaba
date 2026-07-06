import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BRAND = '#062c30';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';
const BORDER = '#E8ECF0';

const accountsUrl =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io';

export function FinalCtaSection() {
  return (
    <section
      className="border-t bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24"
      style={{ borderColor: BORDER }}
      dir="rtl"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className="rounded-2xl border px-6 py-10 text-right sm:rounded-3xl sm:px-10 sm:py-12"
          style={{ borderColor: BORDER, backgroundColor: '#FAFBFC' }}
        >
          <p
            className="mb-3 text-[13px] font-medium"
            style={{ color: MUTED }}
          >
            مجاني للبدء
          </p>
          <h2
            id="final-cta-heading"
            className="text-[1.65rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-3xl md:text-[2.1rem]"
            style={{ color: TEXT }}
          >
            ابدأ رحلتك الرقمية
            <br />
            اليوم مع ركني
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.8]" style={{ color: MUTED }}>
            سجّل مجاناً وأنشئ متجرك أو نماذجك خلال دقائق — دون بطاقة
            ائتمان.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href={accountsUrl}
              className="inline-flex h-11 w-full items-center justify-center rounded-full px-7 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: BRAND }}
            >
              ابدأ مجاناً
            </Link>
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-1 text-[14px] font-medium transition-colors"
              style={{ color: MUTED }}
            >
              <span className="group-hover:opacity-80" style={{ color: TEXT }}>
                عرض الأسعار
              </span>
              <ArrowRight
                className="size-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5"
                style={{ color: MUTED }}
                aria-hidden
              />
            </Link>
          </div>

          <p
            className="mt-8 text-[12px] leading-relaxed sm:text-[13px]"
            style={{ color: MUTED }}
          >
            تشفير كامل · إعداد خلال دقائق · دعم عربي
          </p>
        </div>
      </div>
    </section>
  );
}
