import Link from 'next/link';

export function CtaSection() {
  return (
    <section id="cta" className="scroll-mt-24 py-16 min-[720px]:py-24">
      <div className="mx-auto max-w-6xl px-5 min-[720px]:px-6">
        <div className="landing-glass grid place-items-center rounded-[2rem] px-6 py-12 text-center min-[720px]:px-12 min-[720px]:py-16">
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
            جاهز لتوحيد محادثاتك؟
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-base">
            أنشئ حساباً مجانياً، اربط Instagram، وابدأ إدارة المحادثات من لوحة ركني Business.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="landing-invert-btn inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold">
              ابدأ مجاناً
            </Link>
            <Link href="/login" className="landing-outline-btn inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
