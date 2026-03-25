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
 * Box shadow configuration.
 */
export interface BrandBoxShadow {
  card: string;
  dropdown: string;
  modal: string;
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
}

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
