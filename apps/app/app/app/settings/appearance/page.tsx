export default function AppearanceSettingsPage() {
  return (
    <div className="dashboard-page dashboard-section-stack">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          المظهر
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          خلفية الصفحة، الألوان، والخط — قريباً.
        </p>
      </div>

      <div className="dashboard-panel border-dashed py-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          محرّر المظهر سيتوفر في مرحلة الإعدادات القادمة.
        </p>
      </div>
    </div>
  );
}
