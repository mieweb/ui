// Pure time-entry helpers for BusinessHoursEditor; no React so they can be unit-tested and reused.

/**
 * Parse a typed time into `HH:mm` (24-hour). Accepts "5pm", "5 pm", "5:30 p.m.",
 * "1159pm", "9a", "12am", "17:30", "1730" and "9". Returns `null` when invalid.
 */
export function parseTimeInput(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, ' ');
  const match = /^(\d{1,2})(?::?(\d{2}))?(?: ?([ap])\.?(?: ?m\.?)?)?$/.exec(s);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  const meridiem = match[3];
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem === 'p' ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** End-of-day value in the `TimeSlot` model (see `create24HourSchedule`). */
export const BUSINESS_HOURS_END_OF_DAY = '23:59';

/** A closing time of 00:00 after a real opening time means end of day, not "closes at midnight before it opens". */
export function normalizeClosingTime(start: string, end: string): string {
  return end === '00:00' && !!start && start !== '00:00'
    ? BUSINESS_HOURS_END_OF_DAY
    : end;
}

/** Display `HH:mm` as "9:00 AM" or "09:00". */
export function formatTimeInput(value: string, use24Hour: boolean): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match || use24Hour) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}
