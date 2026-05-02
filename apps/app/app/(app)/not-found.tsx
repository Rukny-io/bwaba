import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

/**
 * 🔍 صفحة 404 — داخل لوحة التحكم
 * تُعرض عند زيارة مسار غير موجود داخل /app
 */
export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        {/* Illustration */}
        <div className="w-48 h-48 mx-auto mb-5 rounded-3xl overflow-hidden">
          <Image
            src="/CI/7e3612a2c0fa27c5e474d0d03a29ad42.jpg"
            alt="404"
            width={192}
            height={192}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-base font-bold text-[var(--foreground)] mb-1.5">
          وينها الصفحة؟ 🤔
        </h1>

        {/* Description */}
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-5">
          هاي الصفحة مو موجودة، يمكن ضاعت بالطريق أو انحذفت
        </p>

        {/* Action */}
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowRight className="w-4 h-4" />
          رجّعني للرئيسية
        </Link>
      </div>
    </div>
  );
}
