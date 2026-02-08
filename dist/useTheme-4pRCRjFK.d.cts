type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
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
declare function useTheme(defaultTheme?: Theme): {
    theme: Theme;
    setTheme: (newTheme: Theme) => void;
    resolvedTheme: ResolvedTheme;
};

export { type ResolvedTheme as R, type Theme as T, useTheme as u };
