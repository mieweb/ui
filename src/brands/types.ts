/**
 * @mieweb/ui Brand System Types
 *
 * This module provides type definitions and utilities for brand themes.
 * Brands define colors, typography, spacing, and other design tokens that
 * can be applied to @mieweb/ui components.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Primary color scale (50-950) following Tailwind conventions.
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Semantic colors for a specific color mode (light or dark).
 */
export interface SemanticColors {
  /** Page background color */
  background: string;
  /** Primary text color */
  foreground: string;
  /** Card/panel background */
  card: string;
  /** Card text color */
  cardForeground: string;
  /** Muted/subtle background */
  muted: string;
  /** Muted/secondary text */
  mutedForeground: string;
  /** Border color */
  border: string;
  /** Input border color */
  input: string;
  /** Focus ring color */
  ring: string;
  /** Destructive/error color */
  destructive: string;
  /** Text on destructive backgrounds */
  destructiveForeground: string;
  /** Success color */
  success: string;
  /** Text on success backgrounds */
  successForeground: string;
  /** Warning color */
  warning: string;
  /** Text on warning backgrounds */
  warningForeground: string;
}

/**
 * Complete color configuration for a brand.
 */
export interface BrandColors {
  /** Primary brand color scale */
  primary: ColorScale;
  /** Secondary color scale (optional — falls back to library defaults) */
  secondary?: ColorScale;
  /** Neutral / gray color scale (optional — falls back to library defaults) */
  neutral?: ColorScale;
  /** Destructive / error color scale (optional — falls back to library defaults) */
  destructive?: ColorScale;
  /** Success color scale (optional — falls back to library defaults) */
  success?: ColorScale;
  /** Warning color scale (optional — falls back to library defaults) */
  warning?: ColorScale;
  /** Info color scale (optional — falls back to library defaults) */
  info?: ColorScale;
  /** Light mode semantic colors */
  light: SemanticColors;
  /** Dark mode semantic colors */
  dark: SemanticColors;
}

/**
 * Typography configuration for a brand.
 */
export interface BrandTypography {
  /** Font family stack for body text */
  fontFamily: {
    sans: string[];
    mono?: string[];
  };
  /** Base font size (usually 16px) */
  baseFontSize?: string;
}

/**
 * Border radius configuration.
 */
export interface BrandBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

/**
 * Box shadow configuration. `card`, `dropdown`, `modal` remain for back-compat;
 * the numbered `1`–`6` levels form a consistent elevation ramp, with `inner` for
 * inset surfaces.
 */
export interface BrandBoxShadow {
  card: string;
  dropdown: string;
  modal: string;
  /** Elevation ramp — increasing depth from 1 (subtle) to 6 (pronounced) */
  1?: string;
  2?: string;
  3?: string;
  4?: string;
  5?: string;
  6?: string;
  /** Inset shadow */
  inner?: string;
}

/**
 * Spacing scale (rem). Used for component padding, gap, and rhythm.
 * Brands may override to set their overall density/breathing room.
 */
export interface BrandSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * Density configuration. `comfortable` is the default; `compact` multiplies
 * spacing tokens by `compactScale` (e.g. 0.75) when `[data-density='compact']`
 * (or the legacy `body.condensed` class) is active.
 */
export interface BrandDensity {
  default: 'comfortable' | 'compact';
  compactScale: number;
}

/**
 * Motion tokens. Durations in ms, easings as CSS timing functions.
 * Honors `prefers-reduced-motion` via the `usePrefersReducedMotion` hook.
 */
export interface BrandMotion {
  durations: {
    fast: string;
    base: string;
    slow: string;
  };
  easings: {
    standard: string;
    emphasized: string;
    decelerate: string;
  };
}

/**
 * Focus ring tokens. `color` is a semantic key (defaults to `ring`).
 */
export interface BrandFocusRing {
  width: string;
  offset: string;
  color?: 'ring' | 'primary' | 'destructive';
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Complete brand configuration.
 */
export interface BrandConfig {
  /** Unique identifier (lowercase, no spaces) */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Brand description */
  description?: string;
  /** Color configuration */
  colors: BrandColors;
  /** Typography settings */
  typography: BrandTypography;
  /** Border radius scale */
  borderRadius: BrandBorderRadius;
  /** Box shadow definitions */
  boxShadow: BrandBoxShadow;
  /** Spacing scale (optional — falls back to library defaults) */
  spacing?: BrandSpacing;
  /** Density configuration (optional — defaults to comfortable, 0.75 compact) */
  density?: BrandDensity;
  /** Motion / transition tokens (optional — falls back to library defaults) */
  motion?: BrandMotion;
  /** Focus ring tokens (optional — falls back to 2px/2px solid ring) */
  focusRing?: BrandFocusRing;
}

/**
 * Library-wide defaults for the optional token groups. Brands can override any
 * subset; missing fields fall back here.
 */
export const defaultSpacing: BrandSpacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
};

export const defaultDensity: BrandDensity = {
  default: 'comfortable',
  compactScale: 0.75,
};

export const defaultMotion: BrandMotion = {
  durations: {
    fast: '120ms',
    base: '200ms',
    slow: '320ms',
  },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  },
};

export const defaultFocusRing: BrandFocusRing = {
  width: '2px',
  offset: '2px',
  color: 'ring',
  style: 'solid',
};

/**
 * Default elevation ramp; used for any brand that doesn't override `boxShadow.1`–`6`/`inner`.
 */
export const defaultElevation = {
  1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  6: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS custom properties from a brand configuration.
 * This creates a standalone CSS file that can be imported into any project.
 */
export function generateBrandCSS(brand: BrandConfig): string {
  const { colors, typography, borderRadius, boxShadow } = brand;

  // Collect all color scales (primary + any optional scales)
  const scaleNames = [
    'primary',
    'secondary',
    'neutral',
    'destructive',
    'success',
    'warning',
    'info',
  ] as const;

  const scaleBlocks = scaleNames
    .filter(
      (name) =>
        name in colors &&
        typeof colors[name] === 'object' &&
        colors[name] !== undefined
    )
    .map((name) => {
      const scale = colors[name] as ColorScale;
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      return `  /* ${label} Color Scale */
  --mieweb-${name}-50: ${scale[50]};
  --mieweb-${name}-100: ${scale[100]};
  --mieweb-${name}-200: ${scale[200]};
  --mieweb-${name}-300: ${scale[300]};
  --mieweb-${name}-400: ${scale[400]};
  --mieweb-${name}-500: ${scale[500]};
  --mieweb-${name}-600: ${scale[600]};
  --mieweb-${name}-700: ${scale[700]};
  --mieweb-${name}-800: ${scale[800]};
  --mieweb-${name}-900: ${scale[900]};
  --mieweb-${name}-950: ${scale[950]};`;
    })
    .join('\n\n');

  return `/**
 * ${brand.displayName} Brand Theme
 * Generated by @mieweb/ui
 * ${brand.description || ''}
 */

/* ============================================
   ${brand.displayName} Design Tokens
   ============================================ */

:root {
${scaleBlocks}

  /* Light Mode Semantic Colors */
  --mieweb-background: ${colors.light.background};
  --mieweb-foreground: ${colors.light.foreground};
  --mieweb-card: ${colors.light.card};
  --mieweb-card-foreground: ${colors.light.cardForeground};
  --mieweb-muted: ${colors.light.muted};
  --mieweb-muted-foreground: ${colors.light.mutedForeground};
  --mieweb-border: ${colors.light.border};
  --mieweb-input: ${colors.light.input};
  --mieweb-ring: ${colors.light.ring};
  --mieweb-destructive: ${colors.light.destructive};
  --mieweb-destructive-foreground: ${colors.light.destructiveForeground};
  --mieweb-success: ${colors.light.success};
  --mieweb-success-foreground: ${colors.light.successForeground};
  --mieweb-warning: ${colors.light.warning};
  --mieweb-warning-foreground: ${colors.light.warningForeground};

  /* Typography */
  --mieweb-font-sans: ${typography.fontFamily.sans.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')};
  ${typography.fontFamily.mono ? `--mieweb-font-mono: ${typography.fontFamily.mono.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')};` : ''}

  /* Border Radius */
  --mieweb-radius-none: ${borderRadius.none};
  --mieweb-radius-sm: ${borderRadius.sm};
  --mieweb-radius-md: ${borderRadius.md};
  --mieweb-radius-lg: ${borderRadius.lg};
  --mieweb-radius-xl: ${borderRadius.xl};
  --mieweb-radius-2xl: ${borderRadius['2xl']};
  --mieweb-radius-full: ${borderRadius.full};

  /* Shadows */
  --mieweb-shadow-card: ${boxShadow.card};
  --mieweb-shadow-dropdown: ${boxShadow.dropdown};
  --mieweb-shadow-modal: ${boxShadow.modal};

  /* Elevation Ramp */
  --mieweb-shadow-1: ${boxShadow[1] ?? defaultElevation[1]};
  --mieweb-shadow-2: ${boxShadow[2] ?? defaultElevation[2]};
  --mieweb-shadow-3: ${boxShadow[3] ?? defaultElevation[3]};
  --mieweb-shadow-4: ${boxShadow[4] ?? defaultElevation[4]};
  --mieweb-shadow-5: ${boxShadow[5] ?? defaultElevation[5]};
  --mieweb-shadow-6: ${boxShadow[6] ?? defaultElevation[6]};
  --mieweb-shadow-inner: ${boxShadow.inner ?? defaultElevation.inner};

  /* Spacing Scale */
  --mieweb-spacing-xs: ${(brand.spacing ?? defaultSpacing).xs};
  --mieweb-spacing-sm: ${(brand.spacing ?? defaultSpacing).sm};
  --mieweb-spacing-md: ${(brand.spacing ?? defaultSpacing).md};
  --mieweb-spacing-lg: ${(brand.spacing ?? defaultSpacing).lg};
  --mieweb-spacing-xl: ${(brand.spacing ?? defaultSpacing).xl};
  --mieweb-spacing-2xl: ${(brand.spacing ?? defaultSpacing)['2xl']};

  /* Density — initial scale follows brand default; runtime [data-density] overrides below */
  --mieweb-density-scale: ${
    (brand.density ?? defaultDensity).default === 'compact'
      ? (brand.density ?? defaultDensity).compactScale
      : 1
  };

  /* Motion */
  --mieweb-duration-fast: ${(brand.motion ?? defaultMotion).durations.fast};
  --mieweb-duration-base: ${(brand.motion ?? defaultMotion).durations.base};
  --mieweb-duration-slow: ${(brand.motion ?? defaultMotion).durations.slow};
  --mieweb-ease-standard: ${(brand.motion ?? defaultMotion).easings.standard};
  --mieweb-ease-emphasized: ${(brand.motion ?? defaultMotion).easings.emphasized};
  --mieweb-ease-decelerate: ${(brand.motion ?? defaultMotion).easings.decelerate};

  /* Focus Ring */
  --mieweb-focus-ring-width: ${(brand.focusRing ?? defaultFocusRing).width};
  --mieweb-focus-ring-offset: ${(brand.focusRing ?? defaultFocusRing).offset};
  --mieweb-focus-ring-style: ${(brand.focusRing ?? defaultFocusRing).style ?? 'solid'};
  --mieweb-focus-ring-color: var(--mieweb-${(brand.focusRing ?? defaultFocusRing).color ?? 'ring'});
}

/* Comfortable density override — explicit reset when brand default is compact */
[data-density='comfortable'] {
  --mieweb-density-scale: 1;
}

/* Compact density — scales spacing tokens. Applies to both data-density and legacy .condensed. */
[data-density='compact'],
body.condensed {
  --mieweb-density-scale: ${(brand.density ?? defaultDensity).compactScale};
}

/* Honor reduced-motion preference at the token level */
@media (prefers-reduced-motion: reduce) {
  :root {
    --mieweb-duration-fast: 0ms;
    --mieweb-duration-base: 0ms;
    --mieweb-duration-slow: 0ms;
  }
}

/* Dark Mode */
[data-theme="dark"],
.dark {
  --mieweb-background: ${colors.dark.background};
  --mieweb-foreground: ${colors.dark.foreground};
  --mieweb-card: ${colors.dark.card};
  --mieweb-card-foreground: ${colors.dark.cardForeground};
  --mieweb-muted: ${colors.dark.muted};
  --mieweb-muted-foreground: ${colors.dark.mutedForeground};
  --mieweb-border: ${colors.dark.border};
  --mieweb-input: ${colors.dark.input};
  --mieweb-ring: ${colors.dark.ring};
  --mieweb-destructive: ${colors.dark.destructive};
  --mieweb-destructive-foreground: ${colors.dark.destructiveForeground};
  --mieweb-success: ${colors.dark.success};
  --mieweb-success-foreground: ${colors.dark.successForeground};
  --mieweb-warning: ${colors.dark.warning};
  --mieweb-warning-foreground: ${colors.dark.warningForeground};
}
`;
}

// ============================================================================
// Tailwind Theme Generation
// ============================================================================

/**
 * Generate Tailwind CSS theme configuration from a brand.
 * Use this in your tailwind.config.js to apply the brand.
 */
export function generateTailwindTheme(brand: BrandConfig) {
  const { colors, typography, borderRadius, boxShadow } = brand;
  const spacing = brand.spacing ?? defaultSpacing;
  const motion = brand.motion ?? defaultMotion;
  const focusRing = brand.focusRing ?? defaultFocusRing;

  // Build color config including all provided optional scales
  const colorConfig: Record<string, ColorScale> = {
    primary: colors.primary,
    // Expose brand colors under the brand name for semantic usage
    [brand.name]: colors.primary,
  };

  const optionalScales = [
    'secondary',
    'neutral',
    'destructive',
    'success',
    'warning',
    'info',
  ] as const;

  for (const scale of optionalScales) {
    if (colors[scale]) {
      colorConfig[scale] = colors[scale];
    }
  }

  return {
    colors: colorConfig,
    fontFamily: {
      sans: typography.fontFamily.sans,
      ...(typography.fontFamily.mono
        ? { mono: typography.fontFamily.mono }
        : {}),
    },
    borderRadius: {
      none: borderRadius.none,
      sm: borderRadius.sm,
      md: borderRadius.md,
      lg: borderRadius.lg,
      xl: borderRadius.xl,
      '2xl': borderRadius['2xl'],
      full: borderRadius.full,
    },
    boxShadow: {
      card: boxShadow.card,
      dropdown: boxShadow.dropdown,
      modal: boxShadow.modal,
      'elevation-1': boxShadow[1] ?? defaultElevation[1],
      'elevation-2': boxShadow[2] ?? defaultElevation[2],
      'elevation-3': boxShadow[3] ?? defaultElevation[3],
      'elevation-4': boxShadow[4] ?? defaultElevation[4],
      'elevation-5': boxShadow[5] ?? defaultElevation[5],
      'elevation-6': boxShadow[6] ?? defaultElevation[6],
      'elevation-inner': boxShadow.inner ?? defaultElevation.inner,
    },
    spacing: {
      'brand-xs': spacing.xs,
      'brand-sm': spacing.sm,
      'brand-md': spacing.md,
      'brand-lg': spacing.lg,
      'brand-xl': spacing.xl,
      'brand-2xl': spacing['2xl'],
    },
    transitionDuration: {
      fast: motion.durations.fast,
      base: motion.durations.base,
      slow: motion.durations.slow,
    },
    transitionTimingFunction: {
      standard: motion.easings.standard,
      emphasized: motion.easings.emphasized,
      decelerate: motion.easings.decelerate,
    },
    ringWidth: {
      focus: focusRing.width,
    },
    ringOffsetWidth: {
      focus: focusRing.offset,
    },
  };
}

/**
 * Generate a complete Tailwind preset for a brand.
 * This includes the mieweb/ui base preset plus brand-specific overrides.
 */
export function createBrandPreset(brand: BrandConfig) {
  return {
    darkMode: ['class', '[data-theme="dark"]'] as const,
    theme: {
      extend: generateTailwindTheme(brand),
    },
  };
}
