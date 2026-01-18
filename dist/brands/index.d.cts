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

/**
 * Enterprise Health Brand Configuration
 *
 * The official brand theme for Enterprise Health.
 * Extracted from enterprisehealth.com on January 2026.
 *
 * Brand Colors:
 * - Primary: #6E2B68 (Burgundy/Purple) - Used for accents, links, icons
 * - Secondary: #00497A (Deep Teal Blue) - Used in gradients
 * - Accent: #F8B700 (Gold/Yellow) - Logo sun color
 * - Gradient: linear-gradient(111.02deg, #00497A, #6E2B68)
 *
 * Typography: Jost (Google Font)
 * Card Radius: 24px (very rounded)
 * Button Radius: 10px
 * Input Radius: 12px
 */

/**
 * Enterprise Health brand configuration.
 * This defines all the design tokens used in Enterprise Health applications.
 */
declare const enterpriseHealthBrand: BrandConfig;

/**
 * MIE Web Brand Configuration
 *
 * The official brand theme for Medical Informatics Engineering (MIE).
 * Primary color: #27ae60 (MIE Green)
 */

/**
 * MIE Web brand configuration.
 * This defines all the design tokens used in MIE Web applications.
 */
declare const miewebBrand: BrandConfig;

/**
 * WebChart Brand Configuration
 *
 * The official brand theme for WebChart EHR.
 * Primary color: #f5841f (WebChart Orange)
 */

/**
 * WebChart brand configuration.
 * This defines all the design tokens used in WebChart applications.
 */
declare const webchartBrand: BrandConfig;

declare const brands: {
    readonly bluehive: () => Promise<BrandConfig>;
    readonly default: () => Promise<BrandConfig>;
    readonly 'enterprise-health': () => Promise<BrandConfig>;
    readonly mieweb: () => Promise<BrandConfig>;
    readonly webchart: () => Promise<BrandConfig>;
};

export { BrandConfig, brands, defaultBrand, enterpriseHealthBrand, miewebBrand, webchartBrand };
