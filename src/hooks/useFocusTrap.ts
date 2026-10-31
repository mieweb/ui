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

/** The traps that are on, so a portaled key goes to the innermost owner. */
const activeTraps = new Set<HTMLElement>();

/**
 * All of a portaled popup: its top-level wrapper under the body, so a search
 * field beside a menu comes with it. A popup rendered in the page itself is
 * just itself.
 */
function popupRoot(popup: HTMLElement): HTMLElement {
  let root = popup;
  while (root.parentElement && root.parentElement !== document.body)
    root = root.parentElement;
  return root.parentElement === document.body ? root : popup;
}

/**
 * The trap's stops in Tab order. A popup that a control inside opened
 * elsewhere on the page (a `Dropdown` portals its menu to the body) comes
 * right after that control, found through its `aria-expanded` and
 * `aria-controls`; so do popups opened from that popup (a submenu).
 */
function tabStops(container: HTMLElement): HTMLElement[] {
  const stops = new Set<HTMLElement>();
  const visited = new Set<HTMLElement>([container]);
  const visit = (root: HTMLElement) => {
    for (const element of tabbablesIn(root)) {
      stops.add(element);
      const popupId =
        element.getAttribute('aria-expanded') === 'true' &&
        element.getAttribute('aria-controls');
      const popup = popupId ? document.getElementById(popupId) : null;
      if (!popup || container.contains(popup)) continue;
      const popupWrapper = popupRoot(popup);
      if (visited.has(popupWrapper) || popupWrapper.contains(container))
        continue;
      visited.add(popupWrapper);
      visit(popupWrapper);
    }
  };
  visit(container);
  return Array.from(stops);
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
    // Keys in a portaled popup don't pass through the container. When traps
    // nest (a dialog inside the panel), the innermost one that owns the popup
    // takes them, as it does for keys inside it.
    const handleOutsideKeyDown = (event: globalThis.KeyboardEvent) => {
      if (container.contains(event.target as Node)) return;
      const active = document.activeElement as HTMLElement | null;
      for (const inner of activeTraps)
        if (
          inner !== container &&
          container.contains(inner) &&
          active &&
          tabStops(inner).includes(active)
        )
          return;
      handleKeyDown(event);
    };

    activeTraps.add(container);
    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleOutsideKeyDown);
    return () => {
      activeTraps.delete(container);
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleOutsideKeyDown);
    };
  }, [enabled, initialFocus]);

  return containerRef;
}
