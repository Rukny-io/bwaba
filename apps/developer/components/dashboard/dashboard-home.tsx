import 'server-only';
import { getDictionary } from '@/lib/dictionary';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

interface PlaceholderPanelProps {
  title: string;
  description: string;
}

export async function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  const dictionary = await getDictionary();
  return (
    <div className="dashboard-panel">
      <DashboardPageHeader className="mb-4 sm:mb-4" title={title} description={description} />
      <p className="inline-flex rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
        {dictionary.panel.comingSoon}
      </p>
    </div>
  );
}

interface WelcomeBannerProps {
  userName: string;
}

export async function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const dictionary = await getDictionary();
  const t = dictionary.banner;

  const steps = [
    { label: t.step1, done: false },
    { label: t.step2, done: false },
    { label: t.step3, done: false },
    { label: t.step4, done: false },
  ];

  return (
    <section className="dashboard-card p-5 sm:p-6">
      <p className="text-xs font-medium text-[var(--primary)]">{t.welcome}</p>
      <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
        {t.hello.replace('{userName}', userName)}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {t.subtitle}
      </p>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? 'bg-[var(--success)] text-[var(--success-foreground)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]'
              }`}
            >
              {index + 1}
            </span>
            <span className="text-[var(--foreground)]">{step.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
