'use client';

import { Globe } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { setLocaleAction } from '@/actions/set-locale';

export function AppsLocaleBar() {
  const t = useTranslations();
  const isEn = t.common.switchLang === 'العربية';

  async function handleLangSwitch() {
    await setLocaleAction(isEn ? 'ar' : 'en');
    window.location.reload();
  }

  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={() => void handleLangSwitch()}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
      >
        <Globe className="size-3.5" />
        {t.common.switchLang}
      </button>
    </div>
  );
}
