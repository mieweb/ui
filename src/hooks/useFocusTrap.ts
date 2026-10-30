import { useEffect, useRef, type RefObject } from 'react';
import { isStorybookDocsMode } from '../utils/environment';

const CANDIDATES =
  'button, a[href], area[href], input, select, textarea, iframe, [tabindex], [contenteditable="true"]';

/** Whether Tab can land on `element`: enabled, in the tab order, not inert, shown. */
function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) return false;
  if (element.closest('[inert]')) return false;
  // Hidden by CSS (display: none, visibility: hidden) on any ancestor.
  return element.checkVisibility?.({ visibilityProperty: true }) ?? true;
}

function tabbablesIn(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
    isTabbable
  );
}

/**
 * The trap's stops in Tab order. A popup that a control inside opened
 * elsewhere on the page (a `Dropdown` portals its menu to the body) comes
 * right after that control, found through its `aria-controls`.
 */
function tabStops(container: HTMLElement): HTMLElement[] {
  const stops: HTMLElement[] = [];
  for (const element of tabbablesIn(container)) {
    stops.push(element);
    const popupId =
      element.getAttribute('aria-expanded') === 'true' &&
      element.getAttribute('aria-controls');
    const popup = popupId ? document.getElementById(popupId) : null;
    if (popup && !container.contains(popup)) stops.push(...tabbablesIn(popup));
  }
  return stops;
}

/**
 * Hook that traps focus within a container element.
 * Essential for accessibility in modals and dialogs.
 *
 * Tab and Shift+Tab wrap between the first and last controls Tab can reach.
 * A popup opened from inside (a `Dropdown`'s portaled menu, through its
 * trigger's `aria-expanded` and `aria-controls`) is part of the trap.
 *
 * @param enabled - Whether focus trapping is active
 * @param options - `initialFocus`: focus the first focusable element when the
 *   trap turns on (default `true`). Pass `false` when the caller moves focus
 *   itself, e.g. to a selected item.
 * @returns ref to attach to the container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }: { isOpen: boolean }) {
 *   const containerRef = useFocusTrap<HTMLDivElement>(isOpen);
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button>First focusable</button>
 *       <button>Last focusable</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(
  enabled = true,
  options: { initialFocus?: boolean } = {}
): RefObject<T | null> {
  const { initialFocus = true } = options;
  const containerRef = useRef<T>(null);

  useEffect(() => {
    // Skip focus trap in Storybook docs mode to prevent auto-scroll
    if (!enabled || !containerRef.current || isStorybookDocsMode()) return;

    const container = containerRef.current;

    // Focus the first element when trap is enabled
    if (initialFocus) tabbablesIn(container)[0]?.focus();

    // Read the stops on every Tab: content inside can change while it's on.
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const active = document.activeElement as HTMLElement | null;
      const stops = tabStops(container);
      const index = active ? stops.indexOf(active) : -1;
      if (index === -1) return;
      const step = event.shiftKey ? -1 : 1;
      const wraps = index + step < 0 || index + step >= stops.length;
      const target = stops[(index + step + stops.length) % stops.length];
      // The browser's own order is right inside the container. Take over at
      // the ends, and into, through or out of a popup that lives elsewhere.
      if (!wraps && container.contains(active) && container.contains(target))
        return;
      event.preventDefault();
      target.focus();
    };
    // Keys in a portaled popup don't pass through the container.
    const handleOutsideKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!container.contains(event.target as Node)) handleKeyDown(event);
    };

    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleOutsideKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleOutsideKeyDown);
    };
  }, [enabled, initialFocus]);

  return containerRef;
}
