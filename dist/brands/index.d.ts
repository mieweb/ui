import { BrandConfig } from './types.js';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './types.js';
export { default as bluehiveBrand } from './bluehive.js';
export { ozwellBrand } from './ozwell.js';

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
 * Waggleline Brand Configuration
 *
 * The official brand theme for Waggleline.
 * Primary color: #17AEED (Waggleline Blue)
 *
 * Waggleline is an experience visualization and orchestration platform
 * that maps relationships, signals, handoffs, dependencies, and momentum
 * across the customer journey.
 *
 * Brand colors from MIE Brand Guide:
 * - Blue (#17AEED): Primary actions, momentum
 * - Green (#009C4E): MIE core platform, success, completions
 * - Orange (#E04501): WebChart workflow, urgency
 * - Yellow (#FFD200): Enterprise Health, readiness, highlights
 * - Purple (#8B5CF6): Ozwell AI, intelligence
 */

/**
 * Waggleline brand configuration.
 * This defines all the design tokens used in Waggleline applications.
 *
 * Note: Dark mode uses charcoal tones (gray-900 based), not pure black,
 * following Waggleline's design philosophy.
 */
declare const wagglelineBrand: BrandConfig;

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
    readonly ozwell: () => Promise<BrandConfig>;
    readonly waggleline: () => Promise<BrandConfig>;
    readonly webchart: () => Promise<BrandConfig>;
};

export { BrandConfig, brands, defaultBrand, enterpriseHealthBrand, miewebBrand, wagglelineBrand, webchartBrand };
