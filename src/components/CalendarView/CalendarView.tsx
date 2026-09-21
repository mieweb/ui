'use client';

import * as React from 'react';
import { DateTime, Info } from 'luxon';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
import { Button } from '../Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import {
  accentClasses,
  defaultViewLabels,
  toDate,
  type ViewBaseProps,
  type ViewLabels,
} from '../../views/types';

// =============================================================================
// Types
// =============================================================================

export type CalendarViewSlot =
  | 'toolbar'
  | 'weekday'
  | 'day'
  | 'outsideDay'
  | 'today'
  | 'entry'
  | 'selectedEntry'
  | 'state';

export interface CalendarLabels extends ViewLabels {
  previousMonth: string;
  nextMonth: string;
  today: string;
  /** Overflow affordance. `{count}` is substituted. */
  more: string;
}

export const defaultCalendarLabels: CalendarLabels = {
  ...defaultViewLabels,
  empty: 'Nothing this month',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Today',
  more: '{count} more',
};

export interface CalendarViewProps<T> extends ViewBaseProps<T> {
  /** Controlled month. Any date inside the month works. */
  month?: Date;
  /** Starting month when uncontrolled. Defaults to the month containing `now`. */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /**
   * IANA zone the grid is drawn in, e.g. `America/New_York`. Defaults to the
   * runtime's. A day boundary is a business fact, so state it explicitly when
   * the collection belongs to somewhere other than the viewer.
   */
  timeZone?: string;
  /** 1 = Monday … 7 = Sunday. Defaults to Monday. */
  weekStartsOn?: number;
  /** Locale for month, weekday and day-number formatting. */
  locale?: string;
  /** Entries to show per day before collapsing into "{count} more". */
  maxPerDay?: number;
  labels?: Partial<CalendarLabels>;
  classNames?: Partial<Record<CalendarViewSlot, string>>;
  /** Hide the month toolbar when the host renders its own. */
  hideToolbar?: boolean;
}

interface Placed<T> {
  id: string;
  item: T;
  start: DateTime;
  end: DateTime;
}

// =============================================================================
// Component
// =============================================================================

export function CalendarView<T>({
  items,
  accessors,
  loading = false,
  error = null,
  selectedId = null,
  onOpen,
  getHref,
  renderItem,
  emptyState,
  labels,
  month,
  defaultMonth,
  onMonthChange,
  timeZone,
  weekStartsOn = 1,
  locale,
  maxPerDay = 3,
  now,
  className,
  classNames,
  hideToolbar = false,
}: CalendarViewProps<T>) {
  const text = { ...defaultCalendarLabels, ...labels };
  const zone = timeZone ?? DateTime.local().zoneName;
  const today = React.useMemo(
    () => DateTime.fromJSDate(now ?? new Date(), { zone }).startOf('day'),
    [now, zone]
  );

  const [internalMonth, setInternalMonth] = React.useState(() =>
    defaultMonth
      ? DateTime.fromJSDate(defaultMonth, { zone }).startOf('month')
      : today.startOf('month')
  );
  // Re-anchor from the calendar year and month rather than the instant: an
  // instant on the 1st shifted into a behind-UTC zone lands in the month before.
  const current = React.useMemo(() => {
    const source = month ? DateTime.fromJSDate(month, { zone }) : internalMonth;
    return DateTime.fromObject(
      { year: source.year, month: source.month, day: 1 },
      { zone }
    );
  }, [month, internalMonth, zone]);

  const goToMonth = (next: DateTime) => {
    if (!month) setInternalMonth(next);
    onMonthChange?.(next.toJSDate());
  };

  // Six weeks always, so the grid does not change height between months.
  const gridStart = React.useMemo(() => {
    const first = current.startOf('month');
    const offset = (first.weekday - weekStartsOn + 7) % 7;
    return first.minus({ days: offset });
  }, [current, weekStartsOn]);

  const days = React.useMemo(
    () => Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i })),
    [gridStart]
  );

  const weeks = React.useMemo(
    () => Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7)),
    [days]
  );

  const placed = React.useMemo<Placed<T>[]>(() => {
    const out: Placed<T>[] = [];
    for (const item of items) {
      const startDate = toDate(accessors.getStart?.(item));
      if (!startDate) continue;
      const start = DateTime.fromJSDate(startDate, { zone }).startOf('day');
      const endDate = toDate(accessors.getEnd?.(item));
      const end = endDate
        ? DateTime.fromJSDate(endDate, { zone }).startOf('day')
        : start;
      out.push({
        id: accessors.getId(item),
        item,
        start,
        // A backwards range is data, not a crash: clamp it to one day.
        end: end < start ? start : end,
      });
    }
    return out;
  }, [items, accessors, zone]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, Placed<T>[]>();
    for (const day of days) {
      const key = day.toISODate() ?? '';
      map.set(
        key,
        placed.filter((p) => p.start <= day && day <= p.end)
      );
    }
    return map;
  }, [days, placed]);

  const weekdayNames = React.useMemo(() => {
    const names = Info.weekdays('short', { locale });
    return Array.from(
      { length: 7 },
      (_, i) => names[(weekStartsOn - 1 + i) % 7]
    );
  }, [locale, weekStartsOn]);

  const state = (content: React.ReactNode) => (
    <div
      data-slot="calendar-view-state"
      className={cn(
        'border-border bg-card text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-10 text-center text-sm',
        classNames?.state
      )}
    >
      {content}
    </div>
  );

  if (error) {
    return state(
      <p role="alert" className="text-destructive">
        {text.error}
      </p>
    );
  }
  if (loading) {
    return state(
      <span className="flex items-center gap-2">
        <Spinner size="sm" label={text.loading} />
        <span aria-hidden>{text.loading}</span>
      </span>
    );
  }

  const monthLabel = current
    .setLocale(locale ?? current.locale ?? 'en')
    .toFormat('LLLL yyyy');
  const nothingPlaced = placed.length === 0;

  return (
    <div
      data-slot="calendar-view"
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      {!hideToolbar && (
        <div
          data-slot="calendar-view-toolbar"
          className={cn(
            'border-border flex items-center gap-2 border-b px-3 py-2',
            classNames?.toolbar
          )}
        >
          <h3 aria-live="polite" className="text-sm font-semibold">
            {monthLabel}
          </h3>
          <div className="ms-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={text.previousMonth}
              onClick={() => goToMonth(current.minus({ months: 1 }))}
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToMonth(today.startOf('month'))}
            >
              {text.today}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={text.nextMonth}
              onClick={() => goToMonth(current.plus({ months: 1 }))}
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {nothingPlaced && emptyState ? (
        emptyState
      ) : (
        // `table`, not `grid`: a grid promises arrow-key navigation between
        // cells, which this does not implement. Rows are explicit because a
        // columnheader or cell outside one is invalid ARIA, not just untidy.
        <div role="table" aria-label={monthLabel}>
          <div role="rowgroup">
            <div role="row" className="border-border grid grid-cols-7 border-b">
              {weekdayNames.map((name) => (
                <div
                  key={name}
                  role="columnheader"
                  data-slot="calendar-view-weekday"
                  className={cn(
                    'text-muted-foreground px-2 py-1.5 text-center text-xs font-medium tracking-wide uppercase',
                    classNames?.weekday
                  )}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            {weeks.map((week) => (
              <div
                key={week[0].toISODate()}
                role="row"
                className="grid grid-cols-7"
              >
                {week.map((day) => {
                  const key = day.toISODate() ?? '';
                  const entries = byDay.get(key) ?? [];
                  const outside = day.month !== current.month;
                  const isToday = day.hasSame(today, 'day');
                  const visible = entries.slice(0, maxPerDay);
                  const overflow = entries.length - visible.length;
                  return (
                    <div
                      key={key}
                      role="cell"
                      data-slot="calendar-view-day"
                      data-outside={outside || undefined}
                      data-today={isToday || undefined}
                      className={cn(
                        'border-border min-h-24 border-e border-b p-1 last:border-e-0',
                        outside && cn('bg-muted/30', classNames?.outsideDay),
                        isToday && classNames?.today,
                        classNames?.day
                      )}
                    >
                      <div
                        className={cn(
                          'mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums',
                          outside ? 'text-muted-foreground' : 'text-foreground',
                          // primary-800, not 500: white on the mid scale is
                          // about 2:1 and fails AA. Same pair Button uses.
                          isToday && 'bg-primary-800 font-semibold text-white'
                        )}
                      >
                        <time dateTime={key}>{day.day}</time>
                        {isToday && (
                          <span className="sr-only">{text.today}</span>
                        )}
                      </div>
                      <ul className="space-y-0.5">
                        {visible.map(({ id, item, start, end }) => {
                          const accent =
                            accessors.getAccent?.(item) ?? 'primary';
                          const selected = id === selectedId;
                          const body = renderItem?.(item, {
                            view: 'calendar',
                          }) ?? (
                            <span className="block truncate">
                              {accessors.getTitle(item)}
                            </span>
                          );
                          const classes = cn(
                            'block w-full rounded px-1 py-0.5 text-start text-xs text-foreground',
                            accentClasses[accent].tint,
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            classNames?.entry,
                            selected &&
                              cn(
                                'ring-1',
                                accentClasses[accent].border,
                                classNames?.selectedEntry
                              )
                          );
                          // A multi-day item repeats on each day it covers; the
                          // range is in the accessible name, not in the geometry.
                          const spanLabel = start.hasSame(end, 'day')
                            ? undefined
                            : `${accessors.getTitle(item)}, ${start.toISODate()} to ${end.toISODate()}`;
                          const href = getHref?.(id, item);
                          return (
                            <li key={id}>
                              {href ? (
                                <a
                                  href={href}
                                  aria-label={spanLabel}
                                  aria-current={selected ? 'true' : undefined}
                                  data-slot="calendar-view-entry"
                                  className={classes}
                                  onClick={(event) => {
                                    if (
                                      !onOpen ||
                                      event.defaultPrevented ||
                                      event.metaKey ||
                                      event.ctrlKey ||
                                      event.shiftKey ||
                                      event.button !== 0
                                    )
                                      return;
                                    event.preventDefault();
                                    onOpen(id, item);
                                  }}
                                >
                                  {body}
                                </a>
                              ) : onOpen ? (
                                <button
                                  type="button"
                                  aria-label={spanLabel}
                                  aria-current={selected ? 'true' : undefined}
                                  data-slot="calendar-view-entry"
                                  className={classes}
                                  onClick={() => onOpen(id, item)}
                                >
                                  {body}
                                </button>
                              ) : (
                                <span
                                  aria-label={spanLabel}
                                  data-slot="calendar-view-entry"
                                  className={classes}
                                >
                                  {body}
                                </span>
                              )}
                            </li>
                          );
                        })}
                        {overflow > 0 && (
                          <li className="text-muted-foreground px-1 text-xs">
                            {text.more.replace('{count}', String(overflow))}
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {nothingPlaced && (
            <p className="text-muted-foreground px-3 py-2 text-center text-sm">
              {text.empty}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
