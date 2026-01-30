import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { T as Theme, R as ResolvedTheme } from '../../useTheme-B9SWu6ui.cjs';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

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

declare const themeToggleVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "ghost" | "default" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const themeToggleIconVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ThemeToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>, VariantProps<typeof themeToggleVariants> {
    /**
     * What themes to cycle through.
     * - 'two-way': Toggle between light and dark only
     * - 'three-way': Cycle through light → dark → system
     * @default 'two-way'
     */
    mode?: 'two-way' | 'three-way';
    /**
     * Whether to show a tooltip with the current/next theme
     * @default true
     */
    showTooltip?: boolean;
    /**
     * Tooltip placement
     * @default 'bottom'
     */
    tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
    /**
     * Delay before showing tooltip in ms
     * @default 140
     */
    tooltipDelay?: number;
    /**
     * Custom icon for light theme
     */
    lightIcon?: React.ReactNode;
    /**
     * Custom icon for dark theme
     */
    darkIcon?: React.ReactNode;
    /**
     * Custom icon for system theme (only used in three-way mode)
     */
    systemIcon?: React.ReactNode;
}
/**
 * An accessible theme toggle button that switches between light/dark modes.
 *
 * Uses the mieweb-ui useTheme hook for state management and persists
 * the user's preference to localStorage.
 *
 * @example
 * ```tsx
 * // Simple two-way toggle (light/dark)
 * <ThemeToggle />
 *
 * // Three-way cycle (light → dark → system)
 * <ThemeToggle mode="three-way" />
 *
 * // With custom styling
 * <ThemeToggle size="lg" variant="ghost" />
 *
 * // Without tooltip
 * <ThemeToggle showTooltip={false} />
 * ```
 */
declare const ThemeToggle: React.ForwardRefExoticComponent<ThemeToggleProps & React.RefAttributes<HTMLButtonElement>>;

export { ThemeProvider, ThemeProviderContext, type ThemeProviderContextValue, type ThemeProviderProps, ThemeToggle, type ThemeToggleProps, themeToggleIconVariants, themeToggleVariants, useThemeContext };
