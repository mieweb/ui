import { useEffect, useRef, type RefObject } from 'react';
import { isStorybookDocsMode } from '../utils/environment';

/**
 * Hook that traps focus within a container element.
 * Essential for accessibility in modals and dialogs.
 *
 * @param enabled - Whether focus trapping is active
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
  enabled = true
): RefObject<T | null> {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    // Skip focus trap in Storybook docs mode to prevent auto-scroll
    if (!enabled || !containerRef.current || isStorybookDocsMode()) return;

    const container = containerRef.current;
    const getFocusable = () =>
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    const initial = getFocusable();
    if (initial.length === 0) return;

    // Focus the first element when trap is enabled
    initial[0].focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // Recompute per keystroke: dialog content enables/disables and
      // mounts/unmounts controls while open (e.g. a Save button enabling
      // after an async load) — cached boundaries would strand them
      // outside the Tab cycle.
      const focusableElements = getFocusable();
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
  }, [enabled]);

  return containerRef;
}
