'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Bell, MessageSquare } from 'lucide-react';
import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardSurface,
} from '@/components/app/dashboard-primitives';

export function MessengerComingSoonPanel() {
  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        title="Messenger"
        description="ربط صفحات Facebook لاستقبال رسائل Messenger في نفس صندوق الوارد."
      />

      <DashboardSurface className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-[var(--border)] p-6 sm:p-8 lg:border-b-0 lg:border-e">
            <span className="inline-flex items-center rounded-full bg-[#0084ff]/10 px-3 py-1 text-xs font-semibold text-[#0084ff]">
              قريباً
            </span>
            <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">
              Messenger ضمن Business Hub
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              نعمل على تفعيل OAuth لصفحات Facebook، webhooks للرسائل، والرد من
              صندوق الوارد الموحّد — بنفس تجربة Instagram.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-[var(--foreground)]">
              <li className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 size-4 text-[#0084ff]" />
                <span>استقبال رسائل Messenger في صندوق واحد</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="mt-0.5 size-4 text-[#0084ff]" />
                <span>إشعارات فورية وتصنيف المحادثات</span>
              </li>
            </ul>

            <Button isDisabled className="mt-8 rounded-full">
              ربط صفحة Facebook (قريباً)
            </Button>
          </div>

          <div className="flex items-center justify-center bg-[var(--surface-secondary)]/40 p-8">
            <Image
              src="/meta.svg"
              alt="Meta"
              width={120}
              height={40}
              className="opacity-80"
            />
          </div>
        </div>
      </DashboardSurface>

      <DashboardEmptyState
        title="ابدأ بـ Instagram الآن"
        description="يمكنك ربط Instagram Professional اليوم واستخدام صندوق الوارد فوراً."
        action={
          <Link
            href="/app/instagram"
            className="landing-invert-btn inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold"
          >
            الانتقال إلى Instagram
          </Link>
        }
      />
    </div>
  );
}
