'use client';

import Link from 'next/link';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import { EMAIL_ERROR_CATALOG } from '@/lib/email-api-catalog';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

export function EmailApiErrors() {
  const d = EMAIL_API_COPY;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.errorsTitle}</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">{d.errorsDesc}</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_ERROR_CATALOG.map((item) => (
                <tr key={item.status} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2.5 font-mono text-[12px]">{item.status}</td>
                  <td className="px-3 py-2.5">{item.code}</td>
                  <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          href={`${DOCUMENTATION_BASE}/email-api/errors`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          Open public error docs
        </Link>
      </section>
    </div>
  );
}
