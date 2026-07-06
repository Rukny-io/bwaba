import {
  CalendarDate,
  Time,
  getLocalTimeZone,
  parseAbsolute,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from '@internationalized/date';

export type ScheduleRange = { start: CalendarDate; end: CalendarDate } | null;

export function scheduleFromForm(
  opensAt?: string | null,
  closesAt?: string | null,
  timeZone = getLocalTimeZone(),
): ScheduleRange {
  const openDate = isoToCalendarDate(opensAt, timeZone);
  const closeDate = isoToCalendarDate(closesAt, timeZone);

  if (!openDate && !closeDate) return null;

  return {
    start: openDate ?? closeDate!,
    end: closeDate ?? openDate!,
  };
}

export function scheduleToIso(
  range: ScheduleRange,
  timeZone = getLocalTimeZone(),
): { opensAt?: string; closesAt?: string } {
  if (!range) {
    return { opensAt: undefined, closesAt: undefined };
  }

  return {
    opensAt: dateTimeToIso(range.start, new Time(0, 0, 0), timeZone),
    closesAt: dateTimeToIso(range.end, new Time(23, 59, 59), timeZone),
  };
}

export function formatCalendarDate(
  date: CalendarDate,
  locale = 'ar',
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date.toDate(getLocalTimeZone()));
}

export function formatScheduleRangeSummary(range: ScheduleRange): string | null {
  if (!range) return null;
  if (range.start.compare(range.end) === 0) {
    return formatCalendarDate(range.start);
  }
  return `من ${formatCalendarDate(range.start)} إلى ${formatCalendarDate(range.end)}`;
}

function isoToCalendarDate(
  iso: string | null | undefined,
  tz: string,
): CalendarDate | null {
  if (!iso) return null;
  try {
    return toCalendarDate(parseAbsolute(iso, tz));
  } catch {
    return null;
  }
}

function dateTimeToIso(date: CalendarDate, time: Time, tz: string): string {
  return toZoned(toCalendarDateTime(date, time), tz).toDate().toISOString();
}
