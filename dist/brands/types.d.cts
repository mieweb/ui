/**
 * @mieweb/ui Brand System Types
 *
 * This module provides type definitions and utilities for brand themes.
 * Brands define colors, typography, spacing, and other design tokens that
 * can be applied to @mieweb/ui components.
 */
/**
 * Primary color scale (50-950) following Tailwind conventions.
 */
interface ColorScale {
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
interface SemanticColors {
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
interface BrandColors {
    /** Primary brand color scale */
    primary: ColorScale;
    /** Light mode semantic colors */
    light: SemanticColors;
    /** Dark mode semantic colors */
    dark: SemanticColors;
}
/**
 * Typography configuration for a brand.
 */
interface BrandTypography {
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
interface BrandBorderRadius {
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
interface BrandBoxShadow {
    card: string;
    dropdown: string;
    modal: string;
}
/**
 * Complete brand configuration.
 */
interface BrandConfig {
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
/**
 * Generate CSS custom properties from a brand configuration.
 * This creates a standalone CSS file that can be imported into any project.
 */
declare function generateBrandCSS(brand: BrandConfig): string;
/**
 * Generate Tailwind CSS theme configuration from a brand.
 * Use this in your tailwind.config.js to apply the brand.
 */
declare function generateTailwindTheme(brand: BrandConfig): {
    colors: {
        [brand.name]: ColorScale;
        primary: ColorScale;
    };
    fontFamily: {
        mono?: string[] | undefined;
        sans: string[];
    };
    borderRadius: {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        full: string;
    };
    boxShadow: {
        card: string;
        dropdown: string;
        modal: string;
    };
};
/**
 * Generate a complete Tailwind preset for a brand.
 * This includes the mieweb/ui base preset plus brand-specific overrides.
 */
declare function createBrandPreset(brand: BrandConfig): {
    darkMode: readonly ["class", "[data-theme=\"dark\"]"];
    theme: {
        extend: {
            colors: {
                [brand.name]: ColorScale;
                primary: ColorScale;
            };
            fontFamily: {
                mono?: string[] | undefined;
                sans: string[];
            };
            borderRadius: {
                none: string;
                sm: string;
                md: string;
                lg: string;
                xl: string;
                '2xl': string;
                full: string;
            };
            boxShadow: {
                card: string;
                dropdown: string;
                modal: string;
            };
        };
    };
};

export { type BrandBorderRadius, type BrandBoxShadow, type BrandColors, type BrandConfig, type BrandTypography, type ColorScale, type SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme };
