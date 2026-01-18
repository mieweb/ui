import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { T as Theme, R as ResolvedTheme } from '../../useTheme-B9SWu6ui.js';

interface ThemeProviderContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: ResolvedTheme;
}
declare const ThemeProviderContext: React.Context<ThemeProviderContextValue | undefined>;
interface ThemeProviderProps {
    children: React.ReactNode;
    /** Default theme to use on first load */
    defaultTheme?: Theme;
    /** Storage key for persisting theme */
    storageKey?: string;
}
/**
 * Provider component that wraps your app to enable theme switching.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system">
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
declare function ThemeProvider({ children, defaultTheme: _defaultTheme, }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare namespace ThemeProvider {
    var displayName: string;
}
/**
 * Hook to access the theme context.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, resolvedTheme } = useThemeContext();
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme
 *     </button>
 *   );
 * }
 * ```
 */
declare function useThemeContext(): ThemeProviderContextValue;

export { ThemeProvider, ThemeProviderContext, type ThemeProviderContextValue, type ThemeProviderProps, useThemeContext };
