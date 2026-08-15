import { siteUrls } from '@/lib/site-urls';

export function AboutRuknySection() {
  return (
    <section
      id="about"
      className="relative z-10 border-t border-white/8 px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="about-rukny-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div dir="rtl" className="text-right">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/40">
              عن Rukny
            </p>
            <h2
              id="about-rukny-heading"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              منصة واحدة — هوية واحدة — لوحة واحدة
            </h2>
            <p className="mt-4 text-[15px] leading-[1.85] text-white/55">
              <strong className="font-semibold text-white">Rukny</strong>{' '}
              (ركني) منصة SaaS عربية تساعدك على إطلاق متجرك، نماذجك، وملفك
              الشخصي من مكان واحد.
            </p>
            <p className="mt-4 text-[13px] text-white/40">
              <a href={siteUrls.privacy} className="underline hover:text-white/70">
                سياسة الخصوصية
              </a>
              {' · '}
              <a href={siteUrls.terms} className="underline hover:text-white/70">
                شروط الاستخدام
              </a>
            </p>
          </div>

          <div
            dir="ltr"
            className="cinematic-card rounded-2xl p-6 sm:p-7"
          >
            <h3
              id="what-is-rukny"
              className="text-base font-bold text-white sm:text-lg"
            >
              What is Rukny?
            </h3>
            <p className="mt-3 text-[14px] leading-[1.8] text-white/55">
              <strong className="text-white">Rukny</strong> is an Arabic SaaS
              application for online stores, smart forms, profile pages, links,
              and analytics.
            </p>

            <h3
              id="google-data-use"
              className="mt-6 text-base font-bold text-white sm:text-lg"
            >
              How Rukny uses Google user data
            </h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-[14px] leading-[1.75] text-white/55">
              <li>Sync form submissions to Google Sheets the user selects</li>
              <li>
                Store integration settings in the user&apos;s Google Drive
              </li>
            </ul>
            <p className="mt-4 text-[13px] text-white/40">
              <a href={siteUrls.privacy} className="underline hover:text-white/70">
                Privacy Policy
              </a>
              {' · '}
              <a href={siteUrls.terms} className="underline hover:text-white/70">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
