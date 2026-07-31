export default function HelpPage() {
  return (
    <div className="dashboard-page dashboard-section-stack">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          المساعدة
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          أدلة سريعة وأسئلة شائعة حول استخدام ركني.
        </p>
      </div>

      <div className="dashboard-panel">
        <h2 className="text-base font-semibold text-[var(--foreground)]">كيف أبدأ؟</h2>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          <li>أضف روابطك من قسم «روابطي».</li>
          <li>خصّص مظهر صفحتك من الإعدادات.</li>
          <li>شارك رابط صفحتك العامة مع جمهورك.</li>
        </ol>
      </div>
    </div>
  );
}
