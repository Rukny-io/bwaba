import Link from 'next/link';
import Image from 'next/image';

/**
 * 🔍 صفحة 404 — غير موجود
 * تُعرض عند زيارة مسار غير موجود
 */
export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-dvh flex items-center justify-center bg-[var(--background)] px-4"
    >
      <div className="text-center max-w-sm">
        {/* Illustration */}
        <div className="w-52 h-52 mx-auto mb-5 rounded-4xl overflow-hidden">
          <Image
            src="/CI/7e3612a2c0fa27c5e474d0d03a29ad42.jpg"
            alt="404"
            width={208}
            height={208}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-[var(--foreground)] mb-2">
          وينها الصفحة؟ 
        </h1>

        {/* Description */}
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-2">
          هاي الصفحة مو موجودة، يمكن ضاعت بالطريق أو انحذفت
        </p>

        {/* Action */}
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          رجعنــي للرئيسية
        </Link>
      </div>
    </div>
  );
}
