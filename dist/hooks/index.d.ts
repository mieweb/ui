export { R as ResolvedTheme, T as Theme, u as useTheme } from '../useTheme-B9SWu6ui.js';
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

/**
 * Options for keyboard shortcut hook
 */
interface KeyboardShortcutOptions {
    /** Whether the shortcut is currently enabled (default: true) */
    enabled?: boolean;
    /** Modifier keys required (default: none) */
    modifiers?: {
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
        meta?: boolean;
    };
    /** Whether to prevent default browser behavior (default: true) */
    preventDefault?: boolean;
    /** Whether to stop event propagation (default: false) */
    stopPropagation?: boolean;
    /** Element types to ignore when the shortcut is pressed (default: ['INPUT', 'TEXTAREA', 'SELECT']) */
    ignoreInputs?: boolean;
}
/**
 * Hook that triggers a callback when a specific keyboard shortcut is pressed.
 * Supports modifier keys (Ctrl, Shift, Alt, Meta) and ignores input fields by default.
 *
 * @param key - The key to listen for (e.g., 'k', 'Enter', 'Escape', '/')
 * @param callback - Function to call when the shortcut is pressed
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Cmd/Ctrl+K to open search
 * useKeyboardShortcut('k', openSearch, { modifiers: { meta: true, ctrl: true } });
 *
 * // Forward slash to focus search (ignoring when typing)
 * useKeyboardShortcut('/', focusSearch);
 *
 * // Escape to close modal
 * useKeyboardShortcut('Escape', closeModal);
 * ```
 */
declare function useKeyboardShortcut(key: string, callback: (event: KeyboardEvent) => void, options?: KeyboardShortcutOptions): void;
/**
 * Hook for the common Cmd/Ctrl+K shortcut pattern (command palette, search, etc.)
 *
 * @param callback - Function to call when Cmd/Ctrl+K is pressed
 * @param enabled - Whether the shortcut is active (default: true)
 *
 * @example
 * ```tsx
 * useCommandK(() => setIsOpen(true));
 * ```
 */
declare function useCommandK(callback: () => void, enabled?: boolean): void;

/**
 * Hook that tracks whether a media query matches.
 * Uses the native `matchMedia` API for efficient media query tracking.
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating whether the media query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 *   return (
 *     <div>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       {isDesktop && <DesktopLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useMediaQuery(query: string): boolean;
/**
 * Preset breakpoint hooks following common responsive design patterns
 */
/** Returns true when viewport is smaller than 640px (mobile) */
declare function useIsMobile(): boolean;
/** Returns true when viewport is 640px-767px (large mobile / small tablet) */
declare function useIsSmallTablet(): boolean;
/** Returns true when viewport is 768px-1023px (tablet) */
declare function useIsTablet(): boolean;
/** Returns true when viewport is 1024px or larger (desktop) */
declare function useIsDesktop(): boolean;
/** Returns true when viewport is 1280px or larger (large desktop) */
declare function useIsLargeDesktop(): boolean;
/** Returns true when viewport is smaller than 1024px (mobile/tablet) */
declare function useIsMobileOrTablet(): boolean;

export { type KeyboardShortcutOptions, useClickOutside, useCommandK, useEscapeKey, useFocusTrap, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery, usePrefersReducedMotion };
