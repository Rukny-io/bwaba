import Link from 'next/link';
import { PlaceholderPage } from '@/components/app/placeholder-page';
import { APP_BASE } from '@/components/app/nav-config';

export default function MailInboxPage() {
  return (
    <div className="w-full pt-6 sm:pt-8">
      <PlaceholderPage
        title="صندوق الوارد"
        description="ستظهر هنا الرسائل الواردة بعد ربط الدومين وتفعيل الاستقبال عبر Amazon SES. يدعم MVP المحادثات (threads) والرد المباشر."
      />
      <Link
        href={`${APP_BASE}/mail/compose`}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-3xl bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)]"
      >
        رسالة جديدة
      </Link>
    </div>
  );
}
