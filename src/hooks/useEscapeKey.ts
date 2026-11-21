import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

// Layout timing in the browser, passive on the server: React's server
// renderer warns on every useLayoutEffect call, even for a disabled listener
// in a closed overlay.
const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? useLayoutEffect : useEffect;

interface ExclusiveOverlay {
  element: () => Element | null;
}

/** Currently open exclusive overlays, in effect registration order. */
const exclusiveOverlays: ExclusiveOverlay[] = [];

/**
 * Escape ownership resolved once per keypress. A synchronous close (legacy
 * root or flushSync) unregisters the inner owner while the event is still
 * dispatching; without this freeze a later listener on the same event would
 * recompute "topmost" and dismiss its own layer too — one Escape, two closes.
 */
let frozenOwner: {
  event: globalThis.KeyboardEvent;
  owner: ExclusiveOverlay | undefined;
} | null = null;

function ownerFor(
  event: globalThis.KeyboardEvent
): ExclusiveOverlay | undefined {
  if (frozenOwner?.event !== event) {
    frozenOwner = { event, owner: topmostOverlay() };
  }
  return frozenOwner.owner;
}

/**
 * The overlay that owns Escape: the last registered overlay not covered by
 * another overlay rendered inside it. DOM containment outranks registration
 * order because React mounts child effects before the parent's — nested
 * overlays opening in the same commit register child-first, so registration
 * alone would hand ownership to the outer layer.
 */
function topmostOverlay(): ExclusiveOverlay | undefined {
  for (let i = exclusiveOverlays.length - 1; i >= 0; i--) {
    const entry = exclusiveOverlays[i];
    const element = entry.element();
    const covered =
      element !== null &&
      exclusiveOverlays.some((other) => {
        if (other === entry) return false;
        const otherElement = other.element();
        return (
          otherElement !== null &&
          otherElement !== element &&
          element.contains(otherElement)
        );
      });
    if (!covered) return entry;
  }
  return exclusiveOverlays[exclusiveOverlays.length - 1];
}

/**
 * Hook that triggers a callback when the Escape key is pressed.
 * Useful for closing modals, dropdowns, and other overlays.
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the listener is active (default: true)
 * @param exclusive - Claim exclusive Escape ownership while enabled: only the
 *   topmost exclusive consumer fires, so stacked overlays (modal → resolver →
 *   nested modal) dismiss one layer at a time instead of all closing on a
 *   single keypress. Pass a ref to the overlay element so depth is resolved
 *   from the DOM; `true` opts in on registration order alone. Non-exclusive
 *   consumers are unaffected.
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
  exclusive: boolean | RefObject<Element | null> = false
): void {
  // Ref'd so a new callback identity (inline arrows re-created per render)
  // does not re-register the listener — re-registering would pop and re-push
  // the exclusive entry, hoisting a re-rendering overlay above newer ones.
  const latest = useRef(callback);
  latest.current = callback;

  // Layout effect, not passive: the listener attaches in the same commit that
  // puts the overlay on screen. A passive effect runs after paint, leaving a
  // window where the dialog is visible but Escape goes nowhere — a keypress
  // in that window is silently lost (seen as CI-only test timeouts).
  // Layout effect, not passive: the listener attaches in the same commit that
  // puts the overlay on screen. A passive effect runs after paint, leaving a
  // window where the dialog is visible but Escape goes nowhere — a keypress
  // in that window is silently lost (seen as CI-only test timeouts).
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const entry: ExclusiveOverlay = {
      element: () => (typeof exclusive === 'object' ? exclusive.current : null),
    };
    if (exclusive) exclusiveOverlays.push(entry);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (exclusive && ownerFor(event) !== entry) return;
      latest.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (exclusive) {
        const index = exclusiveOverlays.indexOf(entry);
        if (index !== -1) exclusiveOverlays.splice(index, 1);
      }
    };
  }, [enabled, exclusive]);
}
