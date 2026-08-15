import { getWhatsappApiErrorCopy } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { COMMON_ERRORS } from '@/lib/whatsapp-api-catalog';

export function WhatsappApiErrors() {
  const d = WHATSAPP_API_COPY;
  const errorCopy = getWhatsappApiErrorCopy();

  return (
    <section className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
      <div className="border-b border-[var(--border)]/40 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold">{d.errorsTitle}</h2>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
          {d.errorsDesc}
        </p>
      </div>
      <ul className="divide-y divide-[var(--border)]/30">
        {COMMON_ERRORS.map((item) => (
          <li
            key={item.code + item.key}
            className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:px-5"
          >
            <code
              className="w-14 shrink-0 font-mono text-[13px] font-semibold text-[var(--foreground)]"
              dir="ltr"
            >
              {item.code}
            </code>
            <p className="text-[13px] text-[var(--muted-foreground)]">
              {errorCopy[item.key]}
            </p>
          </li>
        ))}
      </ul>
      <p className="border-t border-[var(--border)]/40 px-4 py-3 text-[12.5px] text-[var(--muted-foreground)] sm:px-5">
        {d.mediaComingSoon}
      </p>
    </section>
  );
}
