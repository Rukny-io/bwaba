import type { FormAnalyticsResponse } from '@/lib/forms-api';

function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFormAnalyticsCsv(data: FormAnalyticsResponse): void {
  const title = data.form?.title ?? 'form';
  const slug = data.form?.slug ?? 'analytics';
  const lines: string[] = [];

  lines.push('القسم,العنوان,القيمة');
  lines.push(
    `ملخص,المشاهدات,${csvCell(data.summary.totalViews)}`,
  );
  lines.push(
    `ملخص,الاستجابات,${csvCell(data.summary.totalSubmissions)}`,
  );
  lines.push(
    `ملخص,معدل الإكمال,${csvCell(data.summary.completionRate)}`,
  );
  lines.push(
    `ملخص,متوسط وقت الإكمال (ث),${csvCell(data.summary.avgTimeToComplete)}`,
  );

  if (data.period) {
    lines.push(
      `الفترة,من,${csvCell(data.period.startDate)}`,
    );
    lines.push(
      `الفترة,إلى,${csvCell(data.period.endDate)}`,
    );
  }

  lines.push('');
  lines.push('التاريخ,مشاهدات,استجابات');
  const trend = data.dailyTrend?.length
    ? data.dailyTrend
    : data.submissionsByDay.map((s) => ({
        date: s.date,
        views: 0,
        submissions: s.count,
      }));
  for (const row of trend) {
    lines.push(
      `${csvCell(row.date)},${csvCell(row.views)},${csvCell(row.submissions)}`,
    );
  }

  lines.push('');
  lines.push('الحقل,النوع,إجابات,تخطي,معدل الاستجابة');
  for (const field of data.fieldAnalytics) {
    lines.push(
      [
        csvCell(field.fieldLabel),
        csvCell(field.fieldType),
        csvCell(field.totalResponses),
        csvCell(field.skipped),
        csvCell(field.responseRate),
      ].join(','),
    );
    if (field.topValues?.length) {
      for (const tv of field.topValues) {
        lines.push(
          `,قيمة,${csvCell(tv.value)},${csvCell(tv.count)},`,
        );
      }
    }
  }

  const safeSlug = slug.replace(/[^\w-]+/g, '_').slice(0, 40);
  downloadBlob(
    `${safeSlug}-analytics.csv`,
    lines.join('\n'),
    'text/csv;charset=utf-8',
  );
}
