import type { FormField } from '@/lib/forms-api';

export function FormFieldsList({
  fields,
}: {
  fields: FormField[];
  formSlug?: string;
}) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        لا توجد حقول بعد. استخدم المحرّر البصري لإضافة حقول ومنطق شرطي.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
      {fields
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <li
            key={field.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {field.label}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {field.type}
                {field.required ? ' · مطلوب' : ''}
                {field.conditionalLogic ? ' · شرطي' : ''}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-[var(--muted-foreground)]">
              #{field.order + 1}
            </span>
          </li>
        ))}
    </ul>
  );
}
