import type { FormField } from '@/lib/forms-api';

export function FormFieldsList({
  fields,
}: {
  fields: FormField[];
  formSlug?: string;
}) {
  if (fields.length === 0) {
    return (
      <p className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
        لا توجد حقول بعد. استخدم المحرّر البصري لإضافة حقول ومنطق شرطي.
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/30 divide-y divide-[var(--border)]/50">
      {fields
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <li
            key={field.id}
            className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {field.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] sm:text-xs">
                {field.type}
                {field.required ? ' · مطلوب' : ''}
                {field.conditionalLogic ? ' · شرطي' : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] tabular-nums text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/40">
              #{field.order + 1}
            </span>
          </li>
        ))}
    </ul>
  );
}
