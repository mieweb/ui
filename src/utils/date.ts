/**
 * Date formatting and validation utilities
 */

import { DateTime } from 'luxon';

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
