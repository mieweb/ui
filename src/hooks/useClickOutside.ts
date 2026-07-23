import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook that detects clicks outside of a specified element.
 * Useful for closing dropdowns, modals, and other overlays.
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useClickOutside(ref, () => setIsOpen(false), isOpen);
 *
 *   return (
 *     <div ref={ref}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null> | ReadonlyArray<RefObject<HTMLElement | null>>,
  callback: () => void,
  enabled: boolean = true
): void {
  // Latest-ref pattern: keep the document listeners attached for the whole
  // enabled cycle even when callers pass a new inline callback each render.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: Event) => {
      const refs = Array.isArray(ref) ? ref : [ref];
      const target = event.target;
      if (!(target instanceof globalThis.Node)) return;
      const attachedRefs = refs.filter((r) => r.current !== null);
      if (attachedRefs.length === 0) return;
      const inside = attachedRefs.some((r) => r.current?.contains(target));
      if (!inside) {
        callbackRef.current();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [ref, enabled]);
}
