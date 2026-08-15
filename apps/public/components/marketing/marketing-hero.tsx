import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { HeroFloatingIcons } from '@/components/marketing/hero-floating-icons';
import { siteUrls } from '@/lib/site-urls';

const audiences = ['للتجار', 'للأفراد', 'للمطورين', 'للشركات'];
const repeatedAudiences = [...audiences, ...audiences, ...audiences];

export function MarketingHero() {
  return (
    <section
      className="marketing-hero antigravity-hero relative overflow-hidden"
      dir="rtl"
      aria-labelledby="marketing-hero-heading"
    >
      <div className="marketing-hero-fog" aria-hidden>
        <span className="marketing-hero-orb marketing-hero-orb--teal" />
        <span className="marketing-hero-orb marketing-hero-orb--brand" />
        <span className="marketing-hero-orb marketing-hero-orb--mist" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.12),transparent_55%)]"
        aria-hidden
      />
      <HeroFloatingIcons />

      <div className="relative z-10 hidden w-full md:block">
        <div className="mx-auto grid min-h-[440px] max-w-5xl grid-cols-12 px-5 pt-[150px] xl:px-0">
          <div className="col-span-7 flex flex-col items-start">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-white/55 backdrop-blur-md">
              <Sparkles className="size-3.5 text-teal-300" />
              منصة عربية متكاملة
            </div>

            <h1
              id="marketing-hero-heading"
              className="text-right text-[4.5rem] font-black leading-[0.98] tracking-[-0.04em] text-white lg:text-[5.25rem]"
            >
              حلول رقمية
              <span className="mt-2 block text-white/38">متكاملة</span>
            </h1>

            <p className="mt-8 max-w-md text-[16px] leading-[1.9] text-white/52">
              ابنِ متجرك، نماذجك، وملفك الشخصي من مكان واحد مصمم للعربية أولاً.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href={siteUrls.accounts}
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold text-[#0a0a0a] transition hover:bg-white/90"
              >
                ابدأ مجاناً
              </Link>
              <Link
                href="#products"
                className="inline-flex h-12 items-center gap-1.5 rounded-full border border-white/12 px-6 text-[14px] font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                استكشف المنتجات
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>

          <div className="col-span-5 flex items-center justify-end">
            <div className="audience-window" aria-label={audiences.join('، ')}>
              <div className="audience-track" aria-hidden>
                {repeatedAudiences.map((audience, index) => (
                  <span
                    key={`${audience}-${index}`}
                    className="audience-item"
                  >
                    {audience}
                  </span>
                ))}
              </div>
              <div className="audience-focus" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto px-5 pb-16 pt-32 text-center md:hidden">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-white/55">
          <Sparkles className="size-3.5 text-teal-300" />
          منصة عربية متكاملة
        </div>
        <h1 className="text-[3rem] font-black leading-[1.05] tracking-[-0.035em] text-white">
          حلول رقمية متكاملة
          <span className="mt-2 block text-teal-200">للتجار والأفراد</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[15px] leading-[1.85] text-white/55">
          متجرك، نماذجك، وملفك الشخصي في منصة عربية واحدة.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={siteUrls.accounts}
            className="inline-flex h-12 min-w-[10rem] items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold text-[#0a0a0a]"
          >
            ابدأ مجاناً
          </Link>
          <Link
            href="#products"
            className="inline-flex h-12 items-center gap-1.5 px-5 text-[14px] font-medium text-white/70"
          >
            استكشف المنتجات
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
