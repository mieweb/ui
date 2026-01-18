import { BrandConfig } from './types.cjs';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './types.cjs';
export { default as bluehiveBrand } from './bluehive.cjs';

/**
 * Default Brand Configuration
 *
 * A neutral, accessible brand theme using standard colors.
 * Use this as a starting point for creating custom brands.
 */

declare const defaultBrand: BrandConfig;

declare const brands: {
    readonly bluehive: () => Promise<BrandConfig>;
    readonly default: () => Promise<BrandConfig>;
};

export { BrandConfig, brands, defaultBrand };
