import { DateTime } from 'luxon';
import { toDateTime } from '../../views/types';

export interface DayGroup<T> {
  /** ISO date (`yyyy-MM-dd`) in the display zone; `''` for undated items. */
  key: string;
  items: T[];
}

export interface DayLabelOptions {
  now: Date;
  zone: string;
  locale?: string;
  today: string;
  yesterday: string;
  undated: string;
}

export function withLocale(dt: DateTime, locale?: string): DateTime {
  return locale ? dt.setLocale(locale) : dt;
}

const millis = (dt: DateTime | null) =>
  dt ? dt.toMillis() : Number.NEGATIVE_INFINITY;

/** Buckets items by calendar day in `zone`, newest first; undated items last. */
export function groupByDay<T>(
  items: readonly T[],
  getDate: (item: T) => Date | string | null | undefined,
  zone: string
): DayGroup<T>[] {
  const dated = items
    .map((item) => ({ item, dt: toDateTime(getDate(item), zone) }))
    .sort((a, b) => millis(b.dt) - millis(a.dt) || 0);

  const groups: DayGroup<T>[] = [];
  for (const { item, dt } of dated) {
    const key = dt?.toISODate() ?? '';
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

export function formatDayLabel(key: string, options: DayLabelOptions): string {
  if (!key) return options.undated;
  const day = withLocale(
    DateTime.fromISO(key, { zone: options.zone }),
    options.locale
  );
  const today = DateTime.fromJSDate(options.now, { zone: options.zone });
  if (day.hasSame(today, 'day')) return options.today;
  if (day.hasSame(today.minus({ days: 1 }), 'day')) return options.yesterday;
  return day.toLocaleString({
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(day.year !== today.year && { year: 'numeric' }),
  });
}
