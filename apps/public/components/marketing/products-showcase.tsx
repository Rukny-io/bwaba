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

type ProductCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  accentBg: string;
};

const products: ProductCard[] = [
  {
    title: 'المتاجر',
    description: 'منتجات، طلبات، ومدفوعات محلية من أول يوم.',
    href: '/products/stores',
    icon: ShoppingBag,
    accent: '#ea580c',
    accentBg: '#fff7ed',
  },
  {
    title: 'النماذج',
    description: 'استبيانات ذكية مع مزامنة Sheets وإشعارات فورية.',
    href: '/products/forms',
    icon: ClipboardList,
    accent: '#0284c7',
    accentBg: '#f0f9ff',
  },
  {
    title: 'الملف الشخصي',
    description: 'رابط واحد يجمع متجرك وروابطك ونماذجك.',
    href: '/products/profile',
    icon: UserCircle2,
    accent: '#059669',
    accentBg: '#ecfdf5',
  },
  {
    title: 'التحليلات',
    description: 'مبيعات وزيارات واستجابات في لوحة واحدة.',
    href: '/products/analytics',
    icon: BarChart3,
    accent: '#4f46e5',
    accentBg: '#eef2ff',
  },
  {
    title: 'الذكاء الاصطناعي',
    description: 'أدوات ذكية لتسريع المحتوى والقرارات.',
    href: '/products/ai',
    icon: BrainCircuit,
    accent: '#062c30',
    accentBg: '#eef2f2',
  },
];

export function ProductsShowcase() {
  return (
    <section
      id="products"
      className="bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24"
      dir="rtl"
      aria-labelledby="products-showcase-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl md:mb-12">
          <p className="mb-2 text-[13px] font-medium text-[#132327]/50">
            منتجات Rukny
          </p>
          <h2
            id="products-showcase-heading"
            className="text-2xl font-bold tracking-tight text-[#132327] sm:text-3xl md:text-[2.1rem]"
          >
            كل ما تحتاجه لنموّك الرقمي
          </h2>
          <p className="mt-3 text-[15px] leading-[1.8] text-[#132327]/60">
            اختر ما يناسبك اليوم — ووسّع لاحقاً دون تغيير المنصة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <Link
                key={product.href}
                href={product.href}
                className="group flex flex-col rounded-2xl border border-[#E8ECF0] bg-white p-5 transition-all duration-300 hover:border-[#062c30]/15 hover:shadow-[0_12px_40px_rgba(6,44,48,0.08)] sm:p-6"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: product.accentBg }}
                >
                  <Icon
                    className="size-5"
                    style={{ color: product.accent }}
                    strokeWidth={1.75}
                  />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-[#132327]">
                  {product.title}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-[1.75] text-[#132327]/55">
                  {product.description}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#062c30] transition-transform group-hover:-translate-x-0.5"
                >
                  اكتشف المزيد
                  <ArrowLeft className="size-3.5 opacity-70" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
