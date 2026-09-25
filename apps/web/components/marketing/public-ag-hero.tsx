import Image from 'next/image';
import Link from 'next/link';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';

export function PublicAgHero() {
  return (
    <section
      dir="rtl"
      lang="ar"
      className="relative bg-transparent text-[#1D1D1D]"
      aria-labelledby="public-hero-title"
    >
      <div className="mx-auto flex max-w-[820px] flex-col items-center px-5 pb-24 pt-14 text-center sm:px-8 sm:pb-32 sm:pt-16">
        <Link
          href="/"
          className="home-hero-enter mb-12 inline-flex items-center gap-2.5 sm:mb-14"
          aria-label="ركني — الصفحة الرئيسية"
        >
          <Image
            src="/rukny-logo.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="size-7"
          />
          <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
            ركني
          </span>
        </Link>

        <h1
          id="public-hero-title"
          className={`${agLayout.heroTitle} home-hero-enter`}
        >
          <span className="block">منصة واحدة</span>
          <span className="mt-2 block text-[#9CA3AF]">لإطلاق مشروعك الرقمي</span>
        </h1>

        <p className="home-hero-enter-delayed mt-8 max-w-xl text-[17px] leading-[1.75] text-[#6B6F76]">
          متجرك، نماذجك، ملفك الشخصي، وتحليلاتك — تجربة عربية موحّدة للانطلاق
          بسرعة.
        </p>

        <div className="home-hero-enter-delayed mt-10 flex w-full max-w-md flex-col gap-2.5 sm:mt-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <Link href={siteUrls.accounts} className={`${agLayout.btnPrimary} w-full sm:w-auto`}>
            ابدأ مجاناً
          </Link>
          <Link href="#pricing" className={`${agLayout.btnSecondary} w-full sm:w-auto`}>
            عرض الأسعار
          </Link>
          <Link href="#products" className={`${agLayout.btnGhost} w-full sm:w-auto`}>
            استكشف المنتجات
          </Link>
        </div>
      </div>
    </section>
  );
}
