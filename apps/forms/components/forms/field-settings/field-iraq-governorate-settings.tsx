'use client';

import { MapPin } from 'lucide-react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';

export function FieldIraqGovernorateSettings() {
  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={MapPin}
        title="محافظة عراقية"
        description="قائمة منسدلة بجميع محافظات العراق (١٨ محافظة) بأسماء عربية."
      >
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          يختار المستجيب محافظته من القائمة. تُستخدم القيمة في التحليلات
          والتقارير الجغرافية.
        </p>
      </SettingsSectionCard>
    </div>
  );
}
