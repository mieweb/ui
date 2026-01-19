import { useEffect, useCallback } from 'react';

/**
 * Options for keyboard shortcut hook
 */
export interface KeyboardShortcutOptions {
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
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    modifiers = {},
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if we should ignore input fields
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toUpperCase();
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Check modifiers
      const { ctrl, shift, alt, meta } = modifiers;

      // For Cmd+K style shortcuts, allow either meta (Mac) or ctrl (Windows/Linux)
      const metaOrCtrl = meta || ctrl;
      if (metaOrCtrl) {
        if (!(event.metaKey || event.ctrlKey)) return;
      } else {
        // If no meta/ctrl modifier specified, ensure neither is pressed
        if (event.metaKey || event.ctrlKey) return;
      }

      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;

      // Check key match (case-insensitive for letters)
      const eventKey =
        event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const targetKey = key.length === 1 ? key.toLowerCase() : key;
      if (eventKey !== targetKey) return;

      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }

      callback(event);
    },
    [key, callback, modifiers, preventDefault, stopPropagation, ignoreInputs]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

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
export function useCommandK(callback: () => void, enabled = true): void {
  useKeyboardShortcut('k', callback, {
    enabled,
    modifiers: { meta: true, ctrl: true },
    ignoreInputs: false, // Cmd+K should work even in inputs
  });
}
