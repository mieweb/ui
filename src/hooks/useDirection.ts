import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export type Direction = 'ltr' | 'rtl';

/** Locales whose primary script reads right-to-left. */
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'] as const;

/**
 * Returns true when the given locale (e.g. `ar`, `ar-SA`, `he_IL`) uses a
 * right-to-left script.
 */
export function isRtlLocale(locale: string): boolean {
  const lang = locale.toLowerCase().split(/[-_]/)[0];
  return (RTL_LOCALES as readonly string[]).includes(lang);
}

function resolveDirection(element?: HTMLElement | null): Direction {
  if (typeof document === 'undefined') return 'ltr';
  const target = element ?? document.documentElement;
  return getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Hook returning the effective text direction (`ltr` | `rtl`) inherited from
 * the nearest `dir` attribute — zero setup for consumers who set
 * `<html dir="rtl">`.
 *
 * Use for JS-level direction logic that CSS logical properties can't cover:
 * inverting ArrowLeft/ArrowRight keyboard handling, popover/toast placement,
 * drag math, etc.
 *
 * @param elementRef - Optional ref; when provided, direction is resolved from
 *   that element (respecting any local `dir` override) instead of `<html>`.
 *
 * @example
 * ```tsx
 * const direction = useDirection();
 * const nextKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
 * ```
 */
export function useDirection(
  elementRef?: RefObject<HTMLElement | null>
): Direction {
  const [direction, setDirection] = useState<Direction>(() =>
    resolveDirection(elementRef?.current)
  );

  useEffect(() => {
    const update = () => setDirection(resolveDirection(elementRef?.current));
    update();
    // dir changes are rare; observing the whole tree for just this attribute is cheap.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [elementRef]);

  return direction;
}
