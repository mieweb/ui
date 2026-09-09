'use client';

import { useEffect, useState } from 'react';

/** Read the current dark-mode state from the document root. */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return (
    root.classList.contains('dark') ||
    root.getAttribute('data-theme') === 'dark'
  );
}

/**
 * Track dark mode reactively, for the cases a CSS swap cannot cover — content
 * rendered *from* the theme (Mermaid bakes colors into the SVG) or third-party
 * DOM that wants a class of its own (the Kerebron editor surface).
 *
 * @example
 * ```tsx
 * const dark = useIsDarkMode();
 * <div className={dark ? 'kb-component kb-component--dark' : 'kb-component'} />
 * ```
 */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(isDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const update = () => setDark(isDarkMode());
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
}
