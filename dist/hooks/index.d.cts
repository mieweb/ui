export { R as ResolvedTheme, T as Theme, u as useTheme } from '../useTheme-B9SWu6ui.cjs';
import { RefObject } from 'react';

/**
 * Hook that detects if the user prefers reduced motion.
 * Useful for disabling animations for accessibility.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
declare function usePrefersReducedMotion(): boolean;

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
declare function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, callback: () => void): void;

/**
 * Hook that triggers a callback when the Escape key is pressed.
 * Useful for closing modals, dropdowns, and other overlays.
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the listener is active (default: true)
 *
 * @example
 * ```tsx
 * function Modal({ onClose }: { onClose: () => void }) {
 *   useEscapeKey(onClose);
 *   return <div>Modal content</div>;
 * }
 * ```
 */
declare function useEscapeKey(callback: () => void, enabled?: boolean): void;

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
declare function useFocusTrap<T extends HTMLElement>(enabled?: boolean): RefObject<T | null>;

export { useClickOutside, useEscapeKey, useFocusTrap, usePrefersReducedMotion };
