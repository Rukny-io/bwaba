import { siteUrls } from '@/lib/site-urls';
import { agLayout } from '@/lib/public-antigravity-theme';

export function PublicAgAboutSection() {
  return (
    <section
      id="about"
      dir="rtl"
      className={`${agLayout.sectionMuted} ${agLayout.section}`}
      aria-labelledby="public-about-heading"
    >
      <div className={agLayout.container}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-start">
            <p className={agLayout.eyebrow}>عن ركني</p>
            <h2 id="public-about-heading" className={`${agLayout.sectionTitle} mt-4`}>
              منصة واحدة
              <span className="text-[#9CA3AF]"> — هوية واحدة — لوحة واحدة</span>
            </h2>
            <p className={`${agLayout.lead} mt-5`}>
              <strong className="font-medium text-[#1D1D1D]">ركني</strong> يجمع
              متجرك، نماذجك، وملفك الشخصي في تجربة واحدة — بلمسة عربية.
            </p>
            <p className="mt-5 text-[13px] text-[#9CA3AF]">
              <a
                href={siteUrls.privacy}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                سياسة الخصوصية
              </a>
              {' · '}
              <a
                href={siteUrls.terms}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                شروط الاستخدام
              </a>
            </p>
          </div>

          <div className={agLayout.surface}>
            <h3
              id="what-is-rukny"
              className="text-base font-medium text-[#1D1D1D] sm:text-lg"
            >
              ما هي ركني؟
            </h3>
            <p className="mt-3 text-[14px] leading-[1.8] text-[#6B6F76]">
              <strong className="text-[#1D1D1D]">ركني</strong> أدوات للمتاجر
              الإلكترونية، النماذج الذكية، صفحات الملف الشخصي، الروابط،
              والتحليلات.
            </p>

            <h3
              id="google-data-use"
              className="mt-8 text-base font-medium text-[#1D1D1D] sm:text-lg"
            >
              كيف تستخدم ركني بيانات مستخدمي جوجل؟
            </h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-[1.75] text-[#6B6F76]">
              <li>مزامنة إرسالات النماذج مع جداول جوجل التي يختارها المستخدم</li>
              <li>حفظ إعدادات التكامل في درايف جوجل الخاص بالمستخدم</li>
            </ul>
            <p className="mt-5 text-[13px] text-[#9CA3AF]">
              <a
                href={siteUrls.privacy}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                سياسة الخصوصية
              </a>
              {' · '}
              <a
                href={siteUrls.terms}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                شروط الاستخدام
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
