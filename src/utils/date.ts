/**
 * Date formatting and validation utilities
 */

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
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const month = parseInt(digits.slice(0, 2), 10);
  const day = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  const date = new Date(year, month - 1, day);

  // Verify the date is valid (handles edge cases like Feb 30)
  if (
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
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
  const birthDate = parseDateValue(dob);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
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
  const date = parseDateValue(value);
  if (!date) return false;
  return date < new Date();
}

/**
 * Checks if a date is in the future
 */
export function isDateInFuture(value: string): boolean {
  const date = parseDateValue(value);
  if (!date) return false;
  return date > new Date();
}
