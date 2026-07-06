import {
  BarChart3,
  Languages,
  Rocket,
  Shield,
  type LucideIcon,
} from 'lucide-react';

const BRAND = '#062c30';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';
const BORDER = '#E8ECF0';
const SURFACE = '#F6F7F8';

type Pillar = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const PILLARS: Pillar[] = [
  {
    icon: Languages,
    title: 'عربي من الأساس',
    description:
      'واجهة RTL، مدفوعات محلية، ودعم يفهم سياق عملك — لا ترجمة مضافة على أدوات أجنبية.',
  },
  {
    icon: Rocket,
    title: 'إطلاق خلال دقائق',
    description:
      'من التسجيل إلى أول متجر أو نموذج منشور — مسار واضح بخطوات قليلة، دون الحاجة لفريق تقني.',
  },
  {
    icon: Shield,
    title: 'أمان وموثوقية',
    description:
      'تشفير، صلاحيات فرق، ونسخ احتياطي — لأن ثقة عملائك تبدأ من حماية بياناتهم.',
  },
  {
    icon: BarChart3,
    title: 'قرار من لوحة واحدة',
    description:
      'مبيعات، زيارات، واستجابات النماذج في مكان واحد — ترى الصورة كاملة قبل الخطوة التالية.',
  },
];

export function WhyChooseRuknySection() {
  return (
    <section
      className="border-t bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24"
      style={{ borderColor: BORDER }}
      dir="rtl"
      aria-labelledby="why-rukny-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl md:mb-12">
          <p
            className="mb-3 text-[13px] font-medium"
            style={{ color: MUTED }}
          >
            لماذا ركني؟
          </p>
          <h2
            id="why-rukny-heading"
            className="text-[1.75rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-3xl md:text-[2.25rem]"
            style={{ color: TEXT }}
          >
            مميزات تجعلنا الخيار الأول
          </h2>
          <p
            className="mt-4 text-[15px] leading-[1.8] sm:text-base"
            style={{ color: MUTED }}
          >
            منصة عربية متكاملة — تُطلق بسرعة، تحمي بياناتك، وتبقى بسيطة
            أثناء نمو مشروعك.
          </p>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl border sm:rounded-3xl sm:grid-cols-2" style={{ borderColor: BORDER, backgroundColor: BORDER }}>
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <li
                key={pillar.title}
                className="flex gap-4 bg-white p-5 sm:p-6"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11"
                  style={{ backgroundColor: SURFACE, color: BRAND }}
                >
                  <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p
                    className="mb-1 font-mono text-[10px] tracking-wide"
                    style={{ color: MUTED }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className="text-[15px] font-semibold sm:text-base"
                    style={{ color: TEXT }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className="mt-1.5 text-[13px] leading-[1.75] sm:text-[14px]"
                    style={{ color: MUTED }}
                  >
                    {pillar.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p
          className="mt-8 text-center text-[12px] sm:text-[13px] md:text-start"
          style={{ color: MUTED }}
        >
          دعم فني عربي · بياناتك لا تُباع لطرف ثالث · أكثر من ١٠٠٠ مشروع نشط
        </p>
      </div>
    </section>
  );
}
