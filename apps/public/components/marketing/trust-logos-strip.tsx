import { LogoCloud } from '@/components/ui/logo-cloud';

const logos = [
  { src: '/logos/tL_v571NdZ0.svg', alt: 'Meta' },
  { src: '/logos/microsoft.svg', alt: 'Microsoft' },
  { src: '/logos/notion-full.svg', alt: 'Notion' },
  { src: '/logos/udemy.svg', alt: 'Udemy' },
  { src: '/logos/aws.svg', alt: 'AWS' },
];

export function TrustLogosStrip() {
  return (
    <section
      className="relative z-10 border-y border-white/8 py-8 sm:py-10"
      aria-label="شركاء التقنية"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-white/35">
          مدعوم بأدوات عالمية
        </p>
        <div className="relative overflow-hidden opacity-70" dir="ltr">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent sm:w-24"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent sm:w-24"
          />
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  );
}
