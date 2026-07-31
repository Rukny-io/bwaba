'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Button,
  Description,
  Label,
  Popover,
  RangeCalendar,
} from '@heroui/react';
import {
  formatScheduleRangeSummary,
  type ScheduleRange,
} from '@/lib/publish-schedule-utils';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

interface FormPublishScheduleFieldsProps {
  range: ScheduleRange;
  onRangeChange: (range: ScheduleRange) => void;
}

function ScheduleRangeCalendar({
  range,
  onRangeChange,
  onComplete,
}: {
  range: ScheduleRange;
  onRangeChange: (range: ScheduleRange) => void;
  onComplete?: () => void;
}) {
  return (
    <RangeCalendar
      aria-label="فترة قبول الاستجابات"
      value={range}
      onChange={(value) => {
        const next = value as ScheduleRange;
        onRangeChange(next);
        if (next?.start && next?.end) {
          onComplete?.();
        }
      }}
      className="w-full min-w-[17.5rem] p-1"
    >
      <RangeCalendar.Header className="pb-2">
        <RangeCalendar.YearPickerTrigger>
          <RangeCalendar.YearPickerTriggerHeading />
          <RangeCalendar.YearPickerTriggerIndicator />
        </RangeCalendar.YearPickerTrigger>
        <RangeCalendar.NavButton slot="previous" />
        <RangeCalendar.NavButton slot="next" />
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => <RangeCalendar.Cell date={date} />}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
      <RangeCalendar.YearPickerGrid>
        <RangeCalendar.YearPickerGridBody>
          {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
        </RangeCalendar.YearPickerGridBody>
      </RangeCalendar.YearPickerGrid>
    </RangeCalendar>
  );
}

export function FormPublishScheduleFields({
  range,
  onRangeChange,
}: FormPublishScheduleFieldsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const summary = formatScheduleRangeSummary(range);

  return (
    <DashboardSurface padding="md" className="bg-[var(--surface-secondary)]/25">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-[var(--foreground)]">
          فترة قبول الاستجابات
        </Label>
        <Description>
          حدّد تاريخ البداية والنهاية. بدون تحديد — النموذج متاح دون قيود
          زمنية.
        </Description>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Popover isOpen={calendarOpen} onOpenChange={setCalendarOpen}>
          <Popover.Trigger>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl border-[var(--border)] px-4 font-semibold"
            >
              <CalendarDays className="size-4 shrink-0" data-slot="icon" />
              {summary ? 'تعديل التاريخ' : 'تحديد التاريخ'}
            </Button>
          </Popover.Trigger>
          <Popover.Content placement="bottom start" offset={8}>
            <Popover.Dialog className="p-2">
              <Popover.Arrow />
              <ScheduleRangeCalendar
                range={range}
                onRangeChange={onRangeChange}
                onComplete={() => setCalendarOpen(false)}
              />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

        {summary ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-10 rounded-xl text-xs text-[var(--muted-foreground)]"
            onPress={() => onRangeChange(null)}
          >
            مسح الفترة
          </Button>
        ) : null}
      </div>

      {summary ? (
        <p
          className={cn(
            'mt-3 inline-flex max-w-full items-center gap-2 rounded-xl',
            'border border-[var(--border)]/50 bg-[var(--surface)] px-3 py-2',
            'text-[13px] font-medium text-[var(--foreground)]',
          )}
        >
          <CalendarDays
            className="size-4 shrink-0 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <span className="min-w-0 leading-snug">{summary}</span>
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
          لم تُحدَّد فترة بعد.
        </p>
      )}
    </DashboardSurface>
  );
}
