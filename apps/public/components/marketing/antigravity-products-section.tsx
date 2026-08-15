import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';

type ProductBlock = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

const blocks: ProductBlock[] = [
  {
    id: 'stores',
    title: 'متاجر Rukny',
    subtitle: 'المتجر',
    description:
      'منتجات، طلبات، ومدفوعات محلية — أطلق البيع من أول يوم دون تكاملات معقدة.',
    href: '/products/stores',
    icon: ShoppingBag,
    accent: 'from-orange-500/20 via-orange-500/5 to-transparent',
  },
  {
    id: 'forms',
    title: 'النماذج الذكية',
    subtitle: 'النماذج',
    description:
      'استبيانات ذكية مع مزامنة Google Sheets، إشعارات، وتحويل الاستجابات إلى إجراءات.',
    href: '/products/forms',
    icon: ClipboardList,
    accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
  },
  {
    id: 'profile',
    title: 'الملف الشخصي',
    subtitle: 'الهوية',
    description:
      'رابط واحد يجمع متجرك، روابطك، ونماذجك — وجهة احترافية لجمهورك.',
    href: '/products/profile',
    icon: UserCircle2,
    accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  {
    id: 'analytics',
    title: 'التحليلات',
    subtitle: 'القرار',
    description:
      'مبيعات، زيارات، واستجابات في لوحة واحدة — صورة واضحة قبل الخطوة التالية.',
    href: '/products/analytics',
    icon: BarChart3,
    accent: 'from-violet-500/20 via-violet-500/5 to-transparent',
  },
  {
    id: 'ai',
    title: 'الذكاء الاصطناعي',
    subtitle: 'قريباً',
    description:
      'أدوات ذكية لتسريع المحتوى، الردود، وقراراتك اليومية داخل المنصة.',
    href: '/products/ai',
    icon: BrainCircuit,
    accent: 'from-teal-400/20 via-teal-400/5 to-transparent',
  },
];

export function AntigravityProductsSection() {
  return (
    <section
      id="products"
      className="relative z-10 px-4 py-16 sm:px-6 sm:py-24"
      dir="rtl"
      aria-labelledby="antigravity-products-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-white/40">
            منتجات Rukny
          </p>
          <h2
            id="antigravity-products-heading"
            className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2.35rem] md:leading-tight"
          >
            مبني للمؤسسين في عصر المنصات المتكاملة
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Rukny تجمع كل ما تحتاجه لإطلاق مشروعك الرقمي — من المتجر إلى
            النماذج والتحليلات — في تجربة واحدة موثوقة.
          </p>
        </div>

        <div className="space-y-6">
          {blocks.map((block, index) => {
            const Icon = block.icon;
            const reversed = index % 2 === 1;
            return (
              <article
                key={block.id}
                className="antigravity-product-card group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
              >
                <div
                  className={`grid items-center gap-8 p-6 sm:p-8 md:grid-cols-2 md:gap-10 md:p-10 ${
                    reversed ? 'md:[&>div:first-child]:order-2' : ''
                  }`}
                >
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-teal-300/80">
                      {block.subtitle}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                      {block.title}
                    </h3>
                    <p className="mt-4 text-[14px] leading-[1.85] text-white/55 sm:text-[15px]">
                      {block.description}
                    </p>
                    <Link
                      href={block.href}
                      className="mt-6 inline-flex items-center gap-1 text-[14px] font-medium text-white/80 transition group-hover:text-teal-300"
                    >
                      استكشف المنتج
                      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                  </div>

                  <div
                    className={`relative flex min-h-[12rem] items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br ${block.accent} sm:min-h-[14rem]`}
                  >
                    <div
                      className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-500 group-hover:scale-105"
                    >
                      <Icon className="size-9" strokeWidth={1.5} />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_65%)]"
                      aria-hidden
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
