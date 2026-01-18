import * as React from 'react';
import { useTheme, type Theme, type ResolvedTheme } from '../../hooks/useTheme';

export interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeProviderContext = React.createContext<
  ThemeProviderContextValue | undefined
>(undefined);

export interface ThemeProviderProps {
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
function ThemeProvider({
  children,
  defaultTheme: _defaultTheme = 'system',
}: ThemeProviderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

ThemeProvider.displayName = 'ThemeProvider';

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
function useThemeContext(): ThemeProviderContextValue {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeProvider, ThemeProviderContext, useThemeContext };
