import Link from 'next/link';

const settingsLinks = [
  {
    href: '/app/settings/appearance',
    title: 'المظهر',
    description: 'تخصيص ألوان وخلفية صفحتك العامة',
  },
];

export default function SettingsPage() {
  return (
    <div className="dashboard-page dashboard-section-stack">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          الإعدادات
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          إدارة حسابك وصفحتك الشخصية.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {settingsLinks.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="dashboard-panel block transition-shadow hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
