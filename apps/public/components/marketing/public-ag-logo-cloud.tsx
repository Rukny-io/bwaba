import { LogoCloud } from '@/components/ui/logo-cloud';
import { agLayout } from '@/lib/public-antigravity-theme';

const logos = [
  { src: '/logos/aws.svg', alt: 'أمازون ويب سервيس' },
  { src: '/logos/microsoft.svg', alt: 'مايكروسوفت' },
  { src: '/logos/notion-full.svg', alt: 'نوشن' },
  { src: '/logos/udemy.svg', alt: 'يوديمي' },
  { src: '/logos/tL_v571NdZ0.svg', alt: 'ميتا' },
];

export function PublicAgLogoCloud() {
  return (
    <section
      dir="rtl"
      lang="ar"
      className={`${agLayout.sectionWhite} py-20 sm:py-24`}
      aria-labelledby="public-logos-heading"
    >
      <div className={`${agLayout.container} text-center`}>
        <p className={agLayout.eyebrow}>التكاملات</p>
        <h2
          id="public-logos-heading"
          className={`${agLayout.sectionTitle} mt-4`}
        >
          يعمل مع أدواتك الحالية
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#6B6F76]">
          بنية تقنية، جوجل، ومنصات إنتاجية — بدون تعقيد إضافي.
        </p>
        <div className="relative mt-12 overflow-hidden opacity-75" dir="ltr">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-28" />
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  );
}
