'use client';

import { Chip } from '@heroui/react';
import type { AdminFormDetail } from '@/lib/types/forms';
import { formatFieldType, yesNo } from '@/lib/forms-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[65%] text-end text-xs font-medium text-[var(--foreground)]" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export function FormFieldsPanel({ form }: { form: AdminFormDetail }) {
  if (form.fields.length === 0) {
    return (
      <section className={detailPanelClassName}>
        <p className="text-sm text-[var(--muted-foreground)]">This form has no fields yet.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {form.isMultiStep && form.steps.length > 0 ? (
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Steps</h2>
          <div className="space-y-2">
            {form.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2"
              >
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {step.title}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Step {step.order + 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Fields ({form.fields.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-start text-sm">
            <thead className="bg-[var(--surface-secondary)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2.5 text-start">#</th>
                <th className="px-3 py-2.5 text-start">Label</th>
                <th className="px-3 py-2.5 text-start">Type</th>
                <th className="hidden px-3 py-2.5 text-start sm:table-cell">Required</th>
              </tr>
            </thead>
            <tbody>
              {form.fields.map((field, index) => (
                <tr
                  key={field.id}
                  className="border-t border-[var(--border)]/60"
                >
                  <td className="px-3 py-2.5 tabular-nums text-[var(--muted-foreground)]">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-[var(--foreground)]">
                    {field.label}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                    {formatFieldType(field.type)}
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    {field.required ? (
                      <Chip size="sm" variant="soft" color="accent">
                        Required
                      </Chip>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
