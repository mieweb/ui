import { useEffect, useRef } from 'react';

/**
 * Mount-ordered stack of currently open exclusive overlays. Later entries
 * stack above earlier ones, matching DOM paint order for nested overlays
 * (a nested modal mounts after — and renders above — its host).
 */
const exclusiveOverlays: object[] = [];

/**
 * Hook that triggers a callback when the Escape key is pressed.
 * Useful for closing modals, dropdowns, and other overlays.
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the listener is active (default: true)
 * @param exclusive - Claim exclusive Escape ownership while enabled: only the
 *   most recently enabled exclusive consumer fires, so stacked overlays
 *   (modal → resolver → nested modal) dismiss one layer at a time instead of
 *   all closing on a single keypress. Non-exclusive consumers are unaffected.
 *
 * @example
 * ```tsx
 * function Modal({ onClose }: { onClose: () => void }) {
 *   useEscapeKey(onClose);
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useEscapeKey(
  callback: () => void,
  enabled = true,
  exclusive = false
): void {
  // Ref'd so a new callback identity (inline arrows re-created per render)
  // does not re-register the listener — re-registering would pop and re-push
  // the exclusive token, hoisting a re-rendering overlay above newer ones.
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const token = {};
    if (exclusive) exclusiveOverlays.push(token);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (
        exclusive &&
        exclusiveOverlays[exclusiveOverlays.length - 1] !== token
      ) {
        return;
      }
      latest.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (exclusive) {
        const index = exclusiveOverlays.indexOf(token);
        if (index !== -1) exclusiveOverlays.splice(index, 1);
      }
    };
  }, [enabled, exclusive]);
}
