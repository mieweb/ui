import { useEffect, useRef, type RefObject } from 'react';
import { isStorybookDocsMode } from '../utils/environment';

/**
 * Hook that traps focus within a container element.
 * Essential for accessibility in modals and dialogs.
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
const CANDIDATES =
  'button, a[href], area[href], input, select, textarea, [tabindex], [contenteditable="true"]';

/** Whether Tab can land on `element`: enabled, in the tab order, not inert, shown. */
function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) return false;
  if (element.closest('[inert]')) return false;
  // Hidden by CSS (display: none, visibility: hidden) on any ancestor.
  return element.checkVisibility?.({ visibilityProperty: true }) ?? true;
}

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
    // Read on every Tab: content inside the trap can change while it's on.
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
        isTabbable
      );

    // Focus the first element when trap is enabled
    if (initialFocus) focusables()[0]?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusableElements = focusables();
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enabled, initialFocus]);

  return containerRef;
}
