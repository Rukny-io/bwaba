'use client';

import { Globe } from 'lucide-react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';

export function FieldRespondentCountrySettings() {
  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={Globe}
        title="بلد المستجيب"
        description="يُكتشف بلد المستجيب تلقائياً من عنوان IP عند الإرسال، ويظهر في بيانات الإرسال دون أن يرى المستجيب حقل إدخال."
      >
        <ul className="space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <li className="flex gap-2">
            <span className="text-[var(--foreground)]" aria-hidden>
              •
            </span>
            <span>
              لا يُطلب من المستجيب أي معلومة شخصية — يُسجّل رمز البلد واسمه
              فقط.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--foreground)]" aria-hidden>
              •
            </span>
            <span>
              لا يُستخدم للتتبع بين الزيارات؛ يُلحق بالإرسال الحالي فقط.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--foreground)]" aria-hidden>
              •
            </span>
            <span>
              في المعاينة والنموذج العام لن يظهر حقل — القيمة تُملأ عند الإرسال
              من الخادم.
            </span>
          </li>
        </ul>
      </SettingsSectionCard>
    </div>
  );
}
