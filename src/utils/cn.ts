import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
