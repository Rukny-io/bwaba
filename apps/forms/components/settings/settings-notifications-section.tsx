'use client';

import Link from 'next/link';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { Switch } from '@heroui/react';
import { APP_BASE } from '@/components/app/nav-config';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { useBrowserPush } from '@/hooks/use-browser-push';
import { useFormsPreferences } from '@/hooks/use-forms-preferences';
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
} from '@/lib/notification-categories';

const CATEGORY_ORDER: NotificationCategory[] = [
  'submissions',
  'security',
  'integrations',
];

export function SettingsNotificationsSection() {
  const { preferences, update } = useFormsPreferences();
  const { supported: pushSupported, subscribed, busy: pushBusy, toggle: togglePush } =
    useBrowserPush();

  return (
    <SettingsSectionCard
      icon={Bell}
      title="إشعارات Forms"
      description="تنبيهات الاستجابات والنشاط داخل تطبيق النماذج."
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">
            أنواع الإشعارات في اللوحة
          </p>
          {CATEGORY_ORDER.map((key) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-3.5"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {NOTIFICATION_CATEGORY_LABELS[key]}
                </p>
              </div>
              <Switch
                isSelected={preferences.notificationCategories[key]}
                onChange={(checked) =>
                  update({
                    notificationCategories: {
                      ...preferences.notificationCategories,
                      [key]: checked,
                    },
                  })
                }
                aria-label={NOTIFICATION_CATEGORY_LABELS[key]}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          ))}
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-3.5">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              تنبيه داخل التطبيق (Toast)
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              إظهار رسالة خفيفة عند وصول إشعار واللوحة مغلقة.
            </p>
          </div>
          <Switch
            isSelected={preferences.showInAppNotificationToasts}
            onChange={(checked) =>
              update({ showInAppNotificationToasts: checked })
            }
            aria-label="تنبيه داخل التطبيق"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-3.5">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-[var(--muted-foreground)]" />
              <p className="text-sm font-medium text-[var(--foreground)]">
                إشعارات المتصفح (Push)
              </p>
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {pushSupported
                ? subscribed
                  ? 'مفعّل — ستصلك تنبيهات حتى عند إغلاق التبويب.'
                  : 'فعّل لتلقي تنبيهات خارج التطبيق (يتطلب إذن المتصفح).'
                : 'غير مدعوم في هذا المتصفح.'}
            </p>
          </div>
          <Switch
            isSelected={subscribed}
            isDisabled={!pushSupported || pushBusy}
            onChange={(checked) => void togglePush(checked)}
            aria-label="إشعارات المتصفح"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>

        <Link
          href={`${APP_BASE}/notifications`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)]/60"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              فتح لوحة الإشعارات
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              سجل كامل مع فلاتر وتجميع حسب التاريخ من أيقونة الجرس.
            </p>
          </div>
          <Bell className="size-4 shrink-0 text-[var(--muted-foreground)]" />
        </Link>

        <div className="flex gap-3 rounded-2xl border border-[var(--border)] px-4 py-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Mail className="size-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              بريد التنبيهات
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              يُضبط لكل نموذج من تبويب «التكاملات» داخل النموذج (بريد، Webhook،
              Google Sheets).
            </p>
            <Link
              href={`${APP_BASE}/forms`}
              className="inline-flex text-[13px] font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              الانتقال إلى نماذجي
            </Link>
          </div>
        </div>
      </div>
    </SettingsSectionCard>
  );
}
