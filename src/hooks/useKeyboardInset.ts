import { useEffect, useState } from 'react';

/** CSS custom properties written to `<html>` while the hook is mounted. */
export const KEYBOARD_INSET_VAR = '--mieweb-keyboard-inset';
export const VISUAL_VIEWPORT_HEIGHT_VAR = '--mieweb-visual-viewport-height';
export const VISUAL_VIEWPORT_OFFSET_TOP_VAR =
  '--mieweb-visual-viewport-offset-top';
/** Boolean attribute set on `<html>` while an on-screen keyboard is open. */
export const KEYBOARD_OPEN_ATTRIBUTE = 'data-keyboard-open';

export interface KeyboardInsetState {
  /** Pixels of the layout viewport covered by the on-screen keyboard. */
  keyboardInset: number;
  /** Whether an on-screen keyboard currently covers part of the page. */
  isKeyboardOpen: boolean;
}

export interface UseKeyboardInsetOptions {
  /** Stop tracking (and clear the CSS variables). @default true */
  enabled?: boolean;
}

const CLOSED: KeyboardInsetState = { keyboardInset: 0, isKeyboardOpen: false };

/**
 * Tracks the on-screen keyboard via the Visual Viewport API.
 *
 * iOS Safari and WKWebView (Cordova) ignore
 * `interactive-widget=resizes-content`, and `dvh` does not shrink for the
 * keyboard: the page keeps its full height and iOS pans the visual viewport
 * to reveal the focused input, pushing headers off-screen. This hook
 * measures what is actually visible and publishes it on `<html>` so an app
 * shell can follow the visible area instead:
 *
 * - `--mieweb-keyboard-inset` — keyboard height in px (0 when closed)
 * - `--mieweb-visual-viewport-height` — visible height in px
 * - `--mieweb-visual-viewport-offset-top` — how far iOS panned the page
 * - `data-keyboard-open` — present while the keyboard is open
 *
 * On browsers that already resize the layout for the keyboard (Chrome on
 * Android with `interactive-widget=resizes-content`) the inset stays 0 and
 * the variables simply mirror the layout viewport.
 *
 * Mount it once, near the app root.
 *
 * @example
 * ```tsx
 * function AppShell({ children }) {
 *   useKeyboardInset();
 *   return (
 *     <div
 *       style={{
 *         height: 'var(--mieweb-visual-viewport-height, 100dvh)',
 *         transform: 'translateY(var(--mieweb-visual-viewport-offset-top, 0px))',
 *       }}
 *     >
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardInset(
  options: UseKeyboardInsetOptions = {}
): KeyboardInsetState {
  const { enabled = true } = options;
  const [state, setState] = useState<KeyboardInsetState>(CLOSED);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    let frame = 0;

    const measure = () => {
      frame = 0;
      // Pinch-zoom shrinks the visual viewport too; that is not a keyboard.
      const zoomed = Math.abs(viewport.scale - 1) > 0.01;
      const keyboardInset = zoomed
        ? 0
        : Math.max(
            0,
            Math.round(
              window.innerHeight - viewport.height - viewport.offsetTop
            )
          );
      const isKeyboardOpen = keyboardInset > 0;

      root.style.setProperty(KEYBOARD_INSET_VAR, `${keyboardInset}px`);
      root.style.setProperty(
        VISUAL_VIEWPORT_HEIGHT_VAR,
        `${zoomed ? window.innerHeight : Math.round(viewport.height)}px`
      );
      root.style.setProperty(
        VISUAL_VIEWPORT_OFFSET_TOP_VAR,
        `${zoomed ? 0 : Math.round(viewport.offsetTop)}px`
      );
      root.toggleAttribute(KEYBOARD_OPEN_ATTRIBUTE, isKeyboardOpen);

      setState((previous) =>
        previous.keyboardInset === keyboardInset
          ? previous
          : { keyboardInset, isKeyboardOpen }
      );
    };

    // Coalesce the resize + scroll bursts iOS fires while the keyboard
    // animates into one write per frame.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      root.style.removeProperty(KEYBOARD_INSET_VAR);
      root.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_VAR);
      root.style.removeProperty(VISUAL_VIEWPORT_OFFSET_TOP_VAR);
      root.removeAttribute(KEYBOARD_OPEN_ATTRIBUTE);
      setState(CLOSED);
    };
  }, [enabled]);

  return state;
}
