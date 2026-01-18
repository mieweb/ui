import { useEffect, type RefObject } from 'react';

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
 *   useClickOutside(ref, () => setIsOpen(false));
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
  ref: RefObject<T | null>,
  callback: () => void
): void {
  useEffect(() => {
    const handleClick = (event: Event) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as globalThis.Node)
      ) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [ref, callback]);
}
