'use client';

import {
  parseMatrixValue,
  type MatrixFieldData,
} from '@rukny/forms-shared/matrix-field-utils';
import { cn } from '@/lib/utils';

interface MatrixFieldInputProps {
  fieldId: string;
  matrix: MatrixFieldData;
  value: unknown;
  onChange: (value: Record<string, string>) => void;
  themed?: boolean;
}

export function MatrixFieldInput({
  fieldId,
  matrix,
  value,
  onChange,
  themed,
}: MatrixFieldInputProps) {
  const current = parseMatrixValue(value);
  const { rows, columns } = matrix;

  function setCell(row: string, column: string) {
    onChange({ ...current, [row]: column });
  }

  if (themed) {
    return (
      <div className="public-form-matrix overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-sm" dir="rtl">
          <thead>
            <tr>
              <th className="p-2" aria-hidden />
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2 py-2 text-center text-xs font-semibold text-[color:var(--form-text-label)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-[color:var(--form-input-border)]">
                <th
                  scope="row"
                  className="px-2 py-3 text-start text-sm font-medium text-[color:var(--form-text-heading)]"
                >
                  {row}
                </th>
                {columns.map((column) => {
                  const selected = current[row] === column;
                  return (
                    <td key={column} className="px-1.5 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`${row}: ${column}`}
                        aria-pressed={selected}
                        onClick={() => setCell(row, column)}
                        className={cn(
                          'mx-auto flex size-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                          selected
                            ? 'border-[color:var(--form-primary)] bg-[color:var(--form-primary)] text-[color:var(--form-btn-text)]'
                            : 'border-[color:var(--form-input-border)] bg-white text-[color:var(--form-text-body)] hover:border-[color:var(--form-primary)]',
                        )}
                      >
                        <span className="sr-only">{column}</span>
                        <span
                          aria-hidden
                          className={cn(
                            'size-2.5 rounded-full',
                            selected
                              ? 'bg-[color:var(--form-btn-text)]'
                              : 'bg-transparent',
                          )}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="public-form-matrix overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[18rem] border-collapse text-sm" dir="rtl">
        <thead className="bg-[var(--surface-secondary)]/60">
          <tr>
            <th className="p-2" aria-hidden />
            {columns.map((column) => (
              <th
                key={column}
                className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="border-t border-[var(--border)]">
              <th
                scope="row"
                className="px-3 py-2.5 text-start text-sm font-medium text-[var(--foreground)]"
              >
                {row}
              </th>
              {columns.map((column) => (
                <td key={column} className="px-2 py-2 text-center">
                  <input
                    type="radio"
                    name={`${fieldId}-${row}`}
                    checked={current[row] === column}
                    onChange={() => setCell(row, column)}
                    aria-label={`${row}: ${column}`}
                    className="size-4 accent-[var(--primary)]"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
