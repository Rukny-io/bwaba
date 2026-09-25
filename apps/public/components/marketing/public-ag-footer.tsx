import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { agLayout } from '@/lib/public-antigravity-theme';
import { marketingDropdownPanels } from '@/lib/marketing-nav';
import { siteUrls } from '@/lib/site-urls';

const CONTACT_EMAIL = 'support@rukny.io';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const productLinks =
  marketingDropdownPanels.find((panel) => panel.id === 'product')?.links ?? [];

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'المنتجات',
    links: [
      ...productLinks.map((link) => ({ label: link.label, href: link.href })),
      { label: 'عرض كل المنتجات', href: '/#products' },
    ],
  },
  {
    title: 'المنصة',
    links: [
      { label: 'الرئيسية', href: '/' },
      { label: 'الأسعار', href: '/pricing' },
      { label: 'المؤسسات', href: '/enterprise' },
      { label: 'عن ركني', href: '/#about' },
    ],
  },
  {
    title: 'الموارد',
    links: [
      { label: 'الوثائق', href: '/docs' },
      { label: 'المطورون', href: '/developers' },
      { label: 'مركز المساعدة', href: '/support' },
      { label: 'الأسئلة الشائعة', href: '/pricing#faq-heading' },
    ],
  },
  {
    title: 'الحساب',
    links: [
      { label: 'ابدأ مجاناً', href: siteUrls.accounts },
      { label: 'تسجيل الدخول', href: siteUrls.accounts },
      { label: 'إنشاء متجر', href: '/products/stores' },
      { label: 'إنشاء نموذج', href: '/products/forms' },
    ],
  },
  {
    title: 'القانوني',
    links: [
      { label: 'سياسة الخصوصية', href: siteUrls.privacy, external: true },
      { label: 'شروط الاستخدام', href: siteUrls.terms, external: true },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    'inline-flex text-[14px] leading-relaxed text-[#6B6F76] transition-colors hover:text-[#1D1D1D]';

  if (link.external || link.href.startsWith('http') || link.href.startsWith('mailto:')) {
    return (
      <a
        href={link.href}
        className={className}
        {...(link.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

function FooterColumnBlock({ column }: { column: FooterColumn }) {
  return (
    <div className="min-w-0 text-start">
      <h3 className={agLayout.eyebrow}>{column.title}</h3>
      <ul className="mt-4 space-y-2">
        {column.links.map((link) => (
          <li key={`${column.title}-${link.label}`}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicAgFooter() {
  return (
    <footer
      id="contact"
      dir="rtl"
      lang="ar"
      className={`${agLayout.sectionMuted} pt-20 sm:pt-24`}
    >
      <div className={`${agLayout.container} pb-16 sm:pb-20 md:pb-24`}>
        <div className="rounded-[2rem] bg-white p-7 sm:p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div className="text-start">
              <p className={agLayout.eyebrow}>ابدأ اليوم</p>
              <h2 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                منصة واحدة لإطلاق مشروعك الرقمي
              </h2>
              <p className={`${agLayout.lead} mt-3 max-w-lg`}>
                متجر، نماذج، ملف شخصي، وتحليلات — بدون بطاقة ائتمان للبدء.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href={siteUrls.accounts} className={`${agLayout.btnPrimary} sm:min-w-[10rem]`}>
                ابدأ مجاناً
              </Link>
              <Link href="/enterprise" className={`${agLayout.btnSecondary} sm:min-w-[10rem]`}>
                للمؤسسات
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:mt-16 lg:grid-cols-7 lg:gap-x-6 xl:gap-x-10">
          <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-2 lg:max-w-none">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="" width={24} height={24} />
              <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[1.5rem]">
                ركني
              </span>
            </Link>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-[1.75] text-[#6B6F76]">
              متجر، نماذج، ملف شخصي، وتحليلات — أدواتك في مكان واحد.
            </p>

            <div className="mt-6 border-t border-[#EBEBEB] pt-6">
              <p className={agLayout.eyebrow}>تواصل معنا</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-flex text-[15px] text-[#1D1D1D] underline underline-offset-4 transition-colors hover:text-[#6B6F76]"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#9CA3AF]">
                أسئلة حول الإعداد، الفوترة، أو حلول المؤسسات — نقرأ كل رسالة.
              </p>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <FooterColumnBlock key={column.title} column={column} />
          ))}
        </div>

        <div className="mt-14 rounded-[1.5rem] bg-white px-5 py-4 sm:mt-16 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#9CA3AF]">
              <span>© {new Date().getFullYear()} ركني</span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>أدوات رقمية بالعربية</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href={siteUrls.privacy}
                rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
              >
                سياسة الخصوصية
              </a>
              <a
                href={siteUrls.terms}
                rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
              >
                شروط الاستخدام
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70"
              >
                العودة للأعلى
                <ArrowLeft className="size-3.5 rotate-90" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
