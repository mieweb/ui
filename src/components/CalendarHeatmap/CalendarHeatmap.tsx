import * as React from 'react';
import { DateTime } from 'luxon';
import { cn } from '../../utils/cn';

export interface CalendarHeatmapDatum {
  /** ISO date (or date-time) the value belongs to; same-day values are summed. */
  date: string;
  value: number;
}

export interface CalendarHeatmapLabels {
  /** Accessible name of the table. */
  title: string;
  /** Accessible name and tooltip of a day cell. */
  cellLabel: (formattedDate: string, value: number, isoDate: string) => string;
  /** Visually hidden summary of the whole range. */
  summary: (total: number, activeDays: number) => string;
  /** Legend ends. */
  less: string;
  more: string;
}

export const defaultCalendarHeatmapLabels: CalendarHeatmapLabels = {
  title: 'Activity calendar',
  cellLabel: (date, value) => `${date}: ${value}`,
  summary: (total, activeDays) =>
    `${total} total across ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}`,
  less: 'Less',
  more: 'More',
};

export interface CalendarHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Values per day. */
  data: CalendarHeatmapDatum[];
  /** First day shown (ISO date). Defaults to 12 weeks before `end`. */
  start?: string;
  /** Last day shown (ISO date). Defaults to today. */
  end?: string;
  /** First day of each column: 0 = Sunday … 6 = Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale for month, weekday and date names. */
  locale?: string;
  /** Makes days focusable buttons (arrow-key navigable) reporting their ISO date. */
  onDayClick?: (date: string) => void;
  /** Overrides for any user-facing string. */
  labels?: Partial<CalendarHeatmapLabels>;
}

const LEVELS = [
  'bg-muted ring-1 ring-inset ring-border',
  'bg-primary-500/25',
  'bg-primary-500/50',
  'bg-primary-500/75',
  'bg-primary-500',
];

function level(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
}

const CELL = 'block h-3 w-3 rounded-sm';

/**
 * Contribution-style calendar: one column per week, one row per weekday, each
 * day tinted on a five-step primary scale.
 *
 * @example
 * ```tsx
 * <CalendarHeatmap data={activity} onDayClick={(date) => openDay(date)} />
 * ```
 */
export const CalendarHeatmap = React.forwardRef<
  HTMLDivElement,
  CalendarHeatmapProps
>(function CalendarHeatmap(
  {
    data,
    start,
    end,
    weekStartsOn = 0,
    locale,
    onDayClick,
    labels: labelOverrides,
    className,
    ...props
  },
  ref
) {
  const labels = { ...defaultCalendarHeatmapLabels, ...labelOverrides };
  const loc = (d: DateTime) => (locale ? d.setLocale(locale) : d);
  const cells = React.useRef(new Map<string, HTMLButtonElement>());
  const [active, setActive] = React.useState<string | null>(null);

  const grid = React.useMemo(() => {
    const parse = (iso?: string) => {
      const d = iso ? DateTime.fromISO(iso) : null;
      return d?.isValid ? d.startOf('day') : null;
    };
    const end_ = parse(end) ?? DateTime.now().startOf('day');
    const start_ = parse(start) ?? end_.minus({ weeks: 12 }).plus({ days: 1 });
    // A reversed range is swapped so there is always at least one day.
    const [first, last] = start_ <= end_ ? [start_, end_] : [end_, start_];
    const origin = first.minus({
      days: ((first.weekday % 7) - weekStartsOn + 7) % 7,
    });
    const weeks = Math.ceil(
      (Math.round(last.diff(origin, 'days').days) + 1) / 7
    );

    const values = new Map<string, number>();
    for (const d of data) {
      const key = DateTime.fromISO(d.date).toISODate();
      if (key) values.set(key, (values.get(key) ?? 0) + d.value);
    }

    const days = Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, (_, r) => {
        const date = origin.plus({ days: w * 7 + r });
        const iso = date.toISODate()!;
        const inRange = date >= first && date <= last;
        return {
          date,
          iso,
          inRange,
          value: inRange ? (values.get(iso) ?? 0) : 0,
        };
      })
    );
    const inRange = days.flat().filter((d) => d.inRange);
    const max = Math.max(0, ...inRange.map((d) => d.value));
    const total = inRange.reduce((sum, d) => sum + d.value, 0);
    const activeDays = inRange.filter((d) => d.value > 0).length;

    // Consecutive weeks grouped by the month of their first in-range day.
    const months: { key: string; date: DateTime; span: number }[] = [];
    for (const week of days) {
      const date = (week.find((d) => d.inRange) ?? week[0]).date;
      const key = date.toFormat('yyyy-MM');
      const prev = months[months.length - 1];
      if (prev?.key === key) prev.span += 1;
      else months.push({ key, date, span: 1 });
    }

    return { days, first, last, max, total, activeDays, months };
  }, [data, start, end, weekStartsOn]);

  const activeDate = active ? DateTime.fromISO(active) : null;
  // Keep one tab stop even when the range changes and drops the active day.
  const focusable =
    activeDate && activeDate >= grid.first && activeDate <= grid.last
      ? active
      : grid.last.toISODate();

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!focusable) return;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const delta: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: rtl ? 7 : -7,
      ArrowRight: rtl ? -7 : 7,
    };
    if (!delta[e.key]) return;
    e.preventDefault();
    const next = DateTime.fromISO(focusable).plus({ days: delta[e.key] });
    if (next < grid.first || next > grid.last) return;
    const iso = next.toISODate()!;
    setActive(iso);
    cells.current.get(iso)?.focus();
  };

  return (
    <div
      ref={ref}
      data-slot="calendar-heatmap"
      className={cn('inline-flex max-w-full flex-col gap-2', className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table
          role={onDayClick ? 'grid' : undefined}
          aria-label={labels.title}
          className="text-muted-foreground border-separate border-spacing-[3px] text-[10px] leading-none"
        >
          <caption className="sr-only">
            {labels.summary(grid.total, grid.activeDays)}
          </caption>
          <thead>
            <tr>
              <td />
              {grid.months.map((m) => (
                <th
                  key={m.key}
                  scope="colgroup"
                  colSpan={m.span}
                  className="pb-1 text-start font-normal whitespace-nowrap"
                >
                  <span className={m.span < 2 ? 'sr-only' : undefined}>
                    {loc(m.date).toFormat('LLL')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, r) => (
              <tr key={r}>
                <th scope="row" className="pe-1 text-start font-normal">
                  <span className={r % 2 === 1 ? undefined : 'sr-only'}>
                    {loc(grid.days[0][r].date).toFormat('ccc')}
                  </span>
                </th>
                {grid.days.map((week) => {
                  const day = week[r];
                  if (!day.inRange) return <td key={day.iso} />;
                  const label = labels.cellLabel(
                    loc(day.date).toLocaleString(
                      DateTime.DATE_MED_WITH_WEEKDAY
                    ),
                    day.value,
                    day.iso
                  );
                  const swatch = cn(CELL, LEVELS[level(day.value, grid.max)]);
                  return (
                    <td key={day.iso} className="p-0">
                      {onDayClick ? (
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) cells.current.set(day.iso, el);
                            else cells.current.delete(day.iso);
                          }}
                          title={label}
                          tabIndex={day.iso === focusable ? 0 : -1}
                          onFocus={() => setActive(day.iso)}
                          onClick={() => onDayClick(day.iso)}
                          onKeyDown={onKeyDown}
                          className={cn(
                            swatch,
                            'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-1'
                          )}
                        >
                          <span className="sr-only">{label}</span>
                        </button>
                      ) : (
                        <span className={swatch} title={label}>
                          <span className="sr-only">{label}</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        aria-hidden="true"
        data-slot="calendar-heatmap-legend"
        className="text-muted-foreground flex items-center gap-1 self-end text-[10px]"
      >
        <span className="me-1">{labels.less}</span>
        {LEVELS.map((cls) => (
          <span key={cls} className={cn(CELL, cls)} />
        ))}
        <span className="ms-1">{labels.more}</span>
      </div>
    </div>
  );
});
