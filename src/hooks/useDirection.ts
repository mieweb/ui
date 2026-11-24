import { useEffect, useRef, useState } from 'react';
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

function resolveDirection(element?: Element | null): Direction {
  if (typeof document === 'undefined') return 'ltr';
  const target = element ?? document.documentElement;
  return getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Non-hook check for event handlers: true when the element currently renders
 * right-to-left. Use inside `onKeyDown` to invert ArrowLeft/ArrowRight so
 * horizontal arrows follow the *visual* direction:
 *
 * ```ts
 * const rtl = isRtl(event.currentTarget);
 * ```
 *
 * Prefer `useDirection()` when the direction drives rendering.
 */
export function isRtl(element?: Element | null): boolean {
  return resolveDirection(element) === 'rtl';
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

  // Re-sync when a commit points elementRef.current at a different node: the
  // MutationObserver only fires on `dir` attribute mutations, so a replaced
  // ref target whose `dir` was already set before insertion would otherwise
  // go stale. No dependency array — ref targets are swapped during commit,
  // *after* render captured any snapshot, so the check must run after every
  // commit (ref targets change without this hook's deps re-rendering). The
  // identity guard keeps it to one comparison per render and prevents
  // update loops.
  const lastElement = useRef<Element | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const element = elementRef?.current ?? null;
    if (element !== lastElement.current) {
      lastElement.current = element;
      setDirection(resolveDirection(element));
    }
  });

  return direction;
}
