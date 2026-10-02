'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Select } from '../Select';
import { toDateTime } from '../../views/types';
import {
  formatDayLabel,
  groupByDay,
  withLocale,
} from '../ActivityFeed/dayGroups';
import { RecordState } from '../ActivityFeed/RecordState';

// =============================================================================
// Types
// =============================================================================

export type FieldHistoryValue = string | number | boolean | null | undefined;

export interface FieldHistoryActor {
  name: string;
  avatarUrl?: string;
}

export interface FieldHistoryEntry<V = FieldHistoryValue> {
  id: string;
  /** Display label of the changed field. */
  field: string;
  from?: V;
  to?: V;
  /** ISO string or `Date`. */
  changedAt: string | Date;
  changedBy?: FieldHistoryActor;
  /** Where the change came from, e.g. "Import" or "API". */
  source?: string;
}

export interface FieldHistoryLabels {
  loading: string;
  empty: string;
  error: string;
  retry: string;
  /** Shown in place of a blank value. */
  emptyValue: string;
  /** Screen-reader prefix for the old value. */
  from: string;
  /** Screen-reader prefix for the new value. */
  to: string;
  fieldFilter: string;
  allFields: string;
  today: string;
  yesterday: string;
  undated: string;
}

export const defaultFieldHistoryLabels: FieldHistoryLabels = {
  loading: 'Loading history',
  empty: 'No changes recorded',
  error: 'Could not load history',
  retry: 'Try again',
  emptyValue: 'Empty',
  from: 'Changed from',
  to: 'to',
  fieldFilter: 'Field',
  allFields: 'All fields',
  today: 'Today',
  yesterday: 'Yesterday',
  undated: 'Undated',
};

export type FieldHistorySlot =
  | 'toolbar'
  | 'section'
  | 'dayHeader'
  | 'entry'
  | 'value'
  | 'state';

export interface FieldHistoryProps<V = FieldHistoryValue> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  items: FieldHistoryEntry<V>[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  locale?: string;
  /** IANA zone for day boundaries. Defaults to local. */
  timeZone?: string;
  /** Pins "now" for relative times in stories and tests. */
  now?: Date;
  /** Field shown first; the user can change it. Omit for all fields. */
  defaultField?: string;
  /** Renders a non-empty value, e.g. a currency or a status badge. */
  formatValue?: (value: V, entry: FieldHistoryEntry<V>) => React.ReactNode;
  emptyState?: React.ReactNode;
  labels?: Partial<FieldHistoryLabels>;
  classNames?: Partial<Record<FieldHistorySlot, string>>;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

const ALL = '__all__';

const isBlank = (value: unknown) =>
  value === null || value === undefined || value === '';

// =============================================================================
// Component
// =============================================================================

function FieldHistoryInner<V = FieldHistoryValue>(
  {
    items,
    loading = false,
    error = null,
    onRetry,
    locale,
    timeZone = 'local',
    now,
    defaultField,
    formatValue,
    emptyState,
    labels,
    classNames,
    headingLevel: Heading = 'h3',
    className,
    ...rest
  }: FieldHistoryProps<V>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const text = { ...defaultFieldHistoryLabels, ...labels };
  const baseId = React.useId();
  const [fieldState, setField] = React.useState(defaultField ?? ALL);
  const reference = now ?? new Date();

  const fields = React.useMemo(
    () => [...new Set(items.map((e) => e.field))].sort(),
    [items]
  );
  // A field no longer in `items` falls back to all, so the history can't go blank.
  const field = fields.includes(fieldState) ? fieldState : ALL;
  const visible =
    field === ALL ? items : items.filter((e) => e.field === field);

  const value = (v: V | undefined, entry: FieldHistoryEntry<V>) =>
    isBlank(v) ? (
      <span className="italic">{text.emptyValue}</span>
    ) : (
      (formatValue?.(v as V, entry) ?? String(v))
    );

  const renderEntry = (entry: FieldHistoryEntry<V>) => {
    const dt = toDateTime(entry.changedAt, timeZone);
    const localDt = dt && withLocale(dt, locale);
    return (
      <li
        key={entry.id}
        data-slot="field-history-entry"
        className={cn('flex items-start gap-3 px-3 py-3', classNames?.entry)}
      >
        <Avatar
          size="sm"
          name={entry.changedBy?.name}
          src={entry.changedBy?.avatarUrl}
          alt=""
          aria-hidden
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
              {entry.field}
            </span>
            {localDt && (
              <time
                dateTime={localDt.toISO() ?? undefined}
                title={localDt.toLocaleString(DateTime.DATETIME_FULL)}
                className="text-muted-foreground shrink-0 text-xs"
              >
                {localDt.toRelative({
                  base: DateTime.fromJSDate(reference),
                })}
              </time>
            )}
          </div>
          <p
            data-slot="field-history-value"
            className={cn(
              'mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm',
              classNames?.value
            )}
          >
            <span className="sr-only">{text.from}</span>
            <del className="text-muted-foreground line-through">
              {value(entry.from, entry)}
            </del>
            <ArrowRight
              className="text-muted-foreground size-3.5 shrink-0 rtl:rotate-180"
              aria-hidden
            />
            <span className="sr-only">{text.to}</span>
            <ins className="text-foreground no-underline">
              {value(entry.to, entry)}
            </ins>
          </p>
          {(entry.changedBy || entry.source) && (
            <p className="text-muted-foreground mt-1 text-xs">
              {[entry.changedBy?.name, entry.source]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </li>
    );
  };

  let body: React.ReactNode;
  if (error) {
    body = (
      <RecordState
        kind="error"
        slot="field-history-state"
        message={text.error}
        retryLabel={text.retry}
        onRetry={onRetry}
        className={classNames?.state}
      />
    );
  } else if (loading) {
    body = (
      <RecordState
        kind="loading"
        slot="field-history-state"
        message={text.loading}
        className={classNames?.state}
      />
    );
  } else if (visible.length === 0) {
    body = emptyState ?? (
      <RecordState
        kind="empty"
        slot="field-history-state"
        message={text.empty}
        className={classNames?.state}
      />
    );
  } else {
    body = groupByDay(visible, (e) => e.changedAt, timeZone).map((day) => {
      const headingId = `${baseId}-${day.key || 'none'}`;
      return (
        <section
          key={day.key}
          aria-labelledby={headingId}
          data-slot="field-history-section"
          className={classNames?.section}
        >
          <Heading
            id={headingId}
            data-slot="field-history-day-header"
            className={cn(
              'border-border bg-card text-muted-foreground sticky top-0 z-10 border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase',
              classNames?.dayHeader
            )}
          >
            {formatDayLabel(day.key, {
              now: reference,
              zone: timeZone,
              locale,
              today: text.today,
              yesterday: text.yesterday,
              undated: text.undated,
            })}
          </Heading>
          <ul className="divide-border divide-y">
            {day.items.map(renderEntry)}
          </ul>
        </section>
      );
    });
  }

  return (
    <div
      ref={ref}
      data-slot="field-history"
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
      {...rest}
    >
      {fields.length > 1 && !loading && !error && (
        <div
          data-slot="field-history-toolbar"
          className={cn('border-border border-b p-3', classNames?.toolbar)}
        >
          <Select
            size="sm"
            label={text.fieldFilter}
            hideLabel
            value={field}
            onValueChange={setField}
            options={[
              { value: ALL, label: text.allFields },
              ...fields.map((f) => ({ value: f, label: f })),
            ]}
            className="sm:max-w-xs"
          />
        </div>
      )}
      {body}
    </div>
  );
}

/**
 * The change log of a record's fields, grouped by day. Declared
 * `parameters.catalog.collection` — its load states are part of the API.
 */
export const FieldHistory = React.forwardRef(FieldHistoryInner) as <
  V = FieldHistoryValue,
>(
  props: FieldHistoryProps<V> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

(FieldHistory as React.FC).displayName = 'FieldHistory';
