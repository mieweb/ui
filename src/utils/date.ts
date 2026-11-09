/**
 * Date formatting and validation utilities
 */

import { DateTime } from 'luxon';

export type DateLocale = string | string[];

/** Browser regional preferences, independently of the application's UI language. */
export function regionalDateLocale(): string | undefined {
  return typeof navigator === 'undefined'
    ? undefined
    : new Intl.DateTimeFormat([...navigator.languages]).resolvedOptions()
        .locale;
}

function regionalDateFormatter(
  locales: DateLocale | undefined = regionalDateLocale()
) {
  return new Intl.DateTimeFormat(locales, {
    calendar: 'gregory',
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function calendarDate(
  year: number,
  month: number,
  day: number
): Date | undefined {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : undefined;
}

/** Format calendar digits, not an instant: a date never shifts with the timezone. */
export function formatRegionalDate(
  value?: string,
  locales: DateLocale | undefined = regionalDateLocale()
): string {
  if (!value) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(value);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const date = iso
    ? calendarDate(+iso[1], +iso[2], +iso[3])
    : us
      ? calendarDate(+us[3], +us[1], +us[2])
      : undefined;
  return date ? regionalDateFormatter(locales).format(date) : value;
}

export function regionalDatePlaceholder(
  locales: DateLocale | undefined = regionalDateLocale()
): string {
  const labels: Record<string, string> = {
    year: 'YYYY',
    month: 'MM',
    day: 'DD',
  };
  return regionalDateFormatter(locales)
    .formatToParts(new Date(Date.UTC(2006, 10, 22)))
    .map((part) => labels[part.type] ?? part.value)
    .join('');
}

function regionalDigits(value: string, locales?: DateLocale): string {
  const number = new Intl.NumberFormat(locales, { useGrouping: false });
  let normalized = value;
  for (let digit = 0; digit < 10; digit++) {
    normalized = normalized.replaceAll(number.format(digit), String(digit));
  }
  return normalized;
}

/** Insert the region's separators as digits are typed, including on numeric keyboards. */
export function formatRegionalDateInput(
  value: string,
  locales: DateLocale | undefined = regionalDateLocale()
): string {
  const digits = regionalDigits(value, locales).replace(/\D/g, '').slice(0, 8);
  let offset = 0;
  let text = '';
  for (const part of regionalDateFormatter(locales).formatToParts(
    new Date(Date.UTC(2006, 10, 22))
  )) {
    if (offset >= digits.length) break;
    if (part.type === 'literal') {
      text += part.value;
    } else {
      const length = part.type === 'year' ? 4 : 2;
      text += digits.slice(offset, offset + length);
      offset += length;
    }
  }
  return text;
}

/** Complete regional text to the DateInput's existing MM/DD/YYYY value contract. */
export function parseRegionalDate(
  value: string,
  locales: DateLocale | undefined = regionalDateLocale()
): string | undefined {
  const normalized = regionalDigits(value, locales);
  const strip = (text: string) =>
    text.replace(/[\u200e\u200f\u061c]/g, '').trim();
  const parts = regionalDateFormatter(locales).formatToParts(
    new Date(Date.UTC(2006, 10, 22))
  );
  const fields: string[] = [];
  const pattern = parts
    .map((part) => {
      if (['year', 'month', 'day'].includes(part.type)) {
        fields.push(part.type);
        return part.type === 'year' ? '(\\d{4})' : '(\\d{1,2})';
      }
      return strip(part.value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  const match = new RegExp(`^${pattern}$`).exec(strip(normalized));
  if (!match) return undefined;
  const values = Object.fromEntries(
    fields.map((field, index) => [field, +match[index + 1]])
  );
  if (!calendarDate(values.year, values.month, values.day)) return undefined;
  return `${String(values.month).padStart(2, '0')}/${String(values.day).padStart(2, '0')}/${String(values.year).padStart(4, '0')}`;
}

/**
 * Parses a date string to a Luxon DateTime object
 * @param value - Date string in MM/DD/YYYY format (with or without separators)
 * @returns DateTime object in local timezone, or null if invalid
 * @remarks Dates are interpreted in the user's local timezone, consistent with typical user-input date handling
 */
function parseDateTimeValue(value: string): DateTime | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const parsed = DateTime.fromFormat(digits, 'MMddyyyy', {
    zone: 'local',
  });

  if (!parsed.isValid) {
    return null;
  }

  if (parsed.year < 1900 || parsed.year > 2100) {
    return null;
  }

  return parsed.startOf('day');
}

/**
 * Formats a date string to MM/DD/YYYY format
 */
export function formatDateValue(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Parses a date string (MM/DD/YYYY) to a Date object
 * Returns null if the date is invalid
 */
export function parseDateValue(value: string): Date | null {
  const parsed = parseDateTimeValue(value);
  return parsed ? parsed.toJSDate() : null;
}

/**
 * Validates if a date string is a valid date
 */
export function isValidDate(value: string): boolean {
  return parseDateValue(value) !== null;
}

/**
 * Checks if a date string is empty
 */
export function isDateEmpty(value: string): boolean {
  return value.replace(/\D/g, '').length === 0;
}

/**
 * Calculates age from a date of birth string (MM/DD/YYYY)
 * Returns null if the date is invalid
 */
export function calculateAge(dob: string): number | null {
  const birthDate = parseDateTimeValue(dob);
  if (!birthDate) return null;

  const today = DateTime.now().startOf('day');
  let age = today.year - birthDate.year;

  if (today < birthDate.plus({ years: age })) {
    age--;
  }

  return age;
}

/**
 * Checks if a date of birth represents a valid driving age (16+)
 */
export function isValidDrivingAge(dob: string): boolean {
  const age = calculateAge(dob);
  return age !== null && age >= 16;
}

/**
 * Checks if a date is in the past
 */
export function isDateInPast(value: string): boolean {
  const date = parseDateTimeValue(value);
  if (!date) return false;

  return date.toMillis() < DateTime.now().toMillis();
}

/**
 * Checks if a date is in the future
 */
export function isDateInFuture(value: string): boolean {
  const date = parseDateTimeValue(value);
  if (!date) return false;

  return date.toMillis() > DateTime.now().toMillis();
}

/**
 * Converts a Date object or date string to MM/DD/YYYY format for display.
 * Handles both Date objects and YYYY-MM-DD strings, parsing them in local timezone
 * to avoid off-by-one day issues from UTC interpretation.
 */
export function dateToDisplayFormat(date: Date | string): string {
  if (!date) return '';

  let dt: DateTime;
  if (typeof date === 'string') {
    // Check if it's a YYYY-MM-DD format (ISO date-only)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Parse as local date to avoid UTC offset issues
      const [year, month, day] = date.split('-').map(Number);
      dt = DateTime.local(year, month, day);
    } else {
      // Try parsing as full ISO or other format
      dt = DateTime.fromISO(date, { zone: 'local' });
    }
  } else {
    dt = DateTime.fromJSDate(date);
  }

  if (!dt.isValid) return '';

  return dt.toFormat('MM/dd/yyyy');
}

/**
 * Converts MM/DD/YYYY format to YYYY-MM-DD date string.
 * Returns the original value if not a valid complete date.
 */
export function displayFormatToDateString(value: string): string {
  const [month, day, year] = value.split('/');
  if (month && day && year && year.length === 4) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return value;
}
