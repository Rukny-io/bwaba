function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: { key: string; label: string }[],
) {
  if (rows.length === 0) return;

  const cols =
    columns ??
    Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const header = cols.map((col) => escapeCsvCell(col.label)).join(',');
  const body = rows
    .map((row) =>
      cols.map((col) => escapeCsvCell(row[col.key])).join(','),
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${header}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
