'use client';

import * as React from 'react';
import { DateTime, type DateTimeUnit } from 'luxon';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
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

/**
 * Column width in time. `month` and `quarter` are what a roadmap is — the
 * family has no separate RoadmapView, because it would be this component with
 * wider columns.
 */
export type GanttCadence = 'day' | 'week' | 'month' | 'quarter';

export type GanttViewSlot =
  | 'header'
  | 'groupLabel'
  | 'row'
  | 'bar'
  | 'selectedBar'
  | 'state';

export interface GanttLabels extends ViewLabels {
  /** Accessible name of the scrollable chart region. */
  chart: string;
  /** Footnote for records a time axis cannot place. `{count}` is substituted. */
  undated: string;
}

export const defaultGanttLabels: GanttLabels = {
  ...defaultViewLabels,
  empty: 'Nothing to place on the timeline',
  chart: 'Timeline',
  undated: '{count} without dates',
};

export interface GanttViewProps<T> extends ViewBaseProps<T> {
  /** Column width in time. Defaults to `week`. */
  cadence?: GanttCadence;
  /** First column. Defaults to the earliest start in `items`. */
  rangeStart?: Date;
  /** Last column. Defaults to the latest end in `items`. */
  rangeEnd?: Date;
  /** Group rows into swimlanes by `accessors.getGroup`. */
  groupByLane?: boolean;
  timeZone?: string;
  locale?: string;
  labels?: Partial<GanttLabels>;
  classNames?: Partial<Record<GanttViewSlot, string>>;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

const CADENCE_UNIT: Record<GanttCadence, DateTimeUnit> = {
  day: 'day',
  week: 'week',
  month: 'month',
  quarter: 'quarter',
};

const CADENCE_FORMAT: Record<GanttCadence, string> = {
  day: 'd LLL',
  week: "'W'W",
  month: 'LLL',
  quarter: "'Q'q yyyy",
};

interface Bar<T> {
  id: string;
  item: T;
  /** 1-based column index, for CSS grid. */
  column: number;
  span: number;
}

// =============================================================================
// Component
// =============================================================================

export function GanttView<T>({
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
  cadence = 'week',
  rangeStart,
  rangeEnd,
  groupByLane = false,
  timeZone,
  locale,
  now,
  className,
  classNames,
  headingLevel: Heading = 'h3',
}: GanttViewProps<T>) {
  const text = { ...defaultGanttLabels, ...labels };
  const zone = timeZone ?? DateTime.local().zoneName;
  const unit = CADENCE_UNIT[cadence];
  const today = React.useMemo(
    () => DateTime.fromJSDate(now ?? new Date(), { zone }).startOf('day'),
    [now, zone]
  );

  const dated = React.useMemo(() => {
    const out: { id: string; item: T; start: DateTime; end: DateTime }[] = [];
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
        end: end < start ? start : end,
      });
    }
    return out;
  }, [items, accessors, zone]);

  const undatedCount = items.length - dated.length;

  const columns = React.useMemo(() => {
    if (dated.length === 0 && !rangeStart) return [];
    const first = rangeStart
      ? DateTime.fromJSDate(rangeStart, { zone })
      : dated.reduce(
          (min, d) => (d.start < min ? d.start : min),
          dated[0].start
        );
    const last = rangeEnd
      ? DateTime.fromJSDate(rangeEnd, { zone })
      : dated.reduce((max, d) => (d.end > max ? d.end : max), dated[0].end);
    const out: DateTime[] = [];
    let cursor = first.startOf(unit);
    const stop = last.startOf(unit);
    // An explicit range given backwards is caller data, not a crash: draw the
    // column it starts in rather than falling through to the empty state.
    if (stop < cursor) return [cursor];
    // Guard rather than trust the range: a decade of days is 3,650 columns and
    // would hang the page rather than draw a chart.
    while (cursor <= stop && out.length < 200) {
      out.push(cursor);
      cursor = cursor.plus({ [`${unit}s`]: 1 });
    }
    return out;
  }, [dated, rangeStart, rangeEnd, unit, zone]);

  const columnOf = React.useCallback(
    (moment: DateTime) => {
      const target = moment.startOf(unit);
      const index = columns.findIndex((c) => c.hasSame(target, unit));
      if (index >= 0) return index;
      return target < (columns[0] ?? target) ? 0 : columns.length - 1;
    },
    [columns, unit]
  );

  const lanes = React.useMemo(() => {
    const toBar = (d: (typeof dated)[number]): Bar<T> => {
      const from = columnOf(d.start);
      const to = columnOf(d.end);
      return { id: d.id, item: d.item, column: from + 1, span: to - from + 1 };
    };
    if (!groupByLane || !accessors.getGroup)
      return [{ id: '', label: '', bars: dated.map(toBar) }];
    const buckets = new Map<string, Bar<T>[]>();
    for (const d of dated) {
      const key = accessors.getGroup(d.item) ?? '';
      const bucket = buckets.get(key);
      if (bucket) bucket.push(toBar(d));
      else buckets.set(key, [toBar(d)]);
    }
    return [...buckets].map(([key, bars]) => ({
      id: key,
      label: key || 'Ungrouped',
      bars,
    }));
  }, [dated, groupByLane, accessors, columnOf]);

  const todayColumn = columns.length > 0 ? columnOf(today) + 1 : 0;
  const showToday =
    columns.length > 0 &&
    today >= columns[0] &&
    today <= columns[columns.length - 1].endOf(unit);

  const state = (content: React.ReactNode) => (
    <div
      data-slot="gantt-view-state"
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
  if (columns.length === 0) return <>{emptyState ?? state(text.empty)}</>;

  const gridTemplate = {
    gridTemplateColumns: `repeat(${columns.length}, minmax(3.5rem, 1fr))`,
  };

  return (
    <div
      data-slot="gantt-view"
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      {/* Scrollable content must be keyboard operable (WCAG 2.1.1), which axe
          enforces as scrollable-region-focusable. jsx-a11y disagrees for
          non-interactive elements; the success criterion wins. */}
      <div
        className="overflow-x-auto"
        role="group"
        aria-label={text.chart}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <div className="min-w-max">
          <div
            data-slot="gantt-view-header"
            className={cn(
              'border-border bg-muted/40 grid border-b',
              classNames?.header
            )}
            style={gridTemplate}
          >
            {columns.map((column) => (
              <div
                key={column.toISO()}
                className="border-border text-muted-foreground border-e px-2 py-1.5 text-center text-xs last:border-e-0"
              >
                {column
                  .setLocale(locale ?? column.locale ?? 'en')
                  .toFormat(CADENCE_FORMAT[cadence])}
              </div>
            ))}
          </div>

          {lanes.map((lane) => (
            <section key={lane.id}>
              {lane.label && (
                <Heading>
                  <span
                    data-slot="gantt-view-group-label"
                    className={cn(
                      'border-border bg-muted text-muted-foreground block border-b px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
                      classNames?.groupLabel
                    )}
                  >
                    {lane.label}
                  </span>
                </Heading>
              )}
              <ul>
                {lane.bars.map((bar) => {
                  const accent = accessors.getAccent?.(bar.item) ?? 'primary';
                  const selected = bar.id === selectedId;
                  const title = accessors.getTitle(bar.item);
                  const body = renderItem?.(bar.item, { view: 'gantt' }) ?? (
                    <span className="block truncate px-2 text-xs font-medium">
                      {title}
                    </span>
                  );
                  const classes = cn(
                    'flex h-6 items-center rounded-full border text-foreground',
                    accentClasses[accent].tint,
                    accentClasses[accent].border,
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    classNames?.bar,
                    selected &&
                      cn('ring-2 ring-primary-500/50', classNames?.selectedBar)
                  );
                  const href = getHref?.(bar.id, bar.item);
                  return (
                    <li
                      key={bar.id}
                      data-slot="gantt-view-row"
                      className={cn(
                        'border-border relative grid items-center border-b py-1 last:border-b-0',
                        classNames?.row
                      )}
                      style={gridTemplate}
                    >
                      {showToday && (
                        <span
                          aria-hidden
                          className="bg-primary-500/60 pointer-events-none absolute inset-y-0 w-px"
                          style={{
                            gridColumn: `${todayColumn} / span 1`,
                            insetInlineStart: 0,
                          }}
                        />
                      )}
                      <div
                        className="min-w-0"
                        style={{
                          gridColumn: `${bar.column} / span ${bar.span}`,
                        }}
                      >
                        {href ? (
                          <a
                            href={href}
                            aria-current={selected ? 'true' : undefined}
                            data-slot="gantt-view-bar"
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
                              onOpen(bar.id, bar.item);
                            }}
                          >
                            {body}
                          </a>
                        ) : onOpen ? (
                          <button
                            type="button"
                            aria-current={selected ? 'true' : undefined}
                            data-slot="gantt-view-bar"
                            className={cn(classes, 'w-full text-start')}
                            onClick={() => onOpen(bar.id, bar.item)}
                          >
                            {body}
                          </button>
                        ) : (
                          <span data-slot="gantt-view-bar" className={classes}>
                            {body}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {undatedCount > 0 && (
        <p
          data-slot="gantt-view-undated"
          className="border-border text-muted-foreground border-t px-3 py-1.5 text-xs"
        >
          {text.undated.replace('{count}', String(undatedCount))}
        </p>
      )}
    </div>
  );
}
