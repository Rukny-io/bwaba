import Link from 'next/link';
import { Globe, Inbox, Mail } from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';

const quickLinks = [
  {
    href: `${APP_BASE}/domains`,
    icon: Globe,
    title: 'ربط دومين',
    description: 'أضف دومينك وتحقق من سجلات DNS',
  },
  {
    href: `${APP_BASE}/mailboxes`,
    icon: Mail,
    title: 'صناديق البريد',
    description: 'حتى 3 صناديق في باقة الاحترافية',
  },
  {
    href: `${APP_BASE}/mail`,
    icon: Inbox,
    title: 'صندوق الوارد',
    description: 'استقبل ورد على رسائل عملائك',
  },
];

export default function DashboardHomePage() {
  return (
    <section className="w-full pt-6 sm:pt-8">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        مرحباً بك في Workspace
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
        اربط دومينك، أنشئ صناديق بريد مخصصة، وأدر رسائلك من مكان واحد متكامل
        مع منصة ركني.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="dashboard-card dashboard-card-interactive group rounded-3xl p-4 transition-shadow sm:p-5"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-[var(--muted-foreground)]">
        MVP — ربط دومين · 3 صناديق · Inbox/Compose
      </p>
    </section>
  );
}
