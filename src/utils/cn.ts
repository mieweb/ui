import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Physical ⇄ logical Tailwind utility pairs treated as conflicting.
 *
 * Components use CSS logical properties (`ms-*`, `pe-*`, `text-start`, …) for
 * RTL support. Without this, a consumer override like `className="ml-2"` would
 * no longer replace a component-internal `ms-1` — tailwind-merge would keep
 * both and let cascade order decide. Declaring each pair as conflicting
 * preserves the pre-RTL override behavior in both directions.
 *
 * Exported so consumers running their own `extendTailwindMerge` can adopt the
 * same behavior: `extendTailwindMerge({ extend: { conflictingClassGroups: miewebUITwMergeConflicts } })`.
 */
const LOGICAL_PHYSICAL_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['ml', 'ms'],
  ['mr', 'me'],
  ['pl', 'ps'],
  ['pr', 'pe'],
  ['left', 'start'],
  ['right', 'end'],
  ['rounded-l', 'rounded-s'],
  ['rounded-r', 'rounded-e'],
  ['rounded-tl', 'rounded-ss'],
  ['rounded-tr', 'rounded-se'],
  ['rounded-bl', 'rounded-es'],
  ['rounded-br', 'rounded-ee'],
  ['border-w-l', 'border-w-s'],
  ['border-w-r', 'border-w-e'],
  ['border-color-l', 'border-color-s'],
  ['border-color-r', 'border-color-e'],
  ['scroll-ml', 'scroll-ms'],
  ['scroll-mr', 'scroll-me'],
  ['scroll-pl', 'scroll-ps'],
  ['scroll-pr', 'scroll-pe'],
];

export const miewebUITwMergeConflicts: Record<string, string[]> =
  Object.fromEntries(
    LOGICAL_PHYSICAL_PAIRS.flatMap(([physical, logical]) => [
      [physical, [logical]],
      [logical, [physical]],
    ])
  );

const twMerge = extendTailwindMerge({
  extend: { conflictingClassGroups: miewebUITwMergeConflicts },
});

/**
 * Utility function to merge Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * Physical and logical directional utilities (e.g. `ml-*` vs `ms-*`) are
 * treated as conflicting, so consumer overrides written with physical classes
 * still replace component-internal logical classes (RTL support).
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
