/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number string to US format.
 *
 * Behavior:
 * - 10 digits          → `(XXX) XXX-XXXX`
 * - 11 digits w/ `1`   → `+1 (XXX) XXX-XXXX` (E.164 US/Canada)
 * - 12+ digits         → `+CC (XXX) XXX-XXXX...` (best-effort intl)
 * - partial (typing)   → progressive `(`, `(XXX`, `(XXX) X`, etc.
 */
export function formatPhoneNumber(value: string): string {
  const allDigits = value.replace(/\D/g, '');
  if (allDigits.length === 0) return '';

  // E.164 with US/Canada country code (1XXXXXXXXXX). Show the country code
  // explicitly so phone numbers aren't shifted by one digit when displayed.
  if (allDigits.length === 11 && allDigits.startsWith('1')) {
    const rest = allDigits.slice(1);
    return `+1 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
  }

  // Other international numbers: keep the country code prefix and format the
  // trailing 10 digits as a US-style block. This isn't locale-perfect but
  // it's better than silently dropping the country code.
  if (allDigits.length > 11) {
    const cc = allDigits.slice(0, allDigits.length - 10);
    const nat = allDigits.slice(-10);
    return `+${cc} (${nat.slice(0, 3)}) ${nat.slice(3, 6)}-${nat.slice(6)}`;
  }

  // Domestic / partial input — progressive formatting as the user types.
  const digits = allDigits.slice(0, 10);
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
