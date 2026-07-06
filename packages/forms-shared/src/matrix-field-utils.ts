export interface MatrixFieldData {
  rows: string[];
  columns: string[];
}

export const DEFAULT_MATRIX_ROWS = ['عنصر 1', 'عنصر 2'] as const;
export const DEFAULT_MATRIX_COLUMNS = ['1', '2', '3', '4', '5'] as const;

function normalizeStringList(value: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const list = value.map((item) => String(item).trim()).filter(Boolean);
  return list.length > 0 ? list : [...fallback];
}

/** Reads matrix rows/columns from API payload or draft field shape. */
export function parseMatrixFieldData(field: {
  options?: unknown;
  validationRules?: unknown;
}): MatrixFieldData {
  if (
    field.options &&
    typeof field.options === 'object' &&
    !Array.isArray(field.options)
  ) {
    const matrix = field.options as { rows?: unknown; columns?: unknown };
    return {
      rows: normalizeStringList(matrix.rows, DEFAULT_MATRIX_ROWS),
      columns: normalizeStringList(matrix.columns, DEFAULT_MATRIX_COLUMNS),
    };
  }

  const columns = normalizeStringList(field.options, DEFAULT_MATRIX_COLUMNS);
  let rows: string[] = [...DEFAULT_MATRIX_ROWS];

  if (field.validationRules && typeof field.validationRules === 'object') {
    rows = normalizeStringList(
      (field.validationRules as { rows?: unknown }).rows,
      DEFAULT_MATRIX_ROWS,
    );
  }

  return { rows, columns };
}

export function parseMatrixValue(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && entry.trim()) {
      out[key] = entry;
    }
  }
  return out;
}
