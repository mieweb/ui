import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'mieweb-ui-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return null;
}

function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
}

/**
 * Hook for managing theme state with localStorage persistence and system preference support.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       {resolvedTheme === 'dark' ? '☀️' : '🌙'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(defaultTheme: Theme = 'system') {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    defaultTheme === 'system' ? 'light' : defaultTheme === 'dark' ? 'dark' : 'light'
  );

  // Initialize theme from storage, falling back to defaultTheme
  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? defaultTheme;
    setThemeState(initial);

    const resolved = initial === 'system' ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}
