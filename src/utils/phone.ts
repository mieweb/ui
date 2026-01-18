/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number string to US format: (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Removes formatting from a phone number, returning only digits
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validates if a phone number has exactly 10 digits
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = unformatPhoneNumber(value);
  return digits.length === 10;
}

/**
 * Checks if a phone number string is empty (no digits)
 */
export function isPhoneNumberEmpty(value: string): boolean {
  return unformatPhoneNumber(value).length === 0;
}
