import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { Tooltip } from '../Tooltip';

// ============================================================================
// Theme Toggle Variants
// ============================================================================

const themeToggleVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-md border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/40',
  ],
  {
    variants: {
      size: {
        sm: 'h-7 w-7',
        md: 'h-8 w-8',
        lg: 'h-9 w-9',
      },
      variant: {
        default: [
          'border-neutral-300 bg-white text-neutral-600 shadow-sm',
          'hover:bg-neutral-100',
          'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
        ],
        ghost: [
          'border-transparent bg-transparent text-neutral-600',
          'hover:bg-neutral-100',
          'dark:text-neutral-300 dark:hover:bg-neutral-700',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const themeToggleIconVariants = cva('', {
  variants: {
    size: {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// ============================================================================
// Icon Components
// ============================================================================

interface IconProps {
  className?: string;
}

const SunIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

// ============================================================================
// Three-way cycle (single source of truth)
// ============================================================================

/** The three-way cycle order: light → dark → system → light. Click handler,
 *  tooltip label, and default icon are all derived from this one map. */
const THREE_WAY_NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Switch to light mode',
  dark: 'Switch to dark mode',
  system: 'Switch to system theme',
};

// ============================================================================
// ThemeToggle Component
// ============================================================================

export interface ThemeToggleProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof themeToggleVariants> {
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
const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  (
    {
      className,
      size,
      variant,
      mode = 'two-way',
      showTooltip = true,
      tooltipPlacement = 'bottom',
      tooltipDelay = 140,
      lightIcon,
      darkIcon,
      systemIcon,
      ...props
    },
    ref
  ) => {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const handleClick = React.useCallback(() => {
      if (mode === 'two-way') {
        // Simple toggle between light and dark
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      } else {
        setTheme(THREE_WAY_NEXT[theme]);
      }
    }, [mode, theme, resolvedTheme, setTheme]);

    const getLabel = () => {
      if (mode === 'two-way') {
        return resolvedTheme === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode';
      }
      // Three-way mode - name the next stop in the cycle
      return THEME_LABELS[THREE_WAY_NEXT[theme]];
    };

    const getCurrentIcon = () => {
      const iconClass = themeToggleIconVariants({ size });
      if (mode === 'three-way') {
        // The DEFAULT icon previews the next theme in the cycle, matching the
        // tooltip (previously dark showed a sun while the click gave system,
        // and system showed the current state instead of the next). The
        // lightIcon/darkIcon/systemIcon overrides are keyed by the CURRENT
        // theme — they replace the icon shown while in that theme.
        const override = {
          light: lightIcon,
          dark: darkIcon,
          system: systemIcon,
        }[theme];
        if (override) return override;
        const defaultIcons: Record<Theme, React.ReactNode> = {
          light: <SunIcon className={iconClass} />,
          dark: <MoonIcon className={iconClass} />,
          system: <SystemIcon className={iconClass} />,
        };
        return defaultIcons[THREE_WAY_NEXT[theme]];
      }

      // Two-way keeps the classic convention: sun while dark ("click for
      // light"), moon while light ("click for dark").
      if (resolvedTheme === 'dark') {
        return darkIcon || <SunIcon className={iconClass} />;
      }

      return lightIcon || <MoonIcon className={iconClass} />;
    };

    const label = getLabel();

    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={handleClick}
        className={cn(themeToggleVariants({ size, variant }), className)}
        {...props}
      >
        {getCurrentIcon()}
      </button>
    );

    if (showTooltip) {
      return (
        <Tooltip
          content={label}
          placement={tooltipPlacement}
          delay={tooltipDelay}
        >
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle, themeToggleVariants, themeToggleIconVariants };
