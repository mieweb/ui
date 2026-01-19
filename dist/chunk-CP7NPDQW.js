import { useCallback, useEffect, useState } from 'react';

// src/hooks/useKeyboardShortcut.ts
function useKeyboardShortcut(key, callback, options = {}) {
  const {
    enabled = true,
    modifiers = {},
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true
  } = options;
  const handleKeyDown = useCallback(
    (event) => {
      if (ignoreInputs) {
        const target = event.target;
        const tagName = target.tagName.toUpperCase();
        if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target.isContentEditable) {
          return;
        }
      }
      const { ctrl, shift, alt, meta } = modifiers;
      const metaOrCtrl = meta || ctrl;
      if (metaOrCtrl) {
        if (!(event.metaKey || event.ctrlKey)) return;
      } else {
        if (event.metaKey || event.ctrlKey) return;
      }
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;
      const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
function useCommandK(callback, enabled = true) {
  useKeyboardShortcut("k", callback, {
    enabled,
    modifiers: { meta: true, ctrl: true },
    ignoreInputs: false
    // Cmd+K should work even in inputs
  });
}
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const handler = (event) => {
      setMatches(event.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);
  return matches;
}
function useIsMobile() {
  return useMediaQuery("(max-width: 639px)");
}
function useIsSmallTablet() {
  return useMediaQuery("(min-width: 640px) and (max-width: 767px)");
}
function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}
function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
function useIsLargeDesktop() {
  return useMediaQuery("(min-width: 1280px)");
}
function useIsMobileOrTablet() {
  return useMediaQuery("(max-width: 1023px)");
}

export { useCommandK, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery };
//# sourceMappingURL=chunk-CP7NPDQW.js.map
//# sourceMappingURL=chunk-CP7NPDQW.js.map