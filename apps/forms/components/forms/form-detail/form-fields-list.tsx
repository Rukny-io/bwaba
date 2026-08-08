import type { FormField } from '@/lib/forms-api';
import { formDetailCardSurfaceClass } from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';

export function FormFieldsList({
  fields,
}: {
  fields: FormField[];
  formSlug?: string;
}) {
  if (fields.length === 0) {
    return (
      <div className={cn(formDetailCardSurfaceClass, 'py-8 text-center')}>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          لا توجد حقول بعد. استخدم المحرّر البصري لإضافة حقول ومنطق شرطي.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-[12px]">
      {fields
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <li
            key={field.id}
            className={cn(
              formDetailCardSurfaceClass,
              'flex items-center justify-between gap-3',
            )}
          >
            <div className="min-w-0 text-start">
              <p
                dir="auto"
                className="truncate text-[13px] font-medium text-[var(--foreground)] sm:text-[14px]"
              >
                {field.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] sm:text-[12px]">
                {field.type}
                {field.required ? ' · مطلوب' : ''}
                {field.conditionalLogic ? ' · شرطي' : ''}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full border border-[var(--border)]/60 bg-[var(--surface)]',
                'px-2 py-0.5 text-[10px] font-medium tabular-nums text-[var(--muted-foreground)]',
              )}
            >
              #{field.order + 1}
            </span>
          </li>
        ))}
    </ul>
  );
}
