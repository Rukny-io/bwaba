'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from '@/components/providers/translations-provider';
import { appToast } from '@/lib/app-toast';

export function ProductRequiredBanner() {
  const searchParams = useSearchParams();
  const need = searchParams.get('need');
  const t = useTranslations();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!need || shownRef.current === need) return;
    shownRef.current = need;
    const items = (t.products.items ?? {}) as Record<string, { name?: string }>;
    const name = items[need]?.name ?? need;
    appToast.info(t.products.installRequiredTitle, {
      description: t.products.installRequiredDesc.replace('{name}', name),
    });
  }, [need, t]);

  return null;
}
