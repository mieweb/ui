import { useEffect, useState } from 'react';

/** CSS custom properties written to `<html>` while the hook is mounted. */
export const KEYBOARD_INSET_VAR = '--mieweb-keyboard-inset';
export const VISUAL_VIEWPORT_HEIGHT_VAR = '--mieweb-visual-viewport-height';
export const VISUAL_VIEWPORT_OFFSET_TOP_VAR =
  '--mieweb-visual-viewport-offset-top';
/** Boolean attribute set on `<html>` while an on-screen keyboard is open. */
export const KEYBOARD_OPEN_ATTRIBUTE = 'data-keyboard-open';
/** Attribute on `<html>` naming the active {@link KeyboardInsetSource}. */
export const KEYBOARD_SOURCE_ATTRIBUTE = 'data-keyboard-source';

/**
 * Where keyboard metrics come from.
 *
 * - `'visual-viewport'` — the Visual Viewport API. Works in any browser, but
 *   iOS only reports the keyboard once its slide-in animation has finished.
 * - `'native'` — `keyboardWillShow` / `keyboardWillHide` window events with a
 *   `keyboardHeight` property, as fired by `cordova-plugin-ionic-keyboard` and
 *   Capacitor's Keyboard plugin. They arrive *before* the keyboard animates,
 *   so layout can move in step with it.
 */
export type KeyboardInsetSource = 'visual-viewport' | 'native';

export interface KeyboardInsetState {
  /** Pixels of the layout viewport covered by the on-screen keyboard. */
  keyboardInset: number;
  /** Whether an on-screen keyboard currently covers part of the page. */
  isKeyboardOpen: boolean;
}

export interface UseKeyboardInsetOptions {
  /** Track the keyboard; `false` stops tracking and clears the CSS variables. @default true */
  enabled?: boolean;
  /** Where keyboard metrics come from. @default 'visual-viewport' */
  source?: KeyboardInsetSource;
}

interface NativeKeyboardEvent extends Event {
  keyboardHeight?: number;
}

const CLOSED: KeyboardInsetState = { keyboardInset: 0, isKeyboardOpen: false };

/**
 * Tracks the on-screen keyboard and publishes it on `<html>`.
 *
 * ### `source: 'native'` (Cordova / Capacitor apps)
 *
 * Listens for the native keyboard plugin's `keyboardWillShow` /
 * `keyboardWillHide` window events. Configure the plugin so the WebView is
 * neither resized nor panned (for `cordova-plugin-ionic-keyboard`:
 * `KeyboardResize=false`), keep the app shell at full height, and move only
 * the composer dock by `--mieweb-keyboard-inset` with a short transition
 * (~250ms) so it rides up with the keyboard. Only `--mieweb-keyboard-inset`,
 * `data-keyboard-open` and `data-keyboard-source` are published; the
 * visual-viewport variables stay unset.
 *
 * ### `source: 'visual-viewport'` (browsers, default)
 *
 * Uses the Visual Viewport API.
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
 * iOS reports the visual viewport only after the keyboard has finished
 * animating, so a shell sized this way snaps into place once the keyboard
 * lands. Prefer `source: 'native'` wherever a native keyboard plugin exists.
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
 *
 * @example Native app (keyboard plugin with WebView resizing disabled)
 * ```tsx
 * function ComposerDock({ children }) {
 *   useKeyboardInset({ source: 'native' });
 *   return (
 *     <div
 *       style={{
 *         paddingBottom: 'calc(var(--mieweb-keyboard-inset, 0px) + 0.5rem)',
 *         transition: 'padding-bottom 250ms ease',
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
  const { enabled = true, source = 'visual-viewport' } = options;
  const [state, setState] = useState<KeyboardInsetState>(CLOSED);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const root = document.documentElement;

    const publish = (keyboardInset: number) => {
      const isKeyboardOpen = keyboardInset > 0;
      root.style.setProperty(KEYBOARD_INSET_VAR, `${keyboardInset}px`);
      root.toggleAttribute(KEYBOARD_OPEN_ATTRIBUTE, isKeyboardOpen);
      setState((previous) =>
        previous.keyboardInset === keyboardInset
          ? previous
          : { keyboardInset, isKeyboardOpen }
      );
    };

    const clear = () => {
      root.style.removeProperty(KEYBOARD_INSET_VAR);
      root.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_VAR);
      root.style.removeProperty(VISUAL_VIEWPORT_OFFSET_TOP_VAR);
      root.removeAttribute(KEYBOARD_OPEN_ATTRIBUTE);
      root.removeAttribute(KEYBOARD_SOURCE_ATTRIBUTE);
      setState(CLOSED);
    };

    if (source === 'native') {
      const handleWillShow = (event: Event) => {
        publish(
          Math.max(
            0,
            Math.round((event as NativeKeyboardEvent).keyboardHeight ?? 0)
          )
        );
      };
      const handleWillHide = () => publish(0);

      root.setAttribute(KEYBOARD_SOURCE_ATTRIBUTE, source);
      publish(0);
      window.addEventListener('keyboardWillShow', handleWillShow);
      window.addEventListener('keyboardWillHide', handleWillHide);

      return () => {
        window.removeEventListener('keyboardWillShow', handleWillShow);
        window.removeEventListener('keyboardWillHide', handleWillHide);
        clear();
      };
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

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

      root.style.setProperty(
        VISUAL_VIEWPORT_HEIGHT_VAR,
        `${zoomed ? window.innerHeight : Math.round(viewport.height)}px`
      );
      root.style.setProperty(
        VISUAL_VIEWPORT_OFFSET_TOP_VAR,
        `${zoomed ? 0 : Math.round(viewport.offsetTop)}px`
      );
      publish(keyboardInset);
    };

    // Coalesce the resize + scroll bursts iOS fires while the keyboard
    // animates into one write per frame.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    root.setAttribute(KEYBOARD_SOURCE_ATTRIBUTE, source);
    measure();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      clear();
    };
  }, [enabled, source]);

  return state;
}
