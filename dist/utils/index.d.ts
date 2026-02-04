import { ClassValue } from 'clsx';

/**
 * Utility function to merge Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-primary-500', className)
 * // Properly merges and dedupes Tailwind classes
 * ```
 */
declare function cn(...inputs: ClassValue[]): string;

/**
 * Phone number formatting utilities
 */
/**
 * Formats a phone number string to US format: (XXX) XXX-XXXX
 */
declare function formatPhoneNumber(value: string): string;
/**
 * Removes formatting from a phone number, returning only digits
 */
declare function unformatPhoneNumber(value: string): string;
/**
 * Validates if a phone number has exactly 10 digits
 */
declare function isValidPhoneNumber(value: string): boolean;
/**
 * Checks if a phone number string is empty (no digits)
 */
declare function isPhoneNumberEmpty(value: string): boolean;

/**
 * Date formatting and validation utilities
 */
/**
 * Formats a date string to MM/DD/YYYY format
 */
declare function formatDateValue(value: string): string;
/**
 * Parses a date string (MM/DD/YYYY) to a Date object
 * Returns null if the date is invalid
 */
declare function parseDateValue(value: string): Date | null;
/**
 * Validates if a date string is a valid date
 */
declare function isValidDate(value: string): boolean;
/**
 * Checks if a date string is empty
 */
declare function isDateEmpty(value: string): boolean;
/**
 * Calculates age from a date of birth string (MM/DD/YYYY)
 * Returns null if the date is invalid
 */
declare function calculateAge(dob: string): number | null;
/**
 * Checks if a date of birth represents a valid driving age (16+)
 */
declare function isValidDrivingAge(dob: string): boolean;
/**
 * Checks if a date is in the past
 */
declare function isDateInPast(value: string): boolean;
/**
 * Checks if a date is in the future
 */
declare function isDateInFuture(value: string): boolean;

/**
 * Environment detection utilities for handling special rendering contexts
 * like Storybook, testing environments, etc.
 */
/**
 * Check if we're in Storybook docs mode (multiple stories rendered inline).
 * In docs mode, we need to disable certain behaviors like scroll locking
 * and focus trapping that would interfere with the documentation page.
 *
 * @returns true if running in Storybook docs mode
 */
declare function isStorybookDocsMode(): boolean;

export { calculateAge, cn, formatDateValue, formatPhoneNumber, isDateEmpty, isDateInFuture, isDateInPast, isPhoneNumberEmpty, isStorybookDocsMode, isValidDate, isValidDrivingAge, isValidPhoneNumber, parseDateValue, unformatPhoneNumber };
