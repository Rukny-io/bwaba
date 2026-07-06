'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  Code2,
  FileText,
  LayoutGrid,
  HelpCircle,
  LogIn,
  Mail,
  Sparkles,
  Shield,
  ExternalLink,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { ACCOUNTS_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

function RuknyLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 1080 1080"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="352.46" y="211.99" width="411.5" height="239.89" />
      <rect
        x="25"
        y="539.45"
        width="415.04"
        height="239.89"
        transform="translate(891.92 426.88) rotate(90)"
      />
      <path d="m967.42,665.78v175.97c0,13.89-11.26,25.15-25.15,25.15h-190.54c-6.67,0-13.07-2.65-17.78-7.37l-141.2-141.2c-15.84-15.84-4.62-42.93,17.78-42.93h128.24c13.89,0,25.15-11.26,25.15-25.15v-137.68c0-22.41,27.09-33.63,42.93-17.78l153.21,153.21c4.72,4.72,7.37,11.11,7.37,17.78Z" />
    </svg>
  );
}

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MAIN_SITE = 'https://rukny.io';
const DEVELOPERS_URL =
  process.env.NEXT_PUBLIC_DEVELOPERS_URL || 'https://developers.rukny.io';
const BUSINESS_URL =
  process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.rukny.io';
const PRIVACY_URL = `${ACCOUNTS_URL}/privacy`;
const TERMS_URL = `${ACCOUNTS_URL}/terms`;

interface FooterLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'المنتج',
    links: [
      { label: 'المميزات', href: '#features', icon: Sparkles },
      { label: 'التكاملات', href: '#integrations', icon: LayoutGrid },
      { label: 'الأسعار', href: '#pricing', icon: FileText },
      { label: 'ابدأ مجاناً', href: APP_BASE, icon: ArrowUpRight },
    ],
  },
  {
    title: 'الخدمات',
    links: [
      {
        label: 'مطورين',
        href: DEVELOPERS_URL,
        icon: Code2,
        external: true,
      },
      {
        label: 'فريق العمل',
        href: `${MAIN_SITE}/team`,
        icon: Users,
        external: true,
      },
      {
        label: 'ذكاء اصطناعي',
        href: `${MAIN_SITE}/products/ai`,
        icon: Bot,
        external: true,
      },
      {
        label: 'بريد الأعمال',
        href: BUSINESS_URL,
        icon: Mail,
        external: true,
      },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'مركز المساعدة', href: `${APP_BASE}/help`, icon: HelpCircle },
      { label: 'الأسئلة الشائعة', href: '#pricing', icon: FileText },
      {
        label: 'منصة ركني',
        href: MAIN_SITE,
        icon: ExternalLink,
        external: true,
      },
    ],
  },
  {
    title: 'القانونية',
    links: [
      { label: 'سياسة الخصوصية', href: PRIVACY_URL, icon: Shield, external: true },
      { label: 'شروط الاستخدام', href: TERMS_URL, icon: FileText, external: true },
    ],
  },
];

const SOCIALS = [
  { icon: Facebook, href: MAIN_SITE, label: 'فيسبوك' },
  { icon: Instagram, href: MAIN_SITE, label: 'انستغرام' },
  { icon: Twitter, href: MAIN_SITE, label: 'تويتر' },
  { icon: Youtube, href: MAIN_SITE, label: 'يوتيوب' },
  { icon: Linkedin, href: MAIN_SITE, label: 'لينكدإن' },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
  },
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  const Icon = link.icon;
  const className = cn(
    'group inline-flex items-center gap-2.5 text-[13px] text-[var(--muted-foreground)] transition-[color,transform] duration-200',
    'hover:text-[var(--primary)] hover:-translate-x-0.5',
  );

  const content = (
    <>
      {Icon ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)] transition-[background-color,color] duration-200 group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]">
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
      ) : null}
      <span>{link.label}</span>
      {link.external ? (
        <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
      ) : null}
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {content}
    </Link>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 size-[420px] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 size-[320px] rounded-full bg-[var(--foreground)] opacity-[0.04] blur-[90px]"
      />

      <div className="relative mx-auto w-full max-w-[var(--max-content-width)] px-5 py-16 min-[720px]:px-6 min-[720px]:py-20 min-[1280px]:px-0">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="overflow-hidden rounded-4xl landing-glass"
        >
          {/* Brand + CTAs */}
          <div className="grid gap-10 p-8 min-[720px]:grid-cols-[1.35fr_1fr] min-[720px]:items-center min-[720px]:p-10 min-[1280px]:p-12">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                  <RuknyLogoIcon className="h-6 w-auto" />
                </span>
                <div>
                  <span className="block text-lg font-bold tracking-tight text-[var(--foreground)]">
                    ركني
                  </span>
                  <span className="block text-[12px] font-medium text-[var(--muted-foreground)]">
                    Forms
                  </span>
                </div>
              </Link>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--muted-foreground)]">
                منصة عربية لإنشاء وإدارة النماذج الاحترافية — تصميم سريع،
                تكاملات ذكية، وتحليلات فورية لنمو أعمالك.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-[480px]:flex-row min-[720px]:flex-col min-[960px]:flex-row">
              <Link
                href={APP_BASE}
                className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 transition-[transform,opacity] duration-300 hover:opacity-95 active:scale-[0.98]"
              >
                <span>ابدأ مجاناً</span>
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] transition-[border-color,background-color] duration-200 hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/[0.04]"
              >
                <LogIn className="size-4 text-[var(--muted-foreground)]" />
                <span>تسجيل الدخول</span>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 p-8 min-[720px]:grid-cols-4 min-[720px]:gap-8 min-[720px]:p-10 min-[1280px]:p-12">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                  {column.title}
                </h3>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-5 min-[720px]:flex-row min-[720px]:justify-between">
          <p className="order-2 text-[12px] text-[var(--muted-foreground)] min-[720px]:order-1">
            © {year} ركني. جميع الحقوق محفوظة.
          </p>

          <div className="order-1 flex items-center gap-2 min-[720px]:order-2">
            <span className="sr-only">تابعنا على</span>
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex size-9 items-center justify-center rounded-full border border-[var(--border)]/80 bg-[var(--surface)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] active:scale-95"
              >
                <Icon className="size-3.5" />
              </a>
            ))}
          </div>

          <div className="order-3 flex flex-wrap items-center justify-center gap-5">
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
            >
              الخصوصية
            </a>
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
            >
              الشروط
            </a>
            <a
              href={MAIN_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
            >
              rukny.io
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
