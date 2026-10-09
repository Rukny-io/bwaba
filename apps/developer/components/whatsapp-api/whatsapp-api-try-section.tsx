'use client';

import { useTranslations } from '@/components/providers/translations-provider';
import { waApiPanel } from '@/components/whatsapp-api/whatsapp-api-shared';

export function WhatsappApiTrySection(_props: {
  endpoint?: string;
  recipe?: string;
}) {
  const d = useTranslations().whatsappApi;

  return (
    <section className={waApiPanel}>
      <h1 className="text-base font-semibold text-[var(--foreground)]">{d.tryTitle}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">{d.tryDesc}</p>
    </section>
  );
}
